"use client"

import * as React from "react"
import { useSupply } from "@/features/supplies/hooks/use-supplies"
import type { SupplyStock } from "../types/supply-stocks.types"
import { UNIT_OF_MEASURE_LABELS } from "@/features/supplies/types/supplies.types"
import { FlaskConical, MapPin, CalendarDays, Pencil, AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface SupplyStockCardProps {
  stock: SupplyStock
  onEditMinQuantity: (stock: SupplyStock) => void
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (e) {
    return "Fecha inválida"
  }
}

export function SupplyStockCard({ stock, onEditMinQuantity }: SupplyStockCardProps) {
  const { data: supply, isLoading: isSupplyLoading, isError: isSupplyError } = useSupply(stock.supplyId)

  const qty = Number(stock.quantity)
  const minQty = Number(stock.minQuantity)

  const isOutOfStock = qty === 0
  const isLowStock = minQty > 0 && qty <= minQty && qty > 0

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 px-5 rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 gap-4 w-full group relative overflow-hidden",
      isOutOfStock
        ? "border-destructive/30 hover:border-destructive/50 hover:shadow-destructive/5 shadow-sm"
        : isLowStock
          ? "border-brand-500/30 hover:border-brand-500/50 hover:shadow-brand-500/5 shadow-sm bg-brand-50/5 dark:bg-brand-950/5"
          : "border-border hover:border-brand-500/30 hover:shadow-brand-500/5"
    )}>
      {/* Decorative vertical bar for alerts */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
        isOutOfStock
          ? "bg-destructive"
          : isLowStock
            ? "bg-brand-500/60"
            : "bg-transparent group-hover:bg-brand-500"
      )} />

      {/* Left: Supply Information */}
      <div className="flex items-center gap-4 min-w-0 flex-1 pl-1">
        {/* Supply Icon Placeholder */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border/50 text-muted-foreground group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
          {isSupplyLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" />
          ) : (
            <FlaskConical className="h-6 w-6 text-muted-foreground/60" />
          )}
        </div>

        {/* Text information */}
        <div className="flex flex-col min-w-0">
          {isSupplyLoading ? (
            <div className="space-y-2">
              <div className="h-4 w-36 sm:w-48 bg-muted animate-pulse rounded" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </div>
          ) : isSupplyError ? (
            <div className="space-y-1">
              <span className="text-sm font-semibold text-destructive">Error al cargar insumo</span>
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px] sm:max-w-[250px] block">
                ID: {stock.supplyId}
              </span>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-foreground text-base tracking-tight leading-snug group-hover:text-brand-500 transition-colors duration-200 truncate max-w-[200px] sm:max-w-[300px]">
                {supply?.name}
              </h3>
              <div className="text-xs font-mono text-muted-foreground/80 mt-1 flex items-center gap-2 flex-wrap">
                {supply?.unitOfMeasure && (
                  <span className="bg-muted px-1.5 py-0.5 rounded border border-border/40">
                    {UNIT_OF_MEASURE_LABELS[supply.unitOfMeasure]}
                  </span>
                )}
                {supply?.packageSize && (
                  <span className="bg-muted px-1.5 py-0.5 rounded border border-border/40">
                    Paquete: {supply.packageSize}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle: Location & Updated Date */}
      <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2 sm:gap-1.5 w-full sm:w-auto text-xs text-muted-foreground pl-1 sm:pl-0 sm:min-w-[180px] shrink-0">
        <div className="flex items-center gap-1.5 text-foreground/70 font-medium">
          <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0" />
          <span>{stock.location || "Principal"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/80">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>Actualizado: {formatDate(stock.updatedAt)}</span>
        </div>
      </div>

      {/* Right: Quantities & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0 pl-1 sm:pl-0">
        {/* Alerts if out of stock / low stock */}
        {isOutOfStock && (
          <span className="bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 select-none animate-pulse">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Sin Stock
          </span>
        )}
        {isLowStock && (
          <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 select-none">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Stock Bajo
          </span>
        )}

        <div className="flex gap-6 items-center ml-auto sm:ml-0">
          {/* Quantity */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Cantidad
            </span>
            <span className={cn(
              "text-2xl font-black font-mono leading-none mt-1.5",
              isOutOfStock
                ? "text-destructive"
                : isLowStock
                  ? "text-brand-500 dark:text-brand-400"
                  : "text-brand-600 dark:text-brand-400"
            )}>
              {qty}
            </span>
          </div>

          {/* Min Quantity */}
          <div className="flex flex-col items-end pr-1 border-r border-border/40 mr-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Mínimo
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm font-bold font-mono text-foreground/80">
                {Number(stock.minQuantity)}
              </span>
              <button
                onClick={() => onEditMinQuantity(stock)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 active:scale-90 cursor-pointer"
                title="Editar cantidad mínima"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
