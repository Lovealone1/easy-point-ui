export type GlobalRole = 'ADMIN' | 'MODERATOR' | 'USER';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  globalRole: GlobalRole;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindUsersParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface UpdateUserRoleDTO {
  globalRole: GlobalRole;
}
