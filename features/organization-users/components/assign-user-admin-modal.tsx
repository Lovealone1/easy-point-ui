import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/components/ui/select"
import { Label } from "@/shared/components/ui/label"
import { Input } from "@/shared/components/ui/input"
import { useAssignOrganizationUserAdmin, useOrganizationRolesAdmin } from "../hooks/use-organization-users-admin"
import { useUsers } from "../../users/hooks/use-users"
import type { Role } from "../types/organization-users.types"
import type { User } from "../../users/types/users.types"
import { toast } from "sonner"
import { Loader2, Search, User as UserIcon, Check } from "lucide-react"

interface AssignUserAdminModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: string
}

const roleStaticInfo: Record<string, { label: string; description: string }> = {
  OWNER: { label: "Propietario", description: "Acceso total a la organización (solo puede haber uno)." },
  ADMINISTRATOR: { label: "Administrador", description: "Acceso a la mayoría de las configuraciones y módulos." },
  MANAGER: { label: "Gerente", description: "Acceso a la operación diaria y reportes." },
  USER: { label: "Usuario Regular", description: "Acceso básico a las operaciones." },
}

export function AssignUserAdminModal({ isOpen, onClose, orgId }: AssignUserAdminModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [selectedRole, setSelectedRole] = React.useState<Role>("USER")
  
  const assignMutation = useAssignOrganizationUserAdmin()

  // Dynamic Roles consumption
  const { data: rolesResponse } = useOrganizationRolesAdmin(isOpen ? orgId : null)
  const roles = rolesResponse?.data ?? []

  const rolesList = React.useMemo(() => {
    if (roles.length > 0) {
      return roles.map((r) => {
        const info = roleStaticInfo[r.name] || {
          label: r.name,
          description: r.description || "Rol personalizado creado por la organización.",
        }
        return {
          value: r.name as Role,
          label: info.label,
          description: info.description,
        }
      })
    }
    return Object.entries(roleStaticInfo).map(([key, val]) => ({
      value: key as Role,
      label: val.label,
      description: val.description,
    }))
  }, [roles])

  // Fallback to first role if USER or current selectedRole is not present in loaded roles list
  React.useEffect(() => {
    if (isOpen && rolesList.length > 0) {
      const exists = rolesList.some(r => r.value === selectedRole)
      if (!exists) {
        setSelectedRole(rolesList[0].value)
      }
    }
  }, [isOpen, rolesList, selectedRole])

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Reset states on open/close
  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      setDebouncedQuery("")
      setSelectedUser(null)
      setSelectedRole("USER")
    }
  }, [isOpen])

  // Retrieve users based on search
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({
    limit: 5,
    search: debouncedQuery || undefined,
  })
  
  const matchingUsers = usersResponse?.data ?? []

  const handleAssign = () => {
    if (!selectedUser || !orgId) return

    assignMutation.mutate(
      {
        orgId,
        payload: {
          userId: selectedUser.id,
          role: selectedRole,
        },
      },
      {
        onSuccess: () => {
          toast.success("Usuario asignado exitosamente a la organización")
          onClose()
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Error al asignar el usuario")
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Asignar Miembro (Admin)</DialogTitle>
          <DialogDescription>
            Busca un usuario global y asígnalo a esta organización.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* User Search Section */}
          <div className="space-y-2">
            <Label>Buscar Usuario</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Escribe el nombre o correo del usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selected User Indicator */}
            {selectedUser && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-brand-500/20 bg-brand-500/5 text-sm transition-all duration-300">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-brand-500" />
                  <div>
                    <span className="font-bold block leading-tight text-foreground">
                      {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") || "Usuario"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{selectedUser.email}</span>
                  </div>
                </div>
                <div className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center text-white">
                  <Check className="h-3 w-3" />
                </div>
              </div>
            )}

            {/* Dropdown Results List */}
            {searchQuery && !selectedUser && (
              <div className="border border-border rounded-lg max-h-[160px] overflow-y-auto bg-popover text-popover-foreground divide-y divide-border shadow-md">
                {isLoadingUsers ? (
                  <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                    Buscando usuarios...
                  </div>
                ) : matchingUsers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No se encontraron usuarios globales.
                  </div>
                ) : (
                  matchingUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className="w-full text-left p-2.5 hover:bg-muted/60 transition-colors flex items-center gap-2 text-sm"
                    >
                      <UserIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block text-foreground leading-none">
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || "Usuario"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono mt-0.5 block truncate">
                          {u.email}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Role Selection Section */}
          <div className="space-y-2">
            <Label>Rol en la Organización</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as Role)}
              disabled={assignMutation.isPending}
            >
              <SelectTrigger className="w-full h-10 bg-background pr-3">
                <SelectValue placeholder="Selecciona un rol para la organización" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-[280px] max-w-[400px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto z-[60]"
              >
                {rolesList.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="rounded-lg text-xs py-2 cursor-pointer">
                    <div className="flex flex-col py-0.5 pr-2">
                      <span className="font-bold text-foreground leading-snug">{r.label}</span>
                      <span className="text-[10px] text-muted-foreground/80 leading-normal mt-0.5 whitespace-normal break-words">{r.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={assignMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={assignMutation.isPending || !selectedUser}>
            {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Asignar Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
