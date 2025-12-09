import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { PaymentType } from "./PaymentType";

export type TransactionType = "payment" | "transfer";

@Entity("payments")
@Index(
  "IDX_payment_unique",
  ["date", "paymentTypeId", "description", "amount", "transactionType"],
  {
    unique: true,
  }
)
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "date" })
  date!: string; // pode ser string no modelo, o TypeORM converte para DATE

  @Column()
  paymentTypeId!: number;

  @ManyToOne(() => PaymentType)
  @JoinColumn({ name: "paymentTypeId" })
  paymentType!: PaymentType;

  @Column({
    type: "enum",
    enum: ["payment", "transfer"],
    default: "payment",
  })
  transactionType!: TransactionType;

  @Column()
  description!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ nullable: true })
  receiptPath?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Campo virtual (não persiste no banco) para expor URL do comprovante
  receiptUrl?: string;
}
