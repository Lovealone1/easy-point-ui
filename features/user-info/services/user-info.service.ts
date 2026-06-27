// ─────────────────────────────────────────────────────────────────────────────
// features/user-info/services/user-info.service.ts
//
// Client service for user information and DIAN electronic billing profiles.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { BillingProfile } from "../types/user-info.types"

export class UserInfoServiceClass {
  /**
   * Fetches target user billing configuration profile.
   * GET /user-info/:userId/billing
   */
  async getBillingProfile(userId: string): Promise<BillingProfile | null> {
    const { data } = await apiClient.get<BillingProfile | null>(`/user-info/${userId}/billing`)
    return data
  }

  /**
   * Configures Natural Person billing details.
   * POST /user-info/:userId/persona-natural
   */
  async configurePersonaNatural(userId: string, payload: any): Promise<any> {
    const { data } = await apiClient.post<any>(`/user-info/${userId}/persona-natural`, payload)
    return data
  }

  /**
   * Configures Legal Person billing details.
   * POST /user-info/:userId/persona-juridica
   */
  async configurePersonaJuridica(userId: string, payload: any): Promise<any> {
    const { data } = await apiClient.post<any>(`/user-info/${userId}/persona-juridica`, payload)
    return data
  }

  /**
   * Removes billing details profile by user ID.
   * DELETE /user-info/:userId/billing
   */
  async deleteBillingProfile(userId: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/user-info/${userId}/billing`)
    return data
  }
}

export const userInfoService = new UserInfoServiceClass()
