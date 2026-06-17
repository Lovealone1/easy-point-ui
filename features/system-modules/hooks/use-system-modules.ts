// ─────────────────────────────────────────────────────────────────────────────
// features/system-modules/hooks/use-system-modules.ts
//
// React Query hooks for system-modules CRUD.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { systemModulesService } from "../services/system-modules.service"
import type {
  CreateSystemModuleDTO,
  UpdateSystemModuleDTO,
} from "../types/system-modules.types"

// ─────────────────────────────────────────────────────────────────────────────
// Query Key Factory
// ─────────────────────────────────────────────────────────────────────────────

export const systemModuleKeys = {
  all: ["system-modules"] as const,
  lists: () => [...systemModuleKeys.all, "list"] as const,
  list: (params: Record<string, any>) => [...systemModuleKeys.lists(), params] as const,
  details: () => [...systemModuleKeys.all, "detail"] as const,
  detail: (id: string) => [...systemModuleKeys.details(), id] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useSystemModules(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: systemModuleKeys.list(params),
    queryFn: () => systemModulesService.getAll(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useSystemModule(id: string) {
  return useQuery({
    queryKey: systemModuleKeys.detail(id),
    queryFn: () => systemModulesService.getById(id),
    enabled: !!id,
  })
}

export function useCreateSystemModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSystemModuleDTO) => systemModulesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemModuleKeys.lists() })
    },
  })
}

export function useUpdateSystemModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSystemModuleDTO }) =>
      systemModulesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: systemModuleKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: systemModuleKeys.lists() })
    },
  })
}

export function useDeleteSystemModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => systemModulesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: systemModuleKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: systemModuleKeys.lists() })
    },
  })
}

export function useToggleSystemModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      systemModulesService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: systemModuleKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: systemModuleKeys.lists() })
    },
  })
}
