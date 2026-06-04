import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productionsService } from "../services/productions.service"
import type {
  FindProductionsParams,
  CreateProductionDTO,
  UpdateProductionDTO,
} from "../types/productions.types"

// ─── Query Key Factory ─────────────────────────────────────────────────────────

export const productionKeys = {
  all: ["productions"] as const,
  lists: () => [...productionKeys.all, "list"] as const,
  list: (params: FindProductionsParams) =>
    [...productionKeys.lists(), params] as const,
  details: () => [...productionKeys.all, "detail"] as const,
  detail: (id: string) => [...productionKeys.details(), id] as const,
}

// ─── LIST ──────────────────────────────────────────────────────────────────────

/**
 * Retrieves a paginated, filtered list of productions.
 * Supports filtering by type, status, and productId.
 */
export function useProductions(params: FindProductionsParams = {}) {
  return useQuery({
    queryKey: productionKeys.list(params),
    queryFn: () =>
      productionsService.getAll(params as Record<string, unknown>),
    placeholderData: (previousData) => previousData, // smooth pagination, no flash
  })
}

// ─── SINGLE ───────────────────────────────────────────────────────────────────

/**
 * Retrieves a single production by ID.
 * Does not fetch if id is empty.
 */
export function useProduction(id: string) {
  return useQuery({
    queryKey: productionKeys.detail(id),
    queryFn: () => productionsService.getById(id),
    enabled: !!id,
  })
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Creates a new production batch.
 * Also atomically consumes supplies (FIFO) and, if SELLABLE, increments
 * the corresponding product stock on the backend.
 * Invalidates the productions list on success.
 */
export function useCreateProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductionDTO) =>
      productionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.lists() })
    },
  })
}

// ─── UPDATE (notes only) ──────────────────────────────────────────────────────

/**
 * Patches a production record (notes only — completed productions are immutable).
 * Invalidates both the detail and the list caches on success.
 */
export function useUpdateProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProductionDTO
    }) => productionsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productionKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: productionKeys.lists() })
    },
  })
}

// ─── CANCEL ───────────────────────────────────────────────────────────────────

/**
 * Cancels a DRAFT production.
 * Only OWNER / ADMINISTRATOR roles can perform this action.
 * Invalidates both the detail and the list caches on success.
 */
export function useCancelProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productionsService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: productionKeys.lists() })
    },
  })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Deletes a production (only allowed for DRAFT or CANCELLED status).
 * Completed productions cannot be deleted via this hook.
 * Invalidates both the detail and the list caches on success.
 */
export function useDeleteProduction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productionsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: productionKeys.lists() })
    },
  })
}
