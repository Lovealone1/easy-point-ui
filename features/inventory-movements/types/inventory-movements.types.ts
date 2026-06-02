/** Tipo de movimiento de inventario */
export type MovementType =
  | "SALE"
  | "PRODUCTION"
  | "PURCHASE"
  | "ADJUSTMENT"
  | "WASTE"
  | "TESTS";

/** Entidad de movimiento de inventario devuelta por el backend */
export interface InventoryMovement {
  id: string;
  organizationId: string;
  productId: string;
  stockId: string;
  quantity: number;
  unitCost: number | null;
  type: MovementType;
  reason: string | null;
  referenceId: string | null;
  referenceType: string | null;
  performedByUserId: string | null;
  saleId: string | null;
  productionId: string | null;
  productName: string | null;
  createdAt: string;
}

/** Parámetros para filtrar y paginar movimientos de inventario */
export interface FindInventoryMovementsParams {
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  orderBy?: string;
  organizationId?: string;
  productId?: string;
  stockId?: string;
  type?: MovementType;
  saleId?: string;
  productionId?: string;
  productPurchaseId?: string;
}
