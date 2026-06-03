"use client"

import * as React from "react"
import { useUpdateSupplyStock } from "../hooks/use-supply-stocks"
import { useSupply } from "@/features/supplies/hooks/use-supplies"
import type { SupplyStock } from "../types/supply-stocks.types"
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

interface EditSupplyMinQuantityModalProps {
  isOpen: boolean
  onClose: () => void
  stock: SupplyStock | null
}

export function EditSupplyMinQuantityModal({
  isOpen,
  onClose,
  stock,
}: EditSupplyMinQuantityModalProps) {
  const updateStockMutation = useUpdateSupplyStock()
  const { data: supply } = useSupply(stock?.supplyId || "")

  const [minQuantity, setMinQuantity] = React.useState("")
  const [error, setError] = React.useState("")

  // Set initial value when stock is loaded/modal is opened
  React.useEffect(() => {
    if (isOpen && stock) {
      setMinQuantity(String(stock.minQuantity))
      setError("")
    }
  }, [isOpen, stock])

  const validate = () => {
    if (!minQuantity || isNaN(Number(minQuantity)) || Number(minQuantity) < 0) {
      setError("La cantidad mínima debe ser un número igual o mayor a 0")
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !stock) return

    updateStockMutation.mutate(
      {
        id: stock.id,
        payload: {
          minQuantity: Number(minQuantity),
        },
      },
      {
        onSuccess: () => {
          toast.success("Cantidad mínima actualizada con éxito")
          onClose()
        },
        onError: (err) => {
          toast.error("Error al actualizar la cantidad mínima", {
            description: err instanceof Error ? err.message : "Intente de nuevo.",
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
            Ajustar Mínimo de Stock
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {supply ? `Modifica la alerta de stock mínimo para: ${supply.name}` : "Modifica el valor límite para alertas de stock."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-supply-stock-min" className="text-xs font-bold text-muted-foreground/90">
                Cantidad Mínima Requerida <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="edit-supply-stock-min"
                type="number"
                min="0"
                placeholder="Ej. 10"
                value={minQuantity}
                onChange={(e) => {
                  setMinQuantity(e.target.value)
                  if (error) setError("")
                }}
                aria-invalid={!!error}
              />
              {error && (
                <span className="text-xs text-destructive mt-0.5">{error}</span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateStockMutation.isPending}
              className="px-4 py-2 hover:bg-muted/50 rounded-lg text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateStockMutation.isPending}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
            >
              {updateStockMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
