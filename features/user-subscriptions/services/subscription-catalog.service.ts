// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/services/subscription-catalog.service.ts
//
// Read-only access to the global provider/category catalog that powers the
// subscription form. Writes are admin-only and live elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { PaginatedApiResponse } from "@/shared/types/api.types"
import type { SubscriptionCategory, SubscriptionProvider, UserPaymentCard } from "../types/user-subscriptions.types"

class SubscriptionCatalogServiceClass {
  async getCategories(): Promise<SubscriptionCategory[]> {
    const { data } = await apiClient.get<SubscriptionCategory[]>("/subscription-catalog/categories", {
      params: { isActive: true },
    })
    return data
  }

  async getProviders(params: { search?: string; categoryId?: string; limit?: number } = {}): Promise<
    PaginatedApiResponse<SubscriptionProvider>
  > {
    const { data } = await apiClient.get<PaginatedApiResponse<SubscriptionProvider>>(
      "/subscription-catalog/providers",
      { params: { isActive: true, limit: 100, ...params } }
    )
    return data
  }

  /** The user's own cards, for the payment-method picker. */
  async getPaymentCards(): Promise<UserPaymentCard[]> {
    const { data } = await apiClient.get<UserPaymentCard[]>("/me/payment-cards")
    return data
  }
}

export const subscriptionCatalogService = new SubscriptionCatalogServiceClass()
