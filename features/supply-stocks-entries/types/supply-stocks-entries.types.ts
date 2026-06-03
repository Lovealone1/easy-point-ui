export interface SupplyStockEntry {
  id: string;
  organizationId: string;
  supplyStockId: string;
  supplyPurchaseId: string | null;
  /** Cantidad original del lote (decimal serializado como string en la API) */
  initialQuantity: string;
  /** Cantidad restante del lote */
  remainingQuantity: string;
  /** Costo por unidad de medida al momento de la compra */
  unitCost: string;
  /** true cuando el lote está completamente consumido */
  isExhausted: boolean;
  createdAt: string;
  updatedAt: string;
  /** Populated via backend join — name of the supply */
  supplyName?: string;
  /** Populated via backend join — unitOfMeasure of the supply (GRAM | MILLILITER | UNIT) */
  supplyUnitOfMeasure?: string;
}

export interface FindSupplyStockEntriesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  /** Filtrar por SupplyStock ID */
  supplyStockId?: string;
  /** Filtrar por SupplyPurchase ID */
  supplyPurchaseId?: string;
  /** Filtrar por estado de agotamiento */
  isExhausted?: boolean;
}

export interface CreateSupplyStockEntryDTO {
  supplyStockId: string;
  supplyPurchaseId?: string;
  initialQuantity: number;
  unitCost: number;
}
