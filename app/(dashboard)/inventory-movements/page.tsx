"use client"

import * as React from "react"
import { useInventoryMovements } from "@/features/inventory-movements/hooks/use-inventory-movements"
import { useProducts } from "@/features/products/hooks/use-products"
import { useProductStocks } from "@/features/product-stocks/hooks/use-product-stocks"
import { CreateMovementModal } from "@/features/inventory-movements/components/create-movement-modal"
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableFilter } from "@/shared/components/ui/data-table-filter"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { Button } from "@/shared/components/ui/button"
import type { InventoryMovement, MovementType } from "@/features/inventory-movements/types/inventory-movements.types"
import { ChevronDown, MapPin, Settings, Trash2, ShieldAlert, Hammer, RefreshCw } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 9

const MOVEMENT_TYPE_CONFIG: Record<
  MovementType,
  { label: string; className: string }
> = {
  SALE: {
    label: "Venta",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  },
  PURCHASE: {
    label: "Compra",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  PRODUCTION: {
    label: "Producción",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  ADJUSTMENT: {
    label: "Ajuste",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  WASTE: {
    label: "Merma",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  TESTS: {
    label: "Test / Prueba",
    className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  },
}

const TYPE_FILTER_OPTIONS = [
  { label: "Ventas", value: "SALE" },
  { label: "Compras", value: "PURCHASE" },
  { label: "Producción", value: "PRODUCTION" },
  { label: "Ajustes", value: "ADJUSTMENT" },
  { label: "Mermas / Gastos", value: "WASTE" },
  { label: "Tests / Pruebas", value: "TESTS" },
]

export default function InventoryMovementsPage() {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [sortKey, setSortKey] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")

  // Modal States
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedType, setSelectedType] = React.useState<MovementType | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typeFilter])

  // Fetch product stocks to map locations
  const { data: stocksResponse } = useProductStocks({ limit: 100 })
  const { data: productsResponse } = useProducts({ limit: 100 })

  // Location options removed as the filter is disabled

  // Maps for quick client-side lookup
  const productMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    productsResponse?.data?.forEach((p) => {
      map[p.id] = p.name
    })
    return map
  }, [productsResponse])

  const stockMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    stocksResponse?.data?.forEach((s) => {
      map[s.id] = s.location || "Principal"
    })
    return map
  }, [stocksResponse])

  // Fetch paginated inventory movements
  const queryParams = {
    page,
    limit: ITEMS_PER_PAGE,
    orderBy: sortKey,
    order: sortOrder === "asc" ? ("ASC" as const) : ("DESC" as const),
    type: typeFilter !== "all" ? (typeFilter as MovementType) : undefined,
  }

  const { data: response, isLoading, error, refetch } = useInventoryMovements(queryParams)

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar movimientos de inventario", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Apply local search filtering (matches product names)
  const filteredData = React.useMemo(() => {
    let data = response?.data || []

    // 1. Search filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      data = data.filter((row) => {
        const prodName = row.productName || productMap[row.productId] || ""
        return prodName.toLowerCase().includes(q)
      })
    }

    return data
  }, [response, debouncedSearch, productMap])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const columns: ColumnDef<InventoryMovement>[] = [
    {
      key: "id",
      header: "ID / Folio",
      className: "w-[140px] pr-8",
      headerClassName: "pr-8",
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
      className: "w-[180px] pr-8",
      headerClassName: "pr-8",
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs text-left">
          <span className="font-medium text-foreground">
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
      key: "productId",
      header: "Producto",
      className: "w-[260px] pr-8",
      headerClassName: "pr-8",
      render: (row) => (
        <span className="text-xs font-semibold text-foreground truncate max-w-[220px] block text-left">
          {row.productName || productMap[row.productId] || "Cargando..."}
        </span>
      ),
    },
    {
      key: "stockId",
      header: "Ubicación",
      className: "w-[180px] pr-8",
      headerClassName: "pr-8",
      render: (row) => {
        const locationName = stockMap[row.stockId] || "Principal"
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-start">
            <MapPin className="h-3 w-3 shrink-0 text-brand-500" />
            <span className="truncate">{locationName}</span>
          </div>
        )
      },
    },
    {
      key: "type",
      header: "Tipo",
      className: "w-[150px] pr-8",
      headerClassName: "pr-8",
      render: (row) => {
        const cfg = MOVEMENT_TYPE_CONFIG[row.type]
        if (!cfg) return <span className="text-xs uppercase">{row.type}</span>
        return (
          <span className={cn(
            "inline-flex items-center justify-center gap-1 text-[10px] font-bold py-0.5 rounded-full border uppercase tracking-wide w-[96px] shrink-0",
            cfg.className
          )}>
            {cfg.label}
          </span>
        )
      },
    },
    {
      key: "quantity",
      header: "Cantidad",
      className: "w-[150px] pr-8",
      headerClassName: "pr-8",
      render: (row) => {
        const numQty = Number(row.quantity)
        
        let isNegative = false
        if (row.type === "SALE" || row.type === "WASTE" || row.type === "TESTS") {
          isNegative = true
        } else if (row.type === "PURCHASE" || row.type === "PRODUCTION") {
          isNegative = false
        } else if (row.type === "ADJUSTMENT") {
          isNegative = numQty < 0
        }

        const displayQty = Math.abs(numQty)
        const sign = isNegative ? "-" : "+"

        return (
          <span className={cn(
            "font-mono font-bold text-xs tabular-nums text-left block",
            isNegative 
              ? "text-brand-400 dark:text-brand-500" 
              : "text-brand-600 dark:text-brand-300"
          )}>
            {sign}{displayQty}
          </span>
        )
      },
    },
    {
      key: "reason",
      header: "Motivo / Comentarios",
      className: "min-w-[200px] flex-1 pr-4",
      headerClassName: "pr-4",
      render: (row) => (
        <span className="text-xs text-muted-foreground/80 line-clamp-1 max-w-[280px] text-left block" title={row.reason || ""}>
          {row.reason || <span className="italic text-muted-foreground/40">—</span>}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-1">
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por producto..."
            shortcutKey="/"
            shape="md"
          />
        }
        filterSection={
          <DataTableFilter
            title="Tipo"
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_FILTER_OPTIONS}
            placeholder="Todos"
            className="hidden sm:flex w-[110px] shrink-0"
            triggerClassName="w-full"
          />
        }
        actionSection={
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            {/* Type filter dropdown (Mobile only) */}
            <DataTableFilter
              title="Tipo"
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_FILTER_OPTIONS}
              placeholder="Todos"
              className="w-[110px] shrink-0 sm:hidden"
              triggerClassName="w-full"
            />

            {/* Refetch button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refrescar datos"
              className="h-9 w-9 rounded-[11px] shrink-0 border border-border/40 bg-card hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            {/* Registrar Movimiento Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <Button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full justify-between sm:justify-start sm:w-auto whitespace-nowrap bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold px-4 h-9 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <span>Registrar Movimiento</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-popover border border-border/25 rounded-xl shadow-lg p-1 z-40 animate-in fade-in slide-in-from-top-1.5 duration-150">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setSelectedType("ADJUSTMENT")
                        setIsModalOpen(true)
                      }}
                      className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-primary/10 hover:text-brand-500 transition-colors cursor-pointer flex items-center gap-2 font-semibold text-foreground"
                    >
                      <Settings className="h-3.5 w-3.5 text-amber-500" />
                      <span>Ajuste de Stock</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setSelectedType("WASTE")
                        setIsModalOpen(true)
                      }}
                      className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-primary/10 hover:text-brand-500 transition-colors cursor-pointer flex items-center gap-2 font-semibold text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      <span>Merma / Gasto</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setSelectedType("TESTS")
                        setIsModalOpen(true)
                      }}
                      className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-primary/10 hover:text-brand-500 transition-colors cursor-pointer flex items-center gap-2 font-semibold text-foreground"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Prueba / Test</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false)
                        setSelectedType("PRODUCTION")
                        setIsModalOpen(true)
                      }}
                      className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-primary/10 hover:text-brand-500 transition-colors cursor-pointer flex items-center gap-2 font-semibold text-foreground"
                    >
                      <Hammer className="h-3.5 w-3.5 text-purple-500" />
                      <span>Producción Manual</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      {/* ── DataTable ──────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        emptyMessage="No se encontraron movimientos de inventario. Ajusta los filtros o registra una nueva transacción."
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
        glassy
      />

      {/* ── Create Movement Modal ────────────────────────────────────────────── */}
      <CreateMovementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedType(null)
        }}
        type={selectedType}
      />
    </div>
  )
}
