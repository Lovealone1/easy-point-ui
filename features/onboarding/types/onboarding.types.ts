// ─────────────────────────────────────────────────────────────────────────────
// features/onboarding/types/onboarding.types.ts
//
// Type definitions for the self-service organization creation flow.
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateMyOrganizationPayload {
  name: string
  email?: string
}

export interface CreatedOrganization {
  id: string
  name: string
  slug: string | null
  email: string | null
  plan: string
  planActiveUntil: string | null
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
