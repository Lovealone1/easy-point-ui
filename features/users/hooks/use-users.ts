import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users.service';
import type { FindUsersParams, UpdateUserDTO, GlobalRole } from '../types/users.types';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: FindUsersParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(params: FindUsersParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserDTO }) =>
      usersService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(String(variables.id)) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: GlobalRole }) =>
      usersService.updateRole(id, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(String(variables.id)) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(String(id)) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
