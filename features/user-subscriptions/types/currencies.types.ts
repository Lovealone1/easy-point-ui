export interface Currency {
  code: string
  numericCode: string
  name: string
  nameEs: string
  symbol: string | null
  /** ISO 4217 minor unit: JPY/CLP are 0, BHD is 3. */
  decimalDigits: number
  isActive: boolean
  /** Pinned to the top of the picker. */
  isPopular: boolean
  sortOrder: number
}

export interface ConvertCurrencyParams {
  from: string
  to: string
  amount: number
}

export interface CurrencyConversion {
  from: string
  to: string
  amount: number
  converted: string
  rate: string
  ratesAsOf: string
  stale: boolean
  attribution: string
}
