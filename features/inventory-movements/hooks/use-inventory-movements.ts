import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { inventoryMovementsService } from "../services/inventory-movements.service"
import type { CreateMovementPayload } from "../services/inventory-movements.service"
import type {
  FindInventoryMovementsParams,
} from "../types/inventory-movements.types"

export const inventoryMovementKeys = {
  all: ["inventory-movements"] as const,
  lists: () => [...inventoryMovementKeys.all, "list"] as const,
  list: (params: FindInventoryMovementsParams) => [...inventoryMovementKeys.lists(), params] as const,
  details: () => [...inventoryMovementKeys.all, "detail"] as const,
  detail: (id: string) => [...inventoryMovementKeys.details(), id] as const,
}

export function useInventoryMovements(params: FindInventoryMovementsParams = {}) {
  return useQuery({
    queryKey: inventoryMovementKeys.list(params),
    queryFn: () => inventoryMovementsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateAdjustmentMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMovementPayload) =>
      inventoryMovementsService.createAdjustment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryMovementKeys.all })
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] })
    },
  })
}

export function useCreateWasteMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMovementPayload) =>
      inventoryMovementsService.createWaste(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryMovementKeys.all })
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] })
    },
  })
}

export function useCreateTestsMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMovementPayload) =>
      inventoryMovementsService.createTests(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryMovementKeys.all })
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] })
    },
  })
}

export function useCreateProductionMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMovementPayload) =>
      inventoryMovementsService.createProduction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryMovementKeys.all })
      queryClient.invalidateQueries({ queryKey: ["product-stocks"] })
    },
  })
}
