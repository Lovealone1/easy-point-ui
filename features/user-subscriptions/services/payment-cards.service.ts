// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/services/payment-cards.service.ts
//
// The user's payment cards. A card's statementDay is what subscriptions inherit
// as their billing cutoff unless they override it.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { UserPaymentCard } from "../types/user-subscriptions.types"

export type CardBrand =
  | "VISA"
  | "MASTERCARD"
  | "AMEX"
  | "DINERS"
  | "DISCOVER"
  | "UNIONPAY"
  | "JCB"
  | "OTHER"

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  AMEX: "American Express",
  DINERS: "Diners Club",
  DISCOVER: "Discover",
  UNIONPAY: "UnionPay",
  JCB: "JCB",
  OTHER: "Otra",
}

export interface CreatePaymentCardDTO {
  label: string
  brand: CardBrand
  color?: string
  lastFourDigits?: string
  /** Day of month the statement closes (1-31). */
  statementDay?: number
  /** Day of month the payment is due (1-31). */
  paymentDueDay?: number
  isDefault?: boolean
  notes?: string
}

export type UpdatePaymentCardDTO = Partial<CreatePaymentCardDTO> & { isActive?: boolean }

/**
 * Not built on BaseClientService: the list endpoint returns a plain array, not
 * a paginated envelope, so the base class's getAll signature would be a lie.
 */
class PaymentCardsServiceClass {
  private readonly endpoint = "me/payment-cards"

  async getAll(): Promise<UserPaymentCard[]> {
    const { data } = await apiClient.get<UserPaymentCard[]>(`/${this.endpoint}`)
    return data
  }

  async getById(id: string): Promise<UserPaymentCard> {
    const { data } = await apiClient.get<UserPaymentCard>(`/${this.endpoint}/${id}`)
    return data
  }

  async create(payload: CreatePaymentCardDTO): Promise<UserPaymentCard> {
    const { data } = await apiClient.post<UserPaymentCard>(`/${this.endpoint}`, payload)
    return data
  }

  async update(id: string, payload: UpdatePaymentCardDTO): Promise<UserPaymentCard> {
    const { data } = await apiClient.patch<UserPaymentCard>(`/${this.endpoint}/${id}`, payload)
    return data
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/${this.endpoint}/${id}`)
  }
}

export const paymentCardsService = new PaymentCardsServiceClass()
