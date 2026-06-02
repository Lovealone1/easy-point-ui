import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productStocksService } from "../services/product-stocks.service"
import type {
  FindProductStocksParams,
  CreateProductStockDTO,
  UpdateProductStockDTO,
} from "../types/product-stocks.types"

export const productStockKeys = {
  all: ["product-stocks"] as const,
  lists: () => [...productStockKeys.all, "list"] as const,
  list: (params: FindProductStocksParams) => [...productStockKeys.lists(), params] as const,
  details: () => [...productStockKeys.all, "detail"] as const,
  detail: (id: string) => [...productStockKeys.details(), id] as const,
}

/**
 * Hook to retrieve a list of product stocks.
 */
export function useProductStocks(params: FindProductStocksParams = {}) {
  return useQuery({
    queryKey: productStockKeys.list(params),
    queryFn: () => productStocksService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to retrieve a single product stock record by ID.
 */
export function useProductStock(id: string) {
  return useQuery({
    queryKey: productStockKeys.detail(id),
    queryFn: () => productStocksService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to initialize stock for a product manually.
 */
export function useCreateProductStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductStockDTO) => productStocksService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productStockKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing product stock record.
 */
export function useUpdateProductStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductStockDTO }) =>
      productStocksService.update(id, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: productStockKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: productStockKeys.lists() })
    },
  })
}
