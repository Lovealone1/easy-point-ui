import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplyPurchasesService } from "../services/supply-purchases.service";
import type {
  FindSupplyPurchasesParams,
  CreateSupplyPurchaseDTO,
  CompleteSupplyPurchaseDTO,
  AddItemsSupplyPurchaseDTO
} from "../types/supply-purchases.types";

// Query keys factory — type-safe cache key management
export const supplyPurchaseKeys = {
  all: ["supply-purchases"] as const,
  lists: () => [...supplyPurchaseKeys.all, "list"] as const,
  list: (params: FindSupplyPurchasesParams) => [...supplyPurchaseKeys.lists(), params] as const,
  details: () => [...supplyPurchaseKeys.all, "detail"] as const,
  detail: (id: string) => [...supplyPurchaseKeys.details(), id] as const,
};

/**
 * Hook to retrieve a paginated, sorted, and filtered list of supply purchases.
 */
export function useSupplyPurchases(params: FindSupplyPurchasesParams = {}) {
  return useQuery({
    queryKey: supplyPurchaseKeys.list(params),
    queryFn: () => supplyPurchasesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  });
}

/**
 * Hook to retrieve details of a single supply purchase.
 */
export function useSupplyPurchase(id: string) {
  return useQuery({
    queryKey: supplyPurchaseKeys.detail(id),
    queryFn: () => supplyPurchasesService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new supply purchase.
 */
export function useCreateSupplyPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplyPurchaseDTO) => supplyPurchasesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["supply-movements"] });
      queryClient.invalidateQueries({ queryKey: ["supply-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

/**
 * Hook to complete a PENDING purchase.
 */
export function useCompleteSupplyPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CompleteSupplyPurchaseDTO }) =>
      supplyPurchasesService.complete(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplyPurchaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: supplyPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["supply-movements"] });
      queryClient.invalidateQueries({ queryKey: ["supply-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

/**
 * Hook to add items to a PENDING purchase.
 */
export function useAddSupplyPurchaseItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddItemsSupplyPurchaseDTO }) =>
      supplyPurchasesService.addItems(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplyPurchaseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: supplyPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["supply-movements"] });
      queryClient.invalidateQueries({ queryKey: ["supply-stocks"] });
    },
  });
}

/**
 * Hook to cancel or delete a supply purchase.
 */
export function useDeleteSupplyPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplyPurchasesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: supplyPurchaseKeys.detail(String(id)) });
      queryClient.invalidateQueries({ queryKey: supplyPurchaseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["supply-movements"] });
      queryClient.invalidateQueries({ queryKey: ["supply-stocks"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}
