// ─────────────────────────────────────────────────────────────────────────────
// features/user-onboarding/types/user-onboarding.types.ts
//
// Personal Space onboarding: goal, region (timezone + currency) and the
// still-mocked reminder preferences.
// ─────────────────────────────────────────────────────────────────────────────

export type OnboardingGoal =
  | "SAVE_MONEY"
  | "TRACK_SPENDING"
  | "MANAGE_FAMILY"
  | "NEVER_MISS_RENEWAL"

export type OnboardingStep = "GOAL" | "REGION" | "REMINDERS" | "DONE"

export interface OnboardingGoalOption {
  key: OnboardingGoal
  label: string
  description: string
  icon: string
}

export interface ReminderPreferences {
  enabled: boolean
  renewalReminderDaysBefore: number
  channels: Record<string, boolean> | null
  quietHoursStart: number | null
  quietHoursEnd: number | null
}

/** What GET /me/onboarding returns — enough to resume the wizard. */
export interface OnboardingState {
  step: OnboardingStep
  completed: boolean
  completedAt: string | null
  goal: OnboardingGoal | null
  timezone: string
  preferredCurrency: string
  reminders: ReminderPreferences
}

export type ThemeMode = "LIGHT" | "DARK" | "SYSTEM"

export interface UserPreferences {
  id: string
  userId: string
  goal: OnboardingGoal | null
  timezone: string
  preferredCurrency: string
  /** Personal-space branding, the counterpart of OrganizationConfig's. */
  primaryColor: string | null
  defaultTheme: ThemeMode
  remindersEnabled: boolean
  renewalReminderDaysBefore: number
  reminderChannels: Record<string, boolean> | null
  quietHoursStart: number | null
  quietHoursEnd: number | null
  onboardingStep: OnboardingStep
  onboardingCompleted: boolean
  onboardingCompletedAt: string | null
}

export interface UpdateReminderPreferencesDTO {
  remindersEnabled?: boolean
  renewalReminderDaysBefore?: number
  reminderChannels?: Record<string, boolean>
  quietHoursStart?: number
  quietHoursEnd?: number
}

export interface UpdateUserPreferencesDTO extends UpdateReminderPreferencesDTO {
  goal?: OnboardingGoal
  timezone?: string
  preferredCurrency?: string
  primaryColor?: string
  defaultTheme?: ThemeMode
}

/**
 * Timezone pool for the region step. Latin America first — that is where the
 * users are — then the rest, so the common case needs no scrolling.
 */
export const TIMEZONE_OPTIONS: Array<{ group: string; zones: Array<{ value: string; label: string }> }> = [
  {
    group: "América Latina",
    zones: [
      { value: "America/Bogota", label: "Bogotá (COT, UTC-5)" },
      { value: "America/Mexico_City", label: "Ciudad de México (CST, UTC-6)" },
      { value: "America/Lima", label: "Lima (PET, UTC-5)" },
      { value: "America/Santiago", label: "Santiago (CLT, UTC-4)" },
      { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (ART, UTC-3)" },
      { value: "America/Sao_Paulo", label: "São Paulo (BRT, UTC-3)" },
      { value: "America/Caracas", label: "Caracas (VET, UTC-4)" },
      { value: "America/Guayaquil", label: "Quito (ECT, UTC-5)" },
      { value: "America/La_Paz", label: "La Paz (BOT, UTC-4)" },
      { value: "America/Montevideo", label: "Montevideo (UYT, UTC-3)" },
      { value: "America/Asuncion", label: "Asunción (PYT, UTC-4)" },
      { value: "America/Panama", label: "Panamá (EST, UTC-5)" },
      { value: "America/Costa_Rica", label: "San José (CST, UTC-6)" },
      { value: "America/Guatemala", label: "Guatemala (CST, UTC-6)" },
      { value: "America/Santo_Domingo", label: "Santo Domingo (AST, UTC-4)" },
    ],
  },
  {
    group: "Norteamérica",
    zones: [
      { value: "America/New_York", label: "Nueva York (EST, UTC-5)" },
      { value: "America/Chicago", label: "Chicago (CST, UTC-6)" },
      { value: "America/Denver", label: "Denver (MST, UTC-7)" },
      { value: "America/Los_Angeles", label: "Los Ángeles (PST, UTC-8)" },
      { value: "America/Toronto", label: "Toronto (EST, UTC-5)" },
    ],
  },
  {
    group: "Europa",
    zones: [
      { value: "Europe/Madrid", label: "Madrid (CET, UTC+1)" },
      { value: "Europe/London", label: "Londres (GMT, UTC+0)" },
      { value: "Europe/Paris", label: "París (CET, UTC+1)" },
      { value: "Europe/Berlin", label: "Berlín (CET, UTC+1)" },
      { value: "Europe/Lisbon", label: "Lisboa (WET, UTC+0)" },
      { value: "Europe/Rome", label: "Roma (CET, UTC+1)" },
    ],
  },
  {
    group: "Otros",
    zones: [
      { value: "UTC", label: "UTC (tiempo universal)" },
      { value: "Asia/Tokyo", label: "Tokio (JST, UTC+9)" },
      { value: "Asia/Shanghai", label: "Shanghái (CST, UTC+8)" },
      { value: "Asia/Dubai", label: "Dubái (GST, UTC+4)" },
      { value: "Australia/Sydney", label: "Sídney (AEDT, UTC+11)" },
    ],
  },
]

/** Best-effort guess so the region step opens on the right answer. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Bogota"
  } catch {
    return "America/Bogota"
  }
}

/**
 * The same zones as TIMEZONE_OPTIONS, flattened to {value,label}. Base UI's
 * Select resolves the closed trigger's label from the Root's `items`, and its
 * grouped form expects `items` keys rather than our `zones`, so the flat list
 * is what the dropdowns pass. Without it the trigger falls back to the raw
 * value ("America/Bogota") instead of the label.
 */
export const TIMEZONE_ITEMS = TIMEZONE_OPTIONS.flatMap((group) => group.zones)
