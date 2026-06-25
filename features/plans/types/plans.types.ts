// ─────────────────────────────────────────────────────────────────────────────
// features/plans/types/plans.types.ts
//
// TypeScript type definitions for the global pricing plans module.
// Mirrors the NestJS backend plan entity & DTO shapes.
// ─────────────────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  isActive: boolean;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindPlansParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  name?: string;
  isActive?: boolean;
}

export interface CreatePlanDTO {
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  isActive?: boolean;
  metadata?: any;
}

export type UpdatePlanDTO = Partial<CreatePlanDTO>;
