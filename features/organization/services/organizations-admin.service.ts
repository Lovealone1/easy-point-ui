import { BaseClientService } from '@/shared/services/base-client.service';
import type { Organization } from '../types/organization.types';

export class OrganizationsAdminServiceClass extends BaseClientService<Organization> {
  constructor() {
    super('organizations');
  }
}

export const organizationsAdminService = new OrganizationsAdminServiceClass();
