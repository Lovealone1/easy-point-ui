// ─────────────────────────────────────────────────────────────────────────────
// features/organization-modules/components/org-modules-panel.tsx
//
// Interactive management panel for assigning/revoking modules on an organization.
// Optimistic UI state toggles, skeleton loading states, and back navigation.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  ChevronLeft,
  Settings,
  Puzzle,
  ShieldAlert,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Switch } from "@/shared/components/ui/switch"

import {
  useSystemModules,
  useOrgModules,
  useAssignOrgModule,
  useUnassignOrgModule,
  orgModuleKeys,
} from "../hooks/use-organization-modules"
import type { SystemModule } from "../types/organization-modules.types"

// ─────────────────────────────────────────────────────────────────────────────
// Module Icon Resolver Component
// ─────────────────────────────────────────────────────────────────────────────

interface ModuleIconProps {
  name?: string | null
  className?: string
}

function ModuleIcon({ name, className }: ModuleIconProps) {
  if (!name) {
    return <Puzzle className={className} />
  }

  // Convert kebab-case (e.g., "credit-card") to PascalCase (e.g., "CreditCard")
  const formattedName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")

  const IconComponent =
    (LucideIcons as Record<string, any>)[formattedName] ||
    (LucideIcons as Record<string, any>)[name] ||
    Puzzle

  return <IconComponent className={className} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface OrgModulesPanelProps {
  orgId: string
  orgName: string
}

export function OrgModulesPanel({ orgId, orgName }: OrgModulesPanelProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Queries
  const {
    data: systemModules,
    isLoading: isLoadingSystem,
    error: systemError,
  } = useSystemModules()

  const {
    data: assignedModules,
    isLoading: isLoadingAssigned,
    error: assignedError,
  } = useOrgModules(orgId)

  // Mutations
  const assignMutation = useAssignOrgModule(orgId)
  const unassignMutation = useUnassignOrgModule(orgId)

  // Local state to track optimistic toggle switches in progress.
  // Stores { [moduleId]: targetCheckedValue }
  const [pendingToggles, setPendingToggles] = React.useState<Record<string, boolean>>({})

  // Derive assigned module IDs set for quick lookup
  const assignedModuleIds = React.useMemo(() => {
    return new Set((assignedModules ?? []).map((m) => m.id))
  }, [assignedModules])

  const handleToggle = (module: SystemModule, checked: boolean) => {
    const key = module.id
    if (key in pendingToggles) return

    // Register the toggle optimistically
    setPendingToggles((prev) => ({ ...prev, [key]: checked }))

    if (checked) {
      assignMutation.mutate(
        { organizationId: orgId, moduleId: module.id },
        {
          onSuccess: async () => {
            // Await query invalidation refetch so the cache is updated before we clear pending state
            await queryClient.invalidateQueries({ queryKey: orgModuleKeys.byOrg(orgId) })
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
            toast.success(`Módulo "${module.name}" asignado con éxito`)
          },
          onError: (err: any) => {
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
            const message = err.response?.data?.message || `Error al asignar el módulo "${module.name}"`
            toast.error(message)
          },
        }
      )
    } else {
      unassignMutation.mutate(
        { moduleId: module.id },
        {
          onSuccess: async () => {
            // Await query invalidation refetch so the cache is updated before we clear pending state
            await queryClient.invalidateQueries({ queryKey: orgModuleKeys.byOrg(orgId) })
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
            toast.success(`Módulo "${module.name}" desasignado con éxito`)
          },
          onError: (err: any) => {
            setPendingToggles((prev) => {
              const copy = { ...prev }
              delete copy[key]
              return copy
            })
            const message = err.response?.data?.message || `Error al desasignar el módulo "${module.name}"`
            toast.error(message)
          },
        }
      )
    }
  }

  // Check if any error occurred
  const hasError = !!systemError || !!assignedError
  const errorMessage =
    (systemError as any)?.response?.data?.message ||
    (assignedError as any)?.response?.data?.message ||
    "Ocurrió un error al cargar la configuración de módulos."

  // ─────────────────────────────────────────────────────────────────────────────
  // Loading & Error States
  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoadingSystem || isLoadingAssigned) {
    return (
      <div className="w-full pb-12 px-4 sm:px-8 animate-in fade-in duration-300 space-y-8">
        {/* Breadcrumb Skeleton */}
        <div className="h-5 w-40 bg-muted/60 rounded-md animate-pulse" />

        {/* Title Block Skeleton */}
        <div className="space-y-3">
          <div className="h-9 w-72 bg-muted/60 rounded-xl animate-pulse" />
          <div className="h-4 w-[350px] max-w-full bg-muted/60 rounded-lg animate-pulse" />
        </div>

        {/* Module Cards Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`module-skel-${i}`}
              className="border border-border/20 bg-muted/5 rounded-2xl p-5 h-[140px] animate-pulse space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-5 w-10 bg-muted/60 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-24 bg-muted/60 rounded-md" />
                  <div className="h-3.5 w-full bg-muted/60 rounded-md" />
                  <div className="h-3 w-32 bg-muted/60 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 border border-border/40 rounded-2xl bg-card glassy-card space-y-4 select-none">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground font-heading">Error al cargar módulos</h3>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <button
          onClick={() => router.push("/admin/organizations")}
          className="inline-flex items-center gap-1.5 justify-center px-4 h-9 text-xs font-semibold border border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a organizaciones
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Panel Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full pb-12 px-4 sm:px-8 animate-in fade-in duration-300">
      {/* Sticky Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => router.push("/admin/organizations")}
          className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors gap-1.5 group select-none cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Volver a organizaciones
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 shrink-0">
            <Settings className="h-3.5 w-3.5 shrink-0" />
            Configuración Global
          </span>
        </div>
      </div>

      {/* Header Info */}
      <div className="mb-8 select-none">
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Módulos de la Organización: <span className="text-brand-500">{orgName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Habilita o deshabilita los módulos del catálogo global a los que esta organización tiene acceso.
        </p>
      </div>

      {/* Modules Cards Grid */}
      {systemModules?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-card/10 select-none">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40 animate-pulse mb-3" />
          <p className="text-sm font-medium">Catálogo de módulos del sistema vacío.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {systemModules?.map((module) => {
            const isPending = module.id in pendingToggles
            const isChecked = isPending
              ? pendingToggles[module.id]
              : assignedModuleIds.has(module.id)

            return (
              <div
                key={module.id}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200",
                  isChecked
                    ? "border-brand-500/20 bg-brand-500/[0.02]"
                    : "border-border/20 bg-muted/5",
                  "hover:border-brand-500/30 hover:bg-muted/10"
                )}
              >
                {/* Toggle Switch */}
                <div className="mt-1 shrink-0 flex items-center h-5">
                  <Switch
                    id={`switch-${module.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleToggle(module, checked)}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                      <ModuleIcon name={module.icon} className="h-4 w-4 stroke-[1.5]" />
                    </div>
                    <label
                      htmlFor={`switch-${module.id}`}
                      className="text-sm font-bold text-foreground leading-none block truncate select-none cursor-pointer"
                      title={module.name}
                    >
                      {module.name}
                    </label>
                  </div>

                  {module.description && (
                    <p className="text-xs text-muted-foreground/90 leading-relaxed font-medium pt-1">
                      {module.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="inline-flex items-center text-[9px] font-mono font-bold text-muted-foreground/75 bg-muted/40 px-1.5 py-0.5 rounded border border-border/10">
                      {module.key}
                    </span>
                    {module.isActive ? (
                      <span className="inline-flex items-center text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
