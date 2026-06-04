"use client"

import * as React from "react"
import {
  Calendar,
  Copy,
  Check,
  Hash,
  Clock,
  Award,
  DollarSign,
  ArrowRight,
  Bookmark,
  Activity,
  FileText,
  User,
  CreditCard,
  Layers,
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
import type { FinancialTransaction } from "../types/financial-transactions.types"
import {
  TRANSACTION_TYPE_LABELS,
  OPERATION_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "../types/financial-transactions.types"

interface Props {
  isOpen: boolean
  onClose: () => void
  transaction: FinancialTransaction | null
}

export function FinancialTransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: Props) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!transaction) return null

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

  const isCredit = transaction.type === "CREDIT"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1">
          <div className="flex flex-col border-b border-border/30 pb-3 pr-8">
            <div className="flex flex-col min-w-0">
              <DialogTitle className="text-lg font-heading font-bold text-foreground leading-tight flex flex-wrap items-center gap-2 truncate">
                <Hash className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                <span className="truncate">{transaction.transactionNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/90 mt-0.5">
                Número único de registro de transacción.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Transaction Details */}
        <div className="space-y-5">
          {/* Main Financial stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Monto */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 bg-muted/10 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                Monto
              </span>
              <div className="flex items-center gap-1 font-mono font-bold text-base">
                <DollarSign className={`h-4.5 w-4.5 shrink-0 ${isCredit ? "text-emerald-500" : "text-rose-500"}`} />
                <span className={isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            {/* Saldo Anterior */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                Saldo Anterior
              </span>
              <span className="text-xs font-mono font-semibold text-foreground/80">
                {formatCurrency(transaction.balanceBefore)}
              </span>
            </div>

            {/* Saldo Posterior */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                Saldo Posterior
              </span>
              <span className="text-xs font-mono font-semibold text-foreground">
                {formatCurrency(transaction.balanceAfter)}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cuenta Bancaria */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                <Bookmark className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Cuenta Bancaria
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {transaction.bankAccountName || "Sin cuenta registrada"}
                </span>
              </div>
            </div>

            {/* Tipo de Operación */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Tipo de Operación
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {OPERATION_TYPE_LABELS[transaction.operationType] || transaction.operationType}
                </span>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Método de Pago
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5 truncate">
                  {transaction.paymentMethod ? (PAYMENT_METHOD_LABELS[transaction.paymentMethod] || transaction.paymentMethod) : "No especificado"}
                </span>
              </div>
            </div>

            {/* Registrado por */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
              <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Registrado por
                </span>
                <span className="text-xs font-mono font-semibold text-foreground mt-0.5 truncate">
                  {transaction.performedByUserEmail || "Sistema / Automatizado"}
                </span>
              </div>
            </div>

            {/* Referencia (Si existe) */}
            {transaction.referenceId && (
              <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Referencia de Operación
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-foreground/80 truncate">
                    {transaction.referenceType || "DOCUMENTO"}: {transaction.referenceId}
                  </span>
                  <button
                    onClick={() => handleCopy(transaction.referenceId!, "ID Referencia")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    title="Copiar ID de Referencia"
                  >
                    {copiedField === "ID Referencia" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ID Interno de Transacción */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
              <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  ID Interno de Transacción
                </span>
                <div className="flex items-center gap-2 mt-0.5 min-w-0 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-foreground truncate">
                    {transaction.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border select-none shrink-0 ${
                      isCredit
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {TRANSACTION_TYPE_LABELS[transaction.type] || transaction.type}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                    {transaction.categoryName || "Sin categoría"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(transaction.id, "ID Transacción")}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1 shrink-0"
                title="Copiar ID Interno"
              >
                {copiedField === "ID Transacción" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Descripción */}
          {transaction.description && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Descripción
              </span>
              <p className="text-xs font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {transaction.description}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Registro del Sistema
            </span>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
              <span>Fecha de Registro:</span>
              <span className="font-medium text-foreground ml-auto">
                {formatDate(transaction.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
