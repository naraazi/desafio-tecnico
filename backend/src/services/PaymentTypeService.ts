import { PaymentType } from "../entities/PaymentType";
import { getPaymentTypeRepository } from "../repositories/PaymentTypeRepository";

export class PaymentTypeService {
  private repo = getPaymentTypeRepository();

  async create(name: string) {
    const exists = await this.repo.findOne({ where: { name } });
    if (exists) {
      throw new Error("Já existe um tipo de pagamento com esse nome.");
    }

    const type = this.repo.create({ name });
    return this.repo.save(type);
  }

  async list() {
    return this.repo.find({ order: { name: "ASC" } });
  }
}
