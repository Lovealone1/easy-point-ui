"use client"

import * as React from "react"
import { useProducts } from "@/features/products/hooks/use-products"
import { useCreateProductStock } from "../hooks/use-product-stocks"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

interface InitializeStockModalProps {
  isOpen: boolean
  onClose: () => void
  existingProductIds: string[]
}

export function InitializeStockModal({
  isOpen,
  onClose,
  existingProductIds,
}: InitializeStockModalProps) {
  const createStockMutation = useCreateProductStock()

  const [productId, setProductId] = React.useState("")
  const [minQuantity, setMinQuantity] = React.useState("0")
  const [location, setLocation] = React.useState("Principal")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Fetch all active products (limit 100)
  const { data: productsResponse, isLoading: isProductsLoading } = useProducts({ limit: 100, isActive: true })
  const products = productsResponse?.data || []

  // Filter out products that already have a stock record
  const availableProducts = React.useMemo(() => {
    return products.filter((p) => !existingProductIds.includes(p.id))
  }, [products, existingProductIds])

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setProductId("")
      setMinQuantity("0")
      setLocation("Principal")
      setErrors({})
    }
  }, [isOpen])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!productId) {
      newErrors.productId = "El producto es obligatorio"
    }
    if (!minQuantity || isNaN(Number(minQuantity)) || Number(minQuantity) < 0) {
      newErrors.minQuantity = "La cantidad mínima debe ser 0 o superior"
    }
    if (!location.trim()) {
      newErrors.location = "La ubicación es obligatoria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    createStockMutation.mutate(
      {
        productId,
        location: location.trim(),
        minQuantity: Number(minQuantity),
      },
      {
        onSuccess: () => {
          toast.success("Stock inicializado con éxito")
          onClose()
        },
        onError: (err) => {
          toast.error("Error al inicializar el stock", {
            description: err instanceof Error ? err.message : "Intente nuevamente.",
          })
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-6 gap-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-semibold text-foreground">
            Inicializar Stock
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Crea un registro de stock con cantidad inicial 0 para productos con datos deprecados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Product selection */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-product" className="text-xs font-bold text-muted-foreground/90">
                Producto <span className="text-destructive font-bold">*</span>
              </Label>
              {isProductsLoading ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
              ) : availableProducts.length === 0 ? (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  No hay productos activos sin stock configurado actualmente.
                </div>
              ) : (
                <>
                  <Select value={productId} onValueChange={(val) => {
                    setProductId(val || "")
                    if (errors.productId) setErrors((prev) => ({ ...prev, productId: "" }))
                  }}>
                    <SelectTrigger
                      id="stock-product"
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground"
                    >
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                      {availableProducts.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="rounded-lg text-xs py-2 cursor-pointer"
                        >
                          {p.name} {p.sku ? `(SKU: ${p.sku})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.productId && (
                    <span className="text-xs text-destructive mt-0.5">{errors.productId}</span>
                  )}
                </>
              )}
            </div>

            {/* Location (Principal by default) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-location" className="text-xs font-bold text-muted-foreground/90">
                Ubicación <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="stock-location"
                placeholder="Ej. Principal, Bodega B"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  if (errors.location) setErrors((prev) => ({ ...prev, location: "" }))
                }}
                aria-invalid={!!errors.location}
              />
              {errors.location && (
                <span className="text-xs text-destructive mt-0.5">{errors.location}</span>
              )}
            </div>

            {/* Min Quantity */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock-min" className="text-xs font-bold text-muted-foreground/90">
                Cantidad Mínima <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="stock-min"
                type="number"
                min="0"
                placeholder="Ej. 5"
                value={minQuantity}
                onChange={(e) => {
                  setMinQuantity(e.target.value)
                  if (errors.minQuantity) setErrors((prev) => ({ ...prev, minQuantity: "" }))
                }}
                aria-invalid={!!errors.minQuantity}
              />
              {errors.minQuantity && (
                <span className="text-xs text-destructive mt-0.5">{errors.minQuantity}</span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createStockMutation.isPending}
              className="px-4 py-2 hover:bg-muted/50 rounded-lg text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createStockMutation.isPending || !productId || availableProducts.length === 0}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
            >
              {createStockMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Inicializar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
