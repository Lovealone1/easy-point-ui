// ─────────────────────────────────────────────────────────────────────────────
// features/plans/components/plans-detail-modal.tsx
//
// Read-only modal displaying detailed information about a pricing Plan,
// including prices, currency, active status, and custom JSON metadata.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import {
  Calendar,
  FileText,
  Copy,
  Check,
  Award,
  DollarSign,
  Clock,
  Code2,
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
import type { Plan } from "../types/plans.types"

interface PlansDetailModalProps {
  isOpen: boolean
  onClose: () => void
  record: Plan | null
}

export function PlansDetailModal({
  isOpen,
  onClose,
  record,
}: PlansDetailModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!record) return null

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

  const formatCurrency = (value: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: currencyCode || "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)
    } catch {
      return `${currencyCode} ${value}`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            Detalles del Plan de Precios
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/80">
            Vista detallada del plan seleccionado y su configuración en el sistema.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-5 text-left">
          {/* Plan Base Info */}
          <div className="flex items-start gap-4 p-4 border border-border/40 rounded-xl bg-muted/5">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0 mt-0.5">
              <Award className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-foreground truncate">{record.name}</h4>
                {record.isActive ? (
                  <span className="inline-flex items-center text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {record.description || <span className="italic text-muted-foreground/50">Sin descripción</span>}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Precio Mensual */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Precio Mensual
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5">
                  {formatCurrency(record.monthlyPrice, record.currency)}
                </span>
              </div>
            </div>

            {/* Precio Anual */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Precio Anual
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5">
                  {formatCurrency(record.yearlyPrice, record.currency)}
                </span>
              </div>
            </div>

            {/* Moneda */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Moneda
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5">
                  {record.currency}
                </span>
              </div>
            </div>

            {/* ID del Plan */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  ID del Plan
                </span>
                <span className="text-xs font-mono font-semibold text-foreground truncate mt-0.5">
                  {record.id}
                </span>
              </div>
              <button
                onClick={() => handleCopy(record.id, "ID")}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copiar ID"
              >
                {copiedField === "ID" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-muted/10">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-brand-500" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Metadatos Adicionales (JSON)
              </span>
            </div>
            <div className="mt-1">
              {record.metadata ? (
                <pre className="text-[10px] font-mono p-3 bg-card border border-border/40 rounded-lg max-h-[150px] overflow-y-auto leading-relaxed text-foreground/95 no-scrollbar">
                  {JSON.stringify(record.metadata, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic pl-6 border-l border-border/80">
                  Sin metadatos definidos.
                </p>
              )}
            </div>
          </div>

          {/* Change Logs Timestamps */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Registro de Cambios
            </span>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
              <span>Creado el:</span>
              <span className="font-medium text-foreground ml-auto">
                {formatDate(record.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground border-t border-border/25 pt-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground/75" />
              <span>Actualizado el:</span>
              <span className="font-medium text-foreground ml-auto">
                {formatDate(record.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-lg text-xs">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
