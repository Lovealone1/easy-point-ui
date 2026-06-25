// ─────────────────────────────────────────────────────────────────────────────
// features/plans/hooks/use-plans.ts
//
// React Query hooks for the global pricing plans module.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { plansService } from "../services/plans.service"
import type { FindPlansParams, CreatePlanDTO, UpdatePlanDTO } from "../types/plans.types"

// ─────────────────────────────────────────────────────────────────────────────
// Query Key Factory
// ─────────────────────────────────────────────────────────────────────────────

export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: (params: FindPlansParams) => [...planKeys.lists(), params] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve a paginated list of pricing plans.
 */
export function usePlans(params: FindPlansParams = {}) {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => plansService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single pricing plan.
 */
export function usePlan(id: string) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => plansService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new pricing plan.
 */
export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePlanDTO) => plansService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing pricing plan.
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePlanDTO }) =>
      plansService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}

/**
 * Hook to delete a pricing plan.
 */
export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => plansService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}

/**
 * Hook to toggle a pricing plan's active state.
 */
export function useTogglePlanActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      plansService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: planKeys.lists() })
    },
  })
}
