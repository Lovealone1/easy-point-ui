import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { bankAccountsService } from "../services/bank-accounts.service"
import type {
  FindBankAccountsParams,
  CreateBankAccountDTO,
  UpdateBankAccountDTO,
  BankAccountStatus,
} from "../types/bank-accounts.types"

// Query keys factory — type-safe cache key management
export const bankAccountKeys = {
  all: ["bank-accounts"] as const,
  lists: () => [...bankAccountKeys.all, "list"] as const,
  list: (params: FindBankAccountsParams) => [...bankAccountKeys.lists(), params] as const,
  details: () => [...bankAccountKeys.all, "detail"] as const,
  detail: (id: string) => [...bankAccountKeys.details(), id] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of bank accounts.
 */
export function useBankAccounts(params: FindBankAccountsParams = {}) {
  return useQuery({
    queryKey: bankAccountKeys.list(params),
    queryFn: () => bankAccountsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single bank account.
 */
export function useBankAccount(id: string) {
  return useQuery({
    queryKey: bankAccountKeys.detail(id),
    queryFn: () => bankAccountsService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new bank account.
 */
export function useCreateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateBankAccountDTO) => bankAccountsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing bank account.
 */
export function useUpdateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateBankAccountDTO }) =>
      bankAccountsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() })
    },
  })
}

/**
 * Hook to delete a bank account.
 */
export function useDeleteBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => bankAccountsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() })
    },
  })
}

/**
 * Hook to change a bank account's status.
 */
export function useChangeBankAccountStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BankAccountStatus }) =>
      bankAccountsService.changeStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() })
    },
  })
}

/**
 * Hook to upload a QR code for a bank account.
 */
export function useUploadBankAccountQrCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      bankAccountsService.uploadQrCode(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() })
    },
  })
}

/**
 * Hook to delete a bank account's QR code.
 */
export function useDeleteBankAccountQrCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bankAccountsService.deleteQrCode(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() })
    },
  })
}
