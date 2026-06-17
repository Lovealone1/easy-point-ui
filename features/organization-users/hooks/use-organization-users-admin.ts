import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationUsersAdminService } from '../services/organization-users-admin.service';
import type {
  FindOrganizationUsersParams,
  CreateOrganizationUserDTO,
  UpdateOrganizationUserDTO,
} from '../types/organization-users.types';

export const organizationUserAdminKeys = {
  all: ['organization-users-admin'] as const,
  lists: () => [...organizationUserAdminKeys.all, 'list'] as const,
  list: (orgId: string, params: any) => [...organizationUserAdminKeys.lists(), orgId, params] as const,
};

export function useOrganizationUsersAdmin(orgId: string | null, params: Omit<FindOrganizationUsersParams, 'organizationId'> = {}) {
  return useQuery({
    queryKey: organizationUserAdminKeys.list(orgId || '', params),
    queryFn: () => organizationUsersAdminService.getAll(orgId!, params),
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
  });
}

export function useAssignOrganizationUserAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, payload }: { orgId: string; payload: CreateOrganizationUserDTO }) =>
      organizationUsersAdminService.create(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationUserAdminKeys.lists() });
    },
  });
}

export function useUpdateOrganizationUserRoleAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, payload }: { orgId: string; id: string; payload: UpdateOrganizationUserDTO }) =>
      organizationUsersAdminService.updateRole(orgId, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationUserAdminKeys.lists() });
    },
  });
}

export function useRemoveOrganizationUserAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }: { orgId: string; id: string }) =>
      organizationUsersAdminService.delete(orgId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationUserAdminKeys.lists() });
    },
  });
}

export function useOrganizationRolesAdmin(orgId: string | null) {
  return useQuery({
    queryKey: ['organization-roles-admin', orgId],
    queryFn: () => organizationUsersAdminService.getRoles(orgId!),
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
  });
}
