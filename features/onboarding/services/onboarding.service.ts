// ─────────────────────────────────────────────────────────────────────────────
// features/onboarding/services/onboarding.service.ts
//
// Client service for the self-service organization creation flow.
// Connects to NestJS Backend via BFF proxy.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type {
  SelfServiceCatalog,
  CreateMyOrganizationPayload,
  CreatedOrganization,
} from "../types/onboarding.types"

class OnboardingServiceClass {
  /**
   * GET /organizations/self-service/module-catalog
   *
   * Returns the admin-governance modules (always active) split from the
   * modules the user may pick their 5 base modules from.
   */
  async getCatalog(): Promise<SelfServiceCatalog> {
    const { data } = await apiClient.get<SelfServiceCatalog>(
      "/organizations/self-service/module-catalog"
    )
    return data
  }

  /**
   * POST /organizations/self-service
   *
   * Creates a FREE-tier organization for the calling user, who becomes OWNER.
   */
  async createOrganization(
    payload: CreateMyOrganizationPayload
  ): Promise<CreatedOrganization> {
    const { data } = await apiClient.post<CreatedOrganization>(
      "/organizations/self-service",
      payload
    )
    return data
  }
}

export const onboardingService = new OnboardingServiceClass()
