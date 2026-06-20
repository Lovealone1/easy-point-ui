import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { expensesService } from "../services/expenses.service"
import type {
  FindExpensesParams,
  CreateExpenseDTO,
  UpdateExpenseDTO,
} from "../types/expenses.types"

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (params: FindExpensesParams) =>
    [...expenseKeys.lists(), params] as const,
  details: () => [...expenseKeys.all, "detail"] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
}

// ─── LIST ──────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve a paginated, filtered list of expenses.
 */
export function useExpenses(params: FindExpensesParams = {}) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

// ─── SINGLE ────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve details of a single expense.
 */
export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesService.getById(id),
    enabled: !!id,
  })
}

// ─── CREATE ────────────────────────────────────────────────────────────────

/**
 * Hook to create a new expense.
 */
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateExpenseDTO) =>
      expensesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}

// ─── UPDATE ────────────────────────────────────────────────────────────────

/**
 * Hook to update an existing expense (partial PATCH).
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateExpenseDTO
    }) => expensesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: expenseKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}

// ─── DELETE ────────────────────────────────────────────────────────────────

/**
 * Hook to delete an expense.
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => expensesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: expenseKeys.detail(String(id)),
      })
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() })
    },
  })
}
