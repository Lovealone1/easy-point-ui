export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}
