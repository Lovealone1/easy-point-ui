export interface Client {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  notes: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindClientsParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateClientDTO {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  notes?: string;
}

export type UpdateClientDTO = Partial<CreateClientDTO>;
