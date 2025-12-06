import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Payment } from "../entities/Payment";

let paymentRepository: Repository<Payment> | null = null;

export const getPaymentRepository = (): Repository<Payment> => {
  if (!paymentRepository) {
    paymentRepository = AppDataSource.getRepository(Payment);
  }

  return paymentRepository;
};
