import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  productsService,
  productCategoriesService,
} from "../services/products.service"
import type {
  FindProductsParams,
  CreateProductDTO,
  UpdateProductDTO,
} from "../types/products.types"

// Query keys constants to prevent typos
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: FindProductsParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: () => ["product-categories"] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of products.
 */
export function useProducts(params: FindProductsParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single product.
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new product.
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductDTO) => productsService.create(payload),
    onSuccess: (response) => {
      // Invalidate products list cache
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing product.
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateProductDTO }) =>
      productsService.update(id, payload),
    onSuccess: (response, variables) => {
      // Invalidate detail and list cache
      queryClient.invalidateQueries({ queryKey: productKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

/**
 * Hook to delete a product.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => productsService.delete(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

/**
 * Hook to toggle a product's active state.
 */
export function useToggleProductActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productsService.toggleActive(id, isActive),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

/**
 * Hook to append notes to a product.
 */
export function useAddProductNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      productsService.addNote(id, notes),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

/**
 * Hook to retrieve product categories.
 * Useful for building filter dropdown selections.
 */
export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productCategoriesService.getAll(),
  })
}
