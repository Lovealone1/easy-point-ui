import { BaseClientService } from '@/shared/services/base-client.service';
import { apiClient } from '@/shared/services/api-client';
import type { Organization } from '../types/organization.types';

export class OrganizationsAdminServiceClass extends BaseClientService<Organization> {
  constructor() {
    super('organizations');
  }

  async updatePlan(id: string, payload: { plan?: string; planActiveUntil?: string | null }): Promise<Organization> {
    const { data } = await apiClient.patch<Organization>(`/${this.endpoint}/${id}/plan`, payload);
    return data;
  }
}

export const organizationsAdminService = new OrganizationsAdminServiceClass();
