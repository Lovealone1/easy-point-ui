"use client"

import * as React from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/shared/services/api-client"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { useOrganizationsAdmin } from "@/features/organization/hooks/use-organizations-admin"
import {
  useAdminInvitations,
  useCreateAdminInvitation,
  useDeleteAdminInvitation,
} from "@/features/invitations/hooks/use-invitations"
import type { Invitation } from "@/features/invitations/types/invitations.types"
import {
  Mail,
  Building,
  Clock,
  Shield,
  FolderOpen,
  Calendar,
  AlertCircle,
  Trash2,
  Loader2,
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
    <tr className="group border-b border-border/30 bg-white dark:bg-zinc-950 hover:bg-muted/10 dark:hover:bg-muted/5 transition-colors">
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
          <Building className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
            {invitation.organization?.name || 'Cargando...'}
          </span>
        </div>
      </td>
      <td className="px-4 py-4.5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground/60 shrink-0" />
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
          <Clock className="h-3.5 w-3.5 shrink-0" />
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
            title="Revocar invitación"
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
            : "No hay invitaciones enviadas en el sistema."}
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

export default function AdminInvitationsPage() {
  const createMutation = useCreateAdminInvitation()
  const deleteMutation = useDeleteAdminInvitation()
  
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false)
  const [invitationToDeleteId, setInvitationToDeleteId] = React.useState<string | null>(null)
  
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Form states
  const [formOrgId, setFormOrgId] = React.useState("")
  const [formEmail, setFormEmail] = React.useState("")
  const [formRole, setFormRole] = React.useState("")
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({})

  // Fetch organizations
  const { data: orgsResponse, isLoading: isOrgsLoading } = useOrganizationsAdmin({ limit: 100 })
  const organizations = orgsResponse?.data ?? []

  // Fetch roles dynamically based on selected organization
  const { data: rolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["roles", "list", { organizationId: formOrgId }],
    queryFn: async () => {
      const { data } = await apiClient.get('/roles', {
        headers: {
          'x-organization-id': formOrgId
        }
      });
      return data;
    },
    enabled: !!formOrgId,
  })
  const roles = rolesResponse?.data ?? []

  // Filter roles (do not allow inviting owners)
  const rolesOptions = React.useMemo(() => {
    return roles
      .filter((r: any) => r.name !== 'OWNER')
      .map((r: any) => ({
        label: getRoleLabel(r.name),
        value: r.name,
      }))
  }, [roles])

  // Fetch system-wide global invitations
  const { data: invitationsResponse, isLoading, error, refetch } = useAdminInvitations()
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
        (inv.organization?.name || "").toLowerCase().includes(query) ||
        getRoleLabel(inv.role.name).toLowerCase().includes(query)
    )
  }, [invitations, debouncedSearch])

  // Handle dialog opening
  const handleOpenCreate = () => {
    setFormOrgId("")
    setFormEmail("")
    setFormRole("")
    setFormErrors({})
    setIsCreateOpen(true)
  }

  // Handle change of organization in the creation form
  const handleOrgChange = (orgId: string | null) => {
    setFormOrgId(orgId || "")
    setFormRole("") // Reset role when organization changes
    setFormErrors(prev => ({ ...prev, organizationId: "", role: "" }))
  }

  // Form submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const errors: Record<string, string> = {}
    if (!formOrgId) errors.organizationId = "La organización es obligatoria"
    if (!formEmail.trim()) {
      errors.email = "El correo electrónico es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = "El correo electrónico no es válido"
    }
    if (!formRole) errors.role = "El rol es obligatorio"

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    createMutation.mutate(
      {
        organizationId: formOrgId,
        email: formEmail.trim(),
        role: formRole,
      },
      {
        onSuccess: () => {
          toast.success("¡Invitación global enviada correctamente!")
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
        toast.success("¡Invitación revocada correctamente!")
        setIsConfirmDeleteOpen(false)
        setInvitationToDeleteId(null)
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ??
          "Error al revocar la invitación. Intente nuevamente."
        toast.error(msg)
        setIsConfirmDeleteOpen(false)
        setInvitationToDeleteId(null)
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por email, organización o rol..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nueva Invitación"
            shape="md"
            onClick={handleOpenCreate}
          />
        }
      />

      {/* DataTable */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Error al cargar invitaciones</h3>
            <p className="text-[11px] text-muted-foreground">
              Ocurrió un error al obtener la lista de invitaciones desde el servidor.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline"
          >
            Reintentar consulta
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/30 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm shadow-black/5 animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20 text-xs font-semibold text-muted-foreground select-none">
                  <th className="px-4 py-3">Usuario Invitado</th>
                  <th className="px-4 py-3">Organización</th>
                  <th className="px-4 py-3">Rol Asignado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Expiración</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/20 bg-white dark:bg-zinc-950 animate-pulse">
                      <td className="px-4 py-4.5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-muted/60" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 w-1/2 rounded bg-muted/60" />
                          <div className="h-2.5 w-1/3 rounded bg-muted/40" />
                        </div>
                      </td>
                      <td className="px-4 py-4.5">
                        <div className="h-3.5 w-32 rounded bg-muted/50" />
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
                    <td colSpan={6} className="px-4 py-12 text-center">
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
      )}

      {/* Invite Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-5 sm:p-7 gap-5 sm:gap-6 duration-200">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-heading font-semibold text-foreground">
              Enviar Invitación
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Selecciona una organización y especifica el correo electrónico junto con el rol para invitar a un nuevo integrante.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Organization Select */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-org" className="text-xs font-bold text-muted-foreground/90">
                  Organización de Destino <span className="text-destructive font-bold">*</span>
                </Label>
                <Select
                  value={formOrgId}
                  onValueChange={handleOrgChange}
                  disabled={isOrgsLoading || createMutation.isPending}
                >
                  <SelectTrigger
                    id="inv-org"
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow]"
                  >
                    <SelectValue placeholder={isOrgsLoading ? "Cargando organizaciones..." : "Selecciona una organización"}>
                      {formOrgId 
                        ? (organizations.find((o) => o.id === formOrgId)?.name || formOrgId)
                        : undefined
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                    {organizations.map((org) => (
                      <SelectItem
                        key={org.id}
                        value={org.id}
                        className="rounded-lg text-xs py-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                      >
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.organizationId && (
                  <span className="text-xs text-destructive mt-0.5">{formErrors.organizationId}</span>
                )}
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-email" className="text-xs font-bold text-muted-foreground/90">
                  Correo Electrónico <span className="text-destructive font-bold">*</span>
                </Label>
                <Input
                  id="inv-email"
                  placeholder="usuario@empresa.com"
                  value={formEmail}
                  onChange={(e) => {
                    setFormEmail(e.target.value)
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: "" }))
                  }}
                  disabled={createMutation.isPending}
                  className="h-10 text-sm"
                  aria-invalid={!!formErrors.email}
                />
                {formErrors.email && (
                  <span className="text-xs text-destructive mt-0.5">{formErrors.email}</span>
                )}
              </div>

              {/* Role Select */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inv-role" className="text-xs font-bold text-muted-foreground/90">
                  Rol Asignado <span className="text-destructive font-bold">*</span>
                </Label>
                <Select
                  value={formRole}
                  onValueChange={(val) => {
                    setFormRole(val || "")
                    if (formErrors.role) setFormErrors(prev => ({ ...prev, role: "" }))
                  }}
                  disabled={!formOrgId || isRolesLoading || createMutation.isPending}
                >
                  <SelectTrigger
                    id="inv-role"
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow]"
                  >
                    <SelectValue placeholder={
                      !formOrgId 
                        ? "Selecciona primero la organización" 
                        : isRolesLoading 
                          ? "Cargando roles..." 
                          : "Selecciona el rol"
                    }>
                      {formRole 
                        ? getRoleLabel(formRole)
                        : undefined
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                    {rolesOptions.map((opt: { label: string; value: string }) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="rounded-lg text-xs py-2 focus:bg-primary/10 focus:text-primary cursor-pointer"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <span className="text-xs text-destructive mt-0.5">{formErrors.role}</span>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
                className="px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || isRolesLoading}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {createMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Enviar Invitación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false)
          setInvitationToDeleteId(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Revocar Invitación"
        description="¿Está seguro de que desea eliminar esta invitación pendiente? El destinatario ya no podrá usar el enlace enviado para registrarse o unirse a la organización."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
