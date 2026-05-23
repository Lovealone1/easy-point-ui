"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  DataTable,
  ColumnDef,
} from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import {
  useProducts,
  useProductCategories,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductActive,
  useAddProductNote,
} from "@/features/products/hooks/use-products"
import { productsService } from "@/features/products/services/products.service"
import type { Product } from "@/features/products/types/products.types"
import { Pencil, Eye, Barcode, FileText, Trash2, Loader2 } from "lucide-react"

export default function ProductsPage() {
  // Mutations for CRUD and admin actions
  const deleteProductMutation = useDeleteProduct()
  const toggleProductActiveMutation = useToggleProductActive()
  const addProductNoteMutation = useAddProductNote()
  const updateProductMutation = useUpdateProduct()

  // Query filters state
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [sortKey, setSortKey] = React.useState<string>("name")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")

  // Debounce search query to prevent excessive API requests
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset to first page when search filter changes
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch paginated products from BFF proxy
  const { data: productsResponse, isLoading, error } = useProducts({
    page,
    limit: 8,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  // Fetch product categories to build client-side lookup map (avoids server joins)
  const { data: categoriesResponse } = useProductCategories()

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>()
    if (categoriesResponse?.data) {
      categoriesResponse.data.forEach((cat) => {
        map.set(cat.id, cat.name)
      });
    }
    return map
  }, [categoriesResponse])

  // Handle column header clicks for API sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
    setPage(1) // reset page on sort
  }

  // Display error toast if fetching fails
  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar productos", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Format currency helpers
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-"
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  // Columns definition matching system aesthetics
  const columns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: "Producto",
      sortable: true,
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">{row.name}</span>
          {row.description && (
            <span className="text-xs text-muted-foreground/80 mt-0.5 max-w-[160px] sm:max-w-[300px] truncate">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "categoryId",
      header: "Categoría",
      sortable: true,
      render: (row) => {
        const catName = row.categoryId ? categoryMap.get(row.categoryId) : null
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border border-border/40 bg-muted/30 text-muted-foreground max-w-[140px] sm:max-w-[160px]">
            <span className="truncate">{catName || "Sin Categoría"}</span>
          </span>
        )
      },
    },
    {
      key: "salePrice",
      header: "Precio Venta",
      sortable: true,
      className: "font-mono font-semibold text-brand-500 dark:text-brand-400",
      render: (row) => formatCurrency(row.salePrice),
    },
    {
      key: "costPrice",
      header: "Precio Costo",
      sortable: true,
      className: "font-mono text-muted-foreground/80",
      render: (row) => formatCurrency(row.costPrice),
    },
    {
      key: "isActive",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const isPending = toggleProductActiveMutation.isPending && toggleProductActiveMutation.variables?.id === row.id
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleProductActiveMutation.mutate(
                { id: row.id, isActive: !row.isActive },
                {
                  onSuccess: (res) => toast.success(`Producto ${res.isActive ? "activado" : "desactivado"} con éxito`),
                  onError: () => toast.error("Error al cambiar el estado del producto"),
                }
              )
            }}
            disabled={isPending}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 cursor-pointer ${row.isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
              : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/15"
              }`}
            title={row.isActive ? "Desactivar producto" : "Activar producto"}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : null}
            {row.isActive ? "Activo" : "Inactivo"}
          </button>
        )
      },
    },
    {
      key: "acciones",
      header: "Acciones",
      className: "w-[160px]",
      render: (row) => {
        const isDeleting = deleteProductMutation.isPending && deleteProductMutation.variables === row.id
        const isEditing = updateProductMutation.isPending && updateProductMutation.variables?.id === row.id
        const isAddingNote = addProductNoteMutation.isPending && addProductNoteMutation.variables?.id === row.id

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Ver detalles */}
            <button
              onClick={() => {
                toast.info(`Detalles del producto: ${row.name}`, {
                  description: `ID: ${row.id} · SKU: ${row.sku || "Sin SKU"} · Código de barras: ${row.barcode || "Sin código"} · Notas: ${row.notes || "Sin notas"}`,
                })
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Ver detalles"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {/* Editar */}
            <button
              onClick={() => {
                const newName = prompt("Editar nombre del producto:", row.name)
                if (newName !== null && newName.trim() !== "") {
                  updateProductMutation.mutate(
                    { id: row.id, payload: { name: newName } },
                    {
                      onSuccess: () => toast.success("Producto renombrado con éxito"),
                      onError: () => toast.error("Error al renombrar el producto"),
                    }
                  )
                }
              }}
              disabled={isEditing}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Editar nombre"
            >
              {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            </button>

            {/* Código de barras */}
            <button
              onClick={() => {
                if (!row.barcode) {
                  toast.warning("Este producto no posee un código de barras generado.")
                  return
                }
                const barcodeUrl = productsService.getBarcodeUrl(row.id)
                toast.info(`Código de Barras - ${row.sku || "EAN-13"}`, {
                  description: (
                    <div className="mt-2 flex flex-col items-center gap-2 select-none">
                      <img
                        src={barcodeUrl}
                        alt="Código de barras"
                        className="bg-white p-2 rounded-lg border border-border/40 object-contain w-44"
                      />
                      <span className="font-mono text-xs font-semibold">{row.barcode}</span>
                    </div>
                  ),
                  duration: 8000,
                })
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Ver código de barras"
            >
              <Barcode className="h-3.5 w-3.5" />
            </button>

            {/* Agregar nota */}
            <button
              onClick={() => {
                const note = prompt("Ingresar nota administrativa para el producto:")
                if (note !== null && note.trim() !== "") {
                  addProductNoteMutation.mutate(
                    { id: row.id, notes: note },
                    {
                      onSuccess: () => toast.success("Nota añadida correctamente"),
                      onError: () => toast.error("Error al añadir la nota"),
                    }
                  )
                }
              }}
              disabled={isAddingNote}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Agregar nota"
            >
              {isAddingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            </button>

            {/* Eliminar */}
            <button
              onClick={() => {
                if (confirm(`¿Estás seguro de que deseas eliminar el producto "${row.name}"?`)) {
                  deleteProductMutation.mutate(row.id, {
                    onSuccess: () => toast.success("Producto eliminado correctamente"),
                    onError: () => toast.error("Error al eliminar el producto"),
                  })
                }
              }}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Eliminar"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Control Header: Search bar + Create button */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, código SKU o barras..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nuevo Producto"
            shape="md"
            onClick={() => {
              toast.info("Creador de productos próximamente...", {
                description: "Estamos implementando el formulario de creación.",
              })
            }}
          />
        }
      />

      {/* Reusable Data Table component connecting backend response */}
      <DataTable
        columns={columns}
        data={productsResponse?.data || []}
        loading={isLoading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: productsResponse?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: productsResponse?.meta?.itemCount || 0,
          itemsPerPage: 8,
        }}
        onRowClick={(row) => {
          toast.info(`Fila seleccionada: ${row.name}`, {
            description: `SKU: ${row.sku} · Precio de venta: ${formatCurrency(row.salePrice)}`,
          })
        }}
        glassy={true}
      />
    </div>
  )
}
