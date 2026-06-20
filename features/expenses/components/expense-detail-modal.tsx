"use client"

import * as React from "react"
import {
  Calendar,
  Copy,
  Check,
  Hash,
  DollarSign,
  Bookmark,
  Activity,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog"
import type { Expense } from "../types/expenses.types"

interface Props {
  isOpen: boolean
  onClose: () => void
  expense: Expense | null
  categoryName?: string
  bankAccountName?: string
}

export function ExpenseDetailModal({
  isOpen,
  onClose,
  expense,
  categoryName,
  bankAccountName,
}: Props) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!expense) return null

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`${fieldName} copiado al portapapeles`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1">
          <div className="flex flex-col border-b border-border/30 pb-3 pr-8">
            <div className="flex flex-col min-w-0">
              <DialogTitle className="text-lg font-heading font-bold text-foreground leading-tight flex flex-wrap items-center gap-2 truncate">
                <Hash className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span className="truncate">Gasto: {expense.id.substring(0, 8)}...</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/90 mt-0.5">
                Detalles del gasto registrado en el sistema.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Expense Details */}
        <div className="space-y-5">
          {/* Main Financial stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Monto */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 bg-muted/10 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                Monto
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-base">
                <DollarSign className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                <span className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(Number(expense.amount))}
                </span>
              </div>
            </div>

            {/* Fecha */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                Fecha de Registro
              </span>
              <span className="text-xs font-semibold text-foreground/80">
                {formatDate(expense.createdAt)}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cuenta Bancaria */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                <Bookmark className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Cuenta Bancaria
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {bankAccountName || "Sin cuenta registrada"}
                </span>
              </div>
            </div>

            {/* Categoría de Gasto */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Categoría
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {categoryName || "Sin categoría"}
                </span>
              </div>
            </div>

            {/* Transacción Financiera Relacionada */}
            {expense.transactionId && (
              <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Transacción Financiera Relacionada
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-foreground/80 truncate">
                    ID: {expense.transactionId}
                  </span>
                  <button
                    onClick={() => handleCopy(expense.transactionId!, "ID Transacción")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    title="Copiar ID Transacción"
                  >
                    {copiedField === "ID Transacción" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ID Interno de Gasto */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
              <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 shrink-0">
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  ID Interno del Gasto
                </span>
                <span className="text-xs font-mono font-semibold text-foreground mt-0.5 truncate">
                  {expense.id}
                </span>
              </div>
              <button
                onClick={() => handleCopy(expense.id, "ID Gasto")}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1 shrink-0"
                title="Copiar ID de Gasto"
              >
                {copiedField === "ID Gasto" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Descripción */}
          {expense.description && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Descripción
              </span>
              <p className="text-xs font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {expense.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
