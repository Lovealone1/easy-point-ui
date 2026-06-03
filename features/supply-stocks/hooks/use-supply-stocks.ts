import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supplyStocksService } from "../services/supply-stocks.service"
import type {
  FindSupplyStocksParams,
  CreateSupplyStockDTO,
  UpdateSupplyStockDTO,
} from "../types/supply-stocks.types"

export const supplyStockKeys = {
  all: ["supply-stocks"] as const,
  lists: () => [...supplyStockKeys.all, "list"] as const,
  list: (params: FindSupplyStocksParams) => [...supplyStockKeys.lists(), params] as const,
  details: () => [...supplyStockKeys.all, "detail"] as const,
  detail: (id: string) => [...supplyStockKeys.details(), id] as const,
}

/**
 * Hook to retrieve a list of supply stocks.
 */
export function useSupplyStocks(params: FindSupplyStocksParams = {}) {
  return useQuery({
    queryKey: supplyStockKeys.list(params),
    queryFn: () => supplyStocksService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to retrieve a single supply stock record by ID.
 */
export function useSupplyStock(id: string) {
  return useQuery({
    queryKey: supplyStockKeys.detail(id),
    queryFn: () => supplyStocksService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to initialize stock for a supply manually.
 */
export function useCreateSupplyStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSupplyStockDTO) => supplyStocksService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyStockKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing supply stock record.
 */
export function useUpdateSupplyStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplyStockDTO }) =>
      supplyStocksService.update(id, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: supplyStockKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: supplyStockKeys.lists() })
    },
  })
}
