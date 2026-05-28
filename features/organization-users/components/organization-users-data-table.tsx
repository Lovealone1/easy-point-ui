"use client"

import * as React from "react"
import { useOrganizationUsers } from "../hooks/use-organization-users"
import { DataTable } from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { ChangeRoleModal } from "./change-role-modal"
import { RemoveUserModal } from "./remove-user-modal"
import type { OrganizationUser, Role } from "../types/organization-users.types"
import { Button } from "@/shared/components/ui/button"
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
  const limit = 10

  const { data: response, isLoading } = useOrganizationUsers({
    page,
    limit,
    search,
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

  return (
    <div className="flex flex-col space-y-4">
      <DataTableToolbar>
        <DataTableSearch
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={setSearch}
        />
        {/* Futuro: Botón de invitar podría ir aquí */}
      </DataTableToolbar>

      <DataTable
        data={users}
        loading={isLoading}
        columns={[
          {
            header: "Usuario",
            key: "user",
            render: (row) => (
              <div className="flex flex-col">
                <span className="font-medium">
                  {[row.user?.firstName, row.user?.lastName].filter(Boolean).join(" ") || "Usuario Desconocido"}
                </span>
                <span className="text-xs text-muted-foreground">{row.user?.email}</span>
              </div>
            ),
          },
          {
            header: "Rol de Acceso",
            key: "role",
            render: (row) => (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{roleTranslations[row.role as Role] || row.role}</span>
              </div>
            ),
          },
          {
            header: "Fecha de Unión",
            key: "joinedAt",
            render: (row) => (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>{row.joinedAt ? format(new Date(row.joinedAt), "dd/MM/yyyy") : "-"}</span>
              </div>
            ),
          },
          {
            header: "Acciones",
            key: "actions",
            align: "right",
            render: (row) => (
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Cambiar Rol"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenRoleModal(row)
                  }}
                >
                  <Shield className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Expulsar"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenRemoveModal(row)
                  }}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        pagination={{
          currentPage: meta?.page ?? 1,
          totalPages: meta?.pageCount ?? 1,
          totalItems: meta?.itemCount ?? 0,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
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
