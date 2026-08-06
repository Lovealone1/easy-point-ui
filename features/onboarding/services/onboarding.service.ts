// ─────────────────────────────────────────────────────────────────────────────
// features/onboarding/services/onboarding.service.ts
//
// Client service for the self-service organization creation flow.
// Connects to NestJS Backend via BFF proxy.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type {
  CreateMyOrganizationPayload,
  CreatedOrganization,
} from "../types/onboarding.types"

class OnboardingServiceClass {
  /**
   * POST /organizations/self-service
   *
   * Creates a FREE-tier organization (7-day full-access trial) for the
   * calling user, who becomes OWNER. Every active module is assigned.
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
