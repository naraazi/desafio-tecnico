import { Not } from "typeorm";
import { Payment } from "../entities/Payment";
import { getPaymentRepository } from "../repositories/PaymentRepository";
import { AppError } from "../errors/AppError";

interface CreatePaymentDTO {
  date: string;
  paymentTypeId: number;
  description: string;
  amount: number;
}

export class PaymentService {
  private paymentRepository = getPaymentRepository();

  // Normaliza a data para o formato YYYY-MM-DD
  private normalizeDate(date: string): string {
    return date.substring(0, 10);
  }

  // Remove espaços extras da descrição
  private normalizeDescription(description: string): string {
    return description.trim();
  }

  // Garante valor com 2 casas decimais
  private normalizeAmount(amount: number): number {
    return Number(amount.toFixed(2));
  }

  async create(data: CreatePaymentDTO) {
    const normalizedDate = this.normalizeDate(data.date);
    const normalizedDescription = this.normalizeDescription(data.description);
    const normalizedAmount = this.normalizeAmount(data.amount);
    const { paymentTypeId } = data;

    // Regra de não-duplicidade usando valores normalizados
    const existing = await this.paymentRepository.findOne({
      where: {
        date: normalizedDate,
        paymentTypeId,
        description: normalizedDescription,
        amount: normalizedAmount,
      },
    });

    if (existing) {
      throw new AppError(
        "Já existe um pagamento com mesma data, tipo, descrição e valor.",
        400
      );
    }

    const payment = this.paymentRepository.create({
      ...data,
      date: normalizedDate,
      description: normalizedDescription,
      amount: normalizedAmount,
    });

    return this.paymentRepository.save(payment);
  }

  async list(filters?: {
    paymentTypeId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const query = this.paymentRepository
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
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ["paymentType"],
    });
    return payment;
  }

  async update(
    id: number,
    data: {
      date: string;
      paymentTypeId: number;
      description: string;
      amount: number;
    }
  ): Promise<Payment> {
    const paymentRepository = getPaymentRepository();

    const payment = await paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new AppError("Pagamento não encontrado.", 404);
    }

    // ⚠️ IMPORTANTE: usar a MESMA normalização de data do create
    // Se já existir this.normalizeDate, use ela. Fica assim:
    const normalizedDate = this.normalizeDate
      ? this.normalizeDate(data.date)
      : data.date; // fallback simples, caso normalizeDate não exista

    const normalizedDescription = data.description.trim();
    const normalizedAmount = Number(Number(data.amount).toFixed(2));

    // Verificar se já existe OUTRO pagamento com mesma combinação
    const duplicate = await paymentRepository.findOne({
      where: {
        id: Not(id), // ignora o próprio registro
        date: normalizedDate,
        paymentTypeId: data.paymentTypeId,
        description: normalizedDescription,
        amount: normalizedAmount,
      },
    });

    if (duplicate) {
      throw new AppError(
        "Já existe um pagamento com mesma data, tipo, descrição e valor.",
        400
      );
    }

    payment.date = normalizedDate;
    payment.paymentTypeId = data.paymentTypeId;
    payment.description = normalizedDescription;
    payment.amount = normalizedAmount;

    await paymentRepository.save(payment);

    return payment;
  }

  async delete(id: number) {
    const payment = await this.paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new AppError("Pagamento não encontrado.", 404);
    }

    await this.paymentRepository.remove(payment);
  }
}
