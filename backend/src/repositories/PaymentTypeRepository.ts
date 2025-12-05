import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { PaymentType } from "../entities/PaymentType";

let paymentTypeRepository: Repository<PaymentType> | null = null;

/**
 * Camada de repositório para PaymentType.
 * Centraliza o acesso ao TypeORM e evita que os services
 * dependam diretamente do AppDataSource.
 */
export const getPaymentTypeRepository = (): Repository<PaymentType> => {
  if (!paymentTypeRepository) {
    paymentTypeRepository = AppDataSource.getRepository(PaymentType);
  }

  return paymentTypeRepository;
};
