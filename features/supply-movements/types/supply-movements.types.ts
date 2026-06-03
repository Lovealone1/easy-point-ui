export type SupplyMovementType =
  | "PURCHASE"
  | "PRODUCTION"
  | "ADJUSTMENT"
  | "WASTE"
  | "TESTS";

export interface SupplyMovement {
  id: string;
  organizationId: string;
  supplyId: string;
  stockId: string;
  quantity: number;
  unitCost: number | null;
  type: SupplyMovementType;
  reason: string | null;
  referenceId: string | null;
  referenceType: string | null;
  performedByUserId: string | null;
  supplyPurchaseId: string | null;
  productionId: string | null;
  supplyName?: string | null;
  createdAt: string;
}

export interface FindSupplyMovementsParams {
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  orderBy?: string;
  organizationId?: string;
  supplyId?: string;
  stockId?: string;
  type?: SupplyMovementType;
  supplyPurchaseId?: string;
  productionId?: string;
}
