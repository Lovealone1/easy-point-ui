// ─── Enums ──────────────────────────────────────────────────────────────────

/** Estado del ciclo de vida de una venta */
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

/** Método de pago registrado en la venta */
export type SalePaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'OTHER';

// ─── Sub-entities ────────────────────────────────────────────────────────────

/** Línea de detalle de una venta (un ítem del carrito) */
export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  /** Nombre del producto al momento de la venta (snapshot) */
  productName: string;
  /** Cantidad vendida */
  quantity: number;
  /** Precio unitario al momento de la venta */
  unitPrice: number;
  /** Descuento aplicado a esta línea (valor absoluto) */
  discountAmount: number;
  /** Subtotal = (unitPrice * quantity) - discountAmount */
  subtotal: number;
}

// ─── Main Entity ─────────────────────────────────────────────────────────────

/** Entidad venta completa devuelta por el backend */
export interface Sale {
  id: string;
  organizationId: string;
  /** Usuario que registró la venta */
  performedByUserId: string | null;
  /** Cliente asociado a la venta (null = venta anónima) */
  clientId: string | null;
  /** Nombre del cliente (join del backend) */
  clientName: string | null;
  /** Estado actual de la venta */
  status: SaleStatus;
  /** Subtotal antes de descuentos (ya serializado como number) */
  subtotalAmount: number | null;
  /** Descuento global aplicado a toda la venta */
  discountAmount: number | null;
  /** Total final serializado como number */
  totalAmount: number;
  /** ID de la transacción financiera asociada */
  transactionId: string | null;
  /** Notas adicionales de la venta */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // UI additional compatibility fields (optional)
  createdByUserName?: string | null;
  performedByUserEmail?: string | null;
  discountRuleCode?: string | null;
  items?: SaleItem[];
  taxAmount?: number | null;
  amountPaid?: number | null;
  changeAmount?: number | null;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

/** Parámetros para filtrar y paginar el listado de ventas */
export interface FindSalesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  /** Búsqueda libre (por ID, nombre de cliente, etc.) */
  search?: string;
  status?: SaleStatus;
  clientId?: string;
  paymentMethod?: SalePaymentMethod;
  /** Fecha de inicio del rango (ISO 8601) */
  dateFrom?: string;
  /** Fecha de fin del rango (ISO 8601) */
  dateTo?: string;
  createdByUserId?: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Payload de una línea de ítem al crear una venta */
export interface CreateSaleItemDTO {
  productId: string;
  quantity: number;
  /** Si se omite, el backend usa el salePrice actual del producto */
  unitPrice?: number;
}

/** Payload para crear una nueva venta */
export interface CreateSaleDTO {
  /** Lista de ítems del carrito (mínimo 1) */
  items: CreateSaleItemDTO[];
  /** Cliente asociado (null = venta anónima) */
  clientId?: string;
  /** Método de pago. Puede omitirse si la venta queda en estado PENDING */
  paymentMethod?: SalePaymentMethod;
  /** Monto recibido del cliente (para calcular vuelto) */
  amountPaid?: number;
  /** Código de la regla de descuento a aplicar */
  discountRuleCode?: string;
  /** Código del descuento a aplicar a esta venta (coincide con backend) */
  discountCode?: string;
  /** Estado de la venta */
  status?: SaleStatus;
  /** Cuenta bancaria a acreditar si status = COMPLETED */
  bankAccountId?: string;
  /** Categoría de la transacción si status = COMPLETED */
  categoryId?: string;
  /** Descuento manual sobre el total (valor absoluto en moneda local) */
  discountAmount?: number;
  /** Notas opcionales */
  notes?: string;
}

/** Payload para completar una venta que quedó en estado PENDING */
export interface CompleteSaleDTO {
  /** Método de pago con el que se cierra la venta */
  paymentMethod: SalePaymentMethod;
  /** Monto recibido del cliente */
  amountPaid?: number;
  /** Notas adicionales al completar */
  notes?: string;
}
