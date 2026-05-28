import { BaseClientService } from '@/shared/services/base-client.service';
import type {
  OrganizationUser,
  CreateOrganizationUserDTO,
  UpdateOrganizationUserDTO,
  FindOrganizationUsersParams,
} from '../types/organization-users.types';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { apiClient } from '@/shared/services/api-client';
import type { PaginatedApiResponse } from '@/shared/types/api.types';

export class OrganizationUsersServiceClass extends BaseClientService<
  OrganizationUser,
  CreateOrganizationUserDTO,
  UpdateOrganizationUserDTO
> {
  constructor() {
    super('organization-users');
  }

  /**
   * Overridden getAll to automatically inject the organizationId required by the backend.
   */
  async getAll(params: FindOrganizationUsersParams = {}): Promise<PaginatedApiResponse<OrganizationUser>> {
    const orgId = useAuthStore.getState().activeOrganization?.id;
    if (!orgId) {
      throw new Error('No active organization found to fetch organization users.');
    }

    const { data } = await apiClient.get<PaginatedApiResponse<OrganizationUser>>(`/${this.endpoint}`, {
      params: {
        ...params,
        organizationId: orgId, // Inject mandatory query param
      },
    });
    return data;
  }

  /**
   * Modifies the role of an organization user.
   */
  async updateRole(id: string, payload: UpdateOrganizationUserDTO): Promise<OrganizationUser> {
    const { data } = await apiClient.patch<OrganizationUser>(`/${this.endpoint}/${id}`, payload);
    return data;
  }
}

export const organizationUsersService = new OrganizationUsersServiceClass();
