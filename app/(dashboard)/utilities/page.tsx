"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  DataTable,
  ColumnDef,
} from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableFilter } from "@/shared/components/ui/data-table-filter"
import { DataTableAdvancedFilter } from "@/shared/components/ui/data-table-advanced-filter"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { BadgeAlert, Sparkles, Paintbrush, RefreshCw } from "lucide-react"

// Mock Client Data Structure
interface ClientRow {
  id: string
  name: string
  email: string
  category: "Mayorista" | "Minorista" | "Distribuidor"
  status: "Activo" | "Suspendido" | "Pendiente"
  balance: number
  lastPurchase: string
}

const MOCK_CLIENTS: ClientRow[] = [
  { id: "CL-001", name: "Alimentos del Sol S.A.", email: "compras@alimentosdelsol.com", category: "Mayorista", status: "Activo", balance: 1250.0, lastPurchase: "2026-05-20" },
  { id: "CL-002", name: "Supermercados El Cóndor", email: "proveedores@condor.cl", category: "Distribuidor", status: "Activo", balance: 5400.5, lastPurchase: "2026-05-18" },
  { id: "CL-003", name: "Distribuidora San Juan", email: "sanjuan.dist@gmail.com", category: "Distribuidor", status: "Pendiente", balance: 0.0, lastPurchase: "2026-05-22" },
  { id: "CL-004", name: "María José Olivares", email: "mariajose@olivares.com", category: "Minorista", status: "Activo", balance: 150.0, lastPurchase: "2026-05-15" },
  { id: "CL-005", name: "Panificadora Central", email: "info@panificadoracentral.com", category: "Mayorista", status: "Suspendido", balance: -450.0, lastPurchase: "2026-05-10" },
  { id: "CL-006", name: "Minimarket Express", email: "express@minimarkets.net", category: "Minorista", status: "Activo", balance: 890.0, lastPurchase: "2026-05-21" },
  { id: "CL-007", name: "Logística Andina", email: "contacto@andinalog.com", category: "Distribuidor", status: "Activo", balance: 3200.0, lastPurchase: "2026-05-19" },
  { id: "CL-008", name: "Café Gourmet del Valle", email: "administracion@delvalle.com", category: "Minorista", status: "Pendiente", balance: 350.0, lastPurchase: "2026-05-22" },
  { id: "CL-009", name: "Hermanos Rodríguez S.C.", email: "ventas@rodriguezhermanos.com", category: "Mayorista", status: "Activo", balance: 7500.0, lastPurchase: "2026-05-12" },
  { id: "CL-010", name: "Bodega Don Lucho", email: "donluchobodega@hotmail.com", category: "Minorista", status: "Suspendido", balance: 0.0, lastPurchase: "2026-04-30" },
]

export default function UtilitiesPage() {
  // Color customizer state (demonstrating bindable custom colors)
  const [customPrimary, setCustomPrimary] = React.useState("#10b981") // default emerald
  const [customHover, setCustomHover] = React.useState("#059669")

  // Data grid state
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sortKey, setSortKey] = React.useState<string>("name")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)

  // Advanced Filters State
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [minBalance, setMinBalance] = React.useState("")
  const [maxBalance, setMaxBalance] = React.useState("")

  // Calculate active advanced filters count
  const advancedFilterCount = React.useMemo(() => {
    let count = 0
    if (minBalance !== "") count++
    if (maxBalance !== "") count++
    return count
  }, [minBalance, maxBalance])

  // Handle data sorting and filtering
  const filteredData = React.useMemo(() => {
    let result = [...MOCK_CLIENTS]

    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
    }

    // 2. Category Filter
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter)
    }

    // 3. Status Filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }

    // 4. Advanced Filters (Balance Range)
    if (minBalance !== "") {
      const min = parseFloat(minBalance)
      if (!isNaN(min)) {
        result = result.filter((c) => c.balance >= min)
      }
    }
    if (maxBalance !== "") {
      const max = parseFloat(maxBalance)
      if (!isNaN(max)) {
        result = result.filter((c) => c.balance <= max)
      }
    }

    // 5. Sorting
    result.sort((a, b) => {
      let aVal = a[sortKey as keyof ClientRow]
      let bVal = b[sortKey as keyof ClientRow]

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal
      }

      aVal = String(aVal).toLowerCase()
      bVal = String(bVal).toLowerCase()

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [search, categoryFilter, statusFilter, minBalance, maxBalance, sortKey, sortOrder])

  // Pagination params
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, categoryFilter, statusFilter, minBalance, maxBalance])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  // Trigger simulate loader to test skeleton state
  const simulateLoading = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Datos actualizados correctamente")
    }, 1200)
  }

  // Columns definition mapping design standards
  const columns: ColumnDef<ClientRow>[] = [
    {
      key: "id",
      header: "Código ID",
      sortable: true,
      className: "font-mono text-xs text-muted-foreground font-semibold",
    },
    {
      key: "name",
      header: "Nombre de Cliente",
      sortable: true,
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground leading-snug">{row.name}</span>
          <span className="text-xs text-muted-foreground/80 mt-0.5">{row.email}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      sortable: true,
      render: (row) => {
        const colors = {
          Mayorista: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          Minorista: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
          Distribuidor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[row.category]}`}>
            {row.category}
          </span>
        )
      },
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const styles = {
          Activo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          Suspendido: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          Pendiente: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        }
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[row.status]}`}>
            {row.status}
          </span>
        )
      },
    },
    {
      key: "balance",
      header: "Balance Cuenta",
      sortable: true,
      align: "right",
      className: "font-mono font-semibold text-right",
      render: (row) => {
        const isNegative = row.balance < 0
        return (
          <span className={isNegative ? "text-rose-600 dark:text-rose-400" : "text-foreground"}>
            ${row.balance.toLocaleString("es-CL", { minimumFractionDigits: 2 })}
          </span>
        )
      },
    },
    {
      key: "lastPurchase",
      header: "Última Compra",
      sortable: true,
      align: "right",
      className: "text-muted-foreground text-xs text-right font-medium",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Playground Sistema de Tablas
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Showcase del diseño base e individual de los componentes modernos de tablas para CRUDS, 
            configurado con el sistema de diseño de la marca.
          </p>
        </div>

        {/* Loading trigger button */}
        <button
          onClick={simulateLoading}
          disabled={isLoading}
          className="flex h-9 w-fit items-center justify-center gap-1.5 rounded-full border border-border/40 bg-card/45 px-4.5 text-xs font-bold text-muted-foreground transition-all duration-200 hover:border-border/70 hover:bg-card/75 active:scale-95 disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Simular Carga</span>
        </button>
      </div>

      {/* Grid Layout containing Customization controls and Table preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-border/30 bg-card/35 p-5 backdrop-blur-md space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <Paintbrush className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Color Customizable</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El botón genérico de acción acepta propiedades de color inline para amoldarse a la marca del cliente (Multi-tenant).
            </p>
            
            {/* Color selectors */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Color de Fondo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="h-8 w-8 rounded-lg cursor-pointer border border-border/40 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={customPrimary}
                    onChange={(e) => setCustomPrimary(e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-border/40 bg-transparent px-2.5 font-mono text-xs outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Color Hover
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customHover}
                    onChange={(e) => setCustomHover(e.target.value)}
                    className="h-8 w-8 rounded-lg cursor-pointer border border-border/40 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={customHover}
                    onChange={(e) => setCustomHover(e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-border/40 bg-transparent px-2.5 font-mono text-xs outline-hidden focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Live demo of customizable action button */}
            <div className="border-t border-border/20 pt-4 flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground italic text-center block">
                Vista previa botón personalizable:
              </span>
              <DataTableAction
                actionType="custom"
                customBg={customPrimary}
                customHoverBg={customHover}
                customText="#ffffff"
                label="Botón Customizable"
                onClick={() => toast.success(`Acción ejecutada con color: ${customPrimary}`)}
                className="w-full justify-center"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/30 bg-card/35 p-5 backdrop-blur-md space-y-3 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-2 border-b border-border/20 pb-2.5 text-foreground font-bold">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Directivas docs/design.md</span>
            </div>
            <ul className="space-y-2 list-disc list-inside">
              <li>Pills (<code className="text-primary font-semibold">rounded-full</code>) para filtros y búsquedas.</li>
              <li>Tipografía <code className="font-semibold text-foreground">SF Pro Text</code> a 17px para legibilidad.</li>
              <li>Cabeceras a <code className="font-semibold text-foreground">11px uppercase</code> con tracking ancho.</li>
              <li>Micro-escalados de <code className="font-semibold text-foreground">active:scale-95</code> en clics de fila y botones.</li>
              <li>Sin sombras duras; división basada en contrastes suaves.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Table Sandbox Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* DataTable Toolbar (Compose Layout) */}
          <DataTableToolbar
            searchSection={
              <DataTableSearch
                value={search}
                onChange={setSearch}
                placeholder="Buscar clientes por nombre, ID o email... (Presiona /)"
                shortcutKey="/"
              />
            }
            filterSection={
              <>
                <DataTableFilter
                  title="Categoría"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { label: "Mayoristas", value: "Mayorista" },
                    { label: "Minoristas", value: "Minorista" },
                    { label: "Distribuidores", value: "Distribuidor" },
                  ]}
                />
                
                <DataTableFilter
                  title="Estado"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { label: "Activos", value: "Activo" },
                    { label: "Suspendidos", value: "Suspendido" },
                    { label: "Pendientes", value: "Pendiente" },
                  ]}
                />
              </>
            }
            actionSection={
              <>
                <DataTableAdvancedFilter
                  active={showAdvanced}
                  badgeCount={advancedFilterCount}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                />

                <DataTableAction
                  actionType="export"
                  onClick={() => {
                    toast.info("Generando archivo XLS...", {
                      description: "Tu exportación iniciará automáticamente.",
                    })
                  }}
                />

                {/* Create action using brand default primary */}
                <DataTableAction
                  actionType="create"
                  label="Nuevo Cliente"
                  onClick={() => {
                    toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 1500)),
                      {
                        loading: "Iniciando creador de registros...",
                        success: "Cliente creado (Simulado)",
                        error: "Error al crear",
                      }
                    )
                  }}
                />
              </>
            }
          />

          {/* Expandable Advanced Filters block */}
          {showAdvanced && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4.5 space-y-3.5 animate-in slide-in-from-top-3 duration-250 ease-out">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <BadgeAlert className="h-3.5 w-3.5" />
                  Filtros Avanzados (Balance de Cuenta)
                </span>
                {(minBalance || maxBalance) && (
                  <button
                    onClick={() => {
                      setMinBalance("")
                      setMaxBalance("")
                      toast.success("Filtros avanzados limpios")
                    }}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Restablecer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Balance Mínimo ($)
                  </label>
                  <input
                    type="number"
                    value={minBalance}
                    onChange={(e) => setMinBalance(e.target.value)}
                    placeholder="Mínimo balance..."
                    className="h-9 w-full rounded-full border border-border/40 bg-card/45 px-3.5 text-xs text-foreground outline-hidden focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Balance Máximo ($)
                  </label>
                  <input
                    type="number"
                    value={maxBalance}
                    onChange={(e) => setMaxBalance(e.target.value)}
                    placeholder="Máximo balance..."
                    className="h-9 w-full rounded-full border border-border/40 bg-card/45 px-3.5 text-xs text-foreground outline-hidden focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reusable Data Table Component Preview */}
          <DataTable
            columns={columns}
            data={paginatedData}
            loading={isLoading}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
              totalItems: filteredData.length,
              itemsPerPage,
            }}
            onRowClick={(row) => {
              toast.info(`Fila seleccionada: ${row.name}`, {
                description: `ID: ${row.id} · Balance actual: $${row.balance}`,
              })
            }}
            glassy={true}
          />
        </div>
      </div>
    </div>
  )
}
