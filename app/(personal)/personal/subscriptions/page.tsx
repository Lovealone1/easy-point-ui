// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/personal/subscriptions/page.tsx
//
// The subscription register: what you pay and how often. The headline figures
// live on /personal/dashboard so they are not repeated here.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Pencil, Trash2, Pause, Play, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { SubscriptionFormModal } from "@/features/user-subscriptions/components/subscription-form-modal"
import { ProviderLogo, CustomServiceIcon } from "@/features/user-subscriptions/components/provider-picker"
import {
  useUserSubscriptions,
  useSubscriptionsSummary,
  useDeleteUserSubscription,
  useChangeUserSubscriptionStatus,
} from "@/features/user-subscriptions/hooks/use-user-subscriptions"
import { formatCurrency, formatApproximate } from "@/shared/utils/format-currency"
import {
  describeRecurrence,
  displayName,
  displayCategory,
  effectiveCutoffDay,
  USER_SUBSCRIPTION_STATUS_LABELS,
  type UserSubscription,
} from "@/features/user-subscriptions/types/user-subscriptions.types"

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PAUSED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border/40",
}

export default function UserSubscriptionsPage() {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<UserSubscription | null>(null)
  const [deleting, setDeleting] = React.useState<UserSubscription | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const { data: response, isLoading } = useUserSubscriptions({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  })
  const { data: summary } = useSubscriptionsSummary()

  const deleteMutation = useDeleteUserSubscription()
  const statusMutation = useChangeUserSubscriptionStatus()

  const preferredCurrency = summary?.preferredCurrency ?? "COP"
  const ratesUnavailable = summary?.rates.unavailable ?? false

  function openCreate() {
    setEditing(null)
    setIsFormOpen(true)
  }

  function openEdit(subscription: UserSubscription) {
    setEditing(subscription)
    setIsFormOpen(true)
  }

  async function handleToggleStatus(subscription: UserSubscription) {
    const next = subscription.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
    try {
      await statusMutation.mutateAsync({ id: subscription.id, status: next })
      toast.success(next === "PAUSED" ? "Suscripción pausada" : "Suscripción reactivada")
    } catch {
      toast.error("No se pudo cambiar el estado")
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success("Suscripción eliminada")
      setDeleting(null)
    } catch {
      toast.error("No se pudo eliminar la suscripción")
    }
  }

  const columns: ColumnDef<UserSubscription>[] = [
    {
      key: "name",
      header: "Servicio",
      render: (row) => {
        const category = displayCategory(row)
        return (
          <div className="flex items-center gap-3">
            {row.provider ? (
              <ProviderLogo provider={row.provider} size={28} />
            ) : row.customLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL
              <img src={row.customLogoUrl} alt="" className="w-7 h-7 rounded object-contain" />
            ) : (
              <CustomServiceIcon size={28} />
            )}
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{displayName(row)}</p>
              <p className="text-xs text-muted-foreground truncate">
                {category?.name ?? "Sin categoría"}
                {row.planLabel ? ` · ${row.planLabel}` : ""}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: "amount",
      header: "Monto",
      align: "right",
      render: (row) => (
        <div className="text-right">
          <p className="font-medium text-foreground">{formatCurrency(row.amount, row.currency)}</p>
          <p className="text-xs text-muted-foreground">
            {describeRecurrence(row.recurrenceUnit, row.recurrenceInterval, row.isRecurring)}
          </p>
        </div>
      ),
    },
    {
      key: "nextBillingDate",
      header: "Próximo cobro",
      render: (row) => {
        if (!row.nextBillingDate) return <span className="text-muted-foreground">—</span>
        const cutoff = effectiveCutoffDay(row)
        return (
          <div>
            <p className="text-foreground">
              {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
                new Date(row.nextBillingDate)
              )}
            </p>
            {cutoff && <p className="text-xs text-muted-foreground">Corte día {cutoff}</p>}
          </div>
        )
      },
    },
    {
      key: "card",
      header: "Tarjeta",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.card?.label ?? "Sin tarjeta"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      align: "center",
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
            STATUS_STYLES[row.status]
          )}
        >
          {USER_SUBSCRIPTION_STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(row)}
            title={row.status === "ACTIVE" ? "Pausar" : "Reactivar"}
            className="h-8 w-8 p-0"
          >
            {row.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(row)}
            title="Editar"
            className="h-8 w-8 p-0"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleting(row)}
            title="Eliminar"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis suscripciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todo lo que pagas cada mes, en un solo lugar.
        </p>
      </div>

      {/* Multi-currency totals are only meaningful once rates resolve. */}
      {ratesUnavailable && (summary?.byCurrency.length ?? 0) > 1 && (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            No pudimos obtener las tasas de cambio, así que los totales suman monedas distintas sin
            convertir. El desglose por moneda sigue siendo exacto.
          </p>
        </div>
      )}

      {(summary?.byCurrency.length ?? 0) > 1 && !ratesUnavailable && (
        <div className="flex flex-wrap gap-2">
          {summary!.byCurrency.map((entry) => (
            <span
              key={entry.currency}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/50 bg-card text-xs"
            >
              <span className="font-mono font-semibold">{entry.currency}</span>
              <span className="text-muted-foreground">
                {formatCurrency(entry.total, entry.currency)}
              </span>
              {entry.convertedTotal && entry.currency !== preferredCurrency && (
                <span className="text-muted-foreground/70">
                  {formatApproximate(entry.convertedTotal, preferredCurrency)}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por servicio o plan..."
          />
        }
        actionSection={
          <DataTableAction actionType="create" label="Nueva suscripción" onClick={openCreate} />
        }
      />

      <DataTable
        columns={columns}
        data={response?.data ?? []}
        loading={isLoading}
        emptyMessage="Aún no registras suscripciones. Empieza agregando la primera."
        glassy
        pagination={{
          currentPage: page,
          totalPages: response?.meta?.pageCount ?? 1,
          onPageChange: setPage,
          totalItems: response?.meta?.itemCount,
          itemsPerPage: 10,
        }}
      />

      {summary?.rates && !summary.rates.unavailable && (
        <p className="text-[11px] text-muted-foreground/60 text-right">
          {summary.rates.attribution}
          {summary.rates.stale && " · tasas no actualizadas hoy"}
        </p>
      )}

      <SubscriptionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        subscription={editing}
      />

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar suscripción"
        description={
          deleting
            ? `¿Seguro que quieres eliminar "${displayName(deleting)}"? Se perderá su historial de precios y de uso.`
            : ""
        }
        confirmLabel="Eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
