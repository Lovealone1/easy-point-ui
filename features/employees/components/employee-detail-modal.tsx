"use client"

import * as React from "react"
import {
  Calendar,
  FileText,
  Copy,
  Check,
  Phone,
  Mail,
  Clock,
  UserRound,
  Briefcase,
  DollarSign,
  Link,
  Link2Off,
  Hash,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import type { Employee, EmployeeStatus } from "../types/employees.types"

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<EmployeeStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Activo",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  INACTIVE: {
    label: "Inactivo",
    className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
  ON_LEAVE: {
    label: "En Licencia",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  TERMINATED: {
    label: "Terminado",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
}

interface EmployeeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
  onAssignUser?: () => void
}

export function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  onAssignUser,
}: EmployeeDetailModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!employee) return null

  const statusCfg = STATUS_CONFIG[employee.status] ?? STATUS_CONFIG.INACTIVE

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`${fieldName} copiado al portapapeles`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const formatHireDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const fullName = `${employee.firstName} ${employee.lastName}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">

        {/* ── Header: name + status badge ── */}
        <DialogHeader className="flex flex-row items-start justify-between gap-4 pr-10">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-xl font-heading font-bold text-foreground leading-tight">
              {fullName}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground/90 mt-1">
              {employee.position}
            </DialogDescription>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
        </DialogHeader>

        {/* ── Details ── */}
        <div className="space-y-4 sm:space-y-5">

          {/* Contact info grid — 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

            {/* Email */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate text-foreground">
                  {employee.email || "Sin email"}
                </span>
                {employee.email && (
                  <button
                    onClick={() => handleCopy(employee.email!, "Email")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar email"
                  >
                    {copiedField === "Email" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Teléfono</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate text-foreground">
                  {employee.phone || "Sin teléfono"}
                </span>
                {employee.phone && (
                  <button
                    onClick={() => handleCopy(employee.phone!, "Teléfono")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar teléfono"
                  >
                    {copiedField === "Teléfono" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* TaxId / Cédula */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cédula / Tax ID</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono font-semibold truncate text-foreground">
                  {employee.taxId || "Sin documento"}
                </span>
                {employee.taxId && (
                  <button
                    onClick={() => handleCopy(employee.taxId!, "Cédula")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar cédula"
                  >
                    {copiedField === "Cédula" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Salary */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Salario</span>
                <span className="text-xs font-mono font-semibold text-foreground truncate mt-0.5">
                  {new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  }).format(employee.salary)}
                </span>
              </div>
            </div>

            {/* Position */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cargo</span>
                <span className="text-xs font-semibold text-foreground truncate mt-0.5">
                  {employee.position}
                </span>
              </div>
            </div>

            {/* Internal ID */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">ID Empleado</span>
                <span className="text-xs font-mono font-semibold text-foreground truncate mt-0.5">
                  {employee.id}
                </span>
              </div>
            </div>
          </div>

          {/* ── Hire date ── */}
          <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Fecha de Contratación</span>
              <span className="text-xs font-semibold text-foreground mt-0.5">
                {formatHireDate(employee.hireDate)}
              </span>
            </div>
          </div>

          {/* ── Linked user ── */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              {employee.user ? (
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500 shrink-0">
                  <Link className="h-4 w-4" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-muted/40 text-muted-foreground shrink-0">
                  <Link2Off className="h-4 w-4" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Usuario del Sistema</span>
                {employee.user ? (
                  <span className="text-xs font-semibold text-foreground truncate mt-0.5">
                    {[employee.user.firstName, employee.user.lastName].filter(Boolean).join(" ") || employee.user.email}
                    <span className="text-muted-foreground font-normal ml-1.5">· {employee.user.email}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic mt-0.5">Sin usuario asignado</span>
                )}
              </div>
            </div>
            {onAssignUser && (
              <button
                onClick={onAssignUser}
                className="text-xs font-semibold text-brand-500 hover:text-brand-600 underline underline-offset-2 shrink-0 transition-colors"
              >
                {employee.user ? "Cambiar" : "Asignar"}
              </button>
            )}
          </div>

          {/* ── Timestamps ── */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Registro de Cambios
            </span>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
              <span>Creado el:</span>
              <span className="font-medium text-foreground ml-auto">{formatDate(employee.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground border-t border-border/25 pt-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground/75" />
              <span>Actualizado el:</span>
              <span className="font-medium text-foreground ml-auto">{formatDate(employee.updatedAt)}</span>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-muted/10">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-500" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Notas Administrativas</span>
            </div>
            <p className="text-xs text-foreground/90 italic leading-relaxed pl-6 border-l border-border/80">
              {employee.notes || "No hay notas ingresadas para este empleado."}
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 hover:bg-muted/50 rounded-lg text-sm border-border/80"
          >
            Cerrar Detalles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
