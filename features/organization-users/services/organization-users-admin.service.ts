import { apiClient } from '@/shared/services/api-client';
import type { PaginatedApiResponse } from '@/shared/types/api.types';
import type {
  OrganizationUser,
  CreateOrganizationUserDTO,
  UpdateOrganizationUserDTO,
  FindOrganizationUsersParams,
} from '../types/organization-users.types';

export class OrganizationUsersAdminServiceClass {
  private readonly endpoint = 'organization-users';

  async getAll(orgId: string, params: Omit<FindOrganizationUsersParams, 'organizationId'> = {}): Promise<PaginatedApiResponse<OrganizationUser>> {
    const { data } = await apiClient.get<PaginatedApiResponse<OrganizationUser>>(`/${this.endpoint}`, {
      params: {
        ...params,
        organizationId: orgId,
      },
      headers: {
        'x-organization-id': orgId,
      },
    });
    return data;
  }

  async create(orgId: string, payload: CreateOrganizationUserDTO): Promise<OrganizationUser> {
    const { data } = await apiClient.post<OrganizationUser>(`/${this.endpoint}`, payload, {
      headers: {
        'x-organization-id': orgId,
      },
    });
    return data;
  }

  async updateRole(orgId: string, id: string, payload: UpdateOrganizationUserDTO): Promise<OrganizationUser> {
    const { data } = await apiClient.patch<OrganizationUser>(`/${this.endpoint}/${id}`, payload, {
      headers: {
        'x-organization-id': orgId,
      },
    });
    return data;
  }

  async delete(orgId: string, id: string): Promise<void> {
    const { data } = await apiClient.delete<void>(`/${this.endpoint}/${id}`, {
      headers: {
        'x-organization-id': orgId,
      },
    });
    return data;
  }

  async getRoles(orgId: string): Promise<PaginatedApiResponse<any>> {
    const { data } = await apiClient.get<PaginatedApiResponse<any>>(`/roles`, {
      headers: {
        'x-organization-id': orgId,
      },
      params: {
        limit: 100,
      },
    });
    return data;
  }
}

export const organizationUsersAdminService = new OrganizationUsersAdminServiceClass();
