// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/services/subscription-categories.service.ts
//
// The user's category list: seeded system categories (read-only) plus their
// own. Distinct from subscription-catalog.service, which serves the public
// provider catalog.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { SubscriptionCategory } from "../types/user-subscriptions.types"

export interface CreateSubscriptionCategoryDTO {
  name: string
  icon?: string
  color?: string
  sortOrder?: number
}

export type UpdateSubscriptionCategoryDTO = Partial<CreateSubscriptionCategoryDTO> & {
  isActive?: boolean
}

class SubscriptionCategoriesServiceClass {
  private readonly endpoint = "me/subscription-categories"

  async getAll(): Promise<SubscriptionCategory[]> {
    const { data } = await apiClient.get<SubscriptionCategory[]>(`/${this.endpoint}`)
    return data
  }

  async create(payload: CreateSubscriptionCategoryDTO): Promise<SubscriptionCategory> {
    const { data } = await apiClient.post<SubscriptionCategory>(`/${this.endpoint}`, payload)
    return data
  }

  async update(id: string, payload: UpdateSubscriptionCategoryDTO): Promise<SubscriptionCategory> {
    const { data } = await apiClient.patch<SubscriptionCategory>(`/${this.endpoint}/${id}`, payload)
    return data
  }

  /**
   * `reassignTo` moves the subscriptions using this category before deleting
   * it. Without it, the API answers 409 rather than silently leaving them
   * uncategorized.
   */
  async delete(id: string, reassignTo?: string): Promise<SubscriptionCategory> {
    const { data } = await apiClient.delete<SubscriptionCategory>(`/${this.endpoint}/${id}`, {
      params: reassignTo ? { reassignTo } : undefined,
    })
    return data
  }
}

export const subscriptionCategoriesService = new SubscriptionCategoriesServiceClass()
