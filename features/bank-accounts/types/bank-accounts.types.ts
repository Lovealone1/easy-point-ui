export type BankAccountStatus = 'ACTIVE' | 'FROZEN' | 'INACTIVE';

export const BANK_ACCOUNT_STATUS_LABELS: Record<BankAccountStatus, string> = {
  ACTIVE: 'Activo',
  FROZEN: 'Congelada',
  INACTIVE: 'Inactiva',
};

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  accountNumber: string | null;
  qrCode: string | null;
  status: BankAccountStatus;
  version: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindBankAccountsParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  status?: BankAccountStatus;
}

export interface CreateBankAccountDTO {
  name: string;
  currency?: string;
  accountNumber?: string;
  file?: File | null;
}

export type UpdateBankAccountDTO = Partial<CreateBankAccountDTO>;
