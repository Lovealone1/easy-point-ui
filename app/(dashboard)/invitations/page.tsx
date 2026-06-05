"use client"

import * as React from "react"
import { toast } from "sonner"
import { DynamicFormModal, type FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { Button } from "@/shared/components/ui/button"
import { useRoles } from "@/features/roles/hooks/use-roles"
import { useInvitations, useCreateInvitation, useDeleteInvitation } from "@/features/invitations/hooks/use-invitations"
import type { Invitation } from "@/features/invitations/types/invitations.types"
import {
  Mail,
  Building,
  UserCheck,
  Clock,
  Shield,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
  AlertCircle,
  Trash2
} from "lucide-react"
import { cn } from "@/shared/lib/utils"

// ─── Status Badges & Labels ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: Invitation['status'] }) {
  let styles = ""
  let label = ""

  switch (status) {
    case "PENDING":
      styles = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      label = "Pendiente"
      break
    case "ACCEPTED":
      styles = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      label = "Aceptada"
      break
    case "EXPIRED":
      styles = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
      label = "Expirada"
      break
    case "REVOKED":
      styles = "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
      label = "Revocada"
      break
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
      styles
    )}>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === "ACCEPTED" ? "bg-emerald-500" :
        status === "PENDING" ? "bg-amber-500" :
        status === "REVOKED" ? "bg-rose-500" : "bg-zinc-400"
      )} />
      {label}
    </span>
  )
}

function capitalize(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function getRoleLabel(roleName: string) {
  switch (roleName.toUpperCase()) {
    case 'OWNER':
      return 'Propietario';
    case 'ADMINISTRATOR':
      return 'Administrador';
    case 'COLLABORATOR':
      return 'Colaborador';
    case 'USER':
      return 'Usuario regular';
    default:
      return capitalize(roleName);
  }
}

// ─── Invitation Row ───────────────────────────────────────────────────────────

interface InvitationRowProps {
  invitation: Invitation
  onDelete: (id: string) => void
  isDeleting: boolean
}

function InvitationRow({ invitation, onDelete, isDeleting }: InvitationRowProps) {
  const formattedCreated = new Date(invitation.createdAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  const formattedExpires = new Date(invitation.expiresAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })

  return (
    <tr className="group border-b border-border/30 hover:bg-muted/10 dark:hover:bg-muted/5 transition-colors">
      <td className="px-4 py-4.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10">
            <Mail className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{invitation.email}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" /> Enviada: {formattedCreated}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4.5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-sm font-medium text-foreground">
            {getRoleLabel(invitation.role.name)}
          </span>
        </div>
      </td>
      <td className="px-4 py-4.5">
        <StatusBadge status={invitation.status} />
      </td>
      <td className="px-4 py-4.5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Vence: {formattedExpires}</span>
        </div>
      </td>
      <td className="px-4 py-4.5 text-center">
        {invitation.status === "PENDING" ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(invitation.id)}
            disabled={isDeleting}
            className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer mx-auto flex items-center justify-center"
            title="Eliminar invitación"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground/30">-</span>
        )}
      </td>
    </tr>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  isFiltered,
  onClear,
}: {
  isFiltered: boolean
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/40 border border-border/20 text-muted-foreground/40 animate-pulse">
        <FolderOpen className="h-7 w-7" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {isFiltered ? "Sin resultados" : "Sin invitaciones"}
        </p>
        <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
          {isFiltered
            ? "No se encontraron invitaciones que coincidan con la búsqueda."
            : "Aún no hay invitaciones de organización enviadas. Invita a tu primer colaborador."}
        </p>
      </div>
      {isFiltered && (
        <button
          onClick={onClear}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
        >
          Limpiar búsqueda
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InvitationsPage() {
  const createMutation = useCreateInvitation()
  const deleteMutation = useDeleteInvitation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false)
  const [invitationToDeleteId, setInvitationToDeleteId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Fetch roles for the select options
  const { data: rolesResponse } = useRoles()
  const roles = rolesResponse?.data ?? []

  // Fetch organization invitations
  const { data: invitationsResponse, isLoading } = useInvitations()
  const invitations = invitationsResponse ?? []

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // Filter invitations client-side based on search
  const filteredInvitations = React.useMemo(() => {
    if (!debouncedSearch) return invitations

    const query = debouncedSearch.toLowerCase()
    return invitations.filter(
      (inv) =>
        inv.email.toLowerCase().includes(query) ||
        inv.status.toLowerCase().includes(query) ||
        getRoleLabel(inv.role.name).toLowerCase().includes(query)
    )
  }, [invitations, debouncedSearch])

  // Populate Role select options dynamically
  const rolesOptions = React.useMemo(() => {
    return roles
      .filter((r: any) => r.name !== 'OWNER') // owner cannot be invited
      .map((r: any) => ({
        label: getRoleLabel(r.name),
        value: r.name,
      }))
  }, [roles])

  // Create form schema
  const fields = React.useMemo<FormFieldSchema[]>(() => {
    return [
      {
        name: "email",
        label: "Correo Electrónico",
        type: "text",
        required: true,
        gridCols: 2,
        placeholder: "ejemplo@empresa.com",
      },
      {
        name: "role",
        label: "Rol en la Organización",
        type: "select",
        required: true,
        gridCols: 2,
        options: rolesOptions,
        placeholder: "Selecciona el rol...",
      }
    ]
  }, [rolesOptions])

  // Submit invite
  function handleCreate(values: Record<string, any>) {
    createMutation.mutate(
      {
        email: values.email,
        role: values.role,
      },
      {
        onSuccess: () => {
          toast.success("¡Invitación enviada correctamente!")
          setIsCreateOpen(false)
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ??
            "Error al enviar la invitación. Intente nuevamente."
          toast.error(msg)
        },
      }
    )
  }

  function handleDeleteClick(id: string) {
    setInvitationToDeleteId(id)
    setIsConfirmDeleteOpen(true)
  }

  function handleConfirmDelete() {
    if (!invitationToDeleteId) return

    deleteMutation.mutate(invitationToDeleteId, {
      onSuccess: () => {
        toast.success("¡Invitación eliminada correctamente!")
        setIsConfirmDeleteOpen(false)
        setInvitationToDeleteId(null)
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ??
          "Error al eliminar la invitación. Intente nuevamente."
        toast.error(msg)
        setIsConfirmDeleteOpen(false)
        setInvitationToDeleteId(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Invitaciones de Equipo</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Envía invitaciones por correo electrónico para vincular nuevos usuarios a tu organización con roles y accesos específicos.
        </p>
      </div>

      {/* Toolbar */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por email o rol..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Invitar Usuario"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* DataTable */}
      <div className="rounded-2xl border border-border/30 bg-card overflow-hidden shadow-sm shadow-black/5 animate-in fade-in duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20 text-xs font-semibold text-muted-foreground select-none">
                <th className="px-4 py-3">Usuario Invitado</th>
                <th className="px-4 py-3">Rol Asignado</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Expiración</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20 animate-pulse">
                    <td className="px-4 py-4.5 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-muted/60" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-1/2 rounded bg-muted/60" />
                        <div className="h-2.5 w-1/3 rounded bg-muted/40" />
                      </div>
                    </td>
                    <td className="px-4 py-4.5">
                      <div className="h-3.5 w-24 rounded bg-muted/50" />
                    </td>
                    <td className="px-4 py-4.5">
                      <div className="h-5 w-16 rounded-full bg-muted/40" />
                    </td>
                    <td className="px-4 py-4.5">
                      <div className="h-3 w-32 rounded bg-muted/40" />
                    </td>
                    <td className="px-4 py-4.5 text-center">
                      <div className="h-8 w-8 rounded-lg bg-muted/40 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <EmptyState
                      isFiltered={!!debouncedSearch}
                      onClear={() => setSearch("")}
                    />
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((invitation) => (
                  <InvitationRow
                    key={invitation.id}
                    invitation={invitation}
                    onDelete={handleDeleteClick}
                    isDeleting={deleteMutation.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Invitar Nuevo Integrante"
        description="Ingresa el correo electrónico y el nivel de rol para el nuevo usuario. Se enviará un código y enlace directo."
        fields={fields}
        submitLabel="Enviar Invitación"
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false)
          setInvitationToDeleteId(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Revocar Invitación"
        description="¿Está seguro de que desea eliminar esta invitación pendiente? El destinatario ya no podrá usar el enlace enviado para unirse."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
