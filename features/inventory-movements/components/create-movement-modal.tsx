"use client"

import * as React from "react"
import { useProducts } from "@/features/products/hooks/use-products"
import { useProductStocks } from "@/features/product-stocks/hooks/use-product-stocks"
import type { MovementType } from "../types/inventory-movements.types"
import {
  useCreateAdjustmentMovement,
  useCreateWasteMovement,
  useCreateTestsMovement,
  useCreateProductionMovement,
} from "../hooks/use-inventory-movements"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Loader2, AlertTriangle, Settings, Trash2, ShieldAlert, Hammer } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"

interface CreateMovementModalProps {
  isOpen: boolean
  onClose: () => void
  type: MovementType | null
}

const TYPE_CONFIG: Record<
  MovementType,
  { title: string; desc: string; icon: React.ElementType; colorClass: string; buttonBg: string; submitLabel: string }
> = {
  ADJUSTMENT: {
    title: "Registrar Ajuste de Stock",
    desc: "Corrige discrepancias entre el sistema y el inventario físico. Permite valores positivos (entrada) o negativos (salida).",
    icon: Settings,
    colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    buttonBg: "bg-amber-600 hover:bg-amber-700",
    submitLabel: "Guardar Ajuste",
  },
  WASTE: {
    title: "Registrar Merma / Gasto",
    desc: "Registra productos dañados, vencidos, robados o descartados. La cantidad debe ser positiva y disminuirá el stock actual.",
    icon: Trash2,
    colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    buttonBg: "bg-rose-600 hover:bg-rose-700",
    submitLabel: "Registrar Merma",
  },
  TESTS: {
    title: "Registrar Prueba / Test",
    desc: "Registra productos consumidos para pruebas de calidad, demostraciones o degustación. Disminuirá el stock actual.",
    icon: ShieldAlert,
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    buttonBg: "bg-indigo-600 hover:bg-indigo-700",
    submitLabel: "Registrar Test",
  },
  PRODUCTION: {
    title: "Registrar Producción Manual",
    desc: "Registra productos elaborados o ensamblados manualmente. La cantidad debe ser positiva e incrementará el stock actual.",
    icon: Hammer,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    buttonBg: "bg-purple-600 hover:bg-purple-700",
    submitLabel: "Registrar Producción",
  },
  SALE: {
    title: "",
    desc: "",
    icon: Settings,
    colorClass: "",
    buttonBg: "",
    submitLabel: "",
  },
  PURCHASE: {
    title: "",
    desc: "",
    icon: Settings,
    colorClass: "",
    buttonBg: "",
    submitLabel: "",
  },
}

export function CreateMovementModal({ isOpen, onClose, type }: CreateMovementModalProps) {
  const [productId, setProductId] = React.useState("")
  const [stockId, setStockId] = React.useState("")
  const [quantity, setQuantity] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Fetch active products
  const { data: productsRes, isLoading: loadingProducts } = useProducts({ limit: 100, isActive: true })
  
  // Fetch all stocks to find location records for products
  const { data: stocksRes, isLoading: loadingStocks } = useProductStocks({ limit: 100 })

  // Mutations
  const createAdjustment = useCreateAdjustmentMovement()
  const createWaste = useCreateWasteMovement()
  const createTests = useCreateTestsMovement()
  const createProduction = useCreateProductionMovement()

  // Reset fields when opening/closing or type changes
  React.useEffect(() => {
    if (isOpen) {
      setProductId("")
      setStockId("")
      setQuantity("")
      setReason("")
      setErrors({})
    }
  }, [isOpen, type])

  // Get active products
  const products = React.useMemo(() => {
    return productsRes?.data || []
  }, [productsRes])

  // Filter stock locations matching the selected product ID
  const availableStocks = React.useMemo(() => {
    if (!productId || !stocksRes?.data) return []
    return stocksRes.data.filter((s) => s.productId === productId)
  }, [productId, stocksRes])

  // Auto-select location if only one is available
  React.useEffect(() => {
    if (availableStocks.length === 1) {
      setStockId(availableStocks[0].id)
    } else {
      setStockId("")
    }
  }, [availableStocks])

  if (!type || !TYPE_CONFIG[type]) return null
  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  const mutation =
    type === "ADJUSTMENT"
      ? createAdjustment
      : type === "WASTE"
      ? createWaste
      : type === "TESTS"
      ? createTests
      : createProduction

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!productId) newErrors.productId = "Debe seleccionar un producto"
    if (!stockId) newErrors.stockId = "Debe seleccionar una ubicación de stock"
    
    const qtyVal = Number(quantity)
    if (!quantity || isNaN(qtyVal)) {
      newErrors.quantity = "Debe ingresar una cantidad numérica válida"
    } else {
      if (type !== "ADJUSTMENT") {
        if (qtyVal <= 0) {
          newErrors.quantity = "La cantidad debe ser mayor que 0"
        }
      } else {
        if (qtyVal === 0) {
          newErrors.quantity = "El ajuste no puede ser 0"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      productId,
      stockId,
      quantity: Number(quantity),
      reason: reason.trim() || undefined,
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Movimiento registrado con éxito")
        onClose()
      },
      onError: (err) => {
        toast.error("Error al registrar el movimiento", {
          description: err instanceof Error ? err.message : "Por favor, intente nuevamente.",
        })
      },
    })
  }

  const isLoading = loadingProducts || loadingStocks
  const isSubmitting = mutation.isPending
  const hasNoStockLocations = productId !== "" && availableStocks.length === 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl bg-card border border-border/40 shadow-xl p-5 sm:p-7 gap-5 duration-200">
        <DialogHeader className="gap-2 text-left">
          <div className={cn("flex items-center justify-center h-10 w-10 rounded-xl border shrink-0", config.colorClass)}>
            <Icon className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-lg font-heading font-bold text-foreground">
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-normal">
              {config.desc}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-1">
          {/* Product Select */}
          <div className="space-y-1.5">
            <Label htmlFor="productId" className="text-xs font-bold text-muted-foreground/90">
              Producto <span className="text-destructive font-bold">*</span>
            </Label>
            <Select value={productId} onValueChange={(val) => setProductId(val || "")} disabled={isLoading || isSubmitting}>
              <SelectTrigger id="productId" className="h-9 w-full bg-transparent text-xs text-foreground focus-visible:border-brand-500/50">
                <SelectValue placeholder="Selecciona un producto..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="rounded-lg text-xs py-1.5 focus:bg-primary/10 focus:text-primary cursor-pointer">
                    {p.name} {p.sku ? `(SKU: ${p.sku})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <span className="text-[10px] text-destructive font-semibold">{errors.productId}</span>}
          </div>

          {/* Location Select (conditional / dynamic options) */}
          {productId && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1.5 duration-200">
              <Label htmlFor="stockId" className="text-xs font-bold text-muted-foreground/90">
                Ubicación / Almacén <span className="text-destructive font-bold">*</span>
              </Label>
              {availableStocks.length === 0 ? (
                <div className="p-3 border border-dashed border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-700 dark:text-amber-400 rounded-xl flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <span>
                    Este producto no tiene existencias inicializadas. Ve al módulo de **Stock de Productos** e inicializa este producto en alguna ubicación antes de registrar movimientos.
                  </span>
                </div>
              ) : (
                <Select value={stockId} onValueChange={(val) => setStockId(val || "")} disabled={isSubmitting}>
                  <SelectTrigger id="stockId" className="h-9 w-full bg-transparent text-xs text-foreground focus-visible:border-brand-500/50">
                    <SelectValue placeholder="Selecciona ubicación de stock..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1 bg-popover border border-border/25 shadow-lg">
                    {availableStocks.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg text-xs py-1.5 focus:bg-primary/10 focus:text-primary cursor-pointer">
                        {s.location || "Principal"} (Stock actual: {Number(s.quantity)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.stockId && <span className="text-[10px] text-destructive font-semibold">{errors.stockId}</span>}
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <Label htmlFor="quantity" className="text-xs font-bold text-muted-foreground/90">
              Cantidad <span className="text-destructive font-bold">*</span>
            </Label>
            <Input
              id="quantity"
              type="text"
              placeholder={type === "ADJUSTMENT" ? "Ej: 15 o -10" : "Ej: 5"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isSubmitting || hasNoStockLocations}
              className="h-9 text-xs focus-visible:border-brand-500/50"
            />
            {errors.quantity && <span className="text-[10px] text-destructive font-semibold block">{errors.quantity}</span>}
            {type === "ADJUSTMENT" ? (
              <span className="text-[10px] text-muted-foreground/70 leading-normal block">
                Usa números positivos para entradas (suma) y negativos para salidas (resta).
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/70 leading-normal block">
                Ingresa una cantidad absoluta positiva. El sistema restará o sumará automáticamente según el tipo de movimiento.
              </span>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-bold text-muted-foreground/90">
              Motivo / Observaciones
            </Label>
            <Textarea
              id="reason"
              rows={2}
              placeholder="Detalle o justificación para este movimiento..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting || hasNoStockLocations}
              className="text-xs placeholder:text-muted-foreground/40 resize-none"
            />
          </div>

          <DialogFooter className="flex flex-row gap-2 pt-2 border-t border-border/15 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg text-xs font-semibold cursor-pointer h-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || hasNoStockLocations}
              className={cn("flex-1 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer h-8 transition-all active:scale-95", config.buttonBg)}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {config.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
