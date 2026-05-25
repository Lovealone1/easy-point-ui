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
  useSupplies,
  useCreateSupply,
  useUpdateSupply,
  useDeleteSupply,
  useToggleSupplyActive,
  useAddSupplyNote,
} from "@/features/supplies/hooks/use-supplies"
import type { Supply } from "@/features/supplies/types/supplies.types"
import { UNIT_OF_MEASURE_LABELS } from "@/features/supplies/types/supplies.types"
import { Pencil, Eye, FileText, Trash2, Loader2, Layers, DollarSign, Hash } from "lucide-react"

// Shared and feature-specific modals
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { AddNotesModal } from "@/shared/components/ui/add-notes-modal"
import { SupplyDetailModal } from "@/features/supplies/components/supply-detail-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

export default function SuppliesPage() {
  // Mutations for CRUD and admin actions
  const createSupplyMutation = useCreateSupply()
  const updateSupplyMutation = useUpdateSupply()
  const deleteSupplyMutation = useDeleteSupply()
  const toggleSupplyActiveMutation = useToggleSupplyActive()
  const addSupplyNoteMutation = useAddSupplyNote()

  // Modal state management
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isNotesOpen, setIsNotesOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedSupply, setSelectedSupply] = React.useState<Supply | null>(null)

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

  // Fetch paginated supplies from BFF proxy
  const { data: suppliesResponse, isLoading, error } = useSupplies({
    page,
    limit: 8,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  // Display error toast if fetching fails
  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar insumos", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Field schema for create/edit DynamicFormModal
  const supplyFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "name",
      label: "Nombre del Insumo",
      type: "text",
      placeholder: "Ej. Harina de Trigo",
      required: true,
      gridCols: 2,
    },
    {
      name: "description",
      label: "Descripción",
      type: "text",
      placeholder: "Ej. Harina especial de repostería",
      required: false,
      gridCols: 2,
    },
    {
      name: "unitOfMeasure",
      label: "Unidad de Medida",
      type: "select",
      placeholder: "Seleccione unidad",
      required: true,
      gridCols: 1,
      options: [
        { label: "Gramo (g)", value: "GRAM" },
        { label: "Mililitro (ml)", value: "MILLILITER" },
        { label: "Unidad (und)", value: "UNIT" },
      ],
    },
    {
      name: "packageSize",
      label: "Tamaño de Empaque",
      type: "number",
      placeholder: "Ej. 1000",
      required: true,
      gridCols: 1,
    },
    {
      name: "basePrice",
      label: "Precio de Compra (Empaque)",
      type: "number",
      placeholder: "Ej. 5000",
      required: true,
      gridCols: 1,
    },
  ], [])

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

  // Format currency value to CLP/local format
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Column definitions matching system aesthetics
  const columns: ColumnDef<Supply>[] = [
    {
      key: "name",
      header: "Insumo",
      sortable: true,
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">{row.name}</span>
          {row.description && (
            <span className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "unitOfMeasure",
      header: "Unidad",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-sm text-foreground/80">
            {UNIT_OF_MEASURE_LABELS[row.unitOfMeasure] || row.unitOfMeasure}
          </span>
        </div>
      ),
    },
    {
      key: "packageSize",
      header: "Tamaño Empaque",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-sm font-mono text-foreground/80">
            {row.packageSize}
          </span>
        </div>
      ),
    },
    {
      key: "basePrice",
      header: "Precio Base",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-sm font-mono text-foreground/80">
            {formatCurrency(row.basePrice)}
          </span>
        </div>
      ),
    },
    {
      key: "pricePerUnit",
      header: "Precio x Unidad",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-sm font-mono text-foreground/85 font-semibold">
            {formatCurrency(row.pricePerUnit)}
          </span>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const isPending =
          toggleSupplyActiveMutation.isPending &&
          toggleSupplyActiveMutation.variables?.id === row.id
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleSupplyActiveMutation.mutate(
                { id: row.id, isActive: !row.isActive },
                {
                  onSuccess: (res) =>
                    toast.success(
                      `Insumo ${res.isActive ? "activado" : "desactivado"} con éxito`
                    ),
                  onError: () =>
                    toast.error("Error al cambiar el estado del insumo"),
                }
              )
            }}
            disabled={isPending}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 cursor-pointer ${row.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/15"
              }`}
            title={row.isActive ? "Desactivar insumo" : "Activar insumo"}
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
      className: "w-[140px]",
      render: (row) => {
        const isDeleting =
          deleteSupplyMutation.isPending && deleteSupplyMutation.variables === row.id
        const isEditing =
          updateSupplyMutation.isPending && updateSupplyMutation.variables?.id === row.id
        const isAddingNote =
          addSupplyNoteMutation.isPending && addSupplyNoteMutation.variables?.id === row.id

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Ver detalles */}
            <button
              onClick={() => {
                setSelectedSupply(row)
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
                setSelectedSupply(row)
                setIsEditOpen(true)
              }}
              disabled={isEditing}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Editar"
            >
              {isEditing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Agregar nota */}
            <button
              onClick={() => {
                setSelectedSupply(row)
                setIsNotesOpen(true)
              }}
              disabled={isAddingNote}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Agregar nota"
            >
              {isAddingNote ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Eliminar */}
            <button
              onClick={() => {
                setSelectedSupply(row)
                setIsDeleteOpen(true)
              }}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Eliminar"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
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
            placeholder="Buscar por nombre o descripción..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nuevo Insumo"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Reusable Data Table component connecting backend response */}
      <DataTable
        columns={columns}
        data={suppliesResponse?.data || []}
        loading={isLoading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: suppliesResponse?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: suppliesResponse?.meta?.itemCount || 0,
          itemsPerPage: 8,
        }}
        onRowClick={(row) => {
          setSelectedSupply(row)
          setIsDetailsOpen(true)
        }}
        glassy={true}
      />

      {/* Supply Creation Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo Insumo"
        description="Completa la información para registrar un nuevo insumo."
        fields={supplyFields}
        submitLabel="Crear Insumo"
        isLoading={createSupplyMutation.isPending}
        onSubmit={(values) => {
          createSupplyMutation.mutate(values as any, {
            onSuccess: () => {
              toast.success("Insumo creado con éxito")
              setIsCreateOpen(false)
            },
            onError: (err) => {
              toast.error("Error al crear el insumo", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />

      {/* Supply Edition Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedSupply(null)
        }}
        title="Editar Insumo"
        description="Actualiza la información del insumo seleccionado."
        fields={supplyFields}
        submitLabel="Guardar Cambios"
        defaultValues={selectedSupply || undefined}
        isLoading={updateSupplyMutation.isPending}
        onSubmit={(values) => {
          if (!selectedSupply) return

          // Filter to only send modified fields (dirty fields)
          const patchPayload: Record<string, any> = {}
          Object.keys(values).forEach((key) => {
            const newValue = values[key]
            const oldValue = (selectedSupply as any)[key]

            // Treat null, undefined and "" as equivalent for comparison
            const isOldFalsy = oldValue === null || oldValue === undefined || oldValue === ""
            const isNewFalsy = newValue === null || newValue === undefined || newValue === ""
            if (isOldFalsy && isNewFalsy) return

            if (newValue !== oldValue) {
              patchPayload[key] = newValue
            }
          })

          // If no fields were modified, just close the modal
          if (Object.keys(patchPayload).length === 0) {
            toast.info("No se realizaron modificaciones")
            setIsEditOpen(false)
            setSelectedSupply(null)
            return
          }

          updateSupplyMutation.mutate(
            { id: selectedSupply.id, payload: patchPayload },
            {
              onSuccess: () => {
                toast.success("Insumo actualizado con éxito")
                setIsEditOpen(false)
                setSelectedSupply(null)
              },
              onError: (err) => {
                toast.error("Error al actualizar el insumo", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* Supply Details Modal */}
      <SupplyDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedSupply(null)
        }}
        supply={selectedSupply}
      />

      {/* Add Administrative Notes Modal */}
      <AddNotesModal
        isOpen={isNotesOpen}
        onClose={() => {
          setIsNotesOpen(false)
          setSelectedSupply(null)
        }}
        title={`Agregar nota para: ${selectedSupply?.name || ""}`}
        initialNote={selectedSupply?.notes || ""}
        isLoading={addSupplyNoteMutation.isPending}
        onSubmit={(note) => {
          if (!selectedSupply) return
          addSupplyNoteMutation.mutate(
            { id: selectedSupply.id, notes: note },
            {
              onSuccess: () => {
                toast.success("Nota guardada correctamente")
                setIsNotesOpen(false)
                setSelectedSupply(null)
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedSupply(null)
        }}
        title="¿Eliminar insumo?"
        description={`Esta acción no se puede deshacer. Se eliminará de forma permanente el insumo "${selectedSupply?.name || ""}" del sistema.`}
        confirmLabel="Eliminar Insumo"
        cancelLabel="Cancelar"
        isLoading={deleteSupplyMutation.isPending}
        onConfirm={() => {
          if (!selectedSupply) return
          deleteSupplyMutation.mutate(selectedSupply.id, {
            onSuccess: () => {
              toast.success("Insumo eliminado correctamente")
              setIsDeleteOpen(false)
              setSelectedSupply(null)
            },
            onError: (err) => {
              toast.error("Error al eliminar el insumo", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
