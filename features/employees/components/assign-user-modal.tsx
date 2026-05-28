"use client"

import * as React from "react"
import { Loader2, Search, UserRound, Link, Unlink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Label } from "@/shared/components/ui/label"
import type { Employee } from "../types/employees.types"

interface OrganizationUserMemberInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface OrganizationUser {
  id: string;
  userId: string;
  user?: OrganizationUserMemberInfo;
}

interface AssignUserModalProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
  /** Pass the pre-fetched list of org users to pick from */
  users: OrganizationUser[]
  usersLoading?: boolean
  isAssigning?: boolean
  onAssign: (userId: string | null) => void
}

export function AssignUserModal({
  isOpen,
  onClose,
  employee,
  users,
  usersLoading = false,
  isAssigning = false,
  onAssign,
}: AssignUserModalProps) {
  const [selectedId, setSelectedId] = React.useState<string>("none")

  // Pre-select the already assigned user on open
  React.useEffect(() => {
    if (isOpen) {
      setSelectedId(employee?.userId ?? "none")
    }
  }, [isOpen, employee])

  if (!employee) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 duration-200">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-lg font-heading font-bold text-foreground">
            Asignar Usuario
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Selecciona el usuario del sistema que deseas vincular con{" "}
            <span className="font-semibold text-foreground">
              {employee.firstName} {employee.lastName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 py-2">
          <Label className="text-xs font-bold text-muted-foreground/90">Usuario Asignado</Label>
          <Select
            key={users.length ? `assign-select-${users.length}` : `assign-select-empty`}
            value={selectedId}
            onValueChange={(val) => setSelectedId(val ?? "none")}
            disabled={usersLoading || isAssigning}
          >
            <SelectTrigger className="w-full">
              {usersLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando usuarios...</span>
                </div>
              ) : (
                <SelectValue placeholder="Seleccionar un usuario" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin usuario asignado</SelectItem>
              {users.map((u) => {
                const name = [u.user?.firstName, u.user?.lastName].filter(Boolean).join(" ")
                const label = name ? `${name} (${u.user?.email})` : u.user?.email
                return (
                  <SelectItem key={u.id} value={u.userId}>
                    {label || "Usuario Desconocido"}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border/40 pt-4 flex flex-row items-center justify-end mt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isAssigning}
            className="px-4 py-2 hover:bg-muted/50 rounded-lg text-sm border-border/80"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isAssigning}
            onClick={() => onAssign(selectedId === "none" ? null : selectedId)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center gap-1.5"
          >
            {isAssigning && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar Asignación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
