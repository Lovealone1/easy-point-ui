// ─────────────────────────────────────────────────────────────────────────────
// features/system-modules/services/system-modules.service.ts
//
// Client service for global system-modules.
// Handles CRUD operations and active status toggles.
// ─────────────────────────────────────────────────────────────────────────────

import { adminApiClient } from "@/shared/services/admin-api-client"
import type {
  SystemModule,
  CreateSystemModuleDTO,
  UpdateSystemModuleDTO,
} from "../types/system-modules.types"

class SystemModulesServiceClass {
  private readonly endpoint = "system-modules"

  /**
   * GET /system-modules
   *
   * Fetches all global system modules, optionally filtered by isActive.
   */
  async getAll(params?: Record<string, unknown>): Promise<SystemModule[]> {
    const { data } = await adminApiClient.get<SystemModule[]>(`/${this.endpoint}`, { params })
    return data
  }

  /**
   * GET /system-modules/:id
   *
   * Fetches detailed system module properties (including nested features/permissions).
   */
  async getById(id: string): Promise<SystemModule> {
    const { data } = await adminApiClient.get<SystemModule>(`/${this.endpoint}/${id}`)
    return data
  }

  /**
   * POST /system-modules
   *
   * Creates a new global system module.
   */
  async create(payload: CreateSystemModuleDTO): Promise<SystemModule> {
    const { data } = await adminApiClient.post<SystemModule>(`/${this.endpoint}`, payload)
    return data
  }

  /**
   * PATCH /system-modules/:id
   *
   * Updates system module properties.
   */
  async update(id: string, payload: UpdateSystemModuleDTO): Promise<SystemModule> {
    const { data } = await adminApiClient.patch<SystemModule>(`/${this.endpoint}/${id}`, payload)
    return data
  }

  /**
   * DELETE /system-modules/:id
   *
   * Deletes a global system module.
   */
  async delete(id: string): Promise<void> {
    await adminApiClient.delete(`/${this.endpoint}/${id}`)
  }

  /**
   * PATCH /system-modules/:id/toggle
   *
   * Enables or disables a system module catalog-wide.
   */
  async toggleActive(id: string, isActive: boolean): Promise<SystemModule> {
    const { data } = await adminApiClient.patch<SystemModule>(
      `/${this.endpoint}/${id}/toggle`,
      { isActive }
    )
    return data
  }
}

export const systemModulesService = new SystemModulesServiceClass()
