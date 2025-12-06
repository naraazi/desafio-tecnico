import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { PaymentType } from "../entities/PaymentType";

let paymentTypeRepository: Repository<PaymentType> | null = null;

export const getPaymentTypeRepository = (): Repository<PaymentType> => {
  if (!paymentTypeRepository) {
    paymentTypeRepository = AppDataSource.getRepository(PaymentType);
  }

  return paymentTypeRepository;
};
