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

  async create(data: CreatePaymentDTO) {
    const { date, paymentTypeId, description, amount } = data;

    // Regra de não-duplicidade:
    const existing = await this.paymentRepository.findOne({
      where: { date, paymentTypeId, description, amount },
    });

    if (existing) {
      throw new Error(
        "Já existe um pagamento com mesma data, tipo, descrição e valor."
      );
    }

    const payment = this.paymentRepository.create(data);
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
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere("payment.date <= :endDate", {
        endDate: filters.endDate,
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

    Object.assign(payment, data);

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
