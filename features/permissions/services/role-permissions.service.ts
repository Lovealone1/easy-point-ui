// ─────────────────────────────────────────────────────────────────────────────
// features/permissions/services/role-permissions.service.ts
//
// Handles assignment and revocation of permissions on roles.
//
// API contract:
//   GET    /role-permissions/:roleId         → string[] (permission keys)
//   POST   /role-permissions                 → body: { roleId, permissionId }
//   DELETE /role-permissions/:roleId/:permId → void
//
// The x-organization-id header is injected automatically by apiClient
// (set imperatively by useAuthStore.setActiveOrganization).
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/shared/services/api-client"
import type { AssignRolePermissionDto } from "../types/permissions.types"

class RolePermissionsServiceClass {
  /**
   * GET /role-permissions/:roleId
   *
   * Returns an array of active permission **keys** (e.g. ["sales:create", "clients:read"])
   * assigned to the given role in the current organization.
   * Requires `role_permissions:read` permission.
   */
  async getRolePermissions(roleId: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(`/role-permissions/${roleId}`)
    return data
  }

  /**
   * POST /role-permissions
   *
   * Assigns a permission to a role. Body: { roleId, permissionId }.
   * Requires `role_permissions:update` permission.
   * Throws 400 if the role is a system role or the permission is already assigned.
   * Throws 409 (ConflictException) if already assigned.
   */
  async assignPermission(dto: AssignRolePermissionDto): Promise<unknown> {
    const { data } = await apiClient.post<unknown>("/role-permissions", dto)
    return data
  }

  /**
   * DELETE /role-permissions/:roleId/:permissionId
   *
   * Revokes a permission from a role.
   * Requires `role_permissions:update` permission.
   * Throws 400 if the role is a system role.
   * Throws 404 if the association does not exist.
   */
  async revokePermission(roleId: string, permissionId: string): Promise<void> {
    await apiClient.delete(`/role-permissions/${roleId}/${permissionId}`)
  }
}

export const rolePermissionsService = new RolePermissionsServiceClass()
