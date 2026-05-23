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
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductActive,
  useAddProductNote,
} from "@/features/products/hooks/use-products"
import { productsService } from "@/features/products/services/products.service"
import type { Product } from "@/features/products/types/products.types"
import { Pencil, Eye, Barcode, FileText, Trash2, Loader2 } from "lucide-react"

// Global and product-specific modals
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { AddNotesModal } from "@/shared/components/ui/add-notes-modal"
import { ProductDetailModal } from "@/features/products/components/product-detail-modal"
import { BarcodeModal } from "@/features/products/components/barcode-modal"

export default function ProductsPage() {
  // Mutations for CRUD and admin actions
  const createProductMutation = useCreateProduct()
  const deleteProductMutation = useDeleteProduct()
  const toggleProductActiveMutation = useToggleProductActive()
  const addProductNoteMutation = useAddProductNote()
  const updateProductMutation = useUpdateProduct()

  // Modal state management
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isBarcodeOpen, setIsBarcodeOpen] = React.useState(false)
  const [isNotesOpen, setIsNotesOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)

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

  const productFields = React.useMemo<FormFieldSchema[]>(() => {
    return [
      {
        name: "name",
        label: "Nombre del Producto",
        type: "text",
        placeholder: "Ej. Coca Cola 350ml",
        required: true,
        gridCols: 2,
      },
      {
        name: "categoryId",
        label: "Categoría",
        type: "select",
        placeholder: "Selecciona una categoría",
        required: false,
        options: categoriesResponse?.data.map((c) => ({ label: c.name, value: c.id })) || [],
        gridCols: 1,
      },
      {
        name: "isPurchased",
        label: "Origen de Producto",
        type: "boolean",
        placeholder: "Activo si es comprado a proveedor, inactivo si es de elaboración propia",
        required: false,
        gridCols: 1,
      },
      {
        name: "salePrice",
        label: "Precio de Venta",
        type: "number",
        placeholder: "Ej. 1200",
        required: true,
        gridCols: 1,
      },
      {
        name: "costPrice",
        label: "Precio de Costo",
        type: "number",
        placeholder: "Ej. 800",
        required: false,
        gridCols: 1,
      },
      {
        name: "sku",
        label: "Código SKU",
        type: "text",
        placeholder: "Ej. COCA-350-GLS",
        required: false,
        gridCols: 1,
      },
      {
        name: "barcode",
        label: "Código de Barras",
        type: "text",
        placeholder: "Ej. 780000123456",
        required: false,
        gridCols: 1,
      },
      {
        name: "description",
        label: "Descripción del Producto",
        type: "textarea",
        placeholder: "Detalles del producto, empaque, ingredientes...",
        required: false,
        gridCols: 2,
      },
    ]
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
                setSelectedProduct(row)
                setIsDetailsOpen(true)
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Ver detalles"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {/* Editar */}
            <button
              onClick={() => {
                setSelectedProduct(row)
                setIsEditOpen(true)
              }}
              disabled={isEditing}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Editar"
            >
              {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            </button>

            {/* Código de barras */}
            <button
              onClick={() => {
                setSelectedProduct(row)
                setIsBarcodeOpen(true)
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Ver código de barras"
            >
              <Barcode className="h-3.5 w-3.5" />
            </button>

            {/* Agregar nota */}
            <button
              onClick={() => {
                setSelectedProduct(row)
                setIsNotesOpen(true)
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
            onClick={() => setIsCreateOpen(true)}
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
          setSelectedProduct(row)
          setIsDetailsOpen(true)
        }}
        glassy={true}
      />

      {/* Product Creation Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo Producto"
        description="Completa la información para registrar un nuevo producto en el catálogo."
        fields={productFields}
        submitLabel="Crear Producto"
        isLoading={createProductMutation.isPending}
        onSubmit={(values) => {
          createProductMutation.mutate(values as any, {
            onSuccess: () => {
              toast.success("Producto creado con éxito")
              setIsCreateOpen(false)
            },
            onError: (err) => {
              toast.error("Error al crear el producto", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />

      {/* Product Edition Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedProduct(null)
        }}
        title="Editar Producto"
        description="Actualiza la información del producto seleccionado."
        fields={productFields.filter((f) => f.name !== "sku")} // SKU is read-only / not allowed on updates
        submitLabel="Guardar Cambios"
        defaultValues={selectedProduct || undefined}
        isLoading={updateProductMutation.isPending}
        onSubmit={(values) => {
          if (!selectedProduct) return
          updateProductMutation.mutate(
            { id: selectedProduct.id, payload: values },
            {
              onSuccess: () => {
                toast.success("Producto actualizado con éxito")
                setIsEditOpen(false)
                setSelectedProduct(null)
              },
              onError: (err) => {
                toast.error("Error al actualizar el producto", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* Product Details Modal */}
      <ProductDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
      />

      {/* Barcode Visualization Modal */}
      <BarcodeModal
        isOpen={isBarcodeOpen}
        onClose={() => {
          setIsBarcodeOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
      />

      {/* Add Administrative Notes Modal */}
      <AddNotesModal
        isOpen={isNotesOpen}
        onClose={() => {
          setIsNotesOpen(false)
          setSelectedProduct(null)
        }}
        title={`Agregar nota para: ${selectedProduct?.name || ""}`}
        initialNote={selectedProduct?.notes || ""}
        isLoading={addProductNoteMutation.isPending}
        onSubmit={(note) => {
          if (!selectedProduct) return
          addProductNoteMutation.mutate(
            { id: selectedProduct.id, notes: note },
            {
              onSuccess: () => {
                toast.success("Nota guardada correctamente")
                setIsNotesOpen(false)
                setSelectedProduct(null)
              },
              onError: (err) => {
                toast.error("Error al guardar la nota", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />
    </div>
  )
}
