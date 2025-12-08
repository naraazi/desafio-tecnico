export interface PaymentType {
  id: number;
  name: string;
  inUse?: boolean;
}

export interface Payment {
  id: number;
  date: string;
  paymentTypeId: number;
  description: string;
  amount: number;
  paymentType?: PaymentType;
  createdAt?: string;
  updatedAt?: string;
   receiptPath?: string;
   receiptUrl?: string;
}

export interface PaymentReportResponse {
  payments: Payment[];
  total: number;
}
