import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { discountRulesService } from "../services/discount-rules.service"
import type {
  FindDiscountRulesParams,
  CreateDiscountRuleDTO,
  UpdateDiscountRuleDTO,
} from "../types/discount-rules.types"

// ─── Query Key Factory ──────────────────────────────────────────────────────
export const discountRuleKeys = {
  all: ["discount-rules"] as const,
  lists: () => [...discountRuleKeys.all, "list"] as const,
  list: (params: FindDiscountRulesParams) =>
    [...discountRuleKeys.lists(), params] as const,
  details: () => [...discountRuleKeys.all, "detail"] as const,
  detail: (id: string) => [...discountRuleKeys.details(), id] as const,
}

// ─── LIST ───────────────────────────────────────────────────────────────────
/**
 * Hook to retrieve a paginated, sorted, and filtered list of discount rules.
 */
export function useDiscountRules(params: FindDiscountRulesParams = {}) {
  return useQuery({
    queryKey: discountRuleKeys.list(params),
    queryFn: () => discountRulesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

// ─── SINGLE ─────────────────────────────────────────────────────────────────
/**
 * Hook to retrieve details of a single discount rule.
 */
export function useDiscountRule(id: string) {
  return useQuery({
    queryKey: discountRuleKeys.detail(id),
    queryFn: () => discountRulesService.getById(id),
    enabled: !!id,
  })
}

// ─── CREATE ─────────────────────────────────────────────────────────────────
/**
 * Hook to create a new discount rule.
 */
export function useCreateDiscountRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDiscountRuleDTO) =>
      discountRulesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountRuleKeys.lists() })
    },
  })
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────
/**
 * Hook to update an existing discount rule (PATCH — only modified fields).
 * Note: `type` and `scope` are immutable once created.
 */
export function useUpdateDiscountRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string | number
      payload: UpdateDiscountRuleDTO
    }) => discountRulesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: discountRuleKeys.detail(String(variables.id)),
      })
      queryClient.invalidateQueries({ queryKey: discountRuleKeys.lists() })
    },
  })
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
/**
 * Hook to delete a discount rule.
 */
export function useDeleteDiscountRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => discountRulesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: discountRuleKeys.detail(String(id)),
      })
      queryClient.invalidateQueries({ queryKey: discountRuleKeys.lists() })
    },
  })
}

// ─── TOGGLE ACTIVE ──────────────────────────────────────────────────────────
/**
 * Hook to toggle a discount rule's active state.
 */
export function useToggleDiscountRuleActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      discountRulesService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: discountRuleKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: discountRuleKeys.lists() })
    },
  })
}
