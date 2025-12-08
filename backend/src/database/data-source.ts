import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import { PaymentType } from "../entities/PaymentType";
import { Payment } from "../entities/Payment";
import { User } from "../entities/User";

config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [PaymentType, Payment, User],
  synchronize: true,
  logging: false,
});
