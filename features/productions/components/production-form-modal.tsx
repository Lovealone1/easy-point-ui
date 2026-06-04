"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Loader2,
  Package,
  ChevronDown,
  Search,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { DatePicker } from "@/shared/components/ui/date-picker"
import { cn } from "@/shared/lib/utils"
import { useSupplies } from "@/features/supplies/hooks/use-supplies"
import type { Supply } from "@/features/supplies/types/supplies.types"
import type {
  CreateProductionDTO,
  ProductionType,
  ProductionStatus,
  UnitOfMeasure,
} from "../types/productions.types"
import { useProducts } from "@/features/products/hooks/use-products"
import type { Product } from "@/features/products/types/products.types"

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCTION_TYPE_OPTIONS: { label: string; value: ProductionType }[] = [
  { label: "Vendible (produce stock de producto)", value: "SELLABLE" },
  { label: "Intermedia (insumo interno)", value: "INTERMEDIATE" },
]

const UNIT_OPTIONS: { label: string; value: UnitOfMeasure }[] = [
  { label: "Unidades", value: "UNIT" },
  { label: "Kilogramos (kg)", value: "KILOGRAM" },
  { label: "Gramos (g)", value: "GRAM" },
  { label: "Litros (L)", value: "LITER" },
  { label: "Mililitros (ml)", value: "MILLILITER" },
  { label: "Metros (m)", value: "METER" },
  { label: "Centímetros (cm)", value: "CENTIMETER" },
  { label: "Cajas", value: "BOX" },
  { label: "Paquetes", value: "PACKAGE" },
  { label: "Docenas", value: "DOZEN" },
  { label: "Porciones", value: "PORTION" },
  { label: "Otro", value: "OTHER" },
]

// ─── Supply line item ─────────────────────────────────────────────────────────

interface SupplyLine {
  supplyId: string
  supplyName: string
  quantityUsed: number
}

// ─── Combobox for supplies ────────────────────────────────────────────────────

interface SupplyComboboxProps {
  value: string
  onChange: (supply: Supply) => void
  excludeIds: string[]
}

function SupplyCombobox({ value, onChange, excludeIds }: SupplyComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const { data: suppliesData } = useSupplies({
    limit: 100,
    isActive: true,
    search: search || undefined,
  })

  const supplies = suppliesData?.data ?? []
  const available = supplies.filter((s) => !excludeIds.includes(s.id) || s.id === value)
  const selectedName = value
    ? (supplies.find((s) => s.id === value)?.name ?? "Seleccionar insumo")
    : "Seleccionar insumo"

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs font-medium transition-all",
          "hover:border-border/70 hover:bg-card/75 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{selectedName}</span>
        <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/25 bg-popover/95 p-1.5 shadow-md backdrop-blur-md">
          {/* Search */}
          <div className="relative mb-1">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/60" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar insumo..."
              className="h-8 w-full rounded-lg bg-muted/30 pl-7 pr-3 text-xs outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">Sin resultados</p>
            ) : (
              available.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s)
                    setOpen(false)
                    setSearch("")
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all hover:bg-primary/10 hover:text-primary",
                    value === s.id && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <Package className="h-3 w-3 shrink-0" />
                  <span className="truncate">{s.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {s.unitOfMeasure}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductionFormModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
  onSubmit: (payload: CreateProductionDTO) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductionFormModal({
  isOpen,
  onClose,
  isLoading = false,
  onSubmit,
}: ProductionFormModalProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [name, setName] = React.useState("")
  const [productionDate, setProductionDate] = React.useState(
    () => new Date().toISOString().slice(0, 10)
  )
  const [type, setType] = React.useState<ProductionType>("SELLABLE")
  const [status, setStatus] = React.useState<ProductionStatus>("COMPLETED")
  const [productId, setProductId] = React.useState("")
  const [quantityProduced, setQuantityProduced] = React.useState<number | "">(1)
  const [unitOfMeasure, setUnitOfMeasure] = React.useState<UnitOfMeasure>("UNIT")
  const [notes, setNotes] = React.useState("")
  const [supplyLines, setSupplyLines] = React.useState<SupplyLine[]>([
    { supplyId: "", supplyName: "", quantityUsed: 1 },
  ])

  // ── Product search (only for SELLABLE) ────────────────────────────────────
  const [productSearch, setProductSearch] = React.useState("")
  const [productDropOpen, setProductDropOpen] = React.useState(false)
  const { data: productsData } = useProducts({
    limit: 50,
    isActive: true,
    search: productSearch || undefined,
  })
  const products = productsData?.data ?? []
  const selectedProductName = productId
    ? (products.find((p) => p.id === productId)?.name ?? productId)
    : "Seleccionar producto"

  // ── Reset on close ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isOpen) {
      setName("")
      setProductionDate(new Date().toISOString().slice(0, 10))
      setType("SELLABLE")
      setStatus("COMPLETED")
      setProductId("")
      setQuantityProduced(1)
      setUnitOfMeasure("UNIT")
      setNotes("")
      setSupplyLines([{ supplyId: "", supplyName: "", quantityUsed: 1 }])
      setProductSearch("")
    }
  }, [isOpen])

  // ── Supply lines management ────────────────────────────────────────────────
  function addSupplyLine() {
    setSupplyLines((prev) => [...prev, { supplyId: "", supplyName: "", quantityUsed: 1 }])
  }

  function removeSupplyLine(index: number) {
    setSupplyLines((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSupplyLine(index: number, field: keyof SupplyLine, value: string | number) {
    setSupplyLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    )
  }

  function handleSupplySelect(index: number, supply: Supply) {
    setSupplyLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, supplyId: supply.id, supplyName: supply.name } : line
      )
    )
  }

  // ── Validation & submit ────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    if (type === "SELLABLE" && !productId) {
      toast.error("Selecciona el producto resultante para una producción vendible")
      return
    }
    if (!quantityProduced || quantityProduced <= 0) {
      toast.error("La cantidad producida debe ser mayor a 0")
      return
    }
    const validLines = supplyLines.filter((l) => l.supplyId)
    if (validLines.length === 0) {
      toast.error("Agrega al menos un insumo")
      return
    }
    const invalidQty = validLines.find((l) => !l.quantityUsed || l.quantityUsed <= 0)
    if (invalidQty) {
      toast.error(`La cantidad de "${invalidQty.supplyName}" debe ser mayor a 0`)
      return
    }

    onSubmit({
      name: name.trim(),
      productionDate: new Date(productionDate).toISOString(),
      type,
      status,
      productId: type === "SELLABLE" ? productId : undefined,
      quantityProduced: Number(quantityProduced),
      unitOfMeasure,
      notes: notes.trim() || undefined,
      supplies: validLines.map((l) => ({
        supplyId: l.supplyId,
        quantityUsed: l.quantityUsed,
      })),
    })
  }

  const excludedSupplyIds = supplyLines.map((l) => l.supplyId).filter(Boolean)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-0 duration-200 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/25">
          <DialogTitle className="text-lg font-heading font-bold">
            Nueva Producción
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registra un lote de producción y los insumos que consume.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* ── Sección 1: Datos generales ─────────────────────── */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Datos generales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Nombre del lote <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Producción de alfajores – lote 001"
                  className="h-9 w-full rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Fecha de producción <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={productionDate}
                  onChange={(date) => setProductionDate(date.toISOString().slice(0, 10))}
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Tipo <span className="text-rose-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as ProductionType)
                    setProductId("")
                  }}
                  className="h-9 w-full rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {PRODUCTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Estado <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductionStatus)}
                  className="h-9 w-full rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="COMPLETED">Completada (descuenta stock)</option>
                  <option value="DRAFT">Borrador (solo registro)</option>
                </select>
              </div>

              {/* Quantity produced */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Cantidad producida <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0.0001}
                  step="any"
                  value={quantityProduced}
                  onChange={(e) =>
                    setQuantityProduced(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Ej. 50"
                  className="h-9 w-full rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Unit of measure */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Unidad de medida <span className="text-rose-500">*</span>
                </label>
                <select
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                  className="h-9 w-full rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── Sección 2: Producto resultante (SELLABLE) ─────── */}
          {type === "SELLABLE" && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Producto resultante
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Producto <span className="text-rose-500">*</span>
                </label>
                {/* Product combobox */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProductDropOpen((o) => !o)}
                    className={cn(
                      "flex h-9 w-full items-center justify-between rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs font-medium transition-all",
                      "hover:border-border/70 hover:bg-card/75 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                      !productId && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">{selectedProductName}</span>
                    <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>

                  {productDropOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/25 bg-popover/95 p-1.5 shadow-md backdrop-blur-md">
                      <div className="relative mb-1">
                        <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/60" />
                        <input
                          autoFocus
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Buscar producto..."
                          className="h-8 w-full rounded-lg bg-muted/30 pl-7 pr-3 text-xs outline-none placeholder:text-muted-foreground/50"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {products.length === 0 ? (
                          <p className="py-3 text-center text-xs text-muted-foreground">
                            Sin resultados
                          </p>
                        ) : (
                          products.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setProductId(p.id)
                                setProductDropOpen(false)
                                setProductSearch("")
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all hover:bg-primary/10 hover:text-primary",
                                productId === p.id && "bg-primary/10 text-primary font-semibold"
                              )}
                            >
                              <span className="truncate">{p.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                  Al completar la producción se incrementará el stock de este producto.
                </p>
              </div>
            </section>
          )}

          {/* ── Sección 3: Insumos ────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Insumos consumidos
              </h3>
              <button
                type="button"
                onClick={addSupplyLine}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-border/40 bg-card/45 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-border/70 hover:text-foreground active:scale-95"
              >
                <Plus className="h-3 w-3" />
                Agregar insumo
              </button>
            </div>

            <div className="space-y-2">
              {supplyLines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_120px_32px] items-center gap-2 rounded-xl border border-border/25 bg-muted/20 p-2.5"
                >
                  {/* Supply picker */}
                  <SupplyCombobox
                    value={line.supplyId}
                    onChange={(s) => handleSupplySelect(idx, s)}
                    excludeIds={excludedSupplyIds.filter((id) => id !== line.supplyId)}
                  />

                  {/* Quantity */}
                  <input
                    type="number"
                    min={0.0001}
                    step="any"
                    value={line.quantityUsed}
                    onChange={(e) =>
                      updateSupplyLine(idx, "quantityUsed", Number(e.target.value))
                    }
                    placeholder="Cant."
                    className="h-9 w-full rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeSupplyLine(idx)}
                    disabled={supplyLines.length === 1}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-rose-500 transition-all hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Eliminar línea"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground/60">
              Especifica cada insumo y la cantidad que se consume en este lote. Los stocks se descontarán automáticamente al completar la producción.
            </p>
          </section>

          {/* ── Sección 4: Notas ──────────────────────────────── */}
          <section className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones adicionales sobre este lote..."
              className="w-full resize-none rounded-[11px] border border-border/40 bg-card/45 px-3 py-2.5 text-xs outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </section>

          {/* ── Footer ────────────────────────────────────────── */}
          <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t border-border/25 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none px-4 rounded-lg text-xs font-semibold border-border/80 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none px-5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Registrar Producción
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
