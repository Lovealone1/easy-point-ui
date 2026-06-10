"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useRoles, useDeleteRole } from "../hooks/use-roles"
import { RoleModal } from "./role-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { Button } from "@/shared/components/ui/button"
import type { Role } from "../types/roles.types"
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { useAuthStore } from "@/shared/store/use-auth-store"

export function RolesList() {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  const organizationConfig = useAuthStore((s) => s.organizationConfig)
  const plan = organizationConfig?.plan || "FREE"

  const getPlanLimit = (planName: string) => {
    const p = planName.toUpperCase()
    if (p === "PREMIUM") return 5
    if (p === "BASIC") return 3
    if (p === "FREE") return 2
    return 3 // Default fallback
  }

  const roleLimit = getPlanLimit(plan)

  // Debounce search query to prevent excessive API requests
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset to first page when search filter changes
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data: response, isLoading } = useRoles({
    page,
    limit: 6, // 2x3 grid size
    search: debouncedSearch || undefined,
  })

  const roles = response?.data ?? []
  const meta = response?.meta
  const totalRolesCount = meta?.itemCount ?? roles.length

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null)

  const deleteMutation = useDeleteRole()

  const handleCreateClick = () => {
    if (totalRolesCount >= roleLimit) {
      toast.warning("Límite de roles alcanzado", {
        description: `Tu plan actual (${plan}) tiene un límite de ${roleLimit} roles. Actualiza tu plan para crear más.`,
      })
      return
    }
    setSelectedRole(null)
    setIsFormModalOpen(true)
  }

  const handleEditClick = (e: React.MouseEvent, role: Role) => {
    e.stopPropagation()
    setSelectedRole(role)
    setIsFormModalOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, role: Role) => {
    e.stopPropagation()
    setRoleToDelete(role)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!roleToDelete) return
    deleteMutation.mutate(roleToDelete.id, {
      onSuccess: () => {
        toast.success("Rol eliminado exitosamente")
        setIsDeleteModalOpen(false)
        setRoleToDelete(null)
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || "Error al eliminar el rol"
        toast.error(message)
      },
    })
  }

  const handleCardClick = (role: Role) => {
    router.push(`/roles/${role.id}/permissions`)
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return ""
    }
  }

  // Calculate layout cards to maintain 2x3 grid aesthetic (only if page 1 and no search filter)
  const availableSlotsCount = Math.max(0, roleLimit - totalRolesCount)
  const lockedSlotsCount = Math.max(0, 5 - Math.max(totalRolesCount, roleLimit))

  return (
    <div className="space-y-6">
      {/* Toolbar & Search Bar */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            placeholder="Buscar por nombre de rol..."
            value={search}
            onChange={setSearch}
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <Button
            onClick={handleCreateClick}
            className={cn(
              "bg-brand-500 hover:bg-brand-600 text-white rounded-[11px] gap-1.5 flex items-center px-4 h-11 transition-all duration-150 active:scale-95 cursor-pointer text-sm font-semibold shadow-xs",
              totalRolesCount >= roleLimit && "opacity-60 cursor-not-allowed hover:bg-brand-500"
            )}
          >
            <Plus className="h-4.5 w-4.5 shrink-0" />
            Nuevo Rol
          </Button>
        }
      />

      {/* Plan and Limit Progress Indicator */}
      <div className="bg-card/45 border border-border/40 rounded-2xl p-5 backdrop-blur-xs select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Límite de Roles de la Organización
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                plan === "PREMIUM"
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400"
                  : plan === "BASIC"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                    : "bg-muted text-muted-foreground border-border"
              )}>
                {plan === "PREMIUM" && <Sparkles className="h-2.5 w-2.5 animate-pulse" />}
                Plan {plan}
              </span>
            </h4>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              {plan === "PREMIUM"
                ? "Tu plan Premium te permite tener hasta 5 roles (2 de sistema y 3 personalizados) para organizar tus permisos."
                : plan === "BASIC"
                  ? "Tu plan Basic te permite tener hasta 3 roles (2 de sistema y 1 personalizado). Actualiza a Premium para obtener más."
                  : "Tu plan Free te permite tener hasta 2 roles de sistema. Actualiza tu plan para crear roles personalizados."}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-64 shrink-0">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Roles Usados</span>
                <span className="text-foreground">{totalRolesCount} / {roleLimit}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/20">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    totalRolesCount >= roleLimit ? "bg-rose-500" : "bg-brand-500"
                  )}
                  style={{ width: `${Math.min(100, (totalRolesCount / roleLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-[240px] rounded-2xl border border-border/30 bg-muted/20 p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-1/3 bg-muted rounded-md" />
                  <div className="h-4 w-16 bg-muted rounded-full" />
                </div>
                <div className="h-4 w-5/6 bg-muted rounded-md" />
              </div>
              <div className="h-7 w-20 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      ) : roles.length === 0 && debouncedSearch ? (
        /* Empty State for searches */
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-card/10 backdrop-blur-xs select-none">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/40 animate-pulse mb-3" />
          <p className="text-sm font-medium">No se encontraron roles coincidentes.</p>
        </div>
      ) : (
        /* Roles Grid (Unified Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Actual Roles Cards */}
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleCardClick(role)}
              className="group relative flex flex-col justify-between min-h-[240px] border border-border/40 bg-card/45 rounded-2xl p-6 transition-all duration-300 hover:border-brand-500/50 hover:bg-card/75 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] cursor-pointer overflow-hidden active:scale-[0.99] select-none"
            >
              {/* Dynamic Left Accent Bar (Lighter color for System Roles) */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5",
                  role.isSystemDefault ? "bg-brand-400/70 dark:bg-brand-400/50" : "bg-brand-500"
                )}
              />

              <div className="flex flex-col flex-1 justify-between h-full">
                {/* Header */}
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-heading font-bold text-foreground text-sm group-hover:text-brand-500 transition-colors leading-snug truncate pr-2" title={role.name}>
                    {role.name}
                  </h3>

                  {role.isSystemDefault ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-brand-400/10 text-brand-500 dark:text-brand-400 border-brand-400/20 shrink-0">
                      <Shield className="h-3 w-3 shrink-0" />
                      Sistema
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 shrink-0">
                      <ShieldCheck className="h-3 w-3 shrink-0" />
                      Personalizado
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground/90 line-clamp-4 leading-relaxed flex-1">
                  {role.description || "Sin descripción disponible para este rol."}
                </p>

                {/* Creation Date */}
                <div className="text-[10px] text-muted-foreground/50 mt-4 flex items-center gap-1">
                  <span>Creado el {formatDate(role.createdAt)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-border/25 pt-3 mt-4">
                <span className="text-xs font-semibold text-brand-500 group-hover:text-brand-600 transition-colors inline-flex items-center gap-1">
                  Permisos
                  <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-1 duration-200" />
                </span>

                {role.isSystemDefault ? (
                  <div
                    className="p-1 text-muted-foreground/40"
                    title="Rol del sistema no modificable"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleEditClick(e, role)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Editar detalles del rol"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, role)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Eliminar rol"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 2. Available Slots Cards (Only if page === 1 and not searching) */}
          {page === 1 && !debouncedSearch &&
            Array.from({ length: availableSlotsCount }).map((_, i) => (
              <div
                key={`available-slot-${i}`}
                className="group relative flex flex-col justify-between min-h-[240px] border border-dashed border-border bg-card/25 dark:bg-card/10 rounded-2xl p-6 select-none text-center items-center justify-center gap-3 cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-muted/20 text-muted-foreground flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-foreground text-sm">
                    Rol disponible
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                    Espacio disponible para añadir y personalizar un rol de organización.
                  </p>
                </div>
              </div>
            ))}

          {/* 3. Locked Slots Cards (Only if page === 1 and not searching) */}
          {page === 1 && !debouncedSearch &&
            Array.from({ length: lockedSlotsCount }).map((_, i) => (
              <div
                key={`locked-slot-${i}`}
                onClick={() => {
                  toast.info("Mejora tu plan para desbloquear más roles", {
                    description: "El plan Premium te permite tener hasta 5 roles. Ve a Ajustes de Organización para más detalles.",
                    action: {
                      label: "Ajustes",
                      onClick: () => router.push("/organization-config"),
                    },
                  })
                }}
                className="group relative flex flex-col justify-between min-h-[240px] border border-dashed border-border bg-muted/5 opacity-75 hover:opacity-100 hover:border-brand-500/40 hover:bg-card/30 transition-all duration-300 rounded-2xl p-6 cursor-pointer active:scale-[0.99] select-none text-center items-center justify-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-muted/20 text-muted-foreground flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-500/10 group-hover:text-brand-500 shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-foreground text-sm group-hover:text-brand-500 transition-colors">
                    Ranura Bloqueada
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                    Disponible en Plan Premium. Mejora tu plan para obtener más roles.
                  </p>
                </div>
              </div>
            ))}

          {/* 4. Support/Upgrade Card (Only if page === 1 and not searching) */}
          {page === 1 && !debouncedSearch && (
            <div
              onClick={() => {
                toast.success("Contacto de Soporte", {
                  description: "Escríbenos a soporte@easypoint.com para solicitar límites personalizados o asistencia adicional.",
                })
              }}
              className="group relative flex flex-col justify-between min-h-[240px] border border-border/40 bg-card/35 hover:bg-card/75 transition-all duration-300 rounded-2xl p-6 cursor-pointer active:scale-[0.99] select-none overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-brand-500/30"
            >
              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                      <HelpCircle className="h-4.5 w-4.5" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border shrink-0">
                      Soporte
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-foreground text-sm group-hover:text-brand-500 transition-colors pt-3">
                    ¿Necesitas más roles?
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground/90 leading-relaxed mb-4">
                  Contacta a soporte en caso de necesitar más roles o límites específicos para tu equipo.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border/25 pt-3 mt-auto">
                <span className="text-xs font-semibold text-brand-500 group-hover:text-brand-600 transition-colors inline-flex items-center gap-1">
                  Contactar a soporte
                  <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-1 duration-200" />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls (Only if total roles exceed 6) */}
      {meta && meta.itemCount > 6 && (
        <div className="flex items-center justify-between px-5 py-4 border border-border/30 rounded-2xl bg-card/40 backdrop-blur-xs select-none">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            {meta.itemCount !== undefined && (
              <div>
                Total de roles: <span className="font-semibold text-foreground">{meta.itemCount}</span>
              </div>
            )}
            <div>
              Página <span className="font-semibold text-foreground">{page}</span> de{" "}
              <span className="font-semibold text-foreground">{meta.pageCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.pageCount || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(meta.pageCount)}
              disabled={page >= meta.pageCount || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Role Create/Edit Modal */}
      <RoleModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        role={selectedRole}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar Rol?"
        description={`Esta acción eliminará de forma permanente el rol "${roleToDelete?.name}". Asegúrate de que no haya usuarios asignados a este rol antes de continuar.`}
        confirmLabel="Eliminar Rol"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
