"use client"

import * as React from "react"
import { toast } from "sonner"
import { DataTable, ColumnDef } from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select"
import {
  Building2,
  Users,
  UserX,
  Shield,
  Clock,
  Loader2,
  UserPlus,
  UserMinus,
  AlertCircle,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { useOrganizationsAdmin } from "@/features/organization/hooks/use-organizations-admin"
import { useOrganizationUsersAdmin } from "@/features/organization-users/hooks/use-organization-users-admin"
import type { OrganizationUser, Role } from "@/features/organization-users/types/organization-users.types"
import { ChangeRoleAdminModal } from "@/features/organization-users/components/change-role-admin-modal"
import { RemoveUserAdminModal } from "@/features/organization-users/components/remove-user-admin-modal"
import { AssignUserAdminModal } from "@/features/organization-users/components/assign-user-admin-modal"
import { cn } from "@/shared/lib/utils"

const roleTranslations: Record<Role, string> = {
  OWNER: "Propietario",
  ADMINISTRATOR: "Administrador",
  MANAGER: "Gerente",
  USER: "Usuario",
}

export default function AdminOrganizationUsersPage() {
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>("")
  
  // Modals visibility state
  const [isRoleOpen, setIsRoleOpen] = React.useState(false)
  const [isRemoveOpen, setIsRemoveOpen] = React.useState(false)
  const [isAssignOpen, setIsAssignOpen] = React.useState(false)
  
  // Selected items state
  const [selectedUser, setSelectedUser] = React.useState<OrganizationUser | null>(null)

  // Query states
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const limit = 8

  // Fetch organizations for the dropdown
  const { data: orgsResponse, isLoading: isLoadingOrgs } = useOrganizationsAdmin({ limit: 100 })
  const orgs = orgsResponse?.data ?? []

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset page on search change
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch organization users (enabled only when orgId is selected)
  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error,
    refetch,
  } = useOrganizationUsersAdmin(selectedOrgId || null, {
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const users = usersResponse?.data ?? []
  const meta = usersResponse?.meta

  const handleOpenRoleModal = (user: OrganizationUser) => {
    setSelectedUser(user)
    setIsRoleOpen(true)
  }

  const handleOpenRemoveModal = (user: OrganizationUser) => {
    setSelectedUser(user)
    setIsRemoveOpen(true)
  }

  const handleCloseModals = () => {
    setIsRoleOpen(false)
    setIsRemoveOpen(false)
    setIsAssignOpen(false)
    setSelectedUser(null)
  }

  const columns = React.useMemo<ColumnDef<OrganizationUser>[]>(() => [
    {
      header: "Usuario",
      key: "user",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">
            {[row.user?.firstName, row.user?.lastName].filter(Boolean).join(" ") || "Usuario Desconocido"}
          </span>
          <span className="text-xs text-muted-foreground/80 font-mono mt-0.5 truncate">{row.user?.email}</span>
        </div>
      ),
    },
    {
      header: "Rol de Acceso",
      key: "role",
      render: (row) => {
        const roleColors: Record<Role, string> = {
          OWNER: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
          ADMINISTRATOR: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
          MANAGER: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          USER: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
        }
        const colorClass = roleColors[row.role as Role] || roleColors.USER
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}>
            <Shield className="h-3.5 w-3.5 shrink-0" />
            {roleTranslations[row.role as Role] || row.role}
          </span>
        )
      }
    },
    {
      header: "Fecha de Unión",
      key: "joinedAt",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-muted-foreground/80 text-sm">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono">
            {row.joinedAt ? format(new Date(row.joinedAt), "dd/MM/yyyy") : "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Acciones",
      key: "actions",
      align: "center",
      className: "w-[120px]",
      render: (row) => (
        <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenRoleModal(row)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
            title="Cambiar Rol"
          >
            <Shield className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleOpenRemoveModal(row)}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
            title="Expulsar de Organización"
          >
            <UserMinus className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-6">
      {/* Selector de Organización y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/40 backdrop-blur-sm shadow-sm animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
          <div className="space-y-1.5 w-full md:w-auto">
            <Label className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
              Organización
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={selectedOrgId}
                onValueChange={(val) => {
                  setSelectedOrgId(val || "")
                  setPage(1)
                  setSearch("")
                }}
                disabled={isLoadingOrgs}
              >
                <SelectTrigger className="w-full md:w-[360px] h-10 bg-background pr-3">
                  <SelectValue placeholder={isLoadingOrgs ? "Cargando organizaciones..." : "Selecciona una organización..."}>
                    {selectedOrgId ? orgs.find((o) => o.id === selectedOrgId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto"
                >
                  {orgs.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="rounded-lg text-xs py-2 cursor-pointer">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOrgId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedOrgId("")
                    setPage(1)
                    setSearch("")
                  }}
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-brand-500/25 hover:border-brand-500/50 bg-brand-500/5 hover:bg-brand-500/10 text-brand-500 dark:text-brand-400 transition-all duration-150 active:scale-95 cursor-pointer"
                  title="Limpiar selección"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {selectedOrgId && (
            <div className="space-y-1.5 w-full md:w-auto">
              <Label className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                Buscar Miembros
              </Label>
              <DataTableSearch
                value={search}
                onChange={setSearch}
                placeholder="Buscar por nombre o correo..."
                shortcutKey="/"
                shape="md"
                className="h-10 w-full md:w-[320px]"
              />
            </div>
          )}
        </div>

        {selectedOrgId && (
          <div className="pt-5 md:pt-0">
            <Button
              onClick={() => setIsAssignOpen(true)}
              className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150 active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              Asignar Miembro
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!selectedOrgId ? (
        /* Empty State: No organization selected */
        <div className="flex flex-col items-center justify-center py-24 px-4 border border-dashed border-border rounded-2xl bg-card/10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 mb-4 border border-brand-500/20">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Sin Organización Seleccionada</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Selecciona una organización del menú desplegable superior para ver y gestionar sus miembros asociados.
          </p>
        </div>
      ) : isLoadingUsers ? (
        /* Loading State */
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <span className="text-xs text-muted-foreground font-medium">Cargando miembros de la organización...</span>
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Error al cargar datos</h3>
            <p className="text-[11px] text-muted-foreground">
              No pudimos establecer comunicación con el servidor para esta organización.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline cursor-pointer"
          >
            Reintentar consulta
          </button>
        </div>
      ) : users.length === 0 ? (
        /* Empty State: Selected organization has no users */
        <div className="flex flex-col items-center justify-center py-24 px-4 border border-dashed border-border rounded-2xl bg-card/10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
            <UserX className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">No Hay Miembros Registrados</h3>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            Esta organización no tiene ningún miembro asignado en este momento. Puedes asignar el primer usuario para comenzar.
          </p>
          <Button
            onClick={() => setIsAssignOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Asignar Primer Usuario
          </Button>
        </div>
      ) : (
        /* User Table once organization and users are loaded */
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={users}
            loading={isLoadingUsers}
            pagination={{
              currentPage: page,
              totalPages: meta?.pageCount ?? 1,
              onPageChange: setPage,
              totalItems: meta?.itemCount ?? 0,
              itemsPerPage: limit,
            }}
            glassy={true}
          />
        </div>
      )}

      {/* Action Modals */}
      {selectedOrgId && (
        <>
          <ChangeRoleAdminModal
            isOpen={isRoleOpen}
            onClose={handleCloseModals}
            user={selectedUser}
            orgId={selectedOrgId}
          />

          <RemoveUserAdminModal
            isOpen={isRemoveOpen}
            onClose={handleCloseModals}
            user={selectedUser}
            orgId={selectedOrgId}
          />

          <AssignUserAdminModal
            isOpen={isAssignOpen}
            onClose={handleCloseModals}
            orgId={selectedOrgId}
          />
        </>
      )}
    </div>
  )
}
