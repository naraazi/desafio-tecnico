import { AppDataSource } from "./data-source";
import { PaymentType } from "../entities/PaymentType";

const defaultPaymentTypes = [
  "Folha de pagamento",
  "Combustível",
  "Estorno",
  "Manutenção predial",
];

export async function seedPaymentTypes(): Promise<void> {
  const repo = AppDataSource.getRepository(PaymentType);

  for (const name of defaultPaymentTypes) {
    const exists = await repo.findOne({ where: { name } });
    if (!exists) {
      const paymentType = repo.create({ name });
      await repo.save(paymentType);
    }
  }
}
