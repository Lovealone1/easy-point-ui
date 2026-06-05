export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
