import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userSubscriptionsService } from "../services/user-subscriptions.service"
import { subscriptionCatalogService } from "../services/subscription-catalog.service"
import type {
  FindUserSubscriptionsParams,
  CreateUserSubscriptionDTO,
  UpdateUserSubscriptionDTO,
  UserSubscriptionStatus,
} from "../types/user-subscriptions.types"

export const userSubscriptionKeys = {
  all: ["user-subscriptions"] as const,
  lists: () => [...userSubscriptionKeys.all, "list"] as const,
  list: (params: FindUserSubscriptionsParams) => [...userSubscriptionKeys.lists(), params] as const,
  details: () => [...userSubscriptionKeys.all, "detail"] as const,
  detail: (id: string) => [...userSubscriptionKeys.details(), id] as const,
  summary: (month?: string) => [...userSubscriptionKeys.all, "summary", month ?? "current"] as const,
}

export const subscriptionCatalogKeys = {
  all: ["subscription-catalog"] as const,
  categories: () => [...subscriptionCatalogKeys.all, "categories"] as const,
  providers: (params: { search?: string; categoryId?: string }) =>
    [...subscriptionCatalogKeys.all, "providers", params] as const,
  paymentCards: () => ["user-payment-cards", "list"] as const,
}

export function useUserSubscriptions(params: FindUserSubscriptionsParams = {}) {
  return useQuery({
    queryKey: userSubscriptionKeys.list(params),
    queryFn: () => userSubscriptionsService.getAll(params as Record<string, unknown>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

export function useUserSubscription(id: string) {
  return useQuery({
    queryKey: userSubscriptionKeys.detail(id),
    queryFn: () => userSubscriptionsService.getById(id),
    enabled: !!id,
  })
}

export function useSubscriptionsSummary(month?: string) {
  return useQuery({
    queryKey: userSubscriptionKeys.summary(month),
    queryFn: () => userSubscriptionsService.getSummary(month),
  })
}

/** The catalog is seed-managed; refetching it on every mount is wasted work. */
export function useSubscriptionCategories() {
  return useQuery({
    queryKey: subscriptionCatalogKeys.categories(),
    queryFn: () => subscriptionCatalogService.getCategories(),
    staleTime: 60 * 60 * 1000,
  })
}

export function useSubscriptionProviders(params: { search?: string; categoryId?: string } = {}) {
  return useQuery({
    queryKey: subscriptionCatalogKeys.providers(params),
    queryFn: () => subscriptionCatalogService.getProviders(params),
    staleTime: 60 * 60 * 1000,
  })
}

export function usePaymentCards() {
  return useQuery({
    queryKey: subscriptionCatalogKeys.paymentCards(),
    queryFn: () => subscriptionCatalogService.getPaymentCards(),
  })
}

/** Totals shift whenever a subscription changes, so summaries invalidate too. */
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: userSubscriptionKeys.lists() })
  queryClient.invalidateQueries({ queryKey: [...userSubscriptionKeys.all, "summary"] })
  if (id) queryClient.invalidateQueries({ queryKey: userSubscriptionKeys.detail(id) })
}

export function useCreateUserSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserSubscriptionDTO) => userSubscriptionsService.create(payload),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useUpdateUserSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserSubscriptionDTO }) =>
      userSubscriptionsService.update(id, payload),
    onSuccess: (_, variables) => invalidateAll(queryClient, variables.id),
  })
}

export function useChangeUserSubscriptionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserSubscriptionStatus }) =>
      userSubscriptionsService.changeStatus(id, status),
    onSuccess: (_, variables) => invalidateAll(queryClient, variables.id),
  })
}

export function useDeleteUserSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => userSubscriptionsService.delete(id),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useUploadSubscriptionLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => userSubscriptionsService.uploadLogo(id, file),
    onSuccess: (_, variables) => invalidateAll(queryClient, variables.id),
  })
}
