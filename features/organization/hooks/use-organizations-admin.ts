import { useQuery } from '@tanstack/react-query';
import { organizationsAdminService } from '../services/organizations-admin.service';

export const organizationAdminKeys = {
  all: ['organizations-admin'] as const,
  lists: () => [...organizationAdminKeys.all, 'list'] as const,
  list: (params: Record<string, any>) => [...organizationAdminKeys.lists(), params] as const,
};

export function useOrganizationsAdmin(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: organizationAdminKeys.list(params),
    queryFn: () => organizationsAdminService.getAll(params),
    placeholderData: (previousData) => previousData,
  });
}
