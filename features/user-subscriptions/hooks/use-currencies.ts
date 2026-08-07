import { useQuery } from "@tanstack/react-query"
import { currenciesService } from "../services/currencies.service"
import type { ConvertCurrencyParams } from "../types/currencies.types"

export const currencyKeys = {
  all: ["currencies"] as const,
  list: () => [...currencyKeys.all, "list"] as const,
  conversion: (params: ConvertCurrencyParams) => [...currencyKeys.all, "convert", params] as const,
}

/**
 * The ISO 4217 catalog. Seed-managed and immutable at runtime, so it is fetched
 * once per session and never revalidated.
 */
export function useCurrencies() {
  return useQuery({
    queryKey: currencyKeys.list(),
    queryFn: () => currenciesService.getAll(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

/**
 * Live conversion preview for the subscription form. Rates refresh once a day
 * upstream, so an hour of staleness costs nothing and saves a request per
 * keystroke.
 */
export function useCurrencyConversion(params: ConvertCurrencyParams | null) {
  return useQuery({
    queryKey: currencyKeys.conversion(params ?? { from: "", to: "", amount: 0 }),
    queryFn: () => currenciesService.convert(params!),
    enabled: !!params && params.amount > 0 && params.from !== params.to,
    staleTime: 60 * 60 * 1000,
    // A missing rate is a degraded preview, not an error worth retrying hard.
    retry: false,
  })
}
