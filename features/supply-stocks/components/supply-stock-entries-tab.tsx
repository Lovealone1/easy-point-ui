"use client"

import * as React from "react"
import { useSupplyStockEntries } from "@/features/supply-stocks-entries/hooks/use-supply-stocks-entries"
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import type { SupplyStockEntry } from "@/features/supply-stocks-entries/types/supply-stocks-entries.types"
import type { UnitOfMeasure } from "@/features/supplies/types/supplies.types"
import { formatSupplyQuantity } from "@/shared/utils/supply-formatter"
import { CheckCircle2, XCircle, FlaskConical } from "lucide-react"
import { cn } from "@/shared/lib/utils"

interface SupplyStockEntriesTabProps {
  /** Search string forwarded from the parent toolbar */
  search: string
  /** Whether to show only exhausted entries */
  showExhausted: boolean
  /** Trigger to refetch entries from parent */
  refreshTrigger?: number
  /** Refetch trigger from parent toolbar refresh button */
  onRefetch?: () => void
}

const ITEMS_PER_PAGE = 8

function formatCurrency(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "—"
  return Number(val).toLocaleString("es-MX", { style: "currency", currency: "MXN" })
}

/** Formats a quantity using the supply-formatter util when unitOfMeasure is available */
function formatQty(val: string | null | undefined, unitOfMeasure?: string): string {
  if (val === null || val === undefined) return "—"
  if (unitOfMeasure) {
    return formatSupplyQuantity(Number(val), unitOfMeasure as UnitOfMeasure)
  }
  // Fallback: plain number
  return Number(val).toLocaleString("es-MX", { maximumFractionDigits: 4 })
}

export function SupplyStockEntriesTab({ search, showExhausted, refreshTrigger, onRefetch }: SupplyStockEntriesTabProps) {
  const [page, setPage] = React.useState(1)
  const [sortKey, setSortKey] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  // Reset to page 1 when filters change
  React.useEffect(() => { setPage(1) }, [search, showExhausted])

  const {
    data: entriesResponse,
    isLoading,
    refetch,
  } = useSupplyStockEntries({
    page,
    limit: ITEMS_PER_PAGE,
    orderBy: sortKey,
    order: sortOrder.toUpperCase() as "ASC" | "DESC",
  })

  // Refetch when parent triggers it
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refetch()
    }
  }, [refreshTrigger, refetch])

  const entries = entriesResponse?.data || []

  // Client-side filter: search by supply name or purchase id; toggle exhausted
  const filteredEntries = React.useMemo(() => {
    let result = entries

    if (showExhausted) {
      result = result.filter((e) => e.isExhausted)
    }

    if (!search.trim()) return result

    const q = search.toLowerCase()
    return result.filter((e) =>
      (e.supplyName ?? "").toLowerCase().includes(q) ||
      e.supplyStockId.toLowerCase().includes(q) ||
      (e.supplyPurchaseId ?? "").toLowerCase().includes(q)
    )
  }, [entries, search, showExhausted])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const columns: ColumnDef<SupplyStockEntry>[] = [
    {
      key: "supplyName",
      header: "Insumo",
      render: (row) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 border border-border/40">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground/60" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
              {row.supplyName ?? "—"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60 truncate">
              {row.supplyStockId.slice(0, 8)}…
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "supplyPurchaseId",
      header: "Compra Origen",
      render: (row) =>
        row.supplyPurchaseId ? (
          <span className="font-mono text-xs text-muted-foreground" title={row.supplyPurchaseId}>
            {row.supplyPurchaseId.slice(0, 8)}…
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground/50">Manual</span>
        ),
    },
    {
      key: "initialQuantity",
      header: "Cant. Inicial",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-foreground/80">
          {formatQty(row.initialQuantity, row.supplyUnitOfMeasure)}
        </span>
      ),
    },
    {
      key: "remainingQuantity",
      header: "Cant. Restante",
      align: "right",
      sortable: true,
      render: (row) => {
        const remaining = Number(row.remainingQuantity)
        const initial = Number(row.initialQuantity)
        const pct = initial > 0 ? (remaining / initial) * 100 : 0
        const color =
          row.isExhausted
            ? "text-muted-foreground/40"
            : pct <= 25
              ? "text-destructive"
              : pct <= 60
                ? "text-amber-500 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"

        return (
          <span className={cn("font-mono text-sm font-bold", color)}>
            {formatQty(row.remainingQuantity, row.supplyUnitOfMeasure)}
          </span>
        )
      },
    },
    {
      key: "unitCost",
      header: "Costo Unit.",
      align: "right",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatCurrency(row.unitCost)}
        </span>
      ),
    },
    {
      key: "isExhausted",
      header: "Estado",
      align: "center",
      render: (row) =>
        row.isExhausted ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 select-none">
            <XCircle className="h-3 w-3 shrink-0" />
            Agotado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 select-none">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Disponible
          </span>
        ),
    },
    {
      key: "createdAt",
      header: "Registrado",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Data Table */}
      <DataTable<SupplyStockEntry>
        columns={columns}
        data={filteredEntries}
        loading={isLoading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No se encontraron lotes de stock."
        pagination={{
          currentPage: page,
          totalPages: entriesResponse?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: entriesResponse?.meta?.itemCount || 0,
          itemsPerPage: ITEMS_PER_PAGE,
        }}
        glassy
      />
    </div>
  )
}
