import { PaymentType } from "../entities/PaymentType";
import { getPaymentRepository } from "../repositories/PaymentRepository";
import { getPaymentTypeRepository } from "../repositories/PaymentTypeRepository";
import { AppError } from "../errors/AppError";

interface CreatePaymentTypeDTO {
  name: string;
}

export class PaymentTypeService {
  private async ensureNotInUse(id: number) {
    const paymentRepository = getPaymentRepository();
    const inUseCount = await paymentRepository.count({
      where: { paymentTypeId: id },
    });

    if (inUseCount > 0) {
      throw new AppError(
        "Tipo esta em uso e nao pode ser alterado ou removido.",
        409
      );
    }
  }

  async create(data: CreatePaymentTypeDTO): Promise<PaymentType> {
    const paymentTypeRepository = getPaymentTypeRepository();
    const normalizedName = data.name.trim();

    if (!normalizedName) {
      throw new AppError("Nome do tipo de pagamento e obrigatorio.", 400);
    }

    const existing = await paymentTypeRepository.findOne({
      where: { name: normalizedName },
    });

    if (existing) {
      throw new AppError("Ja existe um tipo de pagamento com esse nome.", 409);
    }

    const paymentType = paymentTypeRepository.create({
      name: normalizedName,
    });

    await paymentTypeRepository.save(paymentType);

    return paymentType;
  }

  async list(): Promise<(PaymentType & { inUse: boolean })[]> {
    const paymentTypeRepository = getPaymentTypeRepository();
    const paymentRepository = getPaymentRepository();

    const usageRows = await paymentRepository
      .createQueryBuilder("payment")
      .select("payment.paymentTypeId", "paymentTypeId")
      .addSelect("COUNT(*)", "count")
      .groupBy("payment.paymentTypeId")
      .getRawMany<{ paymentTypeId: number; count: string }>();

    const usageMap = new Map<number, number>();
    usageRows.forEach((row) =>
      usageMap.set(Number(row.paymentTypeId), Number(row.count))
    );

    const paymentTypes = await paymentTypeRepository.find({
      order: { name: "ASC" },
    });

    return paymentTypes.map((type) => ({
      ...type,
      inUse: (usageMap.get(type.id) ?? 0) > 0,
    }));
  }

  async update(id: number, data: CreatePaymentTypeDTO): Promise<PaymentType> {
    const paymentTypeRepository = getPaymentTypeRepository();
    const normalizedName = data.name.trim();

    if (!normalizedName) {
      throw new AppError("Nome do tipo de pagamento e obrigatorio.", 400);
    }

    const paymentType = await paymentTypeRepository.findOne({ where: { id } });
    if (!paymentType) {
      throw new AppError("Tipo nao encontrado.", 404);
    }

    await this.ensureNotInUse(id);

    const duplicate = await paymentTypeRepository.findOne({
      where: { name: normalizedName },
    });

    if (duplicate && duplicate.id !== id) {
      throw new AppError("Ja existe um tipo de pagamento com esse nome.", 409);
    }

    paymentType.name = normalizedName;
    await paymentTypeRepository.save(paymentType);

    return paymentType;
  }

  async delete(id: number): Promise<void> {
    const paymentTypeRepository = getPaymentTypeRepository();

    const paymentType = await paymentTypeRepository.findOne({ where: { id } });
    if (!paymentType) {
      throw new AppError("Tipo nao encontrado.", 404);
    }

    await this.ensureNotInUse(id);

    await paymentTypeRepository.remove(paymentType);
  }
}
