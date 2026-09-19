// ─────────────────────────────────────────────────────────────────────────────
// features/subscriptions/services/subscriptions.service.ts
//
// Client service for global subscriptions management.
// Inherits standard CRUD and adds custom administrative patch actions.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from "axios"
import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import { adminApiClient } from "@/shared/services/admin-api-client"
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
  constructor(client: AxiosInstance = apiClient) {
    super("/subscriptions", client)
  }

  /**
   * Pauses an active subscription.
   * Target: PATCH /subscriptions/:id/pause
   */
  async pause(id: string): Promise<Subscription> {
    const { data } = await this.client.patch<Subscription>(`/${this.endpoint}/${id}/pause`)
    return data
  }

  /**
   * Resumes a paused subscription.
   * Target: PATCH /subscriptions/:id/resume
   */
  async resume(id: string): Promise<Subscription> {
    const { data } = await this.client.patch<Subscription>(`/${this.endpoint}/${id}/resume`)
    return data
  }

  /**
   * Cancels a subscription.
   * Target: PATCH /subscriptions/:id/cancel
   */
  async cancel(id: string): Promise<Subscription> {
    const { data } = await this.client.patch<Subscription>(`/${this.endpoint}/${id}/cancel`)
    return data
  }

  /**
   * The calling org's own access state (plan, trial, blocked or not).
   * Target: GET /subscriptions/me — usable even when access is blocked.
   */
  async getMyState(): Promise<SubscriptionAccessState> {
    // Always the dashboard session: this asks about the caller's own
    // organization, which is a tenant question, and it must answer even for a
    // user with no console access at all.
    const { data } = await apiClient.get<SubscriptionAccessState>("/subscriptions/me")
    return data
  }
}

/**
 * Only getMyState() is reachable on a dashboard session — the rest of the
 * /subscriptions controller is @Roles(ADMIN).
 */
export const subscriptionsService = new SubscriptionsServiceClass()

/** The console's view: every administrative action over any organization. */
export const adminSubscriptionsService = new SubscriptionsServiceClass(adminApiClient)
