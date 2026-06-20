export interface Expense {
  id: string;
  organizationId: string;
  categoryId: string;
  bankAccountId: string;
  amount: number;
  description: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindExpensesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  organizationId?: string;
  categoryId?: string;
  bankAccountId?: string;
  description?: string;
}

export interface CreateExpenseDTO {
  categoryId: string;
  bankAccountId: string;
  amount: number;
  description?: string;
  createdAt?: string;
}

export type UpdateExpenseDTO = Partial<Omit<CreateExpenseDTO, 'amount' | 'bankAccountId' | 'createdAt'>>;
