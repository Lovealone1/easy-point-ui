export type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER';

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de Crédito',
  DEBIT_CARD: 'Tarjeta de Débito',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  OTHER: 'Otro',
};

export interface ProductPurchaseItem {
  productId: string;
  location?: string;
  quantity: number;
  unitCost?: number;
}

export interface ProductPurchase {
  id: string;
  organizationId: string;
  supplierId: string | null;
  totalAmount: number;
  transactionId: string | null;
  status: PurchaseStatus;
  notes: string | null;
  performedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindProductPurchasesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  organizationId?: string;
  supplierId?: string;
  status?: PurchaseStatus;
  search?: string;
}

export interface CreateProductPurchaseDTO {
  supplierId?: string;
  status?: PurchaseStatus;
  bankAccountId?: string;
  paymentMethod?: PaymentMethod;
  categoryId?: string;
  notes?: string;
  items: ProductPurchaseItem[];
}

export interface CompleteProductPurchaseDTO {
  bankAccountId: string;
  paymentMethod?: PaymentMethod;
  categoryId?: string;
  notes?: string;
}

export interface AddItemsProductPurchaseDTO {
  items: ProductPurchaseItem[];
}
