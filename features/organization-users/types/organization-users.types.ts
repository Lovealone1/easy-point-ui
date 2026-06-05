export type Role = 'OWNER' | 'ADMINISTRATOR' | 'MANAGER' | 'USER';

export interface OrganizationUserMemberInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}

export interface OrganizationUser {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  joinedAt: string;
  user?: OrganizationUserMemberInfo;
}

export interface FindOrganizationUsersParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  organizationId?: string; // Required by backend, automatically injected by Service
}

export interface CreateOrganizationUserDTO {
  userId: string;
  role?: Role;
}

export interface UpdateOrganizationUserDTO {
  role: Role;
}
