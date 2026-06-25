// ─────────────────────────────────────────────────────────────────────────────
// features/plans/services/plans.service.ts
//
// Client service for global pricing plans management.
// Inherits CRUD operations from BaseClientService and adds custom toggle active action.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { Plan, CreatePlanDTO, UpdatePlanDTO } from "../types/plans.types"

export class PlansServiceClass extends BaseClientService<
  Plan,
  CreatePlanDTO,
  UpdatePlanDTO
> {
  constructor() {
    super("/plans")
  }

  /**
   * Toggles the active status of a plan.
   * Target: PATCH /plans/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<Plan> {
    const { data } = await apiClient.patch<Plan>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data
  }
}

export const plansService = new PlansServiceClass()
