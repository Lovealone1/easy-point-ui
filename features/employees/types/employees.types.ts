// ─── Linked Organization User (when assigned) ──────────────────────────────
export interface EmployeeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// Matches the Prisma enum EmployeeStatus EXACTLY
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export interface Employee {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  taxId: string | null;
  salary: number;
  hireDate: string;
  position: string;
  email: string | null;
  phone: string | null;
  status: EmployeeStatus;
  isActive: boolean;
  notes: string | null;
  userId: string | null;
  user: EmployeeUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindEmployeesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  status?: EmployeeStatus;
  isActive?: boolean;
}

export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  taxId?: string;
  salary: number;
  hireDate: string;
  position: string;
  email?: string;
  phone?: string;
  status?: EmployeeStatus;
  userId?: string | null;
  notes?: string;
}

export type UpdateEmployeeDTO = Partial<CreateEmployeeDTO>;
