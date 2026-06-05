"use client"

import * as React from "react"
import { useOrganizationUsers } from "../hooks/use-organization-users"
import { DataTable, ColumnDef } from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { ChangeRoleModal } from "./change-role-modal"
import { RemoveUserModal } from "./remove-user-modal"
import type { OrganizationUser, Role } from "../types/organization-users.types"
import { Shield, UserMinus, Clock } from "lucide-react"
import { format } from "date-fns"

const roleTranslations: Record<Role, string> = {
  OWNER: "Propietario",
  ADMINISTRATOR: "Administrador",
  MANAGER: "Gerente",
  USER: "Usuario",
}

export function OrganizationUsersDataTable() {
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const limit = 8

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

  const { data: response, isLoading } = useOrganizationUsers({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const users = response?.data ?? []
  const meta = response?.meta

  const [selectedUser, setSelectedUser] = React.useState<OrganizationUser | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = React.useState(false)

  const handleOpenRoleModal = (user: OrganizationUser) => {
    setSelectedUser(user)
    setIsRoleModalOpen(true)
  }

  const handleOpenRemoveModal = (user: OrganizationUser) => {
    setSelectedUser(user)
    setIsRemoveModalOpen(true)
  }

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false)
    setSelectedUser(null)
  }

  const handleCloseRemoveModal = () => {
    setIsRemoveModalOpen(false)
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
            title="Expulsar"
          >
            <UserMinus className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={setSearch}
            shortcutKey="/"
            shape="md"
          />
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        pagination={{
          currentPage: meta?.page ?? 1,
          totalPages: meta?.pageCount ?? 1,
          totalItems: meta?.itemCount ?? 0,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
        glassy={true}
      />

      <ChangeRoleModal
        isOpen={isRoleModalOpen}
        onClose={handleCloseRoleModal}
        user={selectedUser}
      />
      
      <RemoveUserModal
        isOpen={isRemoveModalOpen}
        onClose={handleCloseRemoveModal}
        user={selectedUser}
      />
    </div>
  )
}
