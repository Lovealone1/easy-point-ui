import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  subscriptionCategoriesService,
  type CreateSubscriptionCategoryDTO,
  type UpdateSubscriptionCategoryDTO,
} from "../services/subscription-categories.service"
import {
  paymentCardsService,
  type CreatePaymentCardDTO,
  type UpdatePaymentCardDTO,
} from "../services/payment-cards.service"

export const personalCategoryKeys = {
  all: ["personal-subscription-categories"] as const,
  list: () => [...personalCategoryKeys.all, "list"] as const,
}

export const paymentCardKeys = {
  all: ["user-payment-cards"] as const,
  list: () => [...paymentCardKeys.all, "list"] as const,
  detail: (id: string) => [...paymentCardKeys.all, "detail", id] as const,
}

// ── Categories ──────────────────────────────────────────────────────────────

export function usePersonalCategories() {
  return useQuery({
    queryKey: personalCategoryKeys.list(),
    queryFn: () => subscriptionCategoriesService.getAll(),
  })
}

/**
 * Category changes reach subscriptions too — a rename shows up on every row
 * that uses it, and a delete-with-reassign moves them.
 */
function invalidateCategories(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: personalCategoryKeys.all })
  queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] })
}

export function useCreatePersonalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSubscriptionCategoryDTO) =>
      subscriptionCategoriesService.create(payload),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

export function useUpdatePersonalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubscriptionCategoryDTO }) =>
      subscriptionCategoriesService.update(id, payload),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

export function useDeletePersonalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      subscriptionCategoriesService.delete(id, reassignTo),
    onSuccess: () => invalidateCategories(queryClient),
  })
}

// ── Payment cards ───────────────────────────────────────────────────────────

export function usePaymentCardsList() {
  return useQuery({
    queryKey: paymentCardKeys.list(),
    queryFn: () => paymentCardsService.getAll(),
  })
}

/**
 * A card's statementDay is inherited as the billing cutoff by every
 * subscription that has not overridden it, so card edits invalidate those too.
 */
function invalidateCards(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: paymentCardKeys.all })
  queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] })
}

export function useCreatePaymentCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePaymentCardDTO) => paymentCardsService.create(payload),
    onSuccess: () => invalidateCards(queryClient),
  })
}

export function useUpdatePaymentCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentCardDTO }) =>
      paymentCardsService.update(id, payload),
    onSuccess: () => invalidateCards(queryClient),
  })
}

export function useDeletePaymentCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => paymentCardsService.delete(id),
    onSuccess: () => invalidateCards(queryClient),
  })
}
