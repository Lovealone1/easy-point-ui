// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/types/user-subscriptions.types.ts
//
// Personal Space subscription tracker. Distinct from features/subscriptions,
// which is the organization's SaaS billing.
// ─────────────────────────────────────────────────────────────────────────────

export type UserSubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED"

export type RecurrenceUnit = "DAY" | "WEEK" | "MONTH" | "QUARTER" | "SEMESTER" | "YEAR"

export const USER_SUBSCRIPTION_STATUS_LABELS: Record<UserSubscriptionStatus, string> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
}

export const RECURRENCE_UNIT_LABELS: Record<RecurrenceUnit, string> = {
  DAY: "Día",
  WEEK: "Semana",
  MONTH: "Mes",
  QUARTER: "Trimestre",
  SEMESTER: "Semestre",
  YEAR: "Año",
}

/** How a cadence reads in a sentence: "cada 2 meses", "mensual". */
const RECURRENCE_PLURAL_LABELS: Record<RecurrenceUnit, string> = {
  DAY: "días",
  WEEK: "semanas",
  MONTH: "meses",
  QUARTER: "trimestres",
  SEMESTER: "semestres",
  YEAR: "años",
}

const RECURRENCE_SIMPLE_LABELS: Record<RecurrenceUnit, string> = {
  DAY: "Diaria",
  WEEK: "Semanal",
  MONTH: "Mensual",
  QUARTER: "Trimestral",
  SEMESTER: "Semestral",
  YEAR: "Anual",
}

export function describeRecurrence(
  unit: RecurrenceUnit,
  interval: number,
  isRecurring: boolean
): string {
  if (!isRecurring) return "Pago único"
  if (interval === 1) return RECURRENCE_SIMPLE_LABELS[unit]
  return `Cada ${interval} ${RECURRENCE_PLURAL_LABELS[unit]}`
}

export interface SubscriptionCategory {
  id: string
  /** null for seeded system categories, which the user cannot edit. */
  userId: string | null
  key: string
  name: string
  icon: string | null
  color: string | null
  sortOrder: number
  isActive: boolean
}

export function isSystemCategory(category: SubscriptionCategory): boolean {
  return category.userId === null
}

export interface SubscriptionProvider {
  id: string
  key: string
  name: string
  categoryId: string
  logoUrl: string | null
  brandColor: string | null
  websiteUrl: string | null
  description: string | null
  isActive: boolean
  category?: SubscriptionCategory
}

export interface UserPaymentCard {
  id: string
  label: string
  brand: string
  color: string
  lastFourDigits: string | null
  statementDay: number | null
  paymentDueDay: number | null
  isDefault: boolean
  isActive: boolean
}

export interface UserSubscription {
  id: string
  userId: string
  providerId: string | null
  customName: string | null
  customLogoUrl: string | null
  customWebsiteUrl: string | null
  customCategoryId: string | null
  cardId: string | null
  billingCutoffDay: number | null
  planLabel: string | null
  amount: string
  currency: string
  recurrenceUnit: RecurrenceUnit
  recurrenceInterval: number
  isRecurring: boolean
  startedAt: string
  nextBillingDate: string | null
  status: UserSubscriptionStatus
  isTrial: boolean
  trialEndsAt: string | null
  cancelledAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string

  provider?: SubscriptionProvider | null
  customCategory?: SubscriptionCategory | null
  card?: UserPaymentCard | null
}

export interface FindUserSubscriptionsParams {
  page?: number
  limit?: number
  order?: "ASC" | "DESC"
  orderBy?: string
  search?: string
  status?: UserSubscriptionStatus
  cardId?: string
  categoryId?: string
  recurrenceUnit?: RecurrenceUnit
  isRecurring?: boolean
}

export interface CreateUserSubscriptionDTO {
  providerId?: string
  customName?: string
  customLogoUrl?: string
  customWebsiteUrl?: string
  customCategoryId?: string
  cardId?: string
  billingCutoffDay?: number
  planLabel?: string
  amount: number
  currency?: string
  recurrenceUnit: RecurrenceUnit
  recurrenceInterval?: number
  isRecurring?: boolean
  startedAt: string
  nextBillingDate?: string
  isTrial?: boolean
  trialEndsAt?: string
  notes?: string
}

export type UpdateUserSubscriptionDTO = Partial<CreateUserSubscriptionDTO>

/** Provenance of every `*Converted` figure in a response. */
export interface FxMetadata {
  asOf: string | null
  stale: boolean
  unavailable: boolean
  attribution: string
}

export interface SubscriptionsSummary {
  month: string
  preferredCurrency: string
  monthlyTotal: string
  yearlyTotal: string
  monthlyTotalConverted: string | null
  yearlyTotalConverted: string | null
  oneTimeTotalThisMonth: string | null
  activeCount: number
  pausedCount: number
  byCurrency: Array<{
    currency: string
    total: string
    convertedTotal: string | null
    subscriptionCount: number
  }>
  byCard: Array<{
    cardId: string | null
    cardLabel: string
    total: string
    currency: string
    subscriptionCount: number
  }>
  byCategory: Array<{
    categoryId: string | null
    categoryName: string
    total: string
    currency: string
    subscriptionCount: number
  }>
  upcoming: Array<{
    id: string
    name: string
    amount: string
    currency: string
    convertedAmount: string | null
    nextBillingDate: string | null
  }>
  rates: FxMetadata
}

/** Unified display fields, mirroring the entity getters on the API side. */
export function displayName(subscription: UserSubscription): string {
  return subscription.provider?.name ?? subscription.customName ?? "Suscripción"
}

export function displayLogoUrl(subscription: UserSubscription): string | null {
  return subscription.provider?.logoUrl ?? subscription.customLogoUrl ?? null
}

export function displayCategory(subscription: UserSubscription): SubscriptionCategory | null {
  return subscription.provider?.category ?? subscription.customCategory ?? null
}

export function displayWebsiteUrl(subscription: UserSubscription): string | null {
  return subscription.provider?.websiteUrl ?? subscription.customWebsiteUrl ?? null
}

/** The cutoff day that actually applies, override first then the card's. */
export function effectiveCutoffDay(subscription: UserSubscription): number | null {
  return subscription.billingCutoffDay ?? subscription.card?.statementDay ?? null
}
