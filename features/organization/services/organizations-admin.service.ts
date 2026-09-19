import { BaseClientService } from '@/shared/services/base-client.service';
import { adminApiClient } from '@/shared/services/admin-api-client';
import type { Organization } from '../types/organization.types';

export class OrganizationsAdminServiceClass extends BaseClientService<Organization> {
  constructor() {
    super('organizations', adminApiClient);
  }

  async updatePlan(id: string, payload: { plan?: string; planActiveUntil?: string | null }): Promise<Organization> {
    const { data } = await adminApiClient.patch<Organization>(`/${this.endpoint}/${id}/plan`, payload);
    return data;
  }
}

export const organizationsAdminService = new OrganizationsAdminServiceClass();
