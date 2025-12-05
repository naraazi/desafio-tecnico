import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Payment } from "../entities/Payment";

let paymentRepository: Repository<Payment> | null = null;

/**
 * Camada de repositório para Payment.
 * Centraliza o acesso ao TypeORM e evita que os services
 * dependam diretamente do AppDataSource.
 */
export const getPaymentRepository = (): Repository<Payment> => {
  if (!paymentRepository) {
    paymentRepository = AppDataSource.getRepository(Payment);
  }

  return paymentRepository;
};
