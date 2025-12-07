import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { PaymentType } from "./PaymentType";

@Entity("payments")
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
