"use client"

import * as React from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Eye,
  Calendar,
  X
} from "lucide-react"

import { cn } from "@/shared/lib/utils"
import {
  useUtilities,
  useUtilitiesByProduct,
  useUtilitiesByCategory
} from "@/features/utilities/hooks/use-utilities"
import type {
  SaleUtility,
  ProductUtilityRow,
  CategoryUtilityRow,
  FindUtilitiesParams
} from "@/features/utilities/types/utilities.types"

import { useProductCategories, useProducts } from "@/features/products/hooks/use-products"
import { useClients } from "@/features/clients/hooks/use-clients"
import { useOrganizationUsers } from "@/features/organization-users/hooks/use-organization-users"

import { DatePicker } from "@/shared/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/shared/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/shared/components/ui/dialog"
import { DataTable, ColumnDef } from "@/shared/components/ui/data-table"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAdvancedFilter } from "@/shared/components/ui/data-table-advanced-filter"

export default function UtilitiesPage() {
  // Tabs state
  const [activeTab, setActiveTab] = React.useState<"sales" | "products" | "categories">("sales")

  // Detail Modal state
  const [selectedSale, setSelectedSale] = React.useState<SaleUtility | null>(null)

  // Filters Sidebar Drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false)

  // Search filter
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Filters State - Using empty string "" for default "Todos" state instead of "all"
  const [dateFrom, setDateFrom] = React.useState<Date | null>(null)
  const [dateTo, setDateTo] = React.useState<Date | null>(null)
  const [productId, setProductId] = React.useState<string>("")
  const [categoryId, setCategoryId] = React.useState<string>("")
  const [clientId, setClientId] = React.useState<string>("")
  const [performedByUserId, setPerformedByUserId] = React.useState<string>("")
  const [paymentMethod, setPaymentMethod] = React.useState<string>("")

  // Pagination state for Individual Sales
  const [currentPage, setCurrentPage] = React.useState(1)
  const limit = 9 // Adjusted to fit exactly 9 rows per client preferences

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset pagination on filter or search change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, dateFrom, dateTo, productId, categoryId, clientId, performedByUserId, paymentMethod])

  // Clear filters not applicable to the active tab
  React.useEffect(() => {
    if (activeTab === "sales" || activeTab === "categories") {
      setProductId("")
      setCategoryId("")
    } else if (activeTab === "products") {
      setProductId("")
    }
  }, [activeTab])

  // Build params DTO
  const params = React.useMemo(() => {
    const p: FindUtilitiesParams = {
      page: currentPage,
      limit,
    }
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim()
    if (dateFrom) p.dateFrom = format(dateFrom, "yyyy-MM-dd")
    if (dateTo) p.dateTo = format(dateTo, "yyyy-MM-dd")
    if (productId) p.productId = productId
    if (categoryId) p.categoryId = categoryId
    if (clientId) p.clientId = clientId
    if (performedByUserId) p.performedByUserId = performedByUserId
    if (paymentMethod) p.paymentMethod = paymentMethod
    return p
  }, [currentPage, debouncedSearch, dateFrom, dateTo, productId, categoryId, clientId, performedByUserId, paymentMethod])

  // Query API
  const { data: utilitiesResponse, isLoading: isUtilitiesLoading } = useUtilities(params)
  const { data: productData, isLoading: isProductLoading } = useUtilitiesByProduct(params)
  const { data: categoryData, isLoading: isCategoryLoading } = useUtilitiesByCategory(params)

  // Dropdowns source data
  const { data: categoriesResponse } = useProductCategories()
  const { data: productsResponse } = useProducts({ limit: 100 })
  const { data: clientsResponse } = useClients({ limit: 100 })
  const { data: usersResponse } = useOrganizationUsers({ limit: 100 })

  const categories = categoriesResponse?.data || []
  const products = productsResponse?.data || []
  const clients = clientsResponse?.data || []
  const users = usersResponse?.data || []

  // Create Product Name Map for detail dialog
  const productMap = React.useMemo(() => {
    return new Map(products.map((p) => [p.id, p.name]))
  }, [products])

  // Calculate active filters count
  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (dateFrom) count++
    if (dateTo) count++
    if (productId) count++
    if (categoryId) count++
    if (clientId) count++
    if (performedByUserId) count++
    if (paymentMethod) count++
    return count
  }, [dateFrom, dateTo, productId, categoryId, clientId, performedByUserId, paymentMethod])

  // Format Helper: Símbolo a la derecha de los valores
  const formatCurrency = (val: number | string | undefined | null) => {
    if (val === undefined || val === null) return "0 $"
    const num = typeof val === "string" ? parseFloat(val) : val
    if (isNaN(num)) return "0 $"
    return `${num.toLocaleString("es-CL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} $`
  }

  const formatMargin = (val: number | string | undefined | null) => {
    if (val === undefined || val === null) return "0.0%"
    const num = typeof val === "string" ? parseFloat(val) : val
    if (isNaN(num)) return "0.0%"
    return `${num.toFixed(1)}%`
  }

  // Clear filters handler
  const handleClearFilters = () => {
    setDateFrom(null)
    setDateTo(null)
    setProductId("")
    setCategoryId("")
    setClientId("")
    setPerformedByUserId("")
    setPaymentMethod("")
    setSearch("")
    toast.success("Filtros restablecidos")
  }

  // Local sorting states
  const [salesSortKey, setSalesSortKey] = React.useState<string>("createdAt")
  const [salesSortOrder, setSalesSortOrder] = React.useState<"asc" | "desc">("desc")

  const [productSortKey, setProductSortKey] = React.useState<string>("unitsSold")
  const [productSortOrder, setProductSortOrder] = React.useState<"asc" | "desc">("desc")

  const [categorySortKey, setCategorySortKey] = React.useState<string>("unitsSold")
  const [categorySortOrder, setCategorySortOrder] = React.useState<"asc" | "desc">("desc")

  // Memoized sorted lists
  const sortedSales = React.useMemo(() => {
    const rawList = [...(utilitiesResponse?.data || [])]
    rawList.sort((a, b) => {
      let aVal: any = a[salesSortKey as keyof SaleUtility]
      let bVal: any = b[salesSortKey as keyof SaleUtility]

      if (salesSortKey === "clientName") {
        aVal = a.sale?.clientName || ""
        bVal = b.sale?.clientName || ""
      } else if (salesSortKey === "performedByUserEmail") {
        aVal = a.sale?.performedByUserEmail || ""
        bVal = b.sale?.performedByUserEmail || ""
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return salesSortOrder === "asc" ? aVal - bVal : bVal - aVal
      }

      aVal = String(aVal || "").toLowerCase()
      bVal = String(bVal || "").toLowerCase()

      if (aVal < bVal) return salesSortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return salesSortOrder === "asc" ? 1 : -1
      return 0
    })
    return rawList
  }, [utilitiesResponse, salesSortKey, salesSortOrder])

  const sortedProducts = React.useMemo(() => {
    const rawList = [...(productData || [])]
    rawList.sort((a, b) => {
      const aVal = a[productSortKey as keyof ProductUtilityRow]
      const bVal = b[productSortKey as keyof ProductUtilityRow]

      if (typeof aVal === "number" && typeof bVal === "number") {
        return productSortOrder === "asc" ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal || "").toLowerCase()
      const bStr = String(bVal || "").toLowerCase()

      if (aStr < bStr) return productSortOrder === "asc" ? -1 : 1
      if (aStr > bStr) return productSortOrder === "asc" ? 1 : -1
      return 0
    })
    return rawList
  }, [productData, productSortKey, productSortOrder])

  const sortedCategories = React.useMemo(() => {
    const rawList = [...(categoryData || [])]
    rawList.sort((a, b) => {
      const aVal = a[categorySortKey as keyof CategoryUtilityRow]
      const bVal = b[categorySortKey as keyof CategoryUtilityRow]

      if (typeof aVal === "number" && typeof bVal === "number") {
        return categorySortOrder === "asc" ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal || "").toLowerCase()
      const bStr = String(bVal || "").toLowerCase()

      if (aStr < bStr) return categorySortOrder === "asc" ? -1 : 1
      if (aStr > bStr) return categorySortOrder === "asc" ? 1 : -1
      return 0
    })
    return rawList
  }, [categoryData, categorySortKey, categorySortOrder])

  // Columns definition: Sales Table
  const salesColumns: ColumnDef<SaleUtility>[] = [
    {
      key: "id",
      header: "Código Venta",
      sortable: true,
      className: "font-mono text-xs text-muted-foreground",
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/40 font-semibold">
          {row.saleId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "clientName",
      header: "Cliente",
      sortable: true,
      className: "font-medium text-foreground",
      render: (row) => row.sale?.clientName || "Cliente General",
    },
    {
      key: "performedByUserEmail",
      header: "Vendedor",
      sortable: true,
      className: "text-xs text-muted-foreground",
      render: (row) => row.sale?.performedByUserEmail || "Sistema",
    },
    {
      key: "createdAt",
      header: "Fecha",
      sortable: true,
      className: "text-xs text-muted-foreground font-medium",
      render: (row) => format(new Date(row.createdAt), "dd MMM yyyy, HH:mm", { locale: es }),
    },
    {
      key: "totalRevenue",
      header: "Ingreso",
      sortable: true,
      align: "left",
      className: "font-mono font-semibold text-left",
      render: (row) => formatCurrency(row.totalRevenue),
    },
    {
      key: "totalCost",
      header: "Costo",
      sortable: true,
      align: "left",
      className: "font-mono text-left text-muted-foreground/80",
      render: (row) => formatCurrency(row.totalCost),
    },
    {
      key: "grossProfit",
      header: "Utilidad",
      sortable: true,
      align: "left",
      className: "font-mono font-bold text-left",
      render: (row) => {
        const isNegative = Number(row.grossProfit) < 0
        return (
          <span className={isNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
            {formatCurrency(row.grossProfit)}
          </span>
        )
      },
    },
    {
      key: "marginPercent",
      header: "Margen",
      sortable: true,
      align: "left",
      className: "font-mono font-bold text-left",
      render: (row) => {
        const isNegative = Number(row.marginPercent) < 0
        return (
          <span className={isNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
            {formatMargin(row.marginPercent)}
          </span>
        )
      },
    },
    {
      key: "actions",
      header: "Detalle",
      align: "center",
      className: "text-center",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setSelectedSale(row)
          }}
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  // Columns definition: Grouped by Product
  const productColumns: ColumnDef<ProductUtilityRow>[] = [
    {
      key: "productName",
      header: "Producto",
      sortable: true,
      className: "font-semibold text-foreground",
    },
    {
      key: "categoryName",
      header: "Categoría",
      sortable: true,
      className: "text-xs text-muted-foreground",
      render: (row) => row.categoryName || "Sin Categoría",
    },
    {
      key: "unitsSold",
      header: "Unidades",
      sortable: true,
      align: "left",
      className: "font-mono font-semibold text-left",
      render: (row) => `${Number(row.unitsSold).toLocaleString("es-CL")} Uds`,
    },
    {
      key: "totalRevenue",
      header: "Ingreso Total",
      sortable: true,
      align: "left",
      className: "font-mono text-left font-semibold",
      render: (row) => formatCurrency(row.totalRevenue),
    },
    {
      key: "totalCost",
      header: "Costo Total",
      sortable: true,
      align: "left",
      className: "font-mono text-left text-muted-foreground/85",
      render: (row) => formatCurrency(row.totalCost),
    },
    {
      key: "grossProfit",
      header: "Utilidad Bruta",
      sortable: true,
      align: "left",
      className: "font-mono font-bold text-left",
      render: (row) => {
        const isNegative = Number(row.grossProfit) < 0
        return (
          <span className={isNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
            {formatCurrency(row.grossProfit)}
          </span>
        )
      },
    },
    {
      key: "marginPercent",
      header: "Margen Promedio",
      sortable: true,
      align: "left",
      className: "font-mono font-bold text-left",
      render: (row) => {
        const isNegative = Number(row.marginPercent) < 0
        return (
          <span className={isNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
            {formatMargin(row.marginPercent)}
          </span>
        )
      },
    },
  ]

  // Columns definition: Grouped by Category
  const categoryColumns: ColumnDef<CategoryUtilityRow>[] = [
    {
      key: "categoryName",
      header: "Categoría de Producto",
      sortable: true,
      className: "font-semibold text-foreground",
      render: (row) => row.categoryName || "Sin Categoría",
    },
    {
      key: "unitsSold",
      header: "Unidades Vendidas",
      sortable: true,
      align: "left",
      className: "font-mono font-semibold text-left",
      render: (row) => `${Number(row.unitsSold).toLocaleString("es-CL")} Uds`,
    },
    {
      key: "totalRevenue",
      header: "Ingreso Total",
      sortable: true,
      align: "left",
      className: "font-mono text-left font-semibold",
      render: (row) => formatCurrency(row.totalRevenue),
    },
    {
      key: "totalCost",
      header: "Costo Total",
      sortable: true,
      align: "left",
      className: "font-mono text-left text-muted-foreground/85",
      render: (row) => formatCurrency(row.totalCost),
    },
    {
      key: "grossProfit",
      header: "Utilidad Bruta",
      sortable: true,
      align: "left",
      className: "font-mono font-bold text-left",
      render: (row) => {
        const isNegative = Number(row.grossProfit) < 0
        return (
          <span className={isNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
            {formatCurrency(row.grossProfit)}
          </span>
        )
      },
    },
    {
      key: "marginPercent",
      header: "Margen Promedio",
      sortable: true,
      align: "left",
      className: "font-mono font-bold text-left",
      render: (row) => {
        const isNegative = Number(row.marginPercent) < 0
        return (
          <span className={isNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
            {formatMargin(row.marginPercent)}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-4 sm:-mt-2">
      {/* Main Toolbar with Searchbar and Filters Drawer Toggle */}
      <DataTableToolbar
        className="pb-2.5"
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código de venta, cliente o vendedor..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <>
            <DataTableAdvancedFilter
              active={isFilterDrawerOpen || activeFiltersCount > 0}
              badgeCount={activeFiltersCount}
              label="Filtros"
              onClick={() => setIsFilterDrawerOpen(true)}
            />
          </>
        }
      />

      {/* Advanced Filters Drawer (Right-Side sliding panel) */}
      <div
        className={cn(
          "fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out",
          isFilterDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300",
            isFilterDrawerOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsFilterDrawerOpen(false)}
        />

        {/* Sliding Panel */}
        <div
          className={cn(
            "absolute inset-y-0 right-0 max-w-sm w-full bg-card border-l border-border/30 shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ease-out transform",
            isFilterDrawerOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/20 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Filtros Avanzados
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Refina los resultados del reporte
                </p>
              </div>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filters Form */}
            <div className="space-y-5">
              {/* Date From */}
              <div className="flex flex-col w-full gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Fecha Desde
                </label>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder="Todos"
                  className="w-full h-9"
                />
              </div>

              {/* Date To */}
              <div className="flex flex-col w-full gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Fecha Hasta
                </label>
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder="Todos"
                  className="w-full h-9"
                />
              </div>

              {/* Category Selector - Only shown in 'products' tab */}
              {activeTab === "products" && (
                <div className="flex flex-col w-full gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Categoría
                  </label>
                  <Select value={categoryId} onValueChange={(v) => setCategoryId(v || "")}>
                    <SelectTrigger size="sm" className="w-full h-9 px-3 border border-border/40 bg-card/45 rounded-[11px] text-xs justify-between">
                      <SelectValue placeholder="Todos">
                        {categoryId ? (categories.find((c) => c.id === categoryId)?.name || "Todos") : "Todos"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full min-w-[200px] rounded-xl p-1 bg-popover border border-border/25 shadow-md">
                      <SelectItem value="" className="rounded-lg text-xs py-1.5">Todos</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="rounded-lg text-xs py-1.5">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Client Selector */}
              <div className="flex flex-col w-full gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Cliente
                </label>
                <Select value={clientId} onValueChange={(v) => setClientId(v || "")}>
                  <SelectTrigger size="sm" className="w-full h-9 px-3 border border-border/40 bg-card/45 rounded-[11px] text-xs justify-between">
                    <SelectValue placeholder="Todos">
                      {clientId ? (clients.find((c) => c.id === clientId)?.name || "Todos") : "Todos"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full min-w-[200px] rounded-xl p-1 bg-popover border border-border/25 shadow-md">
                    <SelectItem value="" className="rounded-lg text-xs py-1.5">Todos</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="rounded-lg text-xs py-1.5">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee/User Selector */}
              <div className="flex flex-col w-full gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Vendedor
                </label>
                <Select value={performedByUserId} onValueChange={(v) => setPerformedByUserId(v || "")}>
                  <SelectTrigger size="sm" className="w-full h-9 px-3 border border-border/40 bg-card/45 rounded-[11px] text-xs justify-between">
                    <SelectValue placeholder="Todos">
                      {performedByUserId ? (users.find((u) => u.userId === performedByUserId)?.user?.email || "Todos") : "Todos"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full min-w-[200px] rounded-xl p-1 bg-popover border border-border/25 shadow-md">
                    <SelectItem value="" className="rounded-lg text-xs py-1.5">Todos</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.userId} value={u.userId} className="rounded-lg text-xs py-1.5">
                        {u.user?.email || "Usuario"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Selector */}
              <div className="flex flex-col w-full gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Método de Pago
                </label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v || "")}>
                  <SelectTrigger size="sm" className="w-full h-9 px-3 border border-border/40 bg-card/45 rounded-[11px] text-xs justify-between">
                    <SelectValue placeholder="Todos">
                      {paymentMethod ? (({ CASH: "Efectivo", CREDIT_CARD: "Tarjeta Crédito", DEBIT_CARD: "Tarjeta Débito", BANK_TRANSFER: "Transferencia", CHECK: "Cheque", OTHER: "Otro" } as Record<string, string>)[paymentMethod] || "Todos") : "Todos"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-full min-w-[200px] rounded-xl p-1 bg-popover border border-border/25 shadow-md">
                    <SelectItem value="" className="rounded-lg text-xs py-1.5">Todos</SelectItem>
                    <SelectItem value="CASH" className="rounded-lg text-xs py-1.5">Efectivo</SelectItem>
                    <SelectItem value="CREDIT_CARD" className="rounded-lg text-xs py-1.5">Tarjeta Crédito</SelectItem>
                    <SelectItem value="DEBIT_CARD" className="rounded-lg text-xs py-1.5">Tarjeta Débito</SelectItem>
                    <SelectItem value="BANK_TRANSFER" className="rounded-lg text-xs py-1.5">Transferencia</SelectItem>
                    <SelectItem value="CHECK" className="rounded-lg text-xs py-1.5">Cheque</SelectItem>
                    <SelectItem value="OTHER" className="rounded-lg text-xs py-1.5">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer inside drawer */}
          <div className="border-t border-border/20 pt-4 mt-4 flex gap-3">
            <button
              onClick={handleClearFilters}
              className="flex-1 h-9 rounded-full border border-border/40 bg-card/45 hover:bg-card/75 text-xs font-bold text-muted-foreground transition-all duration-200 cursor-pointer"
            >
              Restablecer
            </button>
            <button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="flex-1 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* Tab Switcher Layout */}
      <div>
        <div className="flex border-b border-border/20 mb-6 gap-2">
          <button
            onClick={() => setActiveTab("sales")}
            className={`pb-3 px-4 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === "sales"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ventas Individuales
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 px-4 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === "products"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Por Producto
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 px-4 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === "categories"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Por Categoría
          </button>
        </div>

        {/* Individual Sales Report Table */}
        {activeTab === "sales" && (
          <DataTable
            columns={salesColumns}
            data={sortedSales}
            loading={isUtilitiesLoading}
            sortKey={salesSortKey}
            sortOrder={salesSortOrder}
            onSort={(key) => {
              if (salesSortKey === key) {
                setSalesSortOrder(salesSortOrder === "asc" ? "desc" : "asc")
              } else {
                setSalesSortKey(key)
                setSalesSortOrder("asc")
              }
            }}
            pagination={{
              currentPage,
              totalPages: utilitiesResponse?.meta?.pageCount || 1,
              onPageChange: setCurrentPage,
              totalItems: utilitiesResponse?.meta?.itemCount || 0,
              itemsPerPage: limit,
            }}
            onRowClick={(row) => setSelectedSale(row)}
            glassy={true}
          />
        )}

        {/* Grouped by Product Report Table */}
        {activeTab === "products" && (
          <DataTable
            columns={productColumns}
            data={sortedProducts}
            loading={isProductLoading}
            sortKey={productSortKey}
            sortOrder={productSortOrder}
            onSort={(key) => {
              if (productSortKey === key) {
                setProductSortOrder(productSortOrder === "asc" ? "desc" : "asc")
              } else {
                setProductSortKey(key)
                setProductSortOrder("asc")
              }
            }}
            glassy={true}
          />
        )}

        {/* Grouped by Category Report Table */}
        {activeTab === "categories" && (
          <DataTable
            columns={categoryColumns}
            data={sortedCategories}
            loading={isCategoryLoading}
            sortKey={categorySortKey}
            sortOrder={categorySortOrder}
            onSort={(key) => {
              if (categorySortKey === key) {
                setCategorySortOrder(categorySortOrder === "asc" ? "desc" : "asc")
              } else {
                setCategorySortKey(key)
                setCategorySortOrder("asc")
              }
            }}
            glassy={true}
          />
        )}
      </div>

      {/* Sale Detail dialog (Modal modal) */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl lg:max-w-5xl bg-card rounded-2xl border border-border/30 p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
          {selectedSale && (
            <div className="space-y-6">
              {/* Header */}
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                      Detalle de Rentabilidad - Venta
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                      ID Venta: {selectedSale.saleId}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* General Metadata cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border/15">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cliente</span>
                  <p className="text-xs font-bold text-foreground truncate">{selectedSale.sale?.clientName || "Cliente General"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Vendedor</span>
                  <p className="text-xs font-bold text-foreground truncate">{selectedSale.sale?.performedByUserEmail || "Sistema"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Fecha</span>
                  <p className="text-xs font-bold text-foreground">{format(new Date(selectedSale.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Margen Venta</span>
                  <p className={`text-xs font-bold ${Number(selectedSale.marginPercent) < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {formatMargin(selectedSale.marginPercent)}
                  </p>
                </div>
              </div>

              {/* Items Breakdown list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Desglose de Ítems</h4>
                <div className="border border-border/25 rounded-xl overflow-hidden bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 bg-muted/10 text-muted-foreground font-semibold">
                          <th className="p-3">Producto</th>
                          <th className="p-3 text-left">Cant.</th>
                          <th className="p-3 text-left">Unit. Rev</th>
                          <th className="p-3 text-left">Unit. Cost</th>
                          <th className="p-3 text-center">Origen Costo</th>
                          <th className="p-3 text-left font-bold">Utilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.items?.map((item) => {
                          const costSourceBadge = {
                            PRODUCTION: { text: "Producción", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
                            ESTIMATED: { text: "Estimado", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
                            UNKNOWN: { text: "Sin Costo", className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20" },
                          }[item.costSource || "UNKNOWN"]

                          return (
                            <tr key={item.id} className="border-b border-border/15 hover:bg-muted/10 last:border-0 transition-colors">
                              <td className="p-3 font-semibold text-foreground">
                                {productMap.get(item.productId) || item.productId.slice(0, 8)}
                              </td>
                              <td className="p-3 text-left font-mono font-semibold">
                                {`${Number(item.quantity).toLocaleString("es-CL")} Uds`}
                              </td>
                              <td className="p-3 text-left font-mono">
                                {formatCurrency(item.unitRevenue)}
                              </td>
                              <td className="p-3 text-left font-mono text-muted-foreground/85">
                                {formatCurrency(item.unitCost)}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${costSourceBadge.className}`}>
                                  {costSourceBadge.text}
                                </span>
                              </td>
                              <td className="p-3 text-left font-mono font-bold">
                                <span className={Number(item.grossProfit) < 0 ? "text-rose-600" : "text-emerald-600"}>
                                  {formatCurrency(item.grossProfit)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Breakdown Totals */}
              <div className="flex flex-col gap-2 p-4 rounded-xl bg-muted/10 border border-border/15 items-end">
                <div className="flex w-full max-w-[250px] justify-between text-xs">
                  <span className="text-muted-foreground">Ingreso Total:</span>
                  <span className="font-mono font-bold text-foreground">{formatCurrency(selectedSale.totalRevenue)}</span>
                </div>
                <div className="flex w-full max-w-[250px] justify-between text-xs border-b border-border/20 pb-2">
                  <span className="text-muted-foreground">Costo Total:</span>
                  <span className="font-mono text-muted-foreground/90">{formatCurrency(selectedSale.totalCost)}</span>
                </div>
                <div className="flex w-full max-w-[250px] justify-between text-sm pt-1">
                  <span className="font-bold text-foreground">Utilidad Total:</span>
                  <span className={`font-mono font-bold text-base ${Number(selectedSale.grossProfit) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatCurrency(selectedSale.grossProfit)}
                  </span>
                </div>
              </div>

              {/* Close footer button */}
              <div className="flex justify-end pt-2 border-t border-border/15">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-4.5 py-2 rounded-full border border-border/40 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
