import { AppDataSource } from "../database/data-source";
import { Payment } from "../entities/Payment";

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
  private paymentRepository = AppDataSource.getRepository(Payment);

  // Normaliza a data para o formato YYYY-MM-DD
  private normalizeDate(date: string): string {
    // Se vier "2025-12-05T00:00:00.000Z", corta só os 10 primeiros
    return date.substring(0, 10);
  }

  async create(data: CreatePaymentDTO) {
    const normalizedDate = this.normalizeDate(data.date);
    const { paymentTypeId, description, amount } = data;

    // Regra de não-duplicidade usando a data normalizada
    const existing = await this.paymentRepository.findOne({
      where: {
        date: normalizedDate,
        paymentTypeId,
        description,
        amount,
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
