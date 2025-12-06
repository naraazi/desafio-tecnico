import { PaymentType } from "../entities/PaymentType";
import { getPaymentTypeRepository } from "../repositories/PaymentTypeRepository";
import { AppError } from "../errors/AppError";

interface CreatePaymentTypeDTO {
  name: string;
}

export class PaymentTypeService {
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
      throw new AppError("Ja existe um tipo de pagamento com esse nome.", 400);
    }

    const paymentType = paymentTypeRepository.create({
      name: normalizedName,
    });

    await paymentTypeRepository.save(paymentType);

    return paymentType;
  }

  async list(): Promise<PaymentType[]> {
    const paymentTypeRepository = getPaymentTypeRepository();

    const paymentTypes = await paymentTypeRepository.find({
      order: { name: "ASC" },
    });

    return paymentTypes;
  }

  async update(id: number, data: CreatePaymentTypeDTO): Promise<PaymentType> {
    const paymentTypeRepository = getPaymentTypeRepository();
    const normalizedName = data.name.trim();

    if (!normalizedName) {
      throw new AppError("Nome do tipo de pagamento e obrigatorio.", 400);
    }

    const paymentType = await paymentTypeRepository.findOne({ where: { id } });
    if (!paymentType) {
      throw new AppError("Tipo de pagamento nao encontrado.", 404);
    }

    const duplicate = await paymentTypeRepository.findOne({
      where: { name: normalizedName },
    });

    if (duplicate && duplicate.id !== id) {
      throw new AppError("Ja existe um tipo de pagamento com esse nome.", 400);
    }

    paymentType.name = normalizedName;
    await paymentTypeRepository.save(paymentType);

    return paymentType;
  }

  async delete(id: number): Promise<void> {
    const paymentTypeRepository = getPaymentTypeRepository();

    const paymentType = await paymentTypeRepository.findOne({ where: { id } });
    if (!paymentType) {
      throw new AppError("Tipo de pagamento nao encontrado.", 404);
    }

    await paymentTypeRepository.remove(paymentType);
  }
}
