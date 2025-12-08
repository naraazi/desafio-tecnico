import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { User } from "../entities/User";

let userRepository: Repository<User> | null = null;

export const getUserRepository = (): Repository<User> => {
  if (!userRepository) {
    userRepository = AppDataSource.getRepository(User);
  }

  return userRepository;
};
