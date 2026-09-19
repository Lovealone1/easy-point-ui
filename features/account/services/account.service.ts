// ─────────────────────────────────────────────────────────────────────────────
// features/account/services/account.service.ts
//
// Everything under /me: the routes a person uses on their own account.
//
// Goes through `apiClient` (the tenant BFF) rather than `adminApiClient`,
// because none of this needs the administration console — that was the point
// of adding the self-service routes. The API takes the user id off the token,
// so no id is ever sent from here.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { BillingProfile } from "@/features/user-info/types/user-info.types"
import type {
  AccountProfile,
  ActiveSession,
  ConfirmEmailChangeDTO,
  RequestEmailChangeDTO,
  RevokeOtherSessionsResponse,
  UpdateAccountProfileDTO,
} from "../types/account.types"

class AccountServiceClass {
  // ── Profile ────────────────────────────────────────────────────────────────

  async getProfile(): Promise<AccountProfile> {
    const { data } = await apiClient.get<AccountProfile>("/me/profile")
    return data
  }

  async updateProfile(payload: UpdateAccountProfileDTO): Promise<AccountProfile> {
    const { data } = await apiClient.patch<AccountProfile>("/me/profile", payload)
    return data
  }

  // ── Email ──────────────────────────────────────────────────────────────────

  /** Sends the code to the NEW address — that is what proves control of it. */
  async requestEmailChange(payload: RequestEmailChangeDTO): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>("/me/email/request-otp", payload)
    return data
  }

  /**
   * Confirms the change. The account is signed out of every device afterwards,
   * this one included: the address is inside the signed token.
   */
  async confirmEmailChange(payload: ConfirmEmailChangeDTO): Promise<AccountProfile> {
    const { data } = await apiClient.patch<AccountProfile>("/me/email", payload)
    return data
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  /** Scoped to the application the caller is signed into, most recent first. */
  async getSessions(): Promise<ActiveSession[]> {
    const { data } = await apiClient.get<ActiveSession[]>("/me/sessions")
    return data
  }

  async revokeSession(sid: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/me/sessions/${sid}`)
    return data
  }

  async revokeOtherSessions(): Promise<RevokeOtherSessionsResponse> {
    const { data } = await apiClient.post<RevokeOtherSessionsResponse>("/me/sessions/revoke-others")
    return data
  }

  // ── Electronic invoicing (DIAN) ────────────────────────────────────────────

  /** `null` when nothing is configured yet — not an error. */
  async getBillingProfile(): Promise<BillingProfile | null> {
    const { data } = await apiClient.get<BillingProfile | null>("/me/billing")
    return data
  }

  async configurePersonaNatural(payload: unknown): Promise<unknown> {
    const { data } = await apiClient.post("/me/billing/persona-natural", payload)
    return data
  }

  async configurePersonaJuridica(payload: unknown): Promise<unknown> {
    const { data } = await apiClient.post("/me/billing/persona-juridica", payload)
    return data
  }

  async deleteBillingProfile(): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>("/me/billing")
    return data
  }
}

export const accountService = new AccountServiceClass()
