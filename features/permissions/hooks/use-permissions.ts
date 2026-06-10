// ─────────────────────────────────────────────────────────────────────────────
// features/permissions/hooks/use-permissions.ts
//
// React Query hooks for the permissions catalog and role-permissions management.
//
// Query key factory follows the same pattern as the rest of the codebase
// (e.g. roleKeys in features/roles/hooks/use-roles.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { permissionsService } from "../services/permissions.service"
import { rolePermissionsService } from "../services/role-permissions.service"
import type { AssignRolePermissionDto } from "../types/permissions.types"
import { useAuthStore } from "@/shared/store/use-auth-store"

// ─────────────────────────────────────────────────────────────────────────────
// Query Key Factory
// ─────────────────────────────────────────────────────────────────────────────

export const permissionKeys = {
  all: ["permissions"] as const,
  catalog: () => [...permissionKeys.all, "catalog"] as const,
}

export const rolePermissionKeys = {
  all: ["role-permissions"] as const,
  byRole: (roleId: string) => [...rolePermissionKeys.all, roleId] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalog Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the full catalog tree: Module[] → Feature[] → Permission[].
 * Cached globally for the session — the catalog rarely changes.
 * Only runs when there is an active organization.
 */
export function usePermissionsCatalog() {
  const activeOrgId = useAuthStore((s) => s.activeOrganization?.id)

  return useQuery({
    queryKey: permissionKeys.catalog(),
    queryFn: () => permissionsService.getCatalog(),
    enabled: !!activeOrgId,
    // Catalog is stable — stale after 5 minutes, no background refetch on focus
    staleTime: 5 * 60 * 1000,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Role-Permissions Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the array of active permission keys for a specific role.
 * e.g. ["sales:create", "clients:read"]
 *
 * The result is used alongside the catalog to determine the checked state
 * of each switch in the role-permissions panel.
 */
export function useRolePermissions(roleId: string) {
  const activeOrgId = useAuthStore((s) => s.activeOrganization?.id)

  return useQuery({
    queryKey: rolePermissionKeys.byRole(roleId),
    queryFn: () => rolePermissionsService.getRolePermissions(roleId),
    enabled: !!activeOrgId && !!roleId,
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Mutation to assign a permission to a role.
 * On success, invalidates the role's permission key cache so the UI reflects
 * the change immediately on re-render.
 */
export function useAssignRolePermission(roleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: AssignRolePermissionDto) =>
      rolePermissionsService.assignPermission(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolePermissionKeys.byRole(roleId) })
    },
  })
}

/**
 * Mutation to revoke a permission from a role.
 * On success, invalidates the role's permission key cache.
 */
export function useRevokeRolePermission(roleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      permissionId,
    }: {
      permissionId: string
    }) => rolePermissionsService.revokePermission(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolePermissionKeys.byRole(roleId) })
    },
  })
}
