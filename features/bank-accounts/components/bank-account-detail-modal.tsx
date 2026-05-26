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
  QrCode,
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
import type { BankAccount } from "../types/bank-accounts.types"
import { BANK_ACCOUNT_STATUS_LABELS } from "../types/bank-accounts.types"

interface Props {
  isOpen: boolean
  onClose: () => void
  account: BankAccount | null
}

export function BankAccountDetailModal({
  isOpen,
  onClose,
  account,
}: Props) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!account) return null

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

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency || "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-bold text-foreground leading-tight">
            {account.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground/90 mt-1">
            Detalles de la cuenta bancaria de la organización.
          </DialogDescription>
        </DialogHeader>

        {/* Account Details */}
        <div className="space-y-4 sm:space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                account.status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : account.status === "FROZEN"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
              }`}
            >
              {BANK_ACCOUNT_STATUS_LABELS[account.status] || account.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Saldo actual */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Saldo Disponible
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5 font-mono">
                  {formatCurrency(account.balance, account.currency)}
                </span>
              </div>
            </div>

            {/* Divisa */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Moneda / Divisa
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5 font-mono">
                  {account.currency}
                </span>
              </div>
            </div>

            {/* Número de Cuenta */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Número de Cuenta
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate text-foreground font-mono">
                  {account.accountNumber || "Sin número registrado"}
                </span>
                {account.accountNumber && (
                  <button
                    onClick={() => handleCopy(account.accountNumber!, "N° Cuenta")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar número de cuenta"
                  >
                    {copiedField === "N° Cuenta" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Internal ID */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs sm:col-span-2">
              <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  ID de Cuenta
                </span>
                <span className="text-xs font-mono font-semibold text-foreground truncate mt-0.5">
                  {account.id}
                </span>
              </div>
              <button
                onClick={() => handleCopy(account.id, "ID")}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
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

          {/* Timestamps */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Registro de Cambios
            </span>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
              <span>Creado el:</span>
              <span className="font-medium text-foreground ml-auto">
                {formatDate(account.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground border-t border-border/25 pt-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground/75" />
              <span>Actualizado el:</span>
              <span className="font-medium text-foreground ml-auto">
                {formatDate(account.updatedAt)}
              </span>
            </div>
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
