import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { suppliersService } from "../services/suppliers.service"
import type {
  FindSuppliersParams,
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from "../types/suppliers.types"

// Query keys factory — type-safe cache key management
export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params: FindSuppliersParams) => [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, "detail"] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of suppliers.
 */
export function useSuppliers(params: FindSuppliersParams = {}) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => suppliersService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single supplier.
 */
export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new supplier.
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSupplierDTO) => suppliersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing supplier.
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateSupplierDTO }) =>
      suppliersService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

/**
 * Hook to delete a supplier.
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => suppliersService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

/**
 * Hook to toggle a supplier's active state.
 */
export function useToggleSupplierActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      suppliersService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}

/**
 * Hook to append notes to a supplier.
 */
export function useAddSupplierNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      suppliersService.addNote(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
    },
  })
}
