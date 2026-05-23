"use client"

import * as React from "react"
import {
  Calendar,
  FileText,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  Hash,
  Clock,
  Award,
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
import type { Supplier } from "../types/suppliers.types"

interface SupplierDetailModalProps {
  isOpen: boolean
  onClose: () => void
  supplier: Supplier | null
}

export function SupplierDetailModal({
  isOpen,
  onClose,
  supplier,
}: SupplierDetailModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!supplier) return null

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-bold text-foreground leading-tight">
            {supplier.name}
          </DialogTitle>
          <DialogDescription className="text-sm font-mono text-muted-foreground/90 mt-1">
            RUT: {supplier.taxId}
          </DialogDescription>
        </DialogHeader>

        {/* Supplier Details */}
        <div className="space-y-4 sm:space-y-5">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                supplier.isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
              }`}
            >
              {supplier.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tax ID */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  RUT / Tax ID
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold truncate text-foreground">
                  {supplier.taxId}
                </span>
                <button
                  onClick={() => handleCopy(supplier.taxId, "RUT")}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Copiar RUT"
                >
                  {copiedField === "RUT" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Tiempo de Entrega */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Tiempo de Entrega
                </span>
                <span className="text-xs font-semibold text-foreground mt-0.5">
                  {supplier.leadTime} {supplier.leadTime === 1 ? "día" : "días"}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Email
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate text-foreground">
                  {supplier.email || "Sin email"}
                </span>
                {supplier.email && (
                  <button
                    onClick={() => handleCopy(supplier.email!, "Email")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar email"
                  >
                    {copiedField === "Email" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Teléfono
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate text-foreground">
                  {supplier.phone || "Sin teléfono"}
                </span>
                {supplier.phone && (
                  <button
                    onClick={() => handleCopy(supplier.phone!, "Teléfono")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar teléfono"
                  >
                    {copiedField === "Teléfono" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Internal ID */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  ID Proveedor
                </span>
                <span className="text-xs font-mono font-semibold text-foreground truncate mt-0.5">
                  {supplier.id}
                </span>
              </div>
            </div>
          </div>

          {/* Address */}
          {supplier.address && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Dirección
                </span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed pl-5.5">
                {supplier.address}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Registro de Cambios
            </span>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
              <span>Creado el:</span>
              <span className="font-medium text-foreground ml-auto">
                {formatDate(supplier.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground border-t border-border/25 pt-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground/75" />
              <span>Actualizado el:</span>
              <span className="font-medium text-foreground ml-auto">
                {formatDate(supplier.updatedAt)}
              </span>
            </div>
          </div>

          {/* Notes Callout */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-muted/10">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-500" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Notas Administrativas
              </span>
            </div>
            <p className="text-xs text-foreground/90 italic leading-relaxed pl-6 border-l border-border/80">
              {supplier.notes || "No hay notas ingresadas para este proveedor."}
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
