import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { transactionCategoriesService } from "../services/transaction-categories.service"
import type {
  FindTransactionCategoriesParams,
  CreateTransactionCategoryDTO,
  UpdateTransactionCategoryDTO,
} from "../types/transaction-categories.types"

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const transactionCategoryKeys = {
  all: ["transaction-categories"] as const,
  lists: () => [...transactionCategoryKeys.all, "list"] as const,
  list: (params: FindTransactionCategoriesParams) =>
    [...transactionCategoryKeys.lists(), params] as const,
  details: () => [...transactionCategoryKeys.all, "detail"] as const,
  detail: (id: string) => [...transactionCategoryKeys.details(), id] as const,
}

// ─── LIST ──────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve a paginated, filtered list of transaction categories.
 */
export function useTransactionCategories(params: FindTransactionCategoriesParams = {}) {
  return useQuery({
    queryKey: transactionCategoryKeys.list(params),
    queryFn: () => transactionCategoriesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

// ─── SINGLE ────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve details of a single transaction category.
 */
export function useTransactionCategory(id: string) {
  return useQuery({
    queryKey: transactionCategoryKeys.detail(id),
    queryFn: () => transactionCategoriesService.getById(id),
    enabled: !!id,
  })
}

// ─── CREATE ────────────────────────────────────────────────────────────────

/**
 * Hook to create a new transaction category.
 */
export function useCreateTransactionCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTransactionCategoryDTO) =>
      transactionCategoriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionCategoryKeys.lists() })
    },
  })
}

// ─── UPDATE ────────────────────────────────────────────────────────────────

/**
 * Hook to update an existing transaction category (partial PATCH).
 */
export function useUpdateTransactionCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateTransactionCategoryDTO
    }) => transactionCategoriesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: transactionCategoryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: transactionCategoryKeys.lists() })
    },
  })
}

// ─── DELETE ────────────────────────────────────────────────────────────────

/**
 * Hook to delete a transaction category.
 */
export function useDeleteTransactionCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transactionCategoriesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: transactionCategoryKeys.detail(String(id)),
      })
      queryClient.invalidateQueries({ queryKey: transactionCategoryKeys.lists() })
    },
  })
}

// ─── TOGGLE ACTIVE ─────────────────────────────────────────────────────────

/**
 * Hook to toggle the active status of a transaction category.
 * Calls PATCH /transaction-categories/:id/toggle-active
 */
export function useToggleTransactionCategoryActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      transactionCategoriesService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: transactionCategoryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: transactionCategoryKeys.lists() })
    },
  })
}
