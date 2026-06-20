export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindExpenseCategoriesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  name?: string;
  isActive?: boolean;
}

export interface CreateExpenseCategoryDTO {
  name: string;
  description?: string;
}

export interface UpdateExpenseCategoryDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
}
