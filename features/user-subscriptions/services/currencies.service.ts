// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/services/currencies.service.ts
//
// ISO 4217 catalog and FX conversion. The catalog is static, so callers cache
// it indefinitely rather than refetching.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { Currency, ConvertCurrencyParams, CurrencyConversion } from "../types/currencies.types"

class CurrenciesServiceClass {
  /** Unpaginated — the whole catalog comes back in one response. */
  async getAll(): Promise<Currency[]> {
    const { data } = await apiClient.get<Currency[]>("/currencies")
    return data
  }

  async getByCode(code: string): Promise<Currency> {
    const { data } = await apiClient.get<Currency>(`/currencies/${code}`)
    return data
  }

  async convert(params: ConvertCurrencyParams): Promise<CurrencyConversion> {
    const { data } = await apiClient.get<CurrencyConversion>("/exchange-rates/convert", { params })
    return data
  }
}

export const currenciesService = new CurrenciesServiceClass()
