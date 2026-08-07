// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/personal/payment-methods/page.tsx
//
// The cards subscriptions are charged to. Each card's statement day is what its
// subscriptions inherit as their billing cutoff.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { CreditCard, Pencil, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { PageLoader } from "@/shared/components/ui/spinner"
import { PaymentCardFormModal } from "@/features/user-subscriptions/components/payment-card-form-modal"
import {
  usePaymentCardsList,
  useDeletePaymentCard,
} from "@/features/user-subscriptions/hooks/use-personal-catalog"
import { CARD_BRAND_LABELS, type CardBrand } from "@/features/user-subscriptions/services/payment-cards.service"
import { formatCurrency } from "@/shared/utils/format-currency"
import { apiErrorMessage } from "@/shared/utils/api-message"
import type { UserPaymentCard } from "@/features/user-subscriptions/types/user-subscriptions.types"

export default function PaymentMethodsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<UserPaymentCard | null>(null)
  const [deleting, setDeleting] = React.useState<UserPaymentCard | null>(null)

  const { data: cards, isLoading } = usePaymentCardsList()
  const deleteMutation = useDeletePaymentCard()

  function openCreate() {
    setEditing(null)
    setIsFormOpen(true)
  }

  async function handleDelete() {
    if (!deleting) return

    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success("Tarjeta eliminada")
      setDeleting(null)
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo eliminar la tarjeta."))
    }
  }

  if (isLoading) {
    return <PageLoader label="Cargando tus tarjetas..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Métodos de pago</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra tus tarjetas para saber qué se cobra en cada una y cuándo cierra su corte.
        </p>
      </div>

      <DataTableToolbar
        actionSection={
          <DataTableAction actionType="create" label="Nueva tarjeta" onClick={openCreate} />
        }
      />

      {(cards?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-10 text-center">
          <CreditCard className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-1">
            Aún no registras tarjetas
          </h2>
          <p className="text-sm text-muted-foreground">
            Agrega una para asociarla a tus suscripciones y seguir su ciclo de corte.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards!.map((card) => (
            <PaymentCardTile
              key={card.id}
              card={card}
              onEdit={() => {
                setEditing(card)
                setIsFormOpen(true)
              }}
              onDelete={() => setDeleting(card)}
            />
          ))}
        </div>
      )}

      <PaymentCardFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        card={editing}
      />

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar tarjeta"
        description={
          deleting
            ? `¿Seguro que quieres eliminar "${deleting.label}"? Las suscripciones asociadas quedarán sin tarjeta.`
            : ""
        }
        confirmLabel="Eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}

function PaymentCardTile({
  card,
  onEdit,
  onDelete,
}: {
  card: UserPaymentCard
  onEdit: () => void
  onDelete: () => void
}) {
  // The list endpoint enriches each card with its own subscription roll-up.
  const enriched = card as UserPaymentCard & {
    subscriptionCount?: number
    monthlyTotal?: string
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="p-4 text-white h-24 flex flex-col justify-between" style={{ backgroundColor: card.color }}>
        <div className="flex items-start justify-between">
          <CreditCard className="w-5 h-5 opacity-80" />
          <div className="flex items-center gap-2">
            {card.isDefault && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5" />
                Predeterminada
              </span>
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
              {CARD_BRAND_LABELS[card.brand as CardBrand] ?? card.brand}
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-sm font-semibold truncate">{card.label}</span>
          {card.lastFourDigits && (
            <span className="text-xs font-mono opacity-90">••••{card.lastFourDigits}</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Día de corte</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {card.statementDay ? `Día ${card.statementDay}` : "Sin configurar"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Día de pago</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {card.paymentDueDay ? `Día ${card.paymentDueDay}` : "Sin configurar"}
            </dd>
          </div>
          {enriched.subscriptionCount !== undefined && (
            <div>
              <dt className="text-muted-foreground">Suscripciones</dt>
              <dd className="font-medium text-foreground mt-0.5">{enriched.subscriptionCount}</dd>
            </div>
          )}
          {enriched.monthlyTotal !== undefined && (
            <div>
              <dt className="text-muted-foreground">Gasto mensual</dt>
              <dd className="font-medium text-foreground mt-0.5">
                {formatCurrency(enriched.monthlyTotal)}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={onEdit} title="Editar" className="h-8 w-8 p-0">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Eliminar"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
