import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { useRemoveOrganizationUserAdmin } from "../hooks/use-organization-users-admin"
import type { OrganizationUser } from "../types/organization-users.types"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"

interface RemoveUserAdminModalProps {
  isOpen: boolean
  onClose: () => void
  user: OrganizationUser | null
  orgId: string
}

export function RemoveUserAdminModal({ isOpen, onClose, user, orgId }: RemoveUserAdminModalProps) {
  const removeUserMutation = useRemoveOrganizationUserAdmin()

  const handleRemove = () => {
    if (!user || !orgId) return

    removeUserMutation.mutate(
      { orgId, id: user.id },
      {
        onSuccess: () => {
          toast.success("Usuario expulsado exitosamente")
          onClose()
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Error al expulsar al usuario")
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Expulsar Usuario (Admin)
          </DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar a <strong>{user?.user?.firstName} {user?.user?.lastName}</strong> de esta organización.
            <br /><br />
            Ya no tendrán acceso a los módulos ni a la información de la empresa. Los datos históricos creados por este usuario seguirán existiendo. ¿Estás completamente seguro?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={removeUserMutation.isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={removeUserMutation.isPending}>
            {removeUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Sí, Expulsar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
