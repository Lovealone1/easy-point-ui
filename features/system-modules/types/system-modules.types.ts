// ─────────────────────────────────────────────────────────────────────────────
// features/system-modules/types/system-modules.types.ts
//
// Type definitions for the global system-modules catalog CRUD.
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemPermission {
  id: string
  featureId: string
  key: string
  name: string
  description: string | null
  type: string
  sortOrder: number
  isActive: boolean
}

export interface SystemFeature {
  id: string
  moduleId: string
  key: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
  permissions: SystemPermission[]
}

export interface SystemModule {
  id: string
  key: string
  name: string
  description: string | null
  icon: string | null
  sortOrder: number
  isActive: boolean
  features?: SystemFeature[]
  createdAt: string
  updatedAt: string
}

export interface CreateSystemModuleDTO {
  key: string
  name: string
  description?: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
}

export type UpdateSystemModuleDTO = Partial<Omit<CreateSystemModuleDTO, "key">>
