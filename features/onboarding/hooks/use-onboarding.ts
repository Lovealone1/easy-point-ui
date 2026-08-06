// ─────────────────────────────────────────────────────────────────────────────
// features/onboarding/hooks/use-onboarding.ts
//
// TanStack Query hooks for the self-service organization creation flow.
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation } from "@tanstack/react-query"
import { onboardingService } from "../services/onboarding.service"
import type { CreateMyOrganizationPayload } from "../types/onboarding.types"

/**
 * Mutation to create the user's own organization.
 */
export function useCreateMyOrganization() {
  return useMutation({
    mutationFn: (payload: CreateMyOrganizationPayload) =>
      onboardingService.createOrganization(payload),
  })
}
