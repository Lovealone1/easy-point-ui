import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productCategoriesService } from "../services/product-categories.service"
import type {
  FindProductCategoriesParams,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
} from "../types/product-categories.types"

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const productCategoryKeys = {
  all: ["product-categories"] as const,
  lists: () => [...productCategoryKeys.all, "list"] as const,
  list: (params: FindProductCategoriesParams) =>
    [...productCategoryKeys.lists(), params] as const,
  details: () => [...productCategoryKeys.all, "detail"] as const,
  detail: (id: string) => [...productCategoryKeys.details(), id] as const,
}

// ─── LIST ──────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve a paginated, filtered list of product categories.
 */
export function useProductCategories(params: FindProductCategoriesParams = {}) {
  return useQuery({
    queryKey: productCategoryKeys.list(params),
    queryFn: () =>
      productCategoriesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination, no flash
  })
}

// ─── SINGLE ────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve details of a single product category.
 */
export function useProductCategory(id: string) {
  return useQuery({
    queryKey: productCategoryKeys.detail(id),
    queryFn: () => productCategoriesService.getById(id),
    enabled: !!id,
  })
}

// ─── CREATE ────────────────────────────────────────────────────────────────

/**
 * Hook to create a new product category.
 */
export function useCreateProductCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductCategoryDTO) =>
      productCategoriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() })
    },
  })
}

// ─── UPDATE ────────────────────────────────────────────────────────────────

/**
 * Hook to update an existing product category (partial PATCH).
 */
export function useUpdateProductCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProductCategoryDTO
    }) => productCategoriesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() })
    },
  })
}

// ─── DELETE ────────────────────────────────────────────────────────────────

/**
 * Hook to delete a product category.
 */
export function useDeleteProductCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productCategoriesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.detail(String(id)),
      })
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() })
    },
  })
}

// ─── TOGGLE ACTIVE ─────────────────────────────────────────────────────────

/**
 * Hook to toggle the active status of a product category.
 * Calls PATCH /product-categories/:id/toggle-active
 */
export function useToggleProductCategoryActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productCategoriesService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() })
    },
  })
}
