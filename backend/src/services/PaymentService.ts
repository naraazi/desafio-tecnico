import { Not } from "typeorm";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fileType from "file-type";
import { Payment, TransactionType } from "../entities/Payment";
import { getPaymentRepository } from "../repositories/PaymentRepository";
import { getPaymentTypeRepository } from "../repositories/PaymentTypeRepository";
import { AppError } from "../errors/AppError";
import { isBucketPrivate, s3Bucket, s3Client } from "../config/s3Client";

interface CreatePaymentDTO {
  date: string;
  paymentTypeId: number;
  description: string;
  amount: number;
  transactionType?: TransactionType;
}

const ALLOWED_FILE_TYPES = [
  { mime: "application/pdf", ext: "pdf" },
  { mime: "image/png", ext: "png" },
  { mime: "image/jpeg", ext: "jpg" },
];

type PaymentSortField =
  | "date"
  | "amount"
  | "description"
  | "paymentType"
  | "transactionType"
  | "createdAt";

interface ListPaymentsFilters {
  paymentTypeId?: number;
  startDate?: string;
  endDate?: string;
  transactionType?: TransactionType | string;
  page?: number | string;
  pageSize?: number | string;
  sortBy?: PaymentSortField | string;
  sortOrder?: "ASC" | "DESC" | string;
  search?: string | string[];
}

interface PaymentListResponse {
  payments: Payment[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  totals: {
    pageAmount: number;
    overallAmount: number;
  };
  sort: {
    sortBy: PaymentSortField;
    sortOrder: "ASC" | "DESC";
  };
}

export class PaymentService {
  private normalizeDate(date: string): string {
    return date.substring(0, 10);
  }

  private normalizeDescription(description: string): string {
    return description.trim();
  }

  private normalizeAmount(amount: number): number {
    return Number(amount.toFixed(2));
  }

  private normalizeTransactionType(type?: string): TransactionType {
    if (!type) return "payment";
    if (type === "payment" || type === "transfer") return type;
    throw new AppError(
      "Tipo de lancamento invalido. Use payment ou transfer.",
      400
    );
  }

  private buildPublicUrl(key: string) {
    const region = process.env.AWS_REGION;
    return `https://${s3Bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  private async buildReceiptUrl(key: string): Promise<string> {
    if (!key) return "";
    if (!isBucketPrivate) {
      return this.buildPublicUrl(key);
    }
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 60 * 60 }); // 1h
  }

  private async deleteS3Object(key?: string) {
    if (!key) return;
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3Bucket,
          Key: key,
        })
      );
    } catch (err) {
      console.warn("Nao foi possivel remover comprovante no S3:", err);
    }
  }

  private ensureAllowedFile(file: Express.Multer.File) {
    const maxBytes = 5 * 1024 * 1024; // 5MB (mesmo limite do multer)
    if (file.size > maxBytes) {
      throw new AppError("Arquivo maior que o limite de 5MB.", 400);
    }
  }

  private buildBaseQuery(filters?: ListPaymentsFilters) {
    const paymentRepository = getPaymentRepository();

    const query = paymentRepository
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.paymentType", "paymentType");

    const paymentTypeId =
      typeof filters?.paymentTypeId !== "undefined"
        ? Number(filters.paymentTypeId)
        : undefined;
    if (paymentTypeId) {
      query.andWhere("payment.paymentTypeId = :paymentTypeId", {
        paymentTypeId,
      });
    }

    if (filters?.startDate) {
      query.andWhere("payment.date >= :startDate", {
        startDate: this.normalizeDate(filters.startDate),
      });
    }

    if (filters?.endDate) {
      query.andWhere("payment.date <= :endDate", {
        endDate: this.normalizeDate(filters.endDate),
      });
    }

    const transactionType = filters?.transactionType
      ? this.normalizeTransactionType(String(filters.transactionType))
      : undefined;
    if (transactionType) {
      query.andWhere("payment.transactionType = :transactionType", {
        transactionType,
      });
    }

    const rawSearch = filters?.search;
    const searchTerm = Array.isArray(rawSearch)
      ? rawSearch.find((v) => !!v?.toString().trim())
      : rawSearch;
    const normalizedSearch = searchTerm?.toString().trim();

    if (normalizedSearch) {
      query.andWhere(
        "(LOWER(payment.description) LIKE :search OR LOWER(paymentType.name) LIKE :search)",
        {
          search: `%${normalizedSearch.toLowerCase()}%`,
        }
      );
    }

    return query;
  }

  private resolveSort(
    sortBy?: string,
    sortOrder?: string
  ): {
    sortBy: PaymentSortField;
    sortOrder: "ASC" | "DESC";
    column: string;
    secondary?: { column: string; order: "ASC" | "DESC" };
  } {
    const sortMap: Record<PaymentSortField, string> = {
      date: "payment.date",
      amount: "payment.amount",
      description: "payment.description",
      paymentType: "paymentType.name",
      transactionType: "payment.transactionType",
      createdAt: "payment.createdAt",
    };

    const normalizedSortBy = (
      Object.keys(sortMap) as PaymentSortField[]
    ).includes(sortBy as PaymentSortField)
      ? (sortBy as PaymentSortField)
      : "date";

    const normalizedSortOrder =
      sortOrder?.toString().toUpperCase() === "ASC" ? "ASC" : "DESC";

    return {
      sortBy: normalizedSortBy,
      sortOrder: normalizedSortOrder,
      column: sortMap[normalizedSortBy],
      secondary:
        normalizedSortBy === "date"
          ? { column: "payment.id", order: "DESC" }
          : { column: "payment.date", order: "DESC" },
    };
  }

  private async attachReceiptUrls(payments: Payment[]) {
    await Promise.all(
      payments.map(async (payment) => {
        if (payment.receiptPath) {
          payment.receiptUrl = await this.buildReceiptUrl(payment.receiptPath);
        }
      })
    );
  }

  async list(filters?: ListPaymentsFilters): Promise<PaymentListResponse> {
    const baseQuery = this.buildBaseQuery(filters);
    const totalsQuery = baseQuery.clone();

    const totalsRow = await totalsQuery
      .select("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(payment.amount), 0)", "amount")
      .getRawOne<{ count: string; amount: string }>();

    const totalItems = totalsRow ? Number(totalsRow.count) : 0;
    const overallAmount = this.normalizeAmount(Number(totalsRow?.amount ?? 0));

    const requestedPage = Math.max(1, Number(filters?.page) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, Number(filters?.pageSize) || 10)
    );
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;

    const sort = this.resolveSort(
      filters?.sortBy as string,
      filters?.sortOrder as string
    );
    baseQuery.orderBy(sort.column, sort.sortOrder);
    if (sort.secondary) {
      baseQuery.addOrderBy(sort.secondary.column, sort.secondary.order);
    }
    baseQuery.addOrderBy("payment.id", "DESC");

    baseQuery.skip((page - 1) * pageSize).take(pageSize);

    const payments = await baseQuery.getMany();
    await this.attachReceiptUrls(payments);

    const pageAmount = this.normalizeAmount(
      payments.reduce((acc, payment) => acc + Number(payment.amount), 0)
    );

    return {
      payments,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
      totals: {
        pageAmount,
        overallAmount,
      },
      sort: {
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
      },
    };
  }

  async findById(id: number) {
    const paymentRepository = getPaymentRepository();

    const payment = await paymentRepository.findOne({
      where: { id },
      relations: ["paymentType"],
    });

    if (!payment) {
      throw new AppError("Lancamento nao encontrado.", 404);
    }

    if (payment.receiptPath) {
      payment.receiptUrl = await this.buildReceiptUrl(payment.receiptPath);
    }

    return payment;
  }

  async create(data: CreatePaymentDTO) {
    const paymentRepository = getPaymentRepository();
    const paymentTypeRepository = getPaymentTypeRepository();

    const normalizedDate = this.normalizeDate(data.date);
    const normalizedDescription = this.normalizeDescription(data.description);
    const normalizedAmount = this.normalizeAmount(data.amount);
    const { paymentTypeId } = data;
    const normalizedTransactionType = this.normalizeTransactionType(
      data.transactionType
    );

    const paymentTypeExists = await paymentTypeRepository.findOne({
      where: { id: paymentTypeId },
    });
    if (!paymentTypeExists) {
      throw new AppError("Tipo nao encontrado.", 404);
    }

    const existing = await paymentRepository.findOne({
      where: {
        date: normalizedDate,
        paymentTypeId,
        description: normalizedDescription,
        amount: normalizedAmount,
        transactionType: normalizedTransactionType,
      },
    });

    if (existing) {
      throw new AppError(
        "Ja existe um lancamento com mesma data, tipo, descricao e valor.",
        409
      );
    }

    const payment = paymentRepository.create({
      ...data,
      date: normalizedDate,
      description: normalizedDescription,
      amount: normalizedAmount,
      transactionType: normalizedTransactionType,
    });

    return paymentRepository.save(payment);
  }

  async update(
    id: number,
    data: {
      date: string;
      paymentTypeId: number;
      description: string;
      amount: number;
      transactionType: TransactionType;
    }
  ): Promise<Payment> {
    const paymentRepository = getPaymentRepository();
    const paymentTypeRepository = getPaymentTypeRepository();

    const payment = await paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new AppError("Lancamento nao encontrado.", 404);
    }

    const normalizedDate = this.normalizeDate(data.date);
    const normalizedDescription = this.normalizeDescription(data.description);
    const normalizedAmount = this.normalizeAmount(data.amount);
    const normalizedTransactionType = this.normalizeTransactionType(
      data.transactionType
    );
    const normalizedPaymentTypeId = data.paymentTypeId;

    const paymentTypeExists = await paymentTypeRepository.findOne({
      where: { id: normalizedPaymentTypeId },
    });
    if (!paymentTypeExists) {
      throw new AppError("Tipo nao encontrado.", 404);
    }

    const duplicate = await paymentRepository.findOne({
      where: {
        id: Not(id), // ignora o proprio registro
        date: normalizedDate,
        paymentTypeId: normalizedPaymentTypeId,
        description: normalizedDescription,
        amount: normalizedAmount,
        transactionType: normalizedTransactionType,
      },
    });

    if (duplicate) {
      throw new AppError(
        "Ja existe um lancamento com mesma data, tipo, descricao e valor.",
        409
      );
    }

    payment.date = normalizedDate;
    payment.paymentTypeId = normalizedPaymentTypeId;
    payment.description = normalizedDescription;
    payment.amount = normalizedAmount;
    payment.transactionType = normalizedTransactionType;

    await paymentRepository.save(payment);

    return payment;
  }

  async uploadReceipt(id: number, file?: Express.Multer.File) {
    if (!file) {
      throw new AppError("Arquivo e obrigatorio.", 400);
    }

    if (!s3Bucket) {
      throw new AppError("Bucket S3 nao configurado.", 500);
    }

    const paymentRepository = getPaymentRepository();

    const payment = await paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new AppError("Lancamento nao encontrado.", 404);
    }

    // Remove comprovante anterior, se existir
    if (payment.receiptPath) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3Bucket,
            Key: payment.receiptPath,
          })
        );
      } catch (err) {
        console.warn("Nao foi possivel remover comprovante anterior:", err);
      }
    }

    this.ensureAllowedFile(file);
    const detectedType = await fileType.fromBuffer(file.buffer);

    if (!detectedType) {
      throw new AppError(
        "Nao foi possivel identificar o tipo do arquivo.",
        400
      );
    }

    const isAllowed = ALLOWED_FILE_TYPES.some(
      (t) => t.mime === detectedType.mime && t.ext === detectedType.ext
    );

    if (!isAllowed) {
      throw new AppError(
        "Tipo de arquivo nao suportado. Use PDF, JPG ou PNG.",
        400
      );
    }

    const key = `receipts/${id}/${Date.now()}.${detectedType.ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: detectedType.mime,
        ACL: isBucketPrivate ? undefined : "public-read",
      })
    );

    payment.receiptPath = key;
    await paymentRepository.save(payment);

    const receiptUrl = await this.buildReceiptUrl(key);

    return { payment, receiptUrl };
  }

  async delete(id: number) {
    const paymentRepository = getPaymentRepository();
    const payment = await paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new AppError("Lancamento nao encontrado.", 404);
    }

    // remove comprovante associado, se houver
    if (payment.receiptPath && s3Bucket) {
      await this.deleteS3Object(payment.receiptPath);
    }

    await paymentRepository.remove(payment);
  }

  async report(filters?: {
    paymentTypeId?: number;
    startDate?: string;
    endDate?: string;
    transactionType?: TransactionType | string;
  }): Promise<{ payments: Payment[]; total: number }> {
    const query = this.buildBaseQuery(filters);
    query.orderBy("payment.date", "DESC");

    const payments = await query.getMany();
    await this.attachReceiptUrls(payments);

    const total = this.normalizeAmount(
      payments.reduce((acc, payment) => acc + Number(payment.amount), 0)
    );

    return { payments, total };
  }

  async deleteReceipt(id: number) {
    if (!s3Bucket) {
      throw new AppError("Bucket S3 nao configurado.", 500);
    }

    const paymentRepository = getPaymentRepository();
    const payment = await paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new AppError("Lancamento nao encontrado.", 404);
    }

    if (!payment.receiptPath) {
      throw new AppError("Pagamento nao possui comprovante.", 404);
    }

    await this.deleteS3Object(payment.receiptPath);
    payment.receiptPath = undefined;
    await paymentRepository.save(payment);

    return payment;
  }
}
