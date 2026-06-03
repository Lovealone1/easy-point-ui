import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productPurchasesService } from "../services/product-purchases.service";
import type {
  FindProductPurchasesParams,
  CreateProductPurchaseDTO,
  CompleteProductPurchaseDTO,
  AddItemsProductPurchaseDTO
} from "../types/product-purchases.types";

// Query keys factory — type-safe cache key management
export const productPurchaseKeys = {
  all: ["product-purchases"] as const,
  lists: () => [...productPurchaseKeys.all, "list"] as const,
  list: (params: FindProductPurchasesParams) => [...productPurchaseKeys.lists(), params] as const,
  details: () => [...productPurchaseKeys.all, "detail"] as const,
  detail: (id: string) => [...productPurchaseKeys.details(), id] as const,
};

/**
 * Hook to retrieve a paginated, sorted, and filtered list of product purchases.
 */
export function useProductPurchases(params: FindProductPurchasesParams = {}) {
  return useQuery({
    queryKey: productPurchaseKeys.list(params),
    queryFn: () => productPurchasesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  });
}

/**
 * Hook to retrieve details of a single product purchase.
 */
export function useProductPurchase(id: string) {
  return useQuery({
    queryKey: productPurchaseKeys.detail(id),
    queryFn: () => productPurchasesService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new product purchase.
 */
export function useCreateProductPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPurchaseDTO) => productPurchasesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

/**
 * Hook to complete a PENDING purchase.
 */
export function useCompleteProductPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompleteProductPurchaseDTO }) =>
      productPurchasesService.complete(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productPurchaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

/**
 * Hook to add items to a PENDING purchase.
 */
export function useAddProductPurchaseItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddItemsProductPurchaseDTO }) =>
      productPurchasesService.addItems(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productPurchaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] });
    },
  });
}

/**
 * Hook to cancel or delete a product purchase.
 */
export function useDeleteProductPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productPurchasesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productPurchaseKeys.detail(String(id)) });
      queryClient.invalidateQueries({ queryKey: productPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}
