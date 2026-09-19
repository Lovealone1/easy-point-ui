// ─────────────────────────────────────────────────────────────────────────────
// features/account/types/account.types.ts
//
// Account settings — the shapes behind /me on the API. Everything here is
// about the person signed in, never about an organization.
//
// The DIAN billing shapes are NOT redeclared here: they already live in
// features/user-info, which the administration console uses against the same
// database rows. Two copies of a 25-field fiscal document is two chances to
// drift from what the API validates.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  BillingProfile,
  PersonaNaturalBilling,
  PersonaJuridicaBilling,
} from "@/features/user-info/types/user-info.types"

export interface AccountProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  isActive: boolean
  globalRole: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateAccountProfileDTO {
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

// ── Sessions ─────────────────────────────────────────────────────────────────

/** Which application a session belongs to. They never mix — see docs/SESSIONS.md. */
export type SessionScope = "TENANT" | "ADMIN"

export type DeviceType = "desktop" | "mobile" | "tablet" | "bot" | "unknown"

/**
 * The API parses the stored User-Agent on read, so these fields improve
 * without anyone signing back in. `label` is always populated, even for a
 * header the parser could not place ("Unknown device").
 */
export interface SessionDevice {
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  type: DeviceType
  label: string
}

export interface ActiveSession {
  sid: string
  scope: SessionScope
  /** The session making the request. Exactly one row carries it, or none. */
  current: boolean
  ip: string
  userAgent: string
  device: SessionDevice
  createdAt: string
  /** Five-minute resolution; falls back to createdAt on older sessions. */
  lastSeenAt: string
  /** Unix seconds. */
  expiresAt: number
}

export interface RevokeOtherSessionsResponse {
  message: string
  revoked: number
}

// ── Email change ─────────────────────────────────────────────────────────────

export interface RequestEmailChangeDTO {
  newEmail: string
}

export interface ConfirmEmailChangeDTO {
  newEmail: string
  otp: string
}
