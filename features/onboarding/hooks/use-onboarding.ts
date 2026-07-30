// ─────────────────────────────────────────────────────────────────────────────
// features/onboarding/hooks/use-onboarding.ts
//
// TanStack Query hooks for the self-service organization creation flow.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation } from "@tanstack/react-query"
import { onboardingService } from "../services/onboarding.service"
import type { CreateMyOrganizationPayload } from "../types/onboarding.types"

export const onboardingKeys = {
  all: ["onboarding"] as const,
  catalog: () => [...onboardingKeys.all, "module-catalog"] as const,
}

/**
 * Fetches the self-service module catalog (admin defaults + selectable modules).
 * Cached for 5 minutes since the system catalog changes infrequently.
 */
export function useSelfServiceCatalog() {
  return useQuery({
    queryKey: onboardingKeys.catalog(),
    queryFn: () => onboardingService.getCatalog(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Mutation to create the user's own organization.
 */
export function useCreateMyOrganization() {
  return useMutation({
    mutationFn: (payload: CreateMyOrganizationPayload) =>
      onboardingService.createOrganization(payload),
  })
}
