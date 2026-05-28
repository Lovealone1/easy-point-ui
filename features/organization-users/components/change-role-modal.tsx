import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/components/ui/select"
import { Label } from "@/shared/components/ui/label"
import { useUpdateOrganizationUserRole } from "../hooks/use-organization-users"
import type { OrganizationUser, Role } from "../types/organization-users.types"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ChangeRoleModalProps {
  isOpen: boolean
  onClose: () => void
  user: OrganizationUser | null
}

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "OWNER", label: "Propietario", description: "Acceso total a la organización (solo puede haber uno)." },
  { value: "ADMINISTRATOR", label: "Administrador", description: "Acceso a la mayoría de las configuraciones y módulos." },
  { value: "MANAGER", label: "Gerente", description: "Acceso a la operación diaria y reportes." },
  { value: "USER", label: "Usuario Regular", description: "Acceso básico a las operaciones." },
]

export function ChangeRoleModal({ isOpen, onClose, user }: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = React.useState<Role | "">("")
  const updateRoleMutation = useUpdateOrganizationUserRole()

  React.useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(user.role)
    }
  }, [isOpen, user])

  const handleSave = () => {
    if (!user || !selectedRole) return

    updateRoleMutation.mutate(
      { id: user.id, payload: { role: selectedRole } },
      {
        onSuccess: () => {
          toast.success("Rol actualizado exitosamente")
          onClose()
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Error al actualizar el rol")
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Rol</DialogTitle>
          <DialogDescription>
            Actualiza el nivel de acceso para <strong>{user?.user?.firstName} {user?.user?.lastName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-3">
          <Label>Nuevo Rol</Label>
          <Select
            value={selectedRole}
            onValueChange={(v) => setSelectedRole(v as Role)}
            disabled={updateRoleMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rol" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateRoleMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateRoleMutation.isPending || !selectedRole || selectedRole === user?.role}>
            {updateRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
