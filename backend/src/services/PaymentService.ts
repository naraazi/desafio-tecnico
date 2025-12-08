import { Not } from "typeorm";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fileType from "file-type";
import { Payment } from "../entities/Payment";
import { getPaymentRepository } from "../repositories/PaymentRepository";
import { getPaymentTypeRepository } from "../repositories/PaymentTypeRepository";
import { AppError } from "../errors/AppError";
import { isBucketPrivate, s3Bucket, s3Client } from "../config/s3Client";

interface CreatePaymentDTO {
  date: string;
  paymentTypeId: number;
  description: string;
  amount: number;
}

const ALLOWED_FILE_TYPES = [
  { mime: "application/pdf", ext: "pdf" },
  { mime: "image/png", ext: "png" },
  { mime: "image/jpeg", ext: "jpg" },
];

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

  async list(filters?: {
    paymentTypeId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const paymentRepository = getPaymentRepository();

    const query = paymentRepository
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.paymentType", "paymentType")
      .orderBy("payment.date", "DESC");

    if (filters?.paymentTypeId) {
      query.andWhere("payment.paymentTypeId = :paymentTypeId", {
        paymentTypeId: filters.paymentTypeId,
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

    const payments = await query.getMany();

    await Promise.all(
      payments.map(async (payment) => {
        if (payment.receiptPath) {
          payment.receiptUrl = await this.buildReceiptUrl(payment.receiptPath);
        }
      })
    );

    return payments;
  }

  async findById(id: number) {
    const paymentRepository = getPaymentRepository();

    const payment = await paymentRepository.findOne({
      where: { id },
      relations: ["paymentType"],
    });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
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

    const paymentTypeExists = await paymentTypeRepository.findOne({
      where: { id: paymentTypeId },
    });
    if (!paymentTypeExists) {
      throw new AppError("Tipo de pagamento nao encontrado.", 404);
    }

    const existing = await paymentRepository.findOne({
      where: {
        date: normalizedDate,
        paymentTypeId,
        description: normalizedDescription,
        amount: normalizedAmount,
      },
    });

    if (existing) {
      throw new AppError(
        "Ja existe um pagamento com mesma data, tipo, descricao e valor.",
        409
      );
    }

    const payment = paymentRepository.create({
      ...data,
      date: normalizedDate,
      description: normalizedDescription,
      amount: normalizedAmount,
    });

    return paymentRepository.save(payment);
  }

  async update(
    id: number,
    data: {
      date?: string;
      paymentTypeId?: number;
      description?: string;
      amount?: number;
    }
  ): Promise<Payment> {
    const paymentRepository = getPaymentRepository();
    const paymentTypeRepository = getPaymentTypeRepository();

    const payment = await paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
    }

    const normalizedDate = data.date
      ? this.normalizeDate(data.date)
      : payment.date;
    const normalizedDescription = data.description
      ? this.normalizeDescription(data.description)
      : payment.description;
    const normalizedAmount =
      typeof data.amount === "number"
        ? this.normalizeAmount(data.amount)
        : payment.amount;
    const normalizedPaymentTypeId =
      typeof data.paymentTypeId === "number"
        ? data.paymentTypeId
        : payment.paymentTypeId;

    if (typeof data.paymentTypeId === "number") {
      const paymentTypeExists = await paymentTypeRepository.findOne({
        where: { id: data.paymentTypeId },
      });
      if (!paymentTypeExists) {
        throw new AppError("Tipo de pagamento nao encontrado.", 404);
      }
    }

    const duplicate = await paymentRepository.findOne({
      where: {
        id: Not(id), // ignora o proprio registro
        date: normalizedDate,
        paymentTypeId: normalizedPaymentTypeId,
        description: normalizedDescription,
        amount: normalizedAmount,
      },
    });

    if (duplicate) {
      throw new AppError(
        "Ja existe um pagamento com mesma data, tipo, descricao e valor.",
        409
      );
    }

    payment.date = normalizedDate;
    payment.paymentTypeId = normalizedPaymentTypeId;
    payment.description = normalizedDescription;
    payment.amount = normalizedAmount;

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
      throw new AppError("Pagamento nao encontrado.", 404);
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
      throw new AppError("Nao foi possivel identificar o tipo do arquivo.", 400);
    }

    const isAllowed = ALLOWED_FILE_TYPES.some(
      (t) => t.mime === detectedType.mime && t.ext === detectedType.ext
    );

    if (!isAllowed) {
      throw new AppError("Tipo de arquivo nao suportado. Use PDF, JPG ou PNG.", 400);
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
      throw new AppError("Pagamento nao encontrado.", 404);
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
  }): Promise<{ payments: Payment[]; total: number }> {
    const payments = await this.list(filters);
    const total = payments.reduce(
      (acc, payment) => acc + Number(payment.amount),
      0
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
      throw new AppError("Pagamento nao encontrado.", 404);
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
