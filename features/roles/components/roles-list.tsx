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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"

export function RolesList() {
  const router = useRouter()
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const limit = 9

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
    limit,
    search: debouncedSearch || undefined,
  })

  const roles = response?.data ?? []
  const meta = response?.meta

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false)
  const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null)

  const deleteMutation = useDeleteRole()

  const handleCreateClick = () => {
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
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-[11px] gap-1.5 flex items-center px-4 h-11 transition-all duration-150 active:scale-95 cursor-pointer text-sm font-semibold shadow-xs"
          >
            <Plus className="h-4.5 w-4.5 shrink-0" />
            Nuevo Rol
          </Button>
        }
      />

      {/* Loading Skeleton Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-48 rounded-2xl border border-border/30 bg-muted/20 p-5 flex flex-col justify-between"
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
      ) : roles.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-card/10 backdrop-blur-xs select-none">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/40 animate-pulse mb-3" />
          <p className="text-sm font-medium">No se encontraron roles definidos.</p>
        </div>
      ) : (
        /* Roles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleCardClick(role)}
              className="group relative flex flex-col justify-between min-h-[185px] border border-border/40 bg-card/45 rounded-2xl p-5 transition-all duration-300 hover:border-brand-500/50 hover:bg-card/75 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] cursor-pointer overflow-hidden active:scale-[0.99] select-none"
            >
              {/* Dynamic Left Accent Bar */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5",
                  role.isSystemDefault ? "bg-brand-700 dark:bg-brand-300" : "bg-brand-500"
                )}
              />

              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-heading font-bold text-foreground text-sm group-hover:text-brand-500 transition-colors leading-snug truncate pr-2" title={role.name}>
                    {role.name}
                  </h3>

                  {role.isSystemDefault ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-brand-700/10 text-brand-700 border-brand-700/20 dark:bg-brand-300/10 dark:text-brand-300 dark:border-brand-300/20 shrink-0">
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
                <p className="text-xs text-muted-foreground/90 line-clamp-3 leading-relaxed">
                  {role.description || "Sin descripción disponible para este rol."}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-border/25 pt-3 mt-3">
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
        </div>
      )}

      {/* Pagination Controls */}
      {meta && meta.pageCount > 0 && (
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
