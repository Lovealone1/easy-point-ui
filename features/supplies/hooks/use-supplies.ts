import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { suppliesService } from "../services/supplies.service"
import type {
  FindSuppliesParams,
  CreateSupplyDTO,
  UpdateSupplyDTO,
} from "../types/supplies.types"

// Query keys factory — type-safe cache key management
export const supplyKeys = {
  all: ["supplies"] as const,
  lists: () => [...supplyKeys.all, "list"] as const,
  list: (params: FindSuppliesParams) => [...supplyKeys.lists(), params] as const,
  details: () => [...supplyKeys.all, "detail"] as const,
  detail: (id: string) => [...supplyKeys.details(), id] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of supplies.
 */
export function useSupplies(params: FindSuppliesParams = {}) {
  return useQuery({
    queryKey: supplyKeys.list(params),
    queryFn: () => suppliesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single supply.
 */
export function useSupply(id: string) {
  return useQuery({
    queryKey: supplyKeys.detail(id),
    queryFn: () => suppliesService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new supply.
 */
export function useCreateSupply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSupplyDTO) => suppliesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing supply.
 */
export function useUpdateSupply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateSupplyDTO }) =>
      suppliesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() })
    },
  })
}

/**
 * Hook to delete a supply.
 */
export function useDeleteSupply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => suppliesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() })
    },
  })
}

/**
 * Hook to toggle a supply's active state.
 */
export function useToggleSupplyActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      suppliesService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() })
    },
  })
}

/**
 * Hook to append notes to a supply.
 */
export function useAddSupplyNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      suppliesService.addNote(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplyKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: supplyKeys.lists() })
    },
  })
}
