// ─────────────────────────────────────────────────────────────────────────────
// features/subscriptions/hooks/use-subscriptions.ts
//
// React Query hooks for the global subscriptions module.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { subscriptionsService } from "../services/subscriptions.service"
import type {
  FindSubscriptionsParams,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
} from "../types/subscriptions.types"

// ─────────────────────────────────────────────────────────────────────────────
// Query Key Factory
// ─────────────────────────────────────────────────────────────────────────────

export const subscriptionKeys = {
  all: ["subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (params: FindSubscriptionsParams) => [...subscriptionKeys.lists(), params] as const,
  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook to retrieve a paginated, filtered list of subscriptions.
 */
export function useSubscriptions(params: FindSubscriptionsParams = {}) {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => subscriptionsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to retrieve details of a single subscription.
 */
export function useSubscription(id: string) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => subscriptionsService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new subscription.
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSubscriptionDTO) => subscriptionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing subscription.
 */
export function useUpdateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubscriptionDTO }) =>
      subscriptionsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Hook to delete a subscription.
 */
export function useDeleteSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subscriptionsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Hook to pause an active subscription.
 */
export function usePauseSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subscriptionsService.pause(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Hook to resume a paused subscription.
 */
export function useResumeSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subscriptionsService.resume(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Hook to cancel a subscription.
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subscriptionsService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}
