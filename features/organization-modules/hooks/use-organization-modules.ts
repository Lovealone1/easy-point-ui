// ─────────────────────────────────────────────────────────────────────────────
// features/organization-modules/hooks/use-organization-modules.ts
//
// TanStack Query hooks for system-modules catalog and organization-modules assignments.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { organizationModulesService } from "../services/organization-modules.service"
import type { AssignOrgModuleDto } from "../types/organization-modules.types"

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────────────────

export const orgModuleKeys = {
  all: ["organization-modules"] as const,
  byOrg: (orgId: string) => [...orgModuleKeys.all, orgId] as const,
}

export const systemModuleKeys = {
  all: ["system-modules"] as const,
  list: () => [...systemModuleKeys.all, "list"] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches the global catalog of system modules.
 * Cached for 5 minutes since the system catalog changes infrequently.
 */
export function useSystemModules() {
  return useQuery({
    queryKey: systemModuleKeys.list(),
    queryFn: () => organizationModulesService.getSystemModules(),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetches the list of modules currently assigned to an organization.
 */
export function useOrgModules(orgId: string) {
  return useQuery({
    queryKey: orgModuleKeys.byOrg(orgId),
    queryFn: () => organizationModulesService.getOrgModules(orgId),
    enabled: !!orgId,
    placeholderData: (previousData) => previousData,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutation to assign a system module to an organization.
 * Automatically invalidates the query for the organization's assigned modules.
 */
export function useAssignOrgModule(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: AssignOrgModuleDto) =>
      organizationModulesService.assignModule(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgModuleKeys.byOrg(orgId) })
    },
  })
}

/**
 * Mutation to unassign a system module from an organization.
 * Automatically invalidates the query for the organization's assigned modules.
 */
export function useUnassignOrgModule(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      moduleId,
    }: {
      moduleId: string
    }) => organizationModulesService.unassignModule(orgId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgModuleKeys.byOrg(orgId) })
    },
  })
}
