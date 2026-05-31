import { useQuery } from "@tanstack/react-query"
import { transactionCategoriesService } from "../services/transaction-categories.service"
import type { FindTransactionCategoriesParams } from "../types/transaction-categories.types"

export const transactionCategoryKeys = {
  all: ["transaction-categories"] as const,
  lists: () => [...transactionCategoryKeys.all, "list"] as const,
  list: (params: FindTransactionCategoriesParams) =>
    [...transactionCategoryKeys.lists(), params] as const,
}

/**
 * Hook to retrieve a list of transaction categories.
 */
export function useTransactionCategories(params: FindTransactionCategoriesParams = {}) {
  return useQuery({
    queryKey: transactionCategoryKeys.list(params),
    queryFn: () => transactionCategoriesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}
