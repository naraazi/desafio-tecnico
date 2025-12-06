import { Not } from "typeorm";
import { Payment } from "../entities/Payment";
import { getPaymentRepository } from "../repositories/PaymentRepository";
import { getPaymentTypeRepository } from "../repositories/PaymentTypeRepository";
import { AppError } from "../errors/AppError";

interface CreatePaymentDTO {
  date: string;
  paymentTypeId: number;
  description: string;
  amount: number;
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
      throw new AppError("Tipo de pagamento nao encontrado.", 400);
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
        400
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

    return query.getMany();
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

    return payment;
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
        throw new AppError("Tipo de pagamento nao encontrado.", 400);
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
        400
      );
    }

    payment.date = normalizedDate;
    payment.paymentTypeId = normalizedPaymentTypeId;
    payment.description = normalizedDescription;
    payment.amount = normalizedAmount;

    await paymentRepository.save(payment);

    return payment;
  }

  async delete(id: number) {
    const paymentRepository = getPaymentRepository();
    const payment = await paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new AppError("Pagamento nao encontrado.", 404);
    }

    await paymentRepository.remove(payment);
  }
}
