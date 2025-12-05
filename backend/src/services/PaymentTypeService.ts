import { PaymentType } from "../entities/PaymentType";
import { getPaymentTypeRepository } from "../repositories/PaymentTypeRepository";
import { AppError } from "../errors/AppError";

interface CreatePaymentTypeDTO {
  name: string;
}

export class PaymentTypeService {
  async create(data: CreatePaymentTypeDTO): Promise<PaymentType> {
    const paymentTypeRepository = getPaymentTypeRepository();

    // Normaliza o nome (tira espaços e garante consistência)
    const normalizedName = data.name.trim();

    if (!normalizedName) {
      throw new AppError("Nome do tipo de pagamento é obrigatório.", 400);
    }

    // Verifica se já existe um tipo com esse nome exato
    const existing = await paymentTypeRepository.findOne({
      where: { name: normalizedName },
    });

    if (existing) {
      throw new AppError("Já existe um tipo de pagamento com esse nome.", 400);
    }

    // Cria o registro com o nome normalizado
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
}
