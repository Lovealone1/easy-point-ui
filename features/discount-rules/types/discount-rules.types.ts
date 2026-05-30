// Enums que coinciden con Prisma/backend
export type DiscountType = 'FIXED_AMOUNT' | 'PERCENTAGE';
export type DiscountScope = 'GLOBAL' | 'CLIENT';
export type DiscountCategory = 'ONE_TIME' | 'PERIODIC';

export interface DiscountRule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  /** Código corto único por organización (ej: "PROM25") */
  code: string;
  type: DiscountType;
  /** Para PERCENTAGE: 0–100. Para FIXED_AMOUNT: monto en moneda local. */
  value: number;
  scope: DiscountScope;
  clientId: string | null;
  category: DiscountCategory;
  startsAt: string | null;
  expiresAt: string | null;
  /** Techo de descuento para reglas PERCENTAGE (null = sin límite) */
  maxDiscountAmount: number | null;
  /** Monto mínimo de venta para que el descuento sea aplicable */
  minSaleAmount: number | null;
  maxUsages: number | null;
  usageCount: number;
  isActive: boolean;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindDiscountRulesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  name?: string;
  code?: string;
  type?: DiscountType;
  scope?: DiscountScope;
  category?: DiscountCategory;
  clientId?: string;
  isActive?: boolean;
}

export interface CreateDiscountRuleDTO {
  name: string;
  description?: string;
  /** Si no se provee, el backend lo genera automáticamente a partir del nombre. */
  code?: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  /** Obligatorio cuando scope = CLIENT */
  clientId?: string;
  category: DiscountCategory;
  startsAt?: string;
  expiresAt?: string;
  maxDiscountAmount?: number;
  minSaleAmount?: number;
  maxUsages?: number;
  isActive?: boolean;
  notes?: string;
}

/**
 * `type` y `scope` son inmutables una vez creada la regla.
 */
export type UpdateDiscountRuleDTO = Partial<
  Omit<CreateDiscountRuleDTO, 'type' | 'scope'>
>;
