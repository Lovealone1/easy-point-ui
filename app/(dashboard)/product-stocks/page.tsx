"use client"

import * as React from "react"
import { useProductStocks } from "@/features/product-stocks/hooks/use-product-stocks"
import { useProducts } from "@/features/products/hooks/use-products"
import { ProductStockCard } from "@/features/product-stocks/components/product-stock-card"
import { InitializeStockModal } from "@/features/product-stocks/components/initialize-stock-modal"
import { EditMinQuantityModal } from "@/features/product-stocks/components/edit-min-quantity-modal"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { Button } from "@/shared/components/ui/button"
import type { ProductStock } from "@/features/product-stocks/types/product-stocks.types"
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const ITEMS_PER_PAGE = 6

export default function ProductStocksPage() {
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  // Modals state
  const [isInitializeOpen, setIsInitializeOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [selectedStock, setSelectedStock] = React.useState<ProductStock | null>(null)

  // Debounce search query to prevent constant rendering recalculations
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  // Reset page when search term changes
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch stocks: fetch up to 100 records for client-side search and mapping
  const {
    data: stocksResponse,
    isLoading: isStocksLoading,
    error: stocksError,
    refetch: refetchStocks
  } = useProductStocks({
    limit: 100,
    orderBy: "updatedAt",
    order: "DESC",
  })

  // Fetch active products (limit 100) to match names/SKUs for local filtering
  const {
    data: productsResponse,
    isLoading: isProductsLoading
  } = useProducts({ limit: 100, isActive: true })

  // Toast message on API error
  React.useEffect(() => {
    if (stocksError) {
      toast.error("Error al cargar inventario", {
        description: stocksError instanceof Error ? stocksError.message : "Intente nuevamente más tarde.",
      })
    }
  }, [stocksError])

  const stocks = stocksResponse?.data || []
  const products = productsResponse?.data || []

  // Extract a list of product IDs currently in stock to filter initialization choices
  const existingProductIds = React.useMemo(() => {
    return stocks.map((s) => s.productId)
  }, [stocks])

  // Build a lookup map for products to filter stocks locally
  const productMap = React.useMemo(() => {
    const map: Record<string, { name: string; sku: string; barcode: string }> = {}
    products.forEach((p) => {
      map[p.id] = {
        name: p.name,
        sku: p.sku || "",
        barcode: p.barcode || ""
      }
    })
    return map
  }, [products])

  // Filter stocks by product name, sku, barcode, or location locally
  const filteredStocks = React.useMemo(() => {
    if (!debouncedSearch.trim()) return stocks

    const query = debouncedSearch.toLowerCase()
    return stocks.filter((stock) => {
      const prod = productMap[stock.productId]
      const nameMatch = prod?.name?.toLowerCase().includes(query)
      const skuMatch = prod?.sku?.toLowerCase().includes(query)
      const barcodeMatch = prod?.barcode?.toLowerCase().includes(query)
      const locationMatch = stock.location?.toLowerCase().includes(query)

      return nameMatch || skuMatch || barcodeMatch || locationMatch
    })
  }, [stocks, productMap, debouncedSearch])

  // Client-side pagination
  const totalItems = filteredStocks.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedStocks = React.useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredStocks.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredStocks, page])

  const handleEditMinQuantity = (stock: ProductStock) => {
    setSelectedStock(stock)
    setIsEditOpen(true)
  }

  const isLoading = isStocksLoading || isProductsLoading

  return (
    <div className="space-y-4 p-1">

      {/* Toolbar: Search input + Initialize button */}
      <DataTableToolbar className="pb-1"
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por producto, SKU o ubicación..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
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
        }
      />

      {/* Main Stock List Area */}
      {isLoading ? (
        // Skeleton List loading state
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`stock-skeleton-${idx}`}
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
        // Error state
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-destructive/20 bg-destructive/5 rounded-2xl text-destructive gap-3">
          <AlertCircle className="h-10 w-10 animate-bounce" />
          <h3 className="font-bold text-lg">Error al recuperar el inventario</h3>
          <p className="text-sm text-center max-w-md opacity-90">
            Hubo un problema de red o permisos al conectarse con el servidor. Por favor, recarga la página.
          </p>
          <Button
            variant="outline"
            onClick={() => refetchStocks()}
            className="mt-2 border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Reintentar
          </Button>
        </div>
      ) : filteredStocks.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-border/30 bg-muted/10 rounded-2xl text-muted-foreground gap-4">
          <div className="p-4 rounded-full bg-muted/40 text-muted-foreground/60 border border-border/20">
            <Inbox className="h-10 w-10 stroke-1" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {search.trim() ? "No se encontraron resultados" : "Inventario sin existencias"}
            </h3>
            <p className="text-xs text-muted-foreground/90 max-w-sm">
              {search.trim()
                ? "Prueba con términos diferentes o limpia el filtro de búsqueda."
                : "No se han registrado existencias. Inicializa un producto para comenzar a monitorear su stock."}
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
        // Vertical elongated cards list
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {paginatedStocks.map((stock) => (
              <ProductStockCard
                key={stock.id}
                stock={stock}
                onEditMinQuantity={handleEditMinQuantity}
              />
            ))}
          </div>

          {/* Client-side Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border border-border/30 bg-muted/20 dark:bg-muted/10 rounded-2xl select-none mt-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                <div>
                  Total en esta vista: <span className="font-semibold text-foreground">{totalItems}</span>
                </div>
                <div>
                  Página <span className="font-semibold text-foreground">{page}</span> de{" "}
                  <span className="font-semibold text-foreground">{totalPages}</span>
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
      )}

      {/* Initialize Stock Modal */}
      <InitializeStockModal
        isOpen={isInitializeOpen}
        onClose={() => {
          setIsInitializeOpen(false)
          refetchStocks()
        }}
        existingProductIds={existingProductIds}
      />

      {/* Edit Min Quantity Modal */}
      <EditMinQuantityModal
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
