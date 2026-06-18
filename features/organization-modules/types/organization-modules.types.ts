// ─────────────────────────────────────────────────────────────────────────────
// features/organization-modules/types/organization-modules.types.ts
//
// Type definitions for the organization-modules management feature.
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemModule {
  id: string
  key: string
  name: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
}

export interface AssignOrgModuleDto {
  organizationId: string
  moduleId: string
}
