// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/services/user-subscriptions.service.ts
//
// Client for the Personal Space subscription tracker (/me/subscriptions).
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  UserSubscription,
  CreateUserSubscriptionDTO,
  UpdateUserSubscriptionDTO,
  UserSubscriptionStatus,
  SubscriptionsSummary,
} from "../types/user-subscriptions.types"

export class UserSubscriptionsServiceClass extends BaseClientService<
  UserSubscription,
  CreateUserSubscriptionDTO,
  UpdateUserSubscriptionDTO
> {
  constructor() {
    super("/me/subscriptions")
  }

  async changeStatus(id: string, status: UserSubscriptionStatus): Promise<UserSubscription> {
    const { data } = await apiClient.patch<UserSubscription>(`/${this.endpoint}/${id}/status`, { status })
    return data
  }

  async getSummary(month?: string): Promise<SubscriptionsSummary> {
    const { data } = await apiClient.get<SubscriptionsSummary>(`/${this.endpoint}/summary`, {
      params: month ? { month } : undefined,
    })
    return data
  }

  /**
   * Custom subscriptions only — catalog-backed ones use the provider logo and
   * the API rejects an upload for them.
   */
  async uploadLogo(id: string, file: File): Promise<UserSubscription> {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await apiClient.post<UserSubscription>(`/${this.endpoint}/${id}/logo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return data
  }

  async deleteLogo(id: string): Promise<UserSubscription> {
    const { data } = await apiClient.delete<UserSubscription>(`/${this.endpoint}/${id}/logo`)
    return data
  }
}

export const userSubscriptionsService = new UserSubscriptionsServiceClass()
