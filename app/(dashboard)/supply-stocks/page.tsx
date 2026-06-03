"use client"

import * as React from "react"
import { useSupplyStocks } from "@/features/supply-stocks/hooks/use-supply-stocks"
import { useSupplies } from "@/features/supplies/hooks/use-supplies"
import { SupplyStockCard } from "@/features/supply-stocks/components/supply-stock-card"
import { InitializeSupplyStockModal } from "@/features/supply-stocks/components/initialize-supply-stock-modal"
import { EditSupplyMinQuantityModal } from "@/features/supply-stocks/components/edit-supply-min-quantity-modal"
import { SupplyStockEntriesTab } from "@/features/supply-stocks/components/supply-stock-entries-tab"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { Button } from "@/shared/components/ui/button"
import type { SupplyStock } from "@/features/supply-stocks/types/supply-stocks.types"
import { useInitializeMissingEntries } from "@/features/supply-stocks-entries/hooks/use-supply-stocks-entries"
import { ChevronLeft, ChevronRight, AlertCircle, Inbox, RefreshCw, Layers, Archive, PackageX, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 6

type ActiveTab = "stock" | "entries"

export default function SupplyStocksPage() {
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("stock")
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [showExhausted, setShowExhausted] = React.useState(false)
  const [refreshEntriesTrigger, setRefreshEntriesTrigger] = React.useState(0)

  // Modals state
  const [isInitializeOpen, setIsInitializeOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedStock, setSelectedStock] = React.useState<SupplyStock | null>(null)

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handler)
  }, [search])

  // Reset page when search or tab changes
  React.useEffect(() => { setPage(1) }, [debouncedSearch, activeTab])

  // Fetch stocks
  const {
    data: stocksResponse,
    isLoading: isStocksLoading,
    error: stocksError,
    refetch: refetchStocks,
  } = useSupplyStocks({
    limit: 100,
    orderBy: "updatedAt",
    order: "DESC",
  })

  // Fetch active supplies for local filtering
  const {
    data: suppliesResponse,
    isLoading: isSuppliesLoading,
  } = useSupplies({ limit: 100, isActive: true })

  // Legacy initialization mutation
  const initializeMissingMutation = useInitializeMissingEntries()

  // Toast on API error
  React.useEffect(() => {
    if (stocksError) {
      toast.error("Error al cargar inventario de insumos", {
        description: stocksError instanceof Error ? stocksError.message : "Intente nuevamente más tarde.",
      })
    }
  }, [stocksError])

  const stocks = stocksResponse?.data || []
  const supplies = suppliesResponse?.data || []

  const existingSupplyIds = React.useMemo(() => stocks.map((s) => s.supplyId), [stocks])

  const supplyMap = React.useMemo(() => {
    const map: Record<string, { name: string }> = {}
    supplies.forEach((s) => { map[s.id] = { name: s.name } })
    return map
  }, [supplies])

  const filteredStocks = React.useMemo(() => {
    if (!debouncedSearch.trim()) return stocks
    const query = debouncedSearch.toLowerCase()
    return stocks.filter((stock) => {
      const sup = supplyMap[stock.supplyId]
      return (
        sup?.name?.toLowerCase().includes(query) ||
        stock.location?.toLowerCase().includes(query)
      )
    })
  }, [stocks, supplyMap, debouncedSearch])

  const totalItems = filteredStocks.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedStocks = React.useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredStocks.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredStocks, page])

  const handleEditMinQuantity = (stock: SupplyStock) => {
    setSelectedStock(stock)
    setIsEditOpen(true)
  }

  const handleInitializeLegacy = () => {
    initializeMissingMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.initialized === 0) {
          toast.info("No hay lotes pendientes de inicializar", {
            description: "Todos los stocks ya tienen al menos un lote registrado.",
          })
        } else {
          toast.success(`${result.initialized} lote(s) inicializado(s) correctamente`, {
            description: "Los registros legacy ahora tienen un entry de arranque.",
          })
          refetchStocks()
          setRefreshEntriesTrigger((prev) => prev + 1)
        }
      },
      onError: (err) => {
        toast.error("Error al inicializar lotes legacy", {
          description: err instanceof Error ? err.message : "Intente nuevamente.",
        })
      },
    })
  }

  const isLoading = isStocksLoading || isSuppliesLoading

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "stock",
      label: "Stock General",
      icon: <Layers className="h-3.5 w-3.5" />,
    },
    {
      id: "entries",
      label: "Lotes de Stock",
      icon: <Archive className="h-3.5 w-3.5" />,
    },
  ]

  return (
    <div className="space-y-5 p-1">

      {/* ── Tab Switcher ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border/40 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <DataTableToolbar className="pb-1"
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === "stock"
                ? "Buscar por insumo o ubicación..."
                : "Buscar por nombre de insumo o compra..."
            }
            shortcutKey="/"
            shape="md"
          />
        }
        filterSection={null}
        actionSection={
          activeTab === "stock" ? (
            <div className="grid grid-cols-[auto_1fr] gap-2 w-full sm:flex sm:items-center sm:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchStocks()}
                disabled={isLoading}
                title="Refrescar datos"
                className="h-9 w-9 rounded-[11px] shrink-0 border border-border/40 bg-card hover:bg-muted"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <DataTableAction
                actionType="create"
                label="Inicializar Stock"
                shape="md"
                className="w-full sm:w-auto min-w-0"
                onClick={() => setIsInitializeOpen(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 w-full sm:flex sm:items-center sm:w-auto">
              {/* Solo agotados */}
              <button
                onClick={() => setShowExhausted((prev) => !prev)}
                className={cn(
                  "inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer select-none h-9 w-full sm:w-auto",
                  showExhausted
                    ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <PackageX className="h-3.5 w-3.5 shrink-0" />
                {showExhausted ? "Solo agotados ✓" : "Mostrar solo agotados"}
              </button>

              {/* Recargar lotes */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  refetchStocks()
                  setRefreshEntriesTrigger((prev) => prev + 1)
                }}
                title="Recargar lotes"
                className="h-9 w-9 rounded-[11px] shrink-0 border border-border/40 bg-card hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Inicializar Legacy */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleInitializeLegacy}
                disabled={initializeMissingMutation.isPending}
                className="inline-flex items-center gap-1.5 text-xs h-9 rounded-[11px] border-dashed border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/60 shrink-0"
              >
                {initializeMissingMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Inicializar Legacy
              </Button>
            </div>
          )
        }
      />

      {/* ── Tab Content ──────────────────────────────────────────── */}
      {activeTab === "stock" ? (
        /* ── Stock General View ── */
        isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`supply-stock-skeleton-${idx}`}
                className="h-24 w-full rounded-xl border border-border bg-card animate-pulse flex items-center justify-between p-5 gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-28 bg-muted rounded hidden sm:block" />
                <div className="flex gap-4">
                  <div className="h-8 w-14 bg-muted rounded" />
                  <div className="h-8 w-14 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : stocksError ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-destructive/20 bg-destructive/5 rounded-2xl text-destructive gap-3">
            <AlertCircle className="h-10 w-10 animate-bounce" />
            <h3 className="font-bold text-lg">Error al recuperar el inventario de insumos</h3>
            <p className="text-sm text-center max-w-md opacity-90">
              Hubo un problema de red o permisos al conectarse con el servidor.
            </p>
            <Button
              variant="outline"
              onClick={() => refetchStocks()}
              className="mt-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Reintentar
            </Button>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 border border-border/30 bg-muted/10 rounded-2xl text-muted-foreground gap-4">
            <div className="p-4 rounded-full bg-muted/40 text-muted-foreground/60 border border-border/20">
              <Inbox className="h-10 w-10 stroke-1" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-foreground">
                {search.trim() ? "No se encontraron resultados" : "Inventario de insumos sin existencias"}
              </h3>
              <p className="text-xs text-muted-foreground/90 max-w-sm">
                {search.trim()
                  ? "Prueba con términos diferentes o limpia el filtro de búsqueda."
                  : "No se han registrado existencias. Inicializa un insumo para comenzar a monitorear su stock."}
              </p>
            </div>
            {!search.trim() && (
              <Button
                onClick={() => setIsInitializeOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs"
              >
                Inicializar Stock
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {paginatedStocks.map((stock) => (
                <SupplyStockCard
                  key={stock.id}
                  stock={stock}
                  onEditMinQuantity={handleEditMinQuantity}
                />
              ))}
            </div>

            {totalItems > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border border-border/30 bg-muted/20 dark:bg-muted/10 rounded-2xl select-none mt-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                  <div>
                    Total: <span className="font-semibold text-foreground">{totalItems}</span>
                  </div>
                  <div>
                    Página <span className="font-semibold text-foreground">{page}</span> de{" "}
                    <span className="font-semibold text-foreground">{totalPages || 1}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="h-8 w-8 rounded-full border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center p-0 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="h-8 w-8 rounded-full border border-border/40 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center p-0 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* ── Entries / Lotes View ── */
        <SupplyStockEntriesTab
          search={debouncedSearch}
          showExhausted={showExhausted}
          refreshTrigger={refreshEntriesTrigger}
          onRefetch={refetchStocks}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────── */}
      <InitializeSupplyStockModal
        isOpen={isInitializeOpen}
        onClose={() => {
          setIsInitializeOpen(false)
          refetchStocks()
        }}
        existingSupplyIds={existingSupplyIds}
      />

      <EditSupplyMinQuantityModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedStock(null)
          refetchStocks()
        }}
        stock={selectedStock}
      />
    </div>
  )
}
