"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableFilter } from "@/shared/components/ui/data-table-filter"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import {
  useSales,
  useDeleteSale,
  useCompleteSale,
} from "@/features/sales/hooks/use-sales"
import { useClients } from "@/features/clients/hooks/use-clients"
import { useInventoryMovements } from "@/features/inventory-movements/hooks/use-inventory-movements"
import type {
  Sale,
  SaleStatus,
  SalePaymentMethod,
  FindSalesParams,
  CompleteSaleDTO,
} from "@/features/sales/types/sales.types"
import {
  ShoppingCart,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Users,
  CalendarDays,
  Receipt,
  Tag,
  Package,
  DollarSign,
  BadgePercent,
  Copy,
} from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success("Copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Error al copiar")
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150 active:scale-90 cursor-pointer flex items-center justify-center shrink-0"
      title="Copiar ID"
    >
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SaleStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  COMPLETED: {
    label: "Completada",
    icon: CheckCircle2,
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  CANCELLED: {
    label: "Cancelada",
    icon: XCircle,
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
}

function SaleStatusBadge({ status }: { status: SaleStatus }) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1 text-[10px] font-bold py-0.5 rounded-full border uppercase tracking-wide w-[96px] shrink-0",
        config.className
      )}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}

// ─── Sale Detail Modal ────────────────────────────────────────────────────────

interface SaleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale | null
  onDelete: (sale: Sale) => void
  onComplete: (sale: Sale) => void
  isDeleting: boolean
  isCompleting: boolean
}

function SaleDetailModal({
  isOpen,
  onClose,
  sale,
  onDelete,
  onComplete,
  isDeleting,
  isCompleting,
}: SaleDetailModalProps) {
  const { data: movementsResponse, isLoading: isLoadingMovements } = useInventoryMovements({
    saleId: sale?.id,
    limit: 100,
  })

  if (!sale) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl rounded-2xl bg-card border border-border/40 shadow-xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col duration-200">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/20">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
              <ShoppingCart className="h-4.5 w-4.5 stroke-[1.75]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-heading font-bold text-foreground leading-tight">
                  Venta #{sale.id.slice(-8).toUpperCase()}
                </DialogTitle>
                <SaleStatusBadge status={sale.status} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDate(sale.createdAt)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Client & Cashier Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3 w-3" /> Cliente
              </span>
              <span className="text-sm font-medium text-foreground">
                {sale.clientName ?? (
                  <span className="text-muted-foreground/50 italic text-xs">Anónimo</span>
                )}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Registrada por
              </span>
              {sale.performedByUserId ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground font-mono bg-muted/40 px-2 py-0.5 rounded-lg border border-border/15 select-all truncate max-w-[140px] sm:max-w-none" title={sale.performedByUserId}>
                    {sale.performedByUserId}
                  </span>
                  <CopyButton value={sale.performedByUserId} />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/50 italic">—</span>
              )}
            </div>

            {sale.discountRuleCode && (
              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Descuento aplicado
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-400">
                  <BadgePercent className="h-3 w-3" />
                  {sale.discountRuleCode}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-border/15" />

          {/* Items Section */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-3">
              <Package className="h-3 w-3" /> Ítems de la venta
            </h4>

            {isLoadingMovements ? (
              <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/60 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span>Cargando ítems...</span>
              </div>
            ) : movementsResponse?.data && movementsResponse.data.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Producto</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right">P. Unit.</span>
                  <span className="text-right">Subtotal</span>
                </div>
                {movementsResponse.data.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_60px_80px_80px] gap-2 items-center px-2 py-2 rounded-lg bg-muted/20 border border-border/15 text-xs"
                  >
                    <span className="font-medium text-foreground truncate">
                      {item.productName ?? "Producto desconocido"}
                    </span>
                    <span className="text-center text-muted-foreground font-semibold">
                      {Math.abs(item.quantity)}
                    </span>
                    <span className="text-right text-muted-foreground tabular-nums">
                      {formatCurrency(item.unitCost ?? 0)}
                    </span>
                    <span className="text-right font-semibold text-foreground tabular-nums">
                      {formatCurrency(Math.abs(item.quantity) * (item.unitCost ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-20 border border-dashed border-border/25 rounded-xl flex items-center justify-center text-xs text-muted-foreground/60 gap-2">
                <Package className="h-4 w-4 opacity-40" />
                <span>No hay ítems registrados en esta venta</span>
              </div>
            )}
          </div>

          <div className="border-t border-border/15" />

          {/* Totals Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrency(sale.subtotalAmount ?? 0)}
              </span>
            </div>
            {sale.discountAmount !== null && sale.discountAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BadgePercent className="h-3 w-3 text-emerald-500" />
                  Descuento
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  -{formatCurrency(sale.discountAmount ?? 0)}
                </span>
              </div>
            )}
            {sale.taxAmount !== null && sale.taxAmount !== undefined && sale.taxAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Impuestos</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatCurrency(sale.taxAmount ?? 0)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                {formatCurrency(sale.totalAmount)}
              </span>
            </div>
            {sale.amountPaid !== null && sale.amountPaid !== undefined && (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Monto recibido</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCurrency(sale.amountPaid ?? 0)}
                  </span>
                </div>
                {sale.changeAmount !== null && sale.changeAmount !== undefined && sale.changeAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Cambio</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(sale.changeAmount ?? 0)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Notes */}
          {sale.notes && (
            <>
              <div className="border-t border-border/15" />
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Notas
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 rounded-lg p-2.5 border border-border/15">
                  {sale.notes}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer (only shown if PENDING to complete payment) */}
        {sale.status === "PENDING" && (
          <DialogFooter className="px-5 py-4 border-t border-border/20 bg-muted/10 flex flex-row items-center gap-2 justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => onComplete(sale)}
              disabled={isCompleting}
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              {isCompleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Completar pago
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Complete Sale Modal ──────────────────────────────────────────────────────

interface CompleteSaleModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale | null
  onConfirm: (payload: CompleteSaleDTO) => void
  isLoading: boolean
}

const PAYMENT_OPTIONS: { label: string; value: SalePaymentMethod; icon: React.ElementType }[] = [
  { label: "Efectivo", value: "CASH", icon: Banknote },
  { label: "T. Crédito", value: "CREDIT_CARD", icon: CreditCard },
  { label: "T. Débito", value: "DEBIT_CARD", icon: CreditCard },
  { label: "Transferencia", value: "BANK_TRANSFER", icon: ArrowRightLeft },
  { label: "Cheque", value: "CHECK", icon: Receipt },
  { label: "Otro", value: "OTHER", icon: Tag },
]

function CompleteSaleModal({ isOpen, onClose, sale, onConfirm, isLoading }: CompleteSaleModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<SalePaymentMethod>("CASH")
  const [amountPaid, setAmountPaid] = React.useState("")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod("CASH")
      setAmountPaid("")
      setNotes("")
    }
  }, [isOpen])

  if (!sale) return null

  function handleSubmit() {
    const payload: CompleteSaleDTO = {
      paymentMethod,
      amountPaid: amountPaid ? Number(amountPaid) : undefined,
      notes: notes.trim() || undefined,
    }
    onConfirm(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm rounded-2xl bg-card border border-border/40 shadow-xl p-5 sm:p-6 gap-5 duration-200">
        <DialogHeader className="gap-2 flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-heading font-bold text-foreground">
            Completar venta pendiente
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Venta #{sale.id.slice(-8).toUpperCase()} —{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(sale.totalAmount ?? 0)}
            </span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Método de pago</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_OPTIONS.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-semibold transition-all duration-150 cursor-pointer",
                    paymentMethod === value
                      ? "bg-brand-500/10 border-brand-500/40 text-brand-700 dark:text-brand-300"
                      : "bg-transparent border-border/30 text-muted-foreground hover:border-border/60 hover:bg-muted/30"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              Monto recibido{" "}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={String((sale.totalAmount ?? 0).toFixed(2))}
                className="w-full h-9 rounded-lg border border-border/40 bg-transparent pl-7 pr-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-brand-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Notas <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones al completar el pago..."
              className="w-full rounded-lg border border-border/40 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-brand-500/50 outline-none transition-all resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2 pt-2 border-t border-border/20">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 8

// Filter options
const STATUS_FILTER_OPTIONS = [
  { label: "Completada", value: "COMPLETED" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Cancelada", value: "CANCELLED" },
]

export default function SalesPage() {
  const router = useRouter()
  // ─── Mutations ───────────────────────────────────────────────────────────
  const deleteSaleMutation = useDeleteSale()
  const completeSaleMutation = useCompleteSale()

  // ─── Modal States ────────────────────────────────────────────────────────
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = React.useState(false)
  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null)

  // ─── Filter & Pagination State ───────────────────────────────────────────
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [clientFilter, setClientFilter] = React.useState("all")

  // ─── Debounce Search ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // ─── Reset page on filter change ─────────────────────────────────────────
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, clientFilter])

  // ─── Fetch Clients (for filter dropdown) ─────────────────────────────────
  const { data: clientsResponse } = useClients({ limit: 100, isActive: true })
  const clientFilterOptions = React.useMemo(() => {
    if (!clientsResponse?.data) return []
    return clientsResponse.data.map((c) => ({ label: c.name, value: c.id }))
  }, [clientsResponse])

  // ─── Query ───────────────────────────────────────────────────────────────
  const queryParams: FindSalesParams = {
    page,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (statusFilter as SaleStatus) : undefined,
    clientId: clientFilter !== "all" ? clientFilter : undefined,
  }

  const { data: response, isLoading, error } = useSales(queryParams)

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar las ventas", {
        description:
          error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // ─── Sort State ───────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  // ─── Table Columns ────────────────────────────────────────────────────────
  const columns: ColumnDef<Sale>[] = [
    {
      key: "id",
      header: "ID / Folio",
      sortable: false,
      className: "w-[120px]",
      render: (row) => (
        <span className="font-mono text-[11px] font-bold text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
          #{row.id.slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Fecha",
      sortable: true,
      className: "w-[160px]",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground">
            {new Date(row.createdAt).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(row.createdAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "clientName",
      header: "Cliente",
      sortable: false,
      render: (row) =>
        row.clientName ? (
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
              {row.clientName}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">Anónimo</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      sortable: false,
      className: "w-[130px]",
      render: (row) => <SaleStatusBadge status={row.status} />,
    },
    {
      key: "totalAmount",
      header: "Total",
      sortable: true,
      className: "w-[120px]",
      render: (row) => (
        <span className="text-sm font-bold text-foreground tabular-nums">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "w-[100px]",
      align: "center",
      render: (row) => (
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {/* View Details */}
          <button
            onClick={() => {
              setSelectedSale(row)
              setIsDetailOpen(true)
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
            title="Ver detalles"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {/* Complete pending (only for PENDING) */}
          {row.status === "PENDING" && (
            <button
              onClick={() => {
                setSelectedSale(row)
                setIsCompleteOpen(true)
              }}
              disabled={
                completeSaleMutation.isPending &&
                completeSaleMutation.variables?.id === row.id
              }
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Completar pago"
            >
              {completeSaleMutation.isPending &&
                completeSaleMutation.variables?.id === row.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => {
              setSelectedSale(row)
              setIsDeleteOpen(true)
            }}
            disabled={
              deleteSaleMutation.isPending &&
              deleteSaleMutation.variables === row.id
            }
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
            title="Eliminar"
          >
            {deleteSaleMutation.isPending &&
              deleteSaleMutation.variables === row.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ]

  // ─── Handlers ─────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!selectedSale) return
    deleteSaleMutation.mutate(selectedSale.id, {
      onSuccess: () => {
        toast.success("Venta eliminada correctamente")
        setIsDeleteOpen(false)
        setIsDetailOpen(false)
        setSelectedSale(null)
      },
      onError: () => toast.error("Error al eliminar la venta"),
    })
  }

  function handleComplete(payload: CompleteSaleDTO) {
    if (!selectedSale) return
    completeSaleMutation.mutate(
      { id: selectedSale.id, payload },
      {
        onSuccess: () => {
          toast.success("Venta completada correctamente")
          setIsCompleteOpen(false)
          setIsDetailOpen(false)
          setSelectedSale(null)
        },
        onError: () => toast.error("Error al completar la venta"),
      }
    )
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar ventas por ID o cliente..."
            shortcutKey="/"
            shape="md"
          />
        }
        filterSection={
          <>
            {/* Status filter */}
            <DataTableFilter
              title="Estado"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              placeholder="Todos"
            />

            {/* Client filter */}
            <DataTableFilter
              title="Cliente"
              value={clientFilter}
              onChange={setClientFilter}
              options={clientFilterOptions}
              placeholder="Todos"
            />
          </>
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Registrar Venta"
            shape="md"
            onClick={() => router.push("/sales/create")}
          />
        }
      />

      {/* ── DataTable ──────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        emptyMessage="No se encontraron ventas. Ajusta los filtros o registra una nueva venta."
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: response?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: response?.meta?.itemCount || 0,
          itemsPerPage: ITEMS_PER_PAGE,
        }}
        onRowClick={(row) => {
          setSelectedSale(row)
          setIsDetailOpen(true)
        }}
        glassy
      />

      {/* ── Sale Detail Modal ────────────────────────────────────────────────── */}
      <SaleDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedSale(null)
        }}
        sale={selectedSale}
        onDelete={(sale) => {
          setSelectedSale(sale)
          setIsDeleteOpen(true)
        }}
        onComplete={(sale) => {
          setSelectedSale(sale)
          setIsCompleteOpen(true)
        }}
        isDeleting={deleteSaleMutation.isPending}
        isCompleting={completeSaleMutation.isPending}
      />

      {/* ── Complete Pending Sale Modal ──────────────────────────────────────── */}
      <CompleteSaleModal
        isOpen={isCompleteOpen}
        onClose={() => {
          setIsCompleteOpen(false)
        }}
        sale={selectedSale}
        onConfirm={handleComplete}
        isLoading={completeSaleMutation.isPending}
      />

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedSale(null)
        }}
        title="¿Eliminar venta?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente la venta #${selectedSale?.id.slice(-8).toUpperCase() ?? ""}.`}
        confirmLabel="Eliminar Venta"
        cancelLabel="Cancelar"
        isLoading={deleteSaleMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
