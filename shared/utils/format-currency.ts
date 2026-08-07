// ─────────────────────────────────────────────────────────────────────────────
// shared/utils/format-currency.ts
//
// One place to format money. Pages across the app each define their own
// formatter with a different locale (es-CL, es-CO, es-ES); new code should use
// this instead so the same amount reads the same everywhere.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_LOCALE = "es-CO"

interface FormatCurrencyOptions {
  /** ISO 4217 minor unit. Comes from the currency catalog; JPY/CLP are 0. */
  decimalDigits?: number
  locale?: string
  /** Render just the number, for when the currency is already in the label. */
  omitSymbol?: boolean
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "COP",
  options: FormatCurrencyOptions = {}
): string {
  if (amount === null || amount === undefined || amount === "") return "—"

  const value = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isFinite(value)) return "—"

  const { decimalDigits = 2, locale = DEFAULT_LOCALE, omitSymbol = false } = options

  // Trailing ",00" on a peso amount is noise; keep decimals only when the
  // amount actually has them.
  const fractionDigits = Number.isInteger(value) ? 0 : decimalDigits

  if (omitSymbol) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: decimalDigits,
    }).format(value)
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: decimalDigits,
    }).format(value)
  } catch {
    // Intl throws on a code it doesn't know; fall back to a plain number.
    return `${new Intl.NumberFormat(locale).format(value)} ${currency}`
  }
}

/** "≈ $40.084 COP" — for figures derived from an exchange rate. */
export function formatApproximate(
  amount: number | string | null | undefined,
  currency = "COP",
  options: FormatCurrencyOptions = {}
): string {
  if (amount === null || amount === undefined || amount === "") return "—"
  return `≈ ${formatCurrency(amount, currency, options)}`
}
