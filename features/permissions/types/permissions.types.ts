// ─────────────────────────────────────────────────────────────────────────────
// features/permissions/types/permissions.types.ts
//
// Mirrors the domain entities returned by the NestJS permissions catalog API.
// Hierarchy: Module → Feature → Permission
// ─────────────────────────────────────────────────────────────────────────────

/** Granular permission entry — lives inside a Feature */
export interface PermissionCatalog {
  id: string
  featureId: string
  /** Dotted key used for permission checks, e.g. "sales:create" */
  key: string
  /** Human-readable label shown in the UI */
  name: string
  description: string | null
  /** PermissionType enum value from the backend (e.g. "ACTION", "READ") */
  type: string
  sortOrder: number
  isActive: boolean
}

/** Feature grouping — lives inside a Module */
export interface FeatureCatalog {
  id: string
  moduleId: string
  key: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
  permissions: PermissionCatalog[]
}

/** Top-level module in the catalog tree */
export interface ModuleCatalog {
  id: string
  key: string
  name: string
  description: string | null
  /** Lucide icon name or null */
  icon: string | null
  sortOrder: number
  isActive: boolean
  features: FeatureCatalog[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Role-Permissions DTOs
// ─────────────────────────────────────────────────────────────────────────────

/** Body for POST /role-permissions */
export interface AssignRolePermissionDto {
  roleId: string
  permissionId: string
}
