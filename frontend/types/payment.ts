export interface PaymentType {
  id: number;
  name: string;
  inUse?: boolean;
}

export type PaymentSortField =
  | "date"
  | "amount"
  | "description"
  | "paymentType"
  | "transactionType"
  | "createdAt";

export interface Payment {
  id: number;
  date: string;
  paymentTypeId: number;
  description: string;
  amount: number;
  transactionType: "payment" | "transfer";
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

export interface PaymentListResponse {
  payments: Payment[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  totals: {
    pageAmount: number;
    overallAmount: number;
  };
  sort: {
    sortBy: PaymentSortField;
    sortOrder: "ASC" | "DESC";
  };
}
