export interface Supplier {
  id: string;
  name: string;
  taxId: string;
  leadTime: number;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindSuppliersParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateSupplierDTO {
  name: string;
  taxId: string;
  leadTime: number;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;
