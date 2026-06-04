import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { financialTransactionsService } from "../services/financial-transactions.service"
import type {
  FindFinancialTransactionsParams,
  CreateFinancialTransactionDTO,
} from "../types/financial-transactions.types"

export const financialTransactionKeys = {
  all: ["financial-transactions"] as const,
  lists: () => [...financialTransactionKeys.all, "list"] as const,
  list: (params: FindFinancialTransactionsParams) =>
    [...financialTransactionKeys.lists(), params] as const,
  details: () => [...financialTransactionKeys.all, "detail"] as const,
  detail: (id: string) => [...financialTransactionKeys.details(), id] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of financial transactions.
 */
export function useFinancialTransactions(params: FindFinancialTransactionsParams = {}) {
  return useQuery({
    queryKey: financialTransactionKeys.list(params),
    queryFn: () => financialTransactionsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single financial transaction.
 */
export function useFinancialTransaction(id: string) {
  return useQuery({
    queryKey: financialTransactionKeys.detail(id),
    queryFn: () => financialTransactionsService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new manual financial transaction (adjustment).
 * Invalidates lists to trigger refresh. Also invalidates bank accounts because
 * transactions modify bank account balances.
 */
export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateFinancialTransactionDTO) =>
      financialTransactionsService.create(payload),
    onSuccess: () => {
      // Invalidate transaction lists
      queryClient.invalidateQueries({ queryKey: financialTransactionKeys.lists() })
      // Invalidate bank accounts lists/details because bank account balances are updated
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
    },
  })
}

/**
 * Hook to delete a manual financial transaction (adjustment).
 * Invalidates lists to trigger refresh. Also invalidates bank accounts because
 * deleting transactions reverts their effect on bank account balances.
 */
export function useDeleteFinancialTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      financialTransactionsService.delete(id),
    onSuccess: () => {
      // Invalidate transaction lists
      queryClient.invalidateQueries({ queryKey: financialTransactionKeys.lists() })
      // Invalidate bank accounts lists/details because bank account balances are updated
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
    },
  })
}
