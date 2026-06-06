"use client"

import * as React from "react"
import { useCreateRole, useUpdateRole } from "../hooks/use-roles"
import type { Role } from "../types/roles.types"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"

interface RoleModalProps {
  isOpen: boolean
  onClose: () => void
  role: Role | null
}

export function RoleModal({ isOpen, onClose, role }: RoleModalProps) {
  const isEdit = !!role
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  
  const [nameError, setNameError] = React.useState("")
  const [descError, setDescError] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      if (role) {
        setName(role.name)
        setDescription(role.description || "")
      } else {
        setName("")
        setDescription("")
      }
      setNameError("")
      setDescError("")
    }
  }, [isOpen, role])

  const validate = () => {
    let isValid = true
    
    if (!name.trim()) {
      setNameError("El nombre del rol es obligatorio")
      isValid = false
    } else if (name.length > 50) {
      setNameError("El nombre no puede exceder los 50 caracteres")
      isValid = false
    } else {
      setNameError("")
    }

    if (description.length > 255) {
      setDescError("La descripción no puede exceder los 255 caracteres")
      isValid = false
    } else {
      setDescError("")
    }

    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
    }

    if (isEdit && role) {
      updateMutation.mutate(
        { id: role.id, payload },
        {
          onSuccess: () => {
            toast.success("Rol actualizado con éxito")
            onClose()
          },
          onError: (err: any) => {
            const message = err.response?.data?.message || "Error al actualizar el rol"
            toast.error(message)
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Rol creado con éxito")
          onClose()
        },
        onError: (err: any) => {
          const message = err.response?.data?.message || "Error al crear el rol"
          toast.error(message)
        },
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-6 gap-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-semibold text-foreground">
            {isEdit ? "Editar Rol" : "Nuevo Rol"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEdit 
              ? "Modifica los detalles del rol personalizado de la organización." 
              : "Crea un nuevo rol personalizado para la organización."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-name" className="text-xs font-bold text-muted-foreground/90">
                Nombre del Rol <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="role-name"
                type="text"
                placeholder="Ej. Supervisor de Inventario"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError("")
                }}
                disabled={isPending}
                aria-invalid={!!nameError}
              />
              {nameError && (
                <span className="text-xs text-destructive mt-0.5">{nameError}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-description" className="text-xs font-bold text-muted-foreground/90">
                Descripción
              </Label>
              <Textarea
                id="role-description"
                placeholder="Describe las responsabilidades de este rol..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (descError) setDescError("")
                }}
                disabled={isPending}
                aria-invalid={!!descError}
                rows={3}
              />
              {descError && (
                <span className="text-xs text-destructive mt-0.5">{descError}</span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 hover:bg-muted/50 rounded-lg text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar Cambios" : "Crear Rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
