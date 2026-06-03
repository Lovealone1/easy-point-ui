import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supplyStockEntriesService } from "../services/supply-stocks-entries.service"
import type { FindSupplyStockEntriesParams, CreateSupplyStockEntryDTO } from "../types/supply-stocks-entries.types"

export const supplyStockEntryKeys = {
  all: ["supply-stock-entries"] as const,
  lists: () => [...supplyStockEntryKeys.all, "list"] as const,
  list: (params: FindSupplyStockEntriesParams) => [...supplyStockEntryKeys.lists(), params] as const,
  details: () => [...supplyStockEntryKeys.all, "detail"] as const,
  detail: (id: string) => [...supplyStockEntryKeys.details(), id] as const,
}

/**
 * Hook to retrieve a paginated list of supply stock entries.
 * Supports filtering by supplyStockId, supplyPurchaseId, and isExhausted.
 */
export function useSupplyStockEntries(params: FindSupplyStockEntriesParams = {}) {
  return useQuery({
    queryKey: supplyStockEntryKeys.list(params),
    queryFn: () => supplyStockEntriesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to retrieve a single supply stock entry by ID.
 */
export function useSupplyStockEntry(id: string) {
  return useQuery({
    queryKey: supplyStockEntryKeys.detail(id),
    queryFn: () => supplyStockEntriesService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to manually register a new physical batch for an existing SupplyStock.
 */
export function useCreateSupplyStockEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSupplyStockEntryDTO) =>
      supplyStockEntriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyStockEntryKeys.lists() })
    },
  })
}

/**
 * Hook to initialize missing entries for SupplyStocks that don't have any entries yet.
 * Used for legacy data migration (POST /supply-stock-entries/initialize-missing).
 */
export function useInitializeMissingEntries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => supplyStockEntriesService.initializeMissing(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyStockEntryKeys.lists() })
    },
  })
}
