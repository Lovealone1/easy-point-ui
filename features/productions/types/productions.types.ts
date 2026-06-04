// ─── Enums (mirrored from @prisma/client) ─────────────────────────────────────

export type ProductionType = "SELLABLE" | "INTERMEDIATE"

export type ProductionStatus = "DRAFT" | "COMPLETED" | "CANCELLED"

export type UnitOfMeasure =
  | "UNIT"
  | "KILOGRAM"
  | "GRAM"
  | "LITER"
  | "MILLILITER"
  | "METER"
  | "CENTIMETER"
  | "BOX"
  | "PACKAGE"
  | "DOZEN"
  | "PORTION"
  | "OTHER"

// ─── Entity ───────────────────────────────────────────────────────────────────

export interface Production {
  id: string
  organizationId: string
  name: string
  productionDate: string
  type: ProductionType
  status: ProductionStatus
  /** Null when type === "INTERMEDIATE" */
  productId: string | null
  /** Stored as string because the backend uses Prisma.Decimal */
  quantityProduced: string
  unitOfMeasure: UnitOfMeasure
  /** Computed total cost of supplies consumed */
  totalCost: string
  notes: string | null
  performedByUserId: string | null
  createdAt: string
  updatedAt: string
}

// ─── Supply usage line item (for create) ──────────────────────────────────────

export interface ProductionSupplyUsageInput {
  supplyId: string
  quantityUsed: number
}

// ─── Find / filter params ─────────────────────────────────────────────────────

export interface FindProductionsParams {
  page?: number
  limit?: number
  order?: "ASC" | "DESC"
  orderBy?: string
  type?: ProductionType
  status?: ProductionStatus
  productId?: string
  organizationId?: string
}

// ─── Create DTO ───────────────────────────────────────────────────────────────

export interface CreateProductionDTO {
  /** Descriptive name for the production batch */
  name: string
  /** ISO 8601 date string */
  productionDate: string
  type: ProductionType
  /** Required when type === "SELLABLE" */
  productId?: string
  quantityProduced: number
  unitOfMeasure: UnitOfMeasure
  notes?: string
  /** Defaults to COMPLETED on the backend; pass DRAFT to only save intent */
  status?: ProductionStatus
  /** At least one supply is required */
  supplies: ProductionSupplyUsageInput[]
}

// ─── Update DTO ───────────────────────────────────────────────────────────────
// Productions are immutable once COMPLETED; only notes are patchable in practice.
// The cancel action is handled via a dedicated endpoint (PATCH /:id/cancel).
export type UpdateProductionDTO = Pick<Partial<CreateProductionDTO>, "notes">
