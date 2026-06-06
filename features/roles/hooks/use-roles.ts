import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { rolesService } from "../services/roles.service"
import type { Role, CreateRoleDto, UpdateRoleDto } from "../types/roles.types"
import { useAuthStore } from "@/shared/store/use-auth-store"

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: (params: Record<string, any>) => [...roleKeys.lists(), params] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
}

export function useRoles(params: Record<string, any> = {}) {
  const activeOrgId = useAuthStore((s) => s.activeOrganization?.id)
  
  return useQuery({
    queryKey: roleKeys.list({ ...params, organizationId: activeOrgId }),
    queryFn: () => rolesService.getAll(params),
    enabled: !!activeOrgId,
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRoleDto) => rolesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoleDto }) =>
      rolesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => rolesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
    },
  })
}
