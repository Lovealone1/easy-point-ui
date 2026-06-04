export type TransactionType = 'CREDIT' | 'DEBIT';

export type OperationType = 'SALE' | 'PURCHASE' | 'REFUND' | 'TRANSFER' | 'ADJUSTMENT';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  CREDIT: 'Ingreso',
  DEBIT: 'Egreso',
};

export const OPERATION_TYPE_LABELS: Record<OperationType, string> = {
  SALE: 'Venta',
  PURCHASE: 'Compra',
  REFUND: 'Devolución',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de Crédito',
  DEBIT_CARD: 'Tarjeta de Débito',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  OTHER: 'Otro',
};

export interface FinancialTransaction {
  id: string;
  organizationId: string;
  transactionNumber: string;
  bankAccountId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  operationType: OperationType;
  referenceId: string | null;
  referenceType: string | null;
  categoryId: string | null;
  paymentMethod: PaymentMethod | null;
  description: string | null;
  metadata: Record<string, any> | null;
  performedByUserId: string | null;
  createdAt: string;
  bankAccountName?: string | null;
  categoryName?: string | null;
  performedByUserEmail?: string | null;
}

export interface FindFinancialTransactionsParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  bankAccountId?: string;
  type?: TransactionType;
  operationType?: OperationType;
  paymentMethod?: PaymentMethod;
  categoryId?: string;
  search?: string;
}

export interface CreateFinancialTransactionDTO {
  bankAccountId: string;
  type: TransactionType;
  amount: number;
  operationType: OperationType;
  paymentMethod?: PaymentMethod;
  categoryId?: string;
  description?: string;
}
