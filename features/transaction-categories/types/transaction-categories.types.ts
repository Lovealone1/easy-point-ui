export type TransactionCategoryType = 'INCOME' | 'EXPENSE';

export interface TransactionCategory {
  id: string;
  name: string;
  description: string | null;
  type: TransactionCategoryType;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindTransactionCategoriesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  name?: string;
  type?: TransactionCategoryType;
  isActive?: boolean;
}
