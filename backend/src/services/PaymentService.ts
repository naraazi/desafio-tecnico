import { Payment } from "../entities/Payment";
import { getPaymentRepository } from "../repositories/PaymentRepository";

interface CreatePaymentDTO {
  date: string;
  paymentTypeId: number;
  description: string;
  amount: number;
}

interface UpdatePaymentDTO {
  date?: string;
  paymentTypeId?: number;
  description?: string;
  amount?: number;
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
      throw new Error(
        "Já existe um pagamento com mesma data, tipo, descrição e valor."
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

  async update(id: number, data: UpdatePaymentDTO) {
    const payment = await this.paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new Error("Pagamento não encontrado.");
    }

    const toUpdate: UpdatePaymentDTO = { ...data };

    if (toUpdate.date) {
      toUpdate.date = this.normalizeDate(toUpdate.date);
    }

    if (toUpdate.description) {
      toUpdate.description = this.normalizeDescription(toUpdate.description);
    }

    if (typeof toUpdate.amount === "number") {
      toUpdate.amount = this.normalizeAmount(toUpdate.amount);
    }

    Object.assign(payment, toUpdate);

    return this.paymentRepository.save(payment);
  }

  async delete(id: number) {
    const payment = await this.paymentRepository.findOne({ where: { id } });

    if (!payment) {
      throw new Error("Pagamento não encontrado.");
    }

    await this.paymentRepository.remove(payment);
  }
}
