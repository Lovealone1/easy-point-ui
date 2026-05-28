import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationUsersService } from '../services/organization-users.service';
import type {
  FindOrganizationUsersParams,
  CreateOrganizationUserDTO,
  UpdateOrganizationUserDTO,
} from '../types/organization-users.types';
import { useAuthStore } from '@/shared/store/use-auth-store';

export const organizationUserKeys = {
  all: ['organization-users'] as const,
  lists: () => [...organizationUserKeys.all, 'list'] as const,
  list: (params: FindOrganizationUsersParams) => [...organizationUserKeys.lists(), params] as const,
  details: () => [...organizationUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationUserKeys.details(), id] as const,
};

export function useOrganizationUsers(params: FindOrganizationUsersParams = {}) {
  // Always attach the current org ID to the cache key implicitly so changing orgs invalidates it
  const activeOrgId = useAuthStore((s) => s.activeOrganization?.id);
  
  return useQuery({
    queryKey: organizationUserKeys.list({ ...params, organizationId: activeOrgId }),
    queryFn: () => organizationUsersService.getAll(params),
    enabled: !!activeOrgId, // Wait until auth store is hydrated
    placeholderData: (previousData) => previousData,
  });
}

export function useAssignOrganizationUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizationUserDTO) => organizationUsersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationUserKeys.lists() });
    },
  });
}

export function useUpdateOrganizationUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrganizationUserDTO }) =>
      organizationUsersService.updateRole(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationUserKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: organizationUserKeys.lists() });
    },
  });
}

export function useRemoveOrganizationUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationUsersService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: organizationUserKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: organizationUserKeys.lists() });
    },
  });
}
