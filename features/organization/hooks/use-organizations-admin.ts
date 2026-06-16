import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => organizationsAdminService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationAdminKeys.lists() });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      organizationsAdminService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationAdminKeys.all });
    },
  });
}

export function useUpdateOrganizationPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { plan?: string; planActiveUntil?: string | null } }) =>
      organizationsAdminService.updatePlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationAdminKeys.all });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationsAdminService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationAdminKeys.lists() });
    },
  });
}
