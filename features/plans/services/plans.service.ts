// ─────────────────────────────────────────────────────────────────────────────
// features/plans/services/plans.service.ts
//
// Client service for global pricing plans management.
// Inherits CRUD operations from BaseClientService and adds custom toggle active action.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosInstance } from "axios"
import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import { adminApiClient } from "@/shared/services/admin-api-client"
import type { Plan, CreatePlanDTO, UpdatePlanDTO } from "../types/plans.types"

export class PlansServiceClass extends BaseClientService<
  Plan,
  CreatePlanDTO,
  UpdatePlanDTO
> {
  constructor(client: AxiosInstance = apiClient) {
    super("/plans", client)
  }

  /**
   * Toggles the active status of a plan.
   * Target: PATCH /plans/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<Plan> {
    const { data } = await this.client.patch<Plan>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data
  }
}

/**
 * Reads the plan catalogue on a dashboard session — what the trial-expired
 * page needs, and the only plans call a tenant is allowed to make.
 */
export const plansService = new PlansServiceClass()

/**
 * The console's view. Every mutation below /plans is @Roles(ADMIN) on the API
 * and now also demands a console session, so the administration pages must go
 * through this one — including the reads, since a global administrator may
 * hold no dashboard session at all.
 */
export const adminPlansService = new PlansServiceClass(adminApiClient)
