"use client"

// ─────────────────────────────────────────────────────────────────────────────
// features/permissions/components/role-permissions-panel.tsx
//
// Interactive management panel for assigning/revoking permissions on a role.
// Optimistic UI state toggles, full catalog hierarchy (Module → Feature → Permission),
// and read-only styling + notice for system default roles.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ChevronLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Switch } from "@/shared/components/ui/switch"

// Roles API bindings
import { rolesService } from "@/features/roles/services/roles.service"
import { roleKeys } from "@/features/roles/hooks/use-roles"

// Permissions API bindings
import {
  usePermissionsCatalog,
  useRolePermissions,
  useAssignRolePermission,
  useRevokeRolePermission,
  rolePermissionKeys,
} from "../hooks/use-permissions"
import type { PermissionCatalog } from "../types/permissions.types"

// ─────────────────────────────────────────────────────────────────────────────
// Module Icon Resolver Component
// ─────────────────────────────────────────────────────────────────────────────

interface ModuleIconProps {
  name?: string | null
  className?: string
}

function ModuleIcon({ name, className }: ModuleIconProps) {
  if (!name) {
    return <Shield className={className} />
  }

  // Convert kebab-case (e.g., "credit-card") to PascalCase (e.g., "CreditCard")
  const formattedName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")

  const IconComponent =
    (LucideIcons as Record<string, any>)[formattedName] ||
    (LucideIcons as Record<string, any>)[name] ||
    Shield

  return <IconComponent className={className} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface RolePermissionsPanelProps {
  roleId: string
}

export function RolePermissionsPanel({ roleId }: RolePermissionsPanelProps) {
  const router = useRouter()

  // Queries
  const { data: role, isLoading: isLoadingRole, error: roleError } = useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => rolesService.getById(roleId),
    enabled: !!roleId,
  })

  const {
    data: catalog,
    isLoading: isLoadingCatalog,
    error: catalogError,
  } = usePermissionsCatalog()

  const {
    data: activeKeys,
    isLoading: isLoadingActiveKeys,
    error: activeKeysError,
  } = useRolePermissions(roleId)

  // Mutations
  const assignMutation = useAssignRolePermission(roleId)
  const revokeMutation = useRevokeRolePermission(roleId)
  const queryClient = useQueryClient()

  // Local state to track optimistic toggle switches in progress.
  // Stores { [permissionKey]: targetCheckedValue }
  const [pendingToggles, setPendingToggles] = React.useState<Record<string, boolean>>({})

  const isReadOnly = role?.name === "OWNER"
  const isOwner = role?.name === "OWNER"

  const handleToggle = (permission: PermissionCatalog, checked: boolean) => {
    if (isReadOnly) return

    const key = permission.key
    if (key in pendingToggles) return

    // Register the toggle optimistically
    setPendingToggles((prev) => ({ ...prev, [key]: checked }))

    if (checked) {
      assignMutation.mutate(
        { roleId, permissionId: permission.id },
        {
          onSuccess: async () => {
            // Await query invalidation refetch so the cache is updated before we clear pending state
            await queryClient.invalidateQueries({ queryKey: rolePermissionKeys.byRole(roleId) })
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
          },
          onError: (err: any) => {
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
            const message = err.response?.data?.message || "Error al asignar el permiso"
            toast.error(message)
          },
        }
      )
    } else {
      revokeMutation.mutate(
        { permissionId: permission.id },
        {
          onSuccess: async () => {
            // Await query invalidation refetch so the cache is updated before we clear pending state
            await queryClient.invalidateQueries({ queryKey: rolePermissionKeys.byRole(roleId) })
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
          },
          onError: (err: any) => {
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
            const message = err.response?.data?.message || "Error al revocar el permiso"
            toast.error(message)
          },
        }
      )
    }
  }

  // Check if any error occurred
  const hasError = !!roleError || !!catalogError || !!activeKeysError
  const errorMessage =
    (roleError as any)?.response?.data?.message ||
    (catalogError as any)?.response?.data?.message ||
    (activeKeysError as any)?.response?.data?.message ||
    "Ocurrió un error al cargar el módulo de permisos."

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading & Error States
  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoadingRole || isLoadingCatalog || isLoadingActiveKeys) {
    return (
      <div className="w-full pb-12 px-4 sm:px-8 animate-in fade-in duration-300 space-y-8">
        {/* Breadcrumb Skeleton */}
        <div className="h-5 w-32 bg-muted/60 rounded-md animate-pulse" />

        {/* Title Block Skeleton */}
        <div className="space-y-3">
          <div className="h-9 w-64 bg-muted/60 rounded-xl animate-pulse" />
          <div className="h-4 w-[450px] max-w-full bg-muted/60 rounded-lg animate-pulse" />
        </div>

        {/* Modules Skeletons */}
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={`module-skel-${i}`}
              className="border border-border/30 bg-card/45 rounded-2xl p-6 space-y-6 animate-pulse"
            >
              <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                <div className="h-10 w-10 bg-muted/60 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-5 w-36 bg-muted/60 rounded-md" />
                  <div className="h-3.5 w-60 bg-muted/60 rounded-md" />
                </div>
              </div>
              <div className="space-y-6">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={`feature-skel-${i}-${j}`} className="space-y-3 pl-3 border-l-2 border-muted/50">
                    <div className="h-4.5 w-28 bg-muted/60 rounded-md" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 2 }).map((_, k) => (
                        <div
                          key={`perm-skel-${i}-${j}-${k}`}
                          className="h-16 border border-border/20 bg-muted/5 rounded-xl"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (hasError || !role) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 border border-border/40 rounded-2xl bg-card glassy-card space-y-4 select-none">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground font-heading">Error al cargar permisos</h3>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <button
          onClick={() => router.push("/roles")}
          className="inline-flex items-center gap-1.5 justify-center px-4 h-9 text-xs font-semibold border border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a roles
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Catalog Render Layout
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full pb-12 px-4 sm:px-8 animate-in fade-in duration-300">
      {/* Sticky Navigation / Badges Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => router.push("/roles")}
          className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors gap-1.5 group select-none cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Volver a roles
        </button>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-brand-700/10 text-brand-700 border-brand-700/20 dark:bg-brand-300/10 dark:text-brand-300 dark:border-brand-300/20 shrink-0">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Propietario (Solo lectura)
            </span>
          ) : role.isSystemDefault ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 shrink-0">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Sistema (Editable)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Rol Personalizado
            </span>
          )}
        </div>
      </div>

      {/* OWNER Read-only Banner */}
      {isReadOnly && (
        <div className="flex items-start gap-3.5 p-4 border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl mb-8 select-none">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 font-heading">
              Los permisos del rol OWNER no pueden modificarse
            </h4>
            <p className="text-xs text-amber-700/85 dark:text-amber-400/80 leading-relaxed">
              El rol OWNER (Propietario) posee permisos globales e irrevocables sobre toda la organización para asegurar el control administrativo absoluto.
            </p>
          </div>
        </div>
      )}

      {/* Catalog Listing */}
      {catalog?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-card/10 select-none">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40 animate-pulse mb-3" />
          <p className="text-sm font-medium">Catálogo de permisos vacío o no disponible.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {catalog?.map((module) => (
            <div
              key={module.id}
              className="group/module relative flex flex-col border border-border/40 bg-card/45 rounded-2xl p-6 shadow-xs overflow-hidden transition-all duration-300 hover:border-brand-500/25"
            >
              {/* Top Module Header */}
              <div className="flex items-center gap-3 border-b border-border/10 pb-4 mb-6">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                  <ModuleIcon name={module.icon} className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="space-y-0.5 select-none">
                  <h3 className="font-heading font-bold text-foreground text-sm group-hover/module:text-brand-500 transition-colors">
                    Módulo: {module.name}
                  </h3>
                  {module.description && (
                    <p className="text-xs text-muted-foreground/90">
                      {module.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Nested Features List */}
              <div className="space-y-6">
                {module.features.map((feature) => (
                  <div key={feature.id} className="space-y-3.5">
                    {/* Feature Title */}
                    <div className="flex flex-col gap-0.5 border-l-2 border-brand-500/40 pl-3 select-none">
                      <h4 className="text-xs font-bold text-foreground font-heading uppercase tracking-wider">
                        {feature.name}
                      </h4>
                      {feature.description && (
                        <p className="text-[11px] text-muted-foreground">
                          {feature.description}
                        </p>
                      )}
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3">
                      {feature.permissions.map((permission) => {
                        const isPending = permission.key in pendingToggles
                        const isChecked = isOwner || (isPending
                          ? pendingToggles[permission.key]
                          : (activeKeys ?? []).includes(permission.key))

                        return (
                          <div
                            key={permission.id}
                            className={cn(
                              "flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200",
                              isChecked
                                ? "border-brand-500/20 bg-brand-500/[0.02]"
                                : "border-border/20 bg-muted/5",
                              isReadOnly
                                ? "opacity-85"
                                : "hover:border-brand-500/30 hover:bg-muted/10"
                            )}
                          >
                            <div className="mt-1 shrink-0 flex items-center h-5">
                              <Switch
                                id={`switch-${permission.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => handleToggle(permission, checked)}
                                disabled={isReadOnly}
                              />
                            </div>

                            <div className="flex-1 space-y-1 text-left min-w-0">
                              <label
                                htmlFor={`switch-${permission.id}`}
                                className={cn(
                                  "text-xs font-bold text-foreground leading-none block truncate select-none",
                                  isReadOnly ? "cursor-default" : "cursor-pointer"
                                )}
                                title={permission.name}
                              >
                                {permission.name}
                              </label>

                              {permission.description && (
                                <p className="text-[11px] text-muted-foreground/90 leading-relaxed font-medium">
                                  {permission.description}
                                </p>
                              )}

                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="inline-flex items-center text-[9px] font-mono font-bold text-muted-foreground/75 bg-muted/40 px-1.5 py-0.5 rounded border border-border/10">
                                  {permission.key}
                                </span>
                                {permission.type && (
                                  <span className="inline-flex items-center text-[9px] font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded uppercase">
                                    {permission.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
