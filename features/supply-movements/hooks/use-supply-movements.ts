import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supplyMovementsService } from "../services/supply-movements.service"
import type { CreateSupplyMovementPayload } from "../services/supply-movements.service"
import type { FindSupplyMovementsParams } from "../types/supply-movements.types"

export const supplyMovementKeys = {
  all: ["supply-movements"] as const,
  lists: () => [...supplyMovementKeys.all, "list"] as const,
  list: (params: FindSupplyMovementsParams) => [...supplyMovementKeys.lists(), params] as const,
  details: () => [...supplyMovementKeys.all, "detail"] as const,
  detail: (id: string) => [...supplyMovementKeys.details(), id] as const,
}

/**
 * Hook to retrieve a list of supply movements.
 */
export function useSupplyMovements(params: FindSupplyMovementsParams = {}) {
  return useQuery({
    queryKey: supplyMovementKeys.list(params),
    queryFn: () => supplyMovementsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to register an entry by purchase.
 */
export function useCreateSupplyPurchaseMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSupplyMovementPayload) =>
      supplyMovementsService.createPurchase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyMovementKeys.all })
      queryClient.invalidateQueries({ queryKey: ["supply-stocks"] })
    },
  })
}

/**
 * Hook to register a consumption by production.
 */
export function useCreateSupplyProductionMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSupplyMovementPayload) =>
      supplyMovementsService.createProduction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplyMovementKeys.all })
      queryClient.invalidateQueries({ queryKey: ["supply-stocks"] })
    },
  })
}
