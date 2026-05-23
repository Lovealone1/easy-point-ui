"use client"

import * as React from "react"
import { 
  Calendar, 
  Tag, 
  FileText, 
  Copy, 
  Check, 
  Barcode as BarcodeIcon, 
  ShoppingBag, 
  Award, 
  Clock,
  CircleDot
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
import type { Product } from "../types/products.types"

interface ProductDetailModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
}: ProductDetailModalProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  if (!product) return null

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`${fieldName} copiado al portapapeles`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-"
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr))
    } catch (e) {
      return dateStr
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-bold text-foreground leading-tight">
            {product.name}
          </DialogTitle>
          {product.description && (
            <DialogDescription className="text-sm text-muted-foreground/90 mt-1">
              {product.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Product Details Grid */}
        <div className="space-y-4 sm:space-y-5">
          {/* Prices Section */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-muted/20 p-4 rounded-lg border border-border/30">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Precio Venta</span>
              <p className="text-xl font-mono font-bold text-brand-500 dark:text-brand-400 mt-0.5">
                {formatCurrency(product.salePrice)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Precio Costo</span>
              <p className="text-xl font-mono font-semibold text-muted-foreground mt-0.5">
                {formatCurrency(product.costPrice)}
              </p>
            </div>
          </div>

          {/* Identifiers and Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* SKU */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Código SKU</span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="font-mono text-sm font-semibold truncate text-foreground">
                  {product.sku || "Sin SKU"}
                </span>
                {product.sku && (
                  <button
                    onClick={() => handleCopy(product.sku!, "SKU")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar SKU"
                  >
                    {copiedField === "SKU" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Barcode */}
            <div className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Código de Barras</span>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="font-mono text-sm font-semibold truncate text-foreground">
                  {product.barcode || "Sin Código"}
                </span>
                {product.barcode && (
                  <button
                    onClick={() => handleCopy(product.barcode!, "Código de barras")}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copiar código de barras"
                  >
                    {copiedField === "Código de barras" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Tipo de Producto (isPurchased) */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Origen / Compra</span>
                <span className="text-xs font-semibold text-foreground mt-0.5">
                  {product.isPurchased ? "Comprado para Reventa" : "Elaboración Propia"}
                </span>
              </div>
            </div>

            {/* ID Interno */}
            <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3 bg-card shadow-2xs">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">ID Producto</span>
                <span className="text-xs font-mono font-semibold text-foreground truncate mt-0.5">
                  {product.id}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-card shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Registro de Cambios</span>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
              <span>Creado el:</span>
              <span className="font-medium text-foreground ml-auto">{formatDate(product.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground border-t border-border/25 pt-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground/75" />
              <span>Actualizado el:</span>
              <span className="font-medium text-foreground ml-auto">{formatDate(product.updatedAt)}</span>
            </div>
          </div>

          {/* Notes Callout */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3.5 bg-muted/10">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-500" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Notas Administrativas</span>
            </div>
            <p className="text-xs text-foreground/90 italic leading-relaxed pl-6 border-l border-border/80">
              {product.notes || "No hay notas ingresadas para este producto."}
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
