"use client"

import * as React from "react"
import {
  Pencil,
  Trash2,
  Loader2,
  Factory,
  Calendar,
  Package,
  DollarSign,
  ClipboardList,
  XCircle,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { Production } from "../types/productions.types"

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  COMPLETED: {
    label: "Completada",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  DRAFT: {
    label: "Borrador",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "Cancelada",
    className:
      "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20",
    dot: "bg-zinc-400",
  },
} as const

const TYPE_CONFIG = {
  SELLABLE: {
    label: "Vendible",
    className:
      "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20",
  },
  INTERMEDIATE: {
    label: "Intermedia",
    className:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(num)
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductionCardProps {
  production: Production
  onEdit: (production: Production) => void
  onDelete: (production: Production) => void
  isDeleting?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductionCard({
  production,
  onEdit,
  onDelete,
  isDeleting = false,
}: ProductionCardProps) {
  const status = STATUS_CONFIG[production.status]
  const type = TYPE_CONFIG[production.type]

  const canEdit = production.status !== "COMPLETED"
  const canDelete = true

  return (
    <div
      className={cn(
        "glassy-card group relative flex flex-col gap-4 rounded-xl p-5",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        "hover:border-border/60"
      )}
    >
      {/* ── Top row: name + type badge ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Factory className="h-4 w-4 text-primary" />
            </div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {production.name}
            </h3>
          </div>
        </div>

        {/* Badges */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              status.className
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
              type.className
            )}
          >
            {type.label}
          </span>
        </div>
      </div>

      {/* ── Details grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Date */}
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/60">
              Fecha
            </p>
            <p className="truncate text-xs font-semibold text-foreground">
              {formatDate(production.productionDate)}
            </p>
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2">
          <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/60">
              Cantidad
            </p>
            <p className="truncate text-xs font-semibold text-foreground">
              {Math.round(parseFloat(production.quantityProduced)).toLocaleString("es-CO")}{" "}
              <span className="text-[10px] text-muted-foreground">uds.</span>
            </p>
          </div>
        </div>

        {/* Total cost */}
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2">
          <DollarSign className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/60">
              Costo Total
            </p>
            <p className="truncate font-mono text-xs font-bold text-brand-500 dark:text-brand-400">
              {formatCurrency(production.totalCost)}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2">
          <ClipboardList className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/60">
              Notas
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {production.notes || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-1.5 border-t border-border/25 pt-3">
        {/* Edit / cancel (only DRAFT) */}
        <button
          onClick={() => onEdit(production)}
          disabled={!canEdit}
          title={canEdit ? "Editar notas" : "Las producciones completadas no se pueden editar"}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer",
            canEdit
              ? "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              : "cursor-not-allowed opacity-30"
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>

        {/* Delete (DRAFT or CANCELLED only) */}
        <button
          onClick={() => onDelete(production)}
          disabled={isDeleting || !canDelete}
          title="Eliminar producción"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95",
            canDelete
              ? "cursor-pointer text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
              : "cursor-not-allowed opacity-30 text-muted-foreground"
          )}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Eliminar
        </button>
      </div>
    </div>
  )
}
