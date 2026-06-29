// ─────────────────────────────────────────────────────────────────────────────
// features/subscriptions/types/subscriptions.types.ts
//
// TypeScript type definitions for the subscriptions module.
// ─────────────────────────────────────────────────────────────────────────────

import type { Plan } from "@/features/plans/types/plans.types"

export type BillingCycle = "MONTHLY" | "YEARLY"

export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE" | "TRIALING" | "PENDING_PAYMENT"

export interface Subscription {
  id: string
  organizationId: string
  planId: string
  billingCycle: BillingCycle
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndsAt: string | null
  cancelledAt: string | null
  isPaused: boolean
  pausedAt: string | null
  notes: string | null
  metadata: any | null
  createdAt: string
  updatedAt: string

  // Relations
  plan?: Plan
}

export interface FindSubscriptionsParams {
  page?: number
  limit?: number
  order?: "ASC" | "DESC"
  orderBy?: string
  search?: string
  organizationId?: string
  planId?: string
  status?: SubscriptionStatus
  isPaused?: boolean
}

export interface CreateSubscriptionDTO {
  organizationId: string
  planId: string
  billingCycle: BillingCycle
  status?: SubscriptionStatus
  currentPeriodStart?: string
  currentPeriodEnd?: string
  trialEndsAt?: string
  notes?: string
  metadata?: any
}

export type UpdateSubscriptionDTO = Partial<CreateSubscriptionDTO>;
