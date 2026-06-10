// ─────────────────────────────────────────────────────────────────────────────
// features/permissions/services/permissions.service.ts
//
// Handles the GET /permissions/catalog endpoint.
// Does NOT extend BaseClientService because this resource has no standard
// CRUD operations — it is a read-only catalog endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { ModuleCatalog } from "../types/permissions.types"

class PermissionsServiceClass {
  /**
   * GET /permissions/catalog
   *
   * Returns the full hierarchical catalog: Module[] → Feature[] → Permission[].
   * Only active modules/features/permissions are included (backend-filtered).
   * Requires `permissions:read` permission in the current organization.
   */
  async getCatalog(): Promise<ModuleCatalog[]> {
    const { data } = await apiClient.get<ModuleCatalog[]>("/permissions/catalog")
    return data
  }
}

export const permissionsService = new PermissionsServiceClass()
