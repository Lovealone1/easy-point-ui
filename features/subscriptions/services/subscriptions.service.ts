// ─────────────────────────────────────────────────────────────────────────────
// features/subscriptions/services/subscriptions.service.ts
//
// Client service for global subscriptions management.
// Inherits standard CRUD and adds custom administrative patch actions.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  Subscription,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  SubscriptionAccessState,
} from "../types/subscriptions.types"

export class SubscriptionsServiceClass extends BaseClientService<
  Subscription,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO
> {
  constructor() {
    super("/subscriptions")
  }

  /**
   * Pauses an active subscription.
   * Target: PATCH /subscriptions/:id/pause
   */
  async pause(id: string): Promise<Subscription> {
    const { data } = await apiClient.patch<Subscription>(`/${this.endpoint}/${id}/pause`)
    return data
  }

  /**
   * Resumes a paused subscription.
   * Target: PATCH /subscriptions/:id/resume
   */
  async resume(id: string): Promise<Subscription> {
    const { data } = await apiClient.patch<Subscription>(`/${this.endpoint}/${id}/resume`)
    return data
  }

  /**
   * Cancels a subscription.
   * Target: PATCH /subscriptions/:id/cancel
   */
  async cancel(id: string): Promise<Subscription> {
    const { data } = await apiClient.patch<Subscription>(`/${this.endpoint}/${id}/cancel`)
    return data
  }

  /**
   * The calling org's own access state (plan, trial, blocked or not).
   * Target: GET /subscriptions/me — usable even when access is blocked.
   */
  async getMyState(): Promise<SubscriptionAccessState> {
    const { data } = await apiClient.get<SubscriptionAccessState>("/subscriptions/me")
    return data
  }
}

export const subscriptionsService = new SubscriptionsServiceClass()
