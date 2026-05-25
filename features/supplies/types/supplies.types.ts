export type UnitOfMeasure = 'GRAM' | 'MILLILITER' | 'UNIT';

export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, string> = {
  GRAM: 'Gramo (g)',
  MILLILITER: 'Mililitro (ml)',
  UNIT: 'Unidad (und)',
};

export interface Supply {
  id: string;
  name: string;
  description: string | null;
  unitOfMeasure: UnitOfMeasure;
  packageSize: number;
  basePrice: number;
  pricePerUnit: number;
  isActive: boolean;
  notes: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindSuppliesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateSupplyDTO {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  packageSize: number;
  basePrice: number;
  description?: string;
  notes?: string;
}

export type UpdateSupplyDTO = Partial<CreateSupplyDTO>;
