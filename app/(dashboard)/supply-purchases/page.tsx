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
  useSupplyPurchases,
  useDeleteSupplyPurchase,
  useCompleteSupplyPurchase,
  useAddSupplyPurchaseItems,
} from "@/features/supply-purchases/hooks/use-supply-purchases"
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers"
import { useSupplies } from "@/features/supplies/hooks/use-supplies"
import { useBankAccounts } from "@/features/bank-accounts/hooks/use-bank-accounts"
import { useTransactionCategories } from "@/features/transaction-categories/hooks/use-transaction-categories"
import { useSupplyMovements } from "@/features/supply-movements/hooks/use-supply-movements"
import { formatSupplyQuantity } from "@/shared/utils/supply-formatter"
import type {
  SupplyPurchase,
  PurchaseStatus,
  PaymentMethod,
  FindSupplyPurchasesParams,
  CompleteSupplyPurchaseDTO,
  AddItemsSupplyPurchaseDTO,
} from "@/features/supply-purchases/types/supply-purchases.types"
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
  Copy,
  Plus,
  Pencil,
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
  PurchaseStatus,
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

function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
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

// ─── Purchase Detail Modal ────────────────────────────────────────────────────

interface PurchaseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  purchase: SupplyPurchase | null
  supplierMap: Map<string, string>
  supplyUnitMap: Record<string, string>
}

function PurchaseDetailModal({
  isOpen,
  onClose,
  purchase,
  supplierMap,
  supplyUnitMap,
}: PurchaseDetailModalProps) {
  const { data: movementsResponse, isLoading: isLoadingMovements } = useSupplyMovements(
    {
      supplyPurchaseId: purchase?.id,
      limit: 100,
    },
    {
      enabled: !!purchase?.id,
    }
  )

  if (!purchase) return null

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
                  Compra #{purchase.id.slice(-8).toUpperCase()}
                </DialogTitle>
                <PurchaseStatusBadge status={purchase.status} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                <span>Registrada: {formatDate(purchase.createdAt)}</span>
                {purchase.updatedAt && (new Date(purchase.updatedAt).getTime() - new Date(purchase.createdAt).getTime() > 1000) && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30 shrink-0" />
                    <span className="text-brand-600 dark:text-brand-400 font-medium">Actualizada: {formatDate(purchase.updatedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Supplier & Performed By User Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3 w-3" /> Proveedor
              </span>
              <span className="text-sm font-medium text-foreground">
                {purchase.supplierId ? supplierMap.get(purchase.supplierId) ?? "Cargando..." : (
                  <span className="text-muted-foreground/50 italic text-xs">Sin registrar</span>
                )}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Registrada por
              </span>
              {purchase.performedByUserId ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground font-mono bg-muted/40 px-2 py-0.5 rounded-lg border border-border/15 select-all truncate max-w-[140px] sm:max-w-none" title={purchase.performedByUserId}>
                    {purchase.performedByUserId}
                  </span>
                  <CopyButton value={purchase.performedByUserId} />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/50 italic">—</span>
              )}
            </div>
          </div>

          <div className="border-t border-border/15" />

          {/* Items Section */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-3">
              <Package className="h-3 w-3" /> Insumos comprados
            </h4>

            {isLoadingMovements ? (
              <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/60 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                <span>Cargando insumos...</span>
              </div>
            ) : movementsResponse?.data && movementsResponse.data.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_80px_90px_90px] gap-2 px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Insumo</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right">Costo Unit.</span>
                  <span className="text-right">Subtotal</span>
                </div>
                {movementsResponse.data.map((item) => {
                  const unit = supplyUnitMap[item.supplyId] || "UNIT"
                  const qtyFormatted = formatSupplyQuantity(Math.abs(item.quantity), unit as any)
                  
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_80px_90px_90px] gap-2 items-center px-2 py-2 rounded-lg bg-muted/20 border border-border/15 text-xs"
                    >
                      <span className="font-medium text-foreground truncate">
                        {item.supplyName ?? "Insumo desconocido"}
                      </span>
                      <span className="text-center text-muted-foreground font-semibold font-mono">
                        {qtyFormatted}
                      </span>
                      <span className="text-right text-muted-foreground tabular-nums font-mono">
                        {formatCurrency(item.unitCost ?? 0)}
                      </span>
                      <span className="text-right font-semibold text-foreground tabular-nums font-mono">
                        {formatCurrency(Math.abs(item.quantity) * (item.unitCost ?? 0))}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-20 border border-dashed border-border/25 rounded-xl flex items-center justify-center text-xs text-muted-foreground/60 gap-2">
                <Package className="h-4 w-4 opacity-40" />
                <span>No hay insumos registrados en esta compra</span>
              </div>
            )}
          </div>

          <div className="border-t border-border/15" />

          {/* Totals Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                {formatCurrency(purchase.totalAmount)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <>
              <div className="border-t border-border/15" />
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Notas
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 rounded-lg p-2.5 border border-border/15">
                  {purchase.notes}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer with Close Button */}
        <DialogFooter className="px-5 py-4 border-t border-border/20 bg-muted/10 flex flex-row items-center gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Complete Purchase Modal ──────────────────────────────────────────────────

interface CompletePurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  purchase: SupplyPurchase | null
  onConfirm: (payload: CompleteCompletePurchaseDTO) => void
  isLoading: boolean
}

type CompleteCompletePurchaseDTO = CompleteSupplyPurchaseDTO

const PAYMENT_OPTIONS: { label: string; value: PaymentMethod; icon: React.ElementType }[] = [
  { label: "Efectivo", value: "CASH", icon: Banknote },
  { label: "T. Crédito", value: "CREDIT_CARD", icon: CreditCard },
  { label: "T. Débito", value: "DEBIT_CARD", icon: CreditCard },
  { label: "Transferencia", value: "BANK_TRANSFER", icon: ArrowRightLeft },
  { label: "Cheque", value: "CHECK", icon: Receipt },
  { label: "Otro", value: "OTHER", icon: Tag },
]

function CompletePurchaseModal({ isOpen, onClose, purchase, onConfirm, isLoading }: CompletePurchaseModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("BANK_TRANSFER")
  const [bankAccountId, setBankAccountId] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Fetch bank accounts and categories (EXPENSE)
  const { data: bankAccountsRes } = useBankAccounts({ status: "ACTIVE", limit: 100 })
  const { data: categoriesRes } = useTransactionCategories({ type: "EXPENSE", isActive: true, limit: 100 })

  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod("BANK_TRANSFER")
      setBankAccountId("")
      setCategoryId("")
      setNotes("")
    }
  }, [isOpen])

  // Set default bank account and category when they load
  React.useEffect(() => {
    if (isOpen && bankAccountsRes?.data && bankAccountsRes.data.length > 0 && !bankAccountId) {
      setBankAccountId(bankAccountsRes.data[0].id)
    }
  }, [bankAccountsRes, bankAccountId, isOpen])

  React.useEffect(() => {
    if (isOpen && categoriesRes?.data && categoriesRes.data.length > 0 && !categoryId) {
      setCategoryId(categoriesRes.data[0].id)
    }
  }, [categoriesRes, categoryId, isOpen])

  if (!purchase) return null

  function handleSubmit() {
    if (!bankAccountId) {
      toast.error("Seleccione una cuenta bancaria origen")
      return
    }
    const payload: CompleteCompletePurchaseDTO = {
      bankAccountId,
      paymentMethod,
      categoryId: categoryId || undefined,
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
            Completar compra de insumo
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Compra #{purchase.id.slice(-8).toUpperCase()} —{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(purchase.totalAmount ?? 0)}
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

          {/* Bank Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Cuenta bancaria origen</label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border/40 bg-transparent px-2.5 text-xs text-foreground focus:border-brand-500/50 outline-none transition-all cursor-pointer"
            >
              <option value="">Selecciona cuenta bancaria...</option>
              {bankAccountsRes?.data?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Categoría de egreso</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 rounded-lg border border-border/40 bg-transparent px-2.5 text-xs text-foreground focus:border-brand-500/50 outline-none transition-all cursor-pointer"
            >
              <option value="">Selecciona categoría...</option>
              {categoriesRes?.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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
              placeholder="Observaciones adicionales al registrar el pago..."
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

// ─── Add Items To Pending Purchase Modal ──────────────────────────────────────

interface AddPurchaseItemsModalProps {
  isOpen: boolean
  onClose: () => void
  purchase: SupplyPurchase | null
  onConfirm: (payload: AddItemsProductPurchaseDTO) => void
  isLoading: boolean
  supplyUnitMap: Record<string, string>
}

type AddItemsProductPurchaseDTO = AddItemsSupplyPurchaseDTO

interface CartItemInput {
  id: string
  supplyId: string
  quantity: number
  unitCost: number
}

function AddPurchaseItemsModal({ isOpen, onClose, purchase, onConfirm, isLoading, supplyUnitMap }: AddPurchaseItemsModalProps) {
  const [items, setItems] = React.useState<CartItemInput[]>([])
  const [initialized, setInitialized] = React.useState(false)
  
  // Fetch active supplies
  const { data: suppliesRes, isLoading: loadingSupplies } = useSupplies({ limit: 100 })
  const purchasableSupplies = React.useMemo(() => {
    if (!suppliesRes?.data) return []
    return suppliesRes.data.filter((s) => s.isActive)
  }, [suppliesRes])

  // Fetch existing items for this purchase
  const { data: movementsResponse, isLoading: isLoadingMovements } = useSupplyMovements(
    {
      supplyPurchaseId: purchase?.id,
      limit: 100,
    },
    {
      enabled: !!purchase?.id,
    }
  )

  React.useEffect(() => {
    if (!isOpen) {
      setInitialized(false)
      setItems([])
    }
  }, [isOpen])

  React.useEffect(() => {
    if (isOpen && purchase && !initialized && !isLoadingMovements) {
      if (movementsResponse?.data && movementsResponse.data.length > 0) {
        setItems(
          movementsResponse.data.map((m) => ({
            id: m.id,
            supplyId: m.supplyId,
            quantity: Math.abs(m.quantity),
            unitCost: m.unitCost ?? 0,
          }))
        )
      } else {
        setItems([{ id: Math.random().toString(36).substring(7), supplyId: "", quantity: 1, unitCost: 0 }])
      }
      setInitialized(true)
    }
  }, [isOpen, purchase, movementsResponse, isLoadingMovements, initialized])

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: Math.random().toString(36).substring(7), supplyId: "", quantity: 1, unitCost: 0 }])
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof CartItemInput, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }

        if (field === "supplyId" && suppliesRes?.data) {
          const supply = suppliesRes.data.find((s) => s.id === value)
          if (supply) {
            updated.unitCost = supply.basePrice ?? 0
          }
        }
        return updated
      })
    )
  }

  function handleSubmit() {
    if (items.length === 0) {
      toast.error("Agregue al menos un insumo")
      return
    }
    const invalid = items.find((i) => !i.supplyId || i.quantity <= 0 || i.unitCost < 0)
    if (invalid) {
      toast.error("Complete todos los campos correctamente")
      return
    }
    onConfirm({
      items: items.map((i) => ({
        supplyId: i.supplyId,
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
        location: "Principal",
      })),
    })
  }

  if (!purchase) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-2xl bg-card border border-border/40 shadow-xl p-5 sm:p-6 gap-5 duration-200 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border/10">
          <DialogTitle className="text-base font-heading font-bold text-foreground">
            Actualizar insumos de Compra #{purchase.id.slice(-8).toUpperCase()}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Esta compra está pendiente. Puedes agregar, modificar o eliminar insumos de la compra actual. Los cambios afectarán el stock físico.
          </p>
        </DialogHeader>

        {isLoadingMovements ? (
          <div className="h-40 flex flex-col items-center justify-center text-xs text-muted-foreground/60 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            <span>Cargando insumos de la compra...</span>
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {items.map((item) => {
              const unit = supplyUnitMap[item.supplyId] || ""
              const unitSuffix = unit === "GRAM" ? "kg" : unit === "MILLILITER" ? "L" : unit === "UNIT" ? "und" : ""
              
              return (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[2fr_100px_100px_40px] gap-2 items-center p-2 rounded-xl bg-muted/20 border border-border/10">
                  <select
                    value={item.supplyId}
                    onChange={(e) => handleUpdateItem(item.id, "supplyId", e.target.value)}
                    className="w-full h-8 rounded-lg border border-border/30 bg-card px-2 text-xs text-foreground focus:border-brand-500/50 outline-none cursor-pointer"
                  >
                    <option value="">Selecciona insumo...</option>
                    {loadingSupplies ? (
                      <option disabled>Cargando...</option>
                    ) : (
                      purchasableSupplies.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                    )}
                  </select>

                  <div className="relative">
                    <input
                      type="number"
                      min="0.0001"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, "quantity", Number(e.target.value))}
                      placeholder="Cant"
                      className="w-full h-8 rounded-lg border border-border/30 bg-card pr-8 text-center text-xs text-foreground outline-none focus:border-brand-500/50"
                    />
                    {unitSuffix && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/60 font-semibold uppercase">
                        {unitSuffix}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 font-mono">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost === 0 ? "" : item.unitCost}
                      onChange={(e) => handleUpdateItem(item.id, "unitCost", Number(e.target.value))}
                      placeholder="Costo"
                      className="w-full h-8 rounded-lg border border-border/30 bg-card pl-5 pr-2 text-right text-xs text-foreground outline-none focus:border-brand-500/50"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length === 1}
                      className="p-1 text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-border/40 hover:border-brand-500 hover:text-brand-500 rounded-lg text-xs font-semibold text-muted-foreground cursor-pointer transition-all duration-150"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir otro insumo
            </button>
            
            <div className="text-[10px] text-muted-foreground/80 leading-normal p-2.5 bg-brand-500/5 border border-brand-500/10 rounded-xl">
              💡 **Nota sobre Unidades**: Recuerda que las cantidades de peso (g) y volumen (ml) deben ingresarse en su unidad de referencia mayor (Kilogramos o Litros). Ej: `0.5` para 500g.
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row gap-2 pt-3 border-t border-border/20">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isLoadingMovements}
            className="flex-1 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || isLoadingMovements}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar cambios
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

export default function SupplyPurchasesPage() {
  const router = useRouter()
  // ─── Mutations ───────────────────────────────────────────────────────────
  const deletePurchaseMutation = useDeleteSupplyPurchase()
  const completePurchaseMutation = useCompleteSupplyPurchase()
  const addItemsMutation = useAddSupplyPurchaseItems()

  // ─── Modal States ────────────────────────────────────────────────────────
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = React.useState(false)
  const [isAddItemsOpen, setIsAddItemsOpen] = React.useState(false)
  const [selectedPurchase, setSelectedPurchase] = React.useState<SupplyPurchase | null>(null)

  // ─── Filter & Pagination State ───────────────────────────────────────────
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [supplierFilter, setSupplierFilter] = React.useState("all")

  // ─── Debounce Search ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // ─── Reset page on filter change ─────────────────────────────────────────
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, supplierFilter])

  // ─── Fetch Suppliers ─────────────────────────────────────────────────────
  const { data: suppliersResponse } = useSuppliers({ limit: 100, isActive: true })
  const supplierFilterOptions = React.useMemo(() => {
    if (!suppliersResponse?.data) return []
    return suppliersResponse.data.map((s) => ({ label: s.name, value: s.id }))
  }, [suppliersResponse])

  const supplierMap = React.useMemo(() => {
    const map = new Map<string, string>()
    if (suppliersResponse?.data) {
      suppliersResponse.data.forEach((s) => map.set(s.id, s.name))
    }
    return map
  }, [suppliersResponse])

  // ─── Fetch Supplies for Details and Units ───────────────────────────────
  const { data: suppliesRes } = useSupplies({ limit: 100 })
  const supplyUnitMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    suppliesRes?.data?.forEach((s) => {
      map[s.id] = s.unitOfMeasure
    })
    return map
  }, [suppliesRes])

  // ─── Query ───────────────────────────────────────────────────────────────
  const queryParams: FindSupplyPurchasesParams = {
    page,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (statusFilter as PurchaseStatus) : undefined,
    supplierId: supplierFilter !== "all" ? supplierFilter : undefined,
  }

  const { data: response, isLoading, error } = useSupplyPurchases(queryParams)

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar las compras de insumos", {
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
  const columns: ColumnDef<SupplyPurchase>[] = [
    {
      key: "id",
      header: "ID / Folio",
      sortable: false,
      className: "w-[120px] pr-4 text-left",
      headerClassName: "pr-4 text-left",
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
      className: "w-[160px] pr-4 text-left",
      headerClassName: "pr-4 text-left",
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-left">
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
      key: "supplierId",
      header: "Proveedor",
      sortable: false,
      className: "pr-4 text-left",
      headerClassName: "pr-4 text-left",
      render: (row) => {
        const name = row.supplierId ? supplierMap.get(row.supplierId) : null
        return name ? (
          <div className="flex items-center gap-1.5 justify-start">
            <Users className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
              {name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic text-left block">Sin registrar</span>
        )
      },
    },
    {
      key: "status",
      header: "Estado",
      sortable: false,
      className: "w-[130px] pr-4 text-left",
      headerClassName: "pr-4 text-left",
      render: (row) => <PurchaseStatusBadge status={row.status} />,
    },
    {
      key: "totalAmount",
      header: "Total",
      sortable: true,
      className: "w-[120px] pr-4 text-left font-mono",
      headerClassName: "pr-4 text-left",
      render: (row) => (
        <span className="text-sm font-bold text-foreground tabular-nums">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "w-[120px]",
      headerClassName: "text-center",
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
              setSelectedPurchase(row)
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
                setSelectedPurchase(row)
                setIsCompleteOpen(true)
              }}
              disabled={
                completePurchaseMutation.isPending &&
                completePurchaseMutation.variables?.id === row.id
              }
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Completar pago"
            >
              {completePurchaseMutation.isPending &&
                completePurchaseMutation.variables?.id === row.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Edit items (only for PENDING) */}
          {row.status === "PENDING" && (
            <button
              onClick={() => {
                setSelectedPurchase(row)
                setIsAddItemsOpen(true)
              }}
              disabled={
                addItemsMutation.isPending &&
                addItemsMutation.variables?.id === row.id
              }
              className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Editar insumos"
            >
              {addItemsMutation.isPending &&
                addItemsMutation.variables?.id === row.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Delete / Cancel */}
          {row.status !== "CANCELLED" && (
            <button
              onClick={() => {
                setSelectedPurchase(row)
                setIsDeleteOpen(true)
              }}
              disabled={
                deletePurchaseMutation.isPending &&
                deletePurchaseMutation.variables === row.id
              }
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Cancelar / Eliminar"
            >
              {deletePurchaseMutation.isPending &&
                deletePurchaseMutation.variables === row.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      ),
    },
  ]

  // ─── Handlers ─────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!selectedPurchase) return
    deletePurchaseMutation.mutate(selectedPurchase.id, {
      onSuccess: () => {
        toast.success("Compra cancelada/eliminada correctamente")
        setIsDeleteOpen(false)
        setIsDetailOpen(false)
        setSelectedPurchase(null)
      },
      onError: () => toast.error("Error al cancelar la compra"),
    })
  }

  function handleComplete(payload: CompleteCompletePurchaseDTO) {
    if (!selectedPurchase) return
    completePurchaseMutation.mutate(
      { id: selectedPurchase.id, payload },
      {
        onSuccess: () => {
          toast.success("Compra completada correctamente")
          setIsCompleteOpen(false)
          setIsDetailOpen(false)
          setSelectedPurchase(null)
        },
        onError: () => toast.error("Error al completar la compra"),
      }
    )
  }

  function handleAddItems(payload: AddItemsProductPurchaseDTO) {
    if (!selectedPurchase) return
    addItemsMutation.mutate(
      { id: selectedPurchase.id, payload },
      {
        onSuccess: () => {
          toast.success("Insumos agregados con éxito a la compra")
          setIsAddItemsOpen(false)
          setIsDetailOpen(false)
          setSelectedPurchase(null)
        },
        onError: () => toast.error("Error al agregar insumos a la compra"),
      }
    )
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <title>Compras de Insumos | EasyPoint</title>
      
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por proveedor o notas..."
            shortcutKey="/"
            shape="md"
          />
        }
        filterSection={
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:flex-wrap sm:gap-2">
            {/* Status filter */}
            <DataTableFilter
              title="Estado"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_FILTER_OPTIONS}
              placeholder="Todos"
              className="w-full sm:w-auto"
              triggerClassName="w-full sm:w-auto"
            />

            {/* Supplier filter */}
            <DataTableFilter
              title="Proveedor"
              value={supplierFilter}
              onChange={setSupplierFilter}
              options={supplierFilterOptions}
              placeholder="Todos"
              className="w-full sm:w-auto"
              triggerClassName="w-full sm:w-auto"
            />
          </div>
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Registrar Compra"
            shape="md"
            onClick={() => router.push("/supply-purchases/create")}
          />
        }
      />

      {/* ── DataTable ──────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        emptyMessage="No se encontraron compras de insumos. Ajusta los filtros o registra una nueva compra."
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
          setSelectedPurchase(row)
          setIsDetailOpen(true)
        }}
        glassy
      />

      {/* ── Purchase Detail Modal ─────────────────────────────────────────────── */}
      <PurchaseDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedPurchase(null)
        }}
        purchase={selectedPurchase}
        supplierMap={supplierMap}
        supplyUnitMap={supplyUnitMap}
      />

      {/* ── Complete Pending Purchase Modal ───────────────────────────────────── */}
      <CompletePurchaseModal
        isOpen={isCompleteOpen}
        onClose={() => {
          setIsCompleteOpen(false)
        }}
        purchase={selectedPurchase}
        onConfirm={handleComplete}
        isLoading={completePurchaseMutation.isPending}
      />

      {/* ── Add Items To Pending Purchase Modal ───────────────────────────────── */}
      <AddPurchaseItemsModal
        isOpen={isAddItemsOpen}
        onClose={() => {
          setIsAddItemsOpen(false)
        }}
        purchase={selectedPurchase}
        onConfirm={handleAddItems}
        isLoading={addItemsMutation.isPending}
        supplyUnitMap={supplyUnitMap}
      />

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedPurchase(null)
        }}
        title="¿Cancelar compra de insumos?"
        description={
          selectedPurchase?.status === "COMPLETED"
            ? `Esta compra ya está completada. Si continúas, se revertirá el stock de insumos incrementado, se reembolsará el dinero a la cuenta bancaria original de la transacción y se marcará la compra como CANCELADA. ¿Deseas continuar?`
            : `Esta compra está pendiente. Se revertirá el stock de los insumos y se eliminará permanentemente la compra. ¿Deseas continuar?`
        }
        confirmLabel="Confirmar Cancelación"
        cancelLabel="Cancelar"
        isLoading={deletePurchaseMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
