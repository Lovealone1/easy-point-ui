// ─────────────────────────────────────────────────────────────────────────────
// features/organization-modules/services/organization-modules.service.ts
//
// Client service for Managing system modules and organization-specific modules.
// Connects to NestJS Backend via BFF proxy.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { SystemModule, AssignOrgModuleDto } from "../types/organization-modules.types"

class OrganizationModulesServiceClass {
  /**
   * GET /system-modules
   *
   * Lists all modules from the global catalog.
   * Requires GlobalRole.ADMIN.
   */
  async getSystemModules(): Promise<SystemModule[]> {
    const { data } = await apiClient.get<SystemModule[]>("/system-modules")
    return data
  }

  /**
   * GET /organization-modules/:organizationId
   *
   * Lists active modules assigned to a specific organization.
   * Requires GlobalRole.ADMIN.
   */
  async getOrgModules(organizationId: string): Promise<SystemModule[]> {
    const { data } = await apiClient.get<SystemModule[]>(`/organization-modules/${organizationId}`)
    return data
  }

  /**
   * POST /organization-modules
   *
   * Assigns a system module to an organization. Idempotent.
   * Body: { organizationId, moduleId }
   * Requires GlobalRole.ADMIN.
   */
  async assignModule(dto: AssignOrgModuleDto): Promise<unknown> {
    const { data } = await apiClient.post<unknown>("/organization-modules", dto)
    return data
  }

  /**
   * DELETE /organization-modules/:organizationId/:moduleId
   *
   * Revokes/unassigns a system module from an organization.
   * Requires GlobalRole.ADMIN.
   */
  async unassignModule(organizationId: string, moduleId: string): Promise<void> {
    await apiClient.delete(`/organization-modules/${organizationId}/${moduleId}`)
  }
}

export const organizationModulesService = new OrganizationModulesServiceClass()
