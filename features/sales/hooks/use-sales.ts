import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { salesService } from "../services/sales.service"
import type {
  FindSalesParams,
  CreateSaleDTO,
  CompleteSaleDTO,
} from "../types/sales.types"

// ─── Query Key Factory ───────────────────────────────────────────────────────
export const saleKeys = {
  all: ["sales"] as const,
  lists: () => [...saleKeys.all, "list"] as const,
  list: (params: FindSalesParams) => [...saleKeys.lists(), params] as const,
  details: () => [...saleKeys.all, "detail"] as const,
  detail: (id: string) => [...saleKeys.details(), id] as const,
}

// ─── LIST ────────────────────────────────────────────────────────────────────
/**
 * Retrieves a paginated, filtered list of sales.
 * Supports filtering by status, clientId, paymentMethod, date range, and search.
 */
export function useSales(params: FindSalesParams = {}) {
  return useQuery({
    queryKey: saleKeys.list(params),
    queryFn: () => salesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination, no flash
  })
}

// ─── SINGLE ──────────────────────────────────────────────────────────────────
/**
 * Retrieves the full details of a single sale, including its items.
 */
export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: () => salesService.getById(id),
    enabled: !!id,
  })
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
/**
 * Creates a new sale. A sale may be created in PENDING status
 * (no paymentMethod) or directly COMPLETED (with paymentMethod + amountPaid).
 * Invalidates the sales list on success.
 */
export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSaleDTO) => salesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
    },
  })
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
/**
 * Deletes a sale by ID.
 * Invalidates both the detail cache for the deleted sale and the lists cache.
 */
export function useDeleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => salesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
    },
  })
}

// ─── COMPLETE PENDING SALE ───────────────────────────────────────────────────
/**
 * Completes a sale that was left in PENDING status.
 * Sends: paymentMethod, amountPaid (optional), notes (optional).
 * Target: PATCH /sales/:id/complete
 * Invalidates both the detail and the list cache on success.
 */
export function useCompleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompleteSaleDTO }) =>
      salesService.completeSale(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: saleKeys.lists() })
    },
  })
}
