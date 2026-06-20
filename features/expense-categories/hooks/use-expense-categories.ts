import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { expenseCategoriesService } from "../services/expense-categories.service"
import type {
  FindExpenseCategoriesParams,
  CreateExpenseCategoryDTO,
  UpdateExpenseCategoryDTO,
} from "../types/expense-categories.types"

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const expenseCategoryKeys = {
  all: ["expense-categories"] as const,
  lists: () => [...expenseCategoryKeys.all, "list"] as const,
  list: (params: FindExpenseCategoriesParams) =>
    [...expenseCategoryKeys.lists(), params] as const,
  details: () => [...expenseCategoryKeys.all, "detail"] as const,
  detail: (id: string) => [...expenseCategoryKeys.details(), id] as const,
}

// ─── LIST ──────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve a paginated, filtered list of expense categories.
 */
export function useExpenseCategories(params: FindExpenseCategoriesParams = {}) {
  return useQuery({
    queryKey: expenseCategoryKeys.list(params),
    queryFn: () => expenseCategoriesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

// ─── SINGLE ────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve details of a single expense category.
 */
export function useExpenseCategory(id: string) {
  return useQuery({
    queryKey: expenseCategoryKeys.detail(id),
    queryFn: () => expenseCategoriesService.getById(id),
    enabled: !!id,
  })
}

// ─── CREATE ────────────────────────────────────────────────────────────────

/**
 * Hook to create a new expense category.
 */
export function useCreateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateExpenseCategoryDTO) =>
      expenseCategoriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}

// ─── UPDATE ────────────────────────────────────────────────────────────────

/**
 * Hook to update an existing expense category (partial PATCH).
 */
export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateExpenseCategoryDTO
    }) => expenseCategoriesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: expenseCategoryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}

// ─── DELETE ────────────────────────────────────────────────────────────────

/**
 * Hook to delete an expense category.
 */
export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => expenseCategoriesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: expenseCategoryKeys.detail(String(id)),
      })
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}

// ─── TOGGLE ACTIVE ─────────────────────────────────────────────────────────

/**
 * Hook to toggle the active status of an expense category.
 * Calls PATCH /expense-categories/:id/toggle-active
 */
export function useToggleExpenseCategoryActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      expenseCategoriesService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: expenseCategoryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: expenseCategoryKeys.lists() })
    },
  })
}
