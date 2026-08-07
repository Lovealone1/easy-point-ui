// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/components/payment-card-form-modal.tsx
//
// Create/edit a payment card. The statement day matters beyond bookkeeping:
// every subscription on this card inherits it as its billing cutoff unless it
// sets its own.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Loader2, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Switch } from "@/shared/components/ui/switch"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select"
import { apiErrorMessage } from "@/shared/utils/api-message"
import { useCreatePaymentCard, useUpdatePaymentCard } from "../hooks/use-personal-catalog"
import { CARD_BRAND_LABELS, type CardBrand } from "../services/payment-cards.service"
import type { UserPaymentCard } from "../types/user-subscriptions.types"

const DEFAULT_COLOR = "#6366F1"

const COLOR_PRESETS = [
  "#6366F1", "#8A05BE", "#E50914", "#059669",
  "#F59E0B", "#0EA5E9", "#EC4899", "#1F2937",
]

const BRANDS = Object.keys(CARD_BRAND_LABELS) as CardBrand[]

interface PaymentCardFormModalProps {
  isOpen: boolean
  onClose: () => void
  card?: UserPaymentCard | null
}

export function PaymentCardFormModal({ isOpen, onClose, card }: PaymentCardFormModalProps) {
  const isEditing = !!card

  const createMutation = useCreatePaymentCard()
  const updateMutation = useUpdatePaymentCard()

  const [label, setLabel] = React.useState("")
  const [brand, setBrand] = React.useState<CardBrand>("VISA")
  const [color, setColor] = React.useState(DEFAULT_COLOR)
  const [lastFourDigits, setLastFourDigits] = React.useState("")
  const [statementDay, setStatementDay] = React.useState("")
  const [paymentDueDay, setPaymentDueDay] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(false)

  // Seeded during render, not in an effect — the repo lints against
  // setState-in-effect and an effect would paint one stale frame.
  const hydrationKey = isOpen ? (card?.id ?? "new") : null
  const [hydratedKey, setHydratedKey] = React.useState<string | null>(null)

  if (hydrationKey !== null && hydrationKey !== hydratedKey) {
    setHydratedKey(hydrationKey)
    setLabel(card?.label ?? "")
    setBrand((card?.brand as CardBrand) ?? "VISA")
    setColor(card?.color ?? DEFAULT_COLOR)
    setLastFourDigits(card?.lastFourDigits ?? "")
    setStatementDay(card?.statementDay?.toString() ?? "")
    setPaymentDueDay(card?.paymentDueDay?.toString() ?? "")
    setIsDefault(card?.isDefault ?? false)
  }

  if (hydrationKey === null && hydratedKey !== null) {
    setHydratedKey(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!label.trim()) {
      toast.error("Ponle un nombre a la tarjeta")
      return
    }

    const payload = {
      label: label.trim(),
      brand,
      color,
      lastFourDigits: lastFourDigits.trim() || undefined,
      statementDay: statementDay ? Number(statementDay) : undefined,
      paymentDueDay: paymentDueDay ? Number(paymentDueDay) : undefined,
      isDefault,
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: card!.id, payload })
        toast.success("Tarjeta actualizada")
      } else {
        await createMutation.mutateAsync(payload)
        toast.success("Tarjeta creada")
      }
      onClose()
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo guardar la tarjeta."))
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl p-5 sm:p-7 gap-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {isEditing ? "Editar tarjeta" : "Nueva tarjeta"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            No guardamos números de tarjeta: solo lo necesario para organizar tus cobros.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div
            className="rounded-xl p-4 text-white flex flex-col justify-between h-24"
            style={{ backgroundColor: color }}
          >
            <div className="flex items-start justify-between">
              <CreditCard className="w-5 h-5 opacity-80" />
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                {CARD_BRAND_LABELS[brand]}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold truncate">{label.trim() || "Mi tarjeta"}</span>
              {lastFourDigits && (
                <span className="text-xs font-mono opacity-90">••••{lastFourDigits}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nubank, Bancolombia..."
                className="h-11 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Franquicia</label>
              {/* `items` is what the closed trigger reads its label from. */}
              <Select
                items={CARD_BRAND_LABELS}
                value={brand}
                onValueChange={(value) => setBrand(String(value) as CardBrand)}
              >
                <SelectTrigger className="w-full h-11 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {CARD_BRAND_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Últimos 4 dígitos</label>
              <Input
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                inputMode="numeric"
                className="h-11 bg-background font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Día de corte</label>
              <Input
                type="number"
                min={1}
                max={31}
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
                placeholder="15"
                className="h-11 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Día de pago</label>
              <Input
                type="number"
                min={1}
                max={31}
                value={paymentDueDay}
                onChange={(e) => setPaymentDueDay(e.target.value)}
                placeholder="5"
                className="h-11 bg-background"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground -mt-2">
            Tus suscripciones en esta tarjeta heredan el día de corte, salvo que definan uno propio.
          </p>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  style={{ backgroundColor: preset }}
                  className={cn(
                    "w-8 h-8 rounded-md border-2 transition-transform active:scale-95",
                    color.toLowerCase() === preset.toLowerCase()
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 p-3 rounded-md border border-border/50 bg-background cursor-pointer">
            <div>
              <p className="text-sm font-medium text-foreground">Tarjeta predeterminada</p>
              <p className="text-xs text-muted-foreground">
                Se preselecciona al registrar una suscripción.
              </p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </label>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="sm:ml-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Crear tarjeta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
