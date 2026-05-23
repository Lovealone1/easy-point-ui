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
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useToggleSupplierActive,
  useAddSupplierNote,
} from "@/features/suppliers/hooks/use-suppliers"
import type { Supplier } from "@/features/suppliers/types/suppliers.types"
import { Pencil, Eye, FileText, Trash2, Loader2, Phone, Mail, Hash } from "lucide-react"

// Shared and feature-specific modals
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { AddNotesModal } from "@/shared/components/ui/add-notes-modal"
import { SupplierDetailModal } from "@/features/suppliers/components/supplier-detail-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

export default function SuppliersPage() {
  // Mutations for CRUD and admin actions
  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()
  const toggleSupplierActiveMutation = useToggleSupplierActive()
  const addSupplierNoteMutation = useAddSupplierNote()

  // Modal state management
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isNotesOpen, setIsNotesOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null)

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

  // Fetch paginated suppliers from BFF proxy
  const { data: suppliersResponse, isLoading, error } = useSuppliers({
    page,
    limit: 8,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  // Display error toast if fetching fails
  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar proveedores", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Field schema for create/edit DynamicFormModal
  const supplierFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "name",
      label: "Nombre del Proveedor",
      type: "text",
      placeholder: "Ej. Distribuidora Norte",
      required: true,
      gridCols: 2,
    },
    {
      name: "taxId",
      label: "RUT / CC",
      type: "text",
      placeholder: "Ej. 76.123.456-7",
      required: true,
      gridCols: 1,
    },
    {
      name: "leadTime",
      label: "Tiempo de Entrega (días)",
      type: "number",
      placeholder: "Ej. 3",
      required: true,
      gridCols: 1,
      defaultValue: 0,
    },
    {
      name: "email",
      label: "Correo Electrónico",
      type: "text",
      placeholder: "Ej. contacto@proveedor.cl",
      required: false,
      gridCols: 1,
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "text",
      placeholder: "Ej. +56 9 1234 5678",
      required: false,
      gridCols: 1,
    },
    {
      name: "address",
      label: "Dirección",
      type: "text",
      placeholder: "Ej. Av. Independencia 123, Santiago",
      required: false,
      gridCols: 2,
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

  // Column definitions matching system aesthetics
  const columns: ColumnDef<Supplier>[] = [
    {
      key: "name",
      header: "Proveedor",
      sortable: true,
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">{row.name}</span>
          <span className="text-xs text-muted-foreground/80 mt-0.5 font-mono truncate">
            {row.taxId}
          </span>
        </div>
      ),
    },
    {
      key: "leadTime",
      header: "Tiempo de Entrega",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-sm font-mono text-foreground/80">
            {row.leadTime} {row.leadTime === 1 ? "día" : "días"}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5 min-w-0">
          {row.email ? (
            <>
              <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-sm text-foreground/80 truncate max-w-[180px]">{row.email}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground/50 italic">Sin email</span>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.phone ? (
            <>
              <Phone className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-sm text-foreground/80 font-mono">{row.phone}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground/50 italic">Sin teléfono</span>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const isPending =
          toggleSupplierActiveMutation.isPending &&
          toggleSupplierActiveMutation.variables?.id === row.id
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleSupplierActiveMutation.mutate(
                { id: row.id, isActive: !row.isActive },
                {
                  onSuccess: (res) =>
                    toast.success(
                      `Proveedor ${res.isActive ? "activado" : "desactivado"} con éxito`
                    ),
                  onError: () =>
                    toast.error("Error al cambiar el estado del proveedor"),
                }
              )
            }}
            disabled={isPending}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 cursor-pointer ${row.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/15"
              }`}
            title={row.isActive ? "Desactivar proveedor" : "Activar proveedor"}
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
          deleteSupplierMutation.isPending && deleteSupplierMutation.variables === row.id
        const isEditing =
          updateSupplierMutation.isPending && updateSupplierMutation.variables?.id === row.id
        const isAddingNote =
          addSupplierNoteMutation.isPending && addSupplierNoteMutation.variables?.id === row.id

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Ver detalles */}
            <button
              onClick={() => {
                setSelectedSupplier(row)
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
                setSelectedSupplier(row)
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
                setSelectedSupplier(row)
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
                setSelectedSupplier(row)
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
            placeholder="Buscar por nombre, email o contacto..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nuevo Proveedor"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Reusable Data Table component connecting backend response */}
      <DataTable
        columns={columns}
        data={suppliersResponse?.data || []}
        loading={isLoading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: suppliersResponse?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: suppliersResponse?.meta?.itemCount || 0,
          itemsPerPage: 8,
        }}
        onRowClick={(row) => {
          setSelectedSupplier(row)
          setIsDetailsOpen(true)
        }}
        glassy={true}
      />

      {/* Supplier Creation Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo Proveedor"
        description="Completa la información para registrar un nuevo proveedor."
        fields={supplierFields}
        submitLabel="Crear Proveedor"
        isLoading={createSupplierMutation.isPending}
        onSubmit={(values) => {
          createSupplierMutation.mutate(values as any, {
            onSuccess: () => {
              toast.success("Proveedor creado con éxito")
              setIsCreateOpen(false)
            },
            onError: (err) => {
              toast.error("Error al crear el proveedor", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />

      {/* Supplier Edition Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedSupplier(null)
        }}
        title="Editar Proveedor"
        description="Actualiza la información del proveedor seleccionado."
        fields={supplierFields}
        submitLabel="Guardar Cambios"
        defaultValues={selectedSupplier || undefined}
        isLoading={updateSupplierMutation.isPending}
        onSubmit={(values) => {
          if (!selectedSupplier) return

          // Filter to only send modified fields (dirty fields)
          const patchPayload: Record<string, any> = {}
          Object.keys(values).forEach((key) => {
            const newValue = values[key]
            const oldValue = (selectedSupplier as any)[key]

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
            setSelectedSupplier(null)
            return
          }

          updateSupplierMutation.mutate(
            { id: selectedSupplier.id, payload: patchPayload },
            {
              onSuccess: () => {
                toast.success("Proveedor actualizado con éxito")
                setIsEditOpen(false)
                setSelectedSupplier(null)
              },
              onError: (err) => {
                toast.error("Error al actualizar el proveedor", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* Supplier Details Modal */}
      <SupplierDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedSupplier(null)
        }}
        supplier={selectedSupplier}
      />

      {/* Add Administrative Notes Modal */}
      <AddNotesModal
        isOpen={isNotesOpen}
        onClose={() => {
          setIsNotesOpen(false)
          setSelectedSupplier(null)
        }}
        title={`Agregar nota para: ${selectedSupplier?.name || ""}`}
        initialNote={selectedSupplier?.notes || ""}
        isLoading={addSupplierNoteMutation.isPending}
        onSubmit={(note) => {
          if (!selectedSupplier) return
          addSupplierNoteMutation.mutate(
            { id: selectedSupplier.id, notes: note },
            {
              onSuccess: () => {
                toast.success("Nota guardada correctamente")
                setIsNotesOpen(false)
                setSelectedSupplier(null)
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
          setSelectedSupplier(null)
        }}
        title="¿Eliminar proveedor?"
        description={`Esta acción no se puede deshacer. Se eliminará de forma permanente el proveedor "${selectedSupplier?.name || ""}" del sistema.`}
        confirmLabel="Eliminar Proveedor"
        cancelLabel="Cancelar"
        isLoading={deleteSupplierMutation.isPending}
        onConfirm={() => {
          if (!selectedSupplier) return
          deleteSupplierMutation.mutate(selectedSupplier.id, {
            onSuccess: () => {
              toast.success("Proveedor eliminado correctamente")
              setIsDeleteOpen(false)
              setSelectedSupplier(null)
            },
            onError: (err) => {
              toast.error("Error al eliminar el proveedor", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
