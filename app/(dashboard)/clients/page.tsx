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
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useToggleClientActive,
  useAddClientNote,
} from "@/features/clients/hooks/use-clients"
import type { Client } from "@/features/clients/types/clients.types"
import { Pencil, Eye, FileText, Trash2, Loader2, Phone, Mail, Hash } from "lucide-react"

// Shared and feature-specific modals
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { AddNotesModal } from "@/shared/components/ui/add-notes-modal"
import { ClientDetailModal } from "@/features/clients/components/client-detail-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

export default function ClientsPage() {
  // Mutations for CRUD and admin actions
  const createClientMutation = useCreateClient()
  const updateClientMutation = useUpdateClient()
  const deleteClientMutation = useDeleteClient()
  const toggleClientActiveMutation = useToggleClientActive()
  const addClientNoteMutation = useAddClientNote()

  // Modal state management
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isNotesOpen, setIsNotesOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)

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

  // Fetch paginated clients from BFF proxy
  const { data: clientsResponse, isLoading, error } = useClients({
    page,
    limit: 8,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  // Display error toast if fetching fails
  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar clientes", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Field schema for create/edit DynamicFormModal
  const clientFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "name",
      label: "Nombre del Cliente",
      type: "text",
      placeholder: "Ej. Juan Pérez",
      required: true,
      gridCols: 2,
    },
    {
      name: "taxId",
      label: "Cédula / NIT",
      type: "text",
      placeholder: "Ej. 1.234.567-8",
      required: false,
      gridCols: 1,
    },
    {
      name: "email",
      label: "Correo Electrónico",
      type: "text",
      placeholder: "Ej. cliente@correo.com",
      required: false,
      gridCols: 1,
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "text",
      placeholder: "Ej. +57 300 123 4567",
      required: false,
      gridCols: 1,
    },
    {
      name: "address",
      label: "Dirección",
      type: "text",
      placeholder: "Ej. Calle 123 #45-67, Medellín",
      required: false,
      gridCols: 1,
    },
    {
      name: "creditLimit",
      label: "Límite de Crédito",
      type: "number",
      placeholder: "Ej. 0",
      required: true,
      gridCols: 1,
      defaultValue: 0,
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
  const columns: ColumnDef<Client>[] = [
    {
      key: "name",
      header: "Cliente",
      sortable: true,
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">{row.name}</span>
          {row.taxId && (
            <span className="text-xs text-muted-foreground/80 mt-0.5 font-mono truncate">
              {row.taxId}
            </span>
          )}
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
      key: "taxId",
      header: "Cédula / NIT",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.taxId ? (
            <>
              <Hash className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-sm text-foreground/80 font-mono">{row.taxId}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground/50 italic">Sin documento</span>
          )}
        </div>
      ),
    },
    {
      key: "creditLimit",
      header: "Límite de Crédito",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-mono text-foreground/80">
          {new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          }).format(row.creditLimit || 0)}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const isPending =
          toggleClientActiveMutation.isPending &&
          toggleClientActiveMutation.variables?.id === row.id
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleClientActiveMutation.mutate(
                { id: row.id, isActive: !row.isActive },
                {
                  onSuccess: (res) =>
                    toast.success(
                      `Cliente ${res.isActive ? "activado" : "desactivado"} con éxito`
                    ),
                  onError: () =>
                    toast.error("Error al cambiar el estado del cliente"),
                }
              )
            }}
            disabled={isPending}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 cursor-pointer ${row.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/15"
              }`}
            title={row.isActive ? "Desactivar cliente" : "Activar cliente"}
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
          deleteClientMutation.isPending && deleteClientMutation.variables === row.id
        const isEditing =
          updateClientMutation.isPending && updateClientMutation.variables?.id === row.id
        const isAddingNote =
          addClientNoteMutation.isPending && addClientNoteMutation.variables?.id === row.id

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Ver detalles */}
            <button
              onClick={() => {
                setSelectedClient(row)
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
                setSelectedClient(row)
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
                setSelectedClient(row)
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
                setSelectedClient(row)
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
            placeholder="Buscar por nombre, email o documento..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nuevo Cliente"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Reusable Data Table component connecting backend response */}
      <DataTable
        columns={columns}
        data={clientsResponse?.data || []}
        loading={isLoading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: clientsResponse?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: clientsResponse?.meta?.itemCount || 0,
          itemsPerPage: 8,
        }}
        onRowClick={(row) => {
          setSelectedClient(row)
          setIsDetailsOpen(true)
        }}
        glassy={true}
      />

      {/* Client Creation Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo Cliente"
        description="Completa la información para registrar un nuevo cliente."
        fields={clientFields}
        submitLabel="Crear Cliente"
        isLoading={createClientMutation.isPending}
        onSubmit={(values) => {
          createClientMutation.mutate(values as any, {
            onSuccess: () => {
              toast.success("Cliente creado con éxito")
              setIsCreateOpen(false)
            },
            onError: (err) => {
              toast.error("Error al crear el cliente", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />

      {/* Client Edition Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedClient(null)
        }}
        title="Editar Cliente"
        description="Actualiza la información del cliente seleccionado."
        fields={clientFields}
        submitLabel="Guardar Cambios"
        defaultValues={selectedClient || undefined}
        isLoading={updateClientMutation.isPending}
        onSubmit={(values) => {
          if (!selectedClient) return

          // Filter to only send modified fields (dirty fields)
          const patchPayload: Record<string, any> = {}
          Object.keys(values).forEach((key) => {
            const newValue = values[key]
            const oldValue = (selectedClient as any)[key]

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
            setSelectedClient(null)
            return
          }

          updateClientMutation.mutate(
            { id: selectedClient.id, payload: patchPayload },
            {
              onSuccess: () => {
                toast.success("Cliente actualizado con éxito")
                setIsEditOpen(false)
                setSelectedClient(null)
              },
              onError: (err) => {
                toast.error("Error al actualizar el cliente", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* Client Details Modal */}
      <ClientDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedClient(null)
        }}
        client={selectedClient}
      />

      {/* Add Administrative Notes Modal */}
      <AddNotesModal
        isOpen={isNotesOpen}
        onClose={() => {
          setIsNotesOpen(false)
          setSelectedClient(null)
        }}
        title={`Agregar nota para: ${selectedClient?.name || ""}`}
        initialNote={selectedClient?.notes || ""}
        isLoading={addClientNoteMutation.isPending}
        onSubmit={(note) => {
          if (!selectedClient) return
          addClientNoteMutation.mutate(
            { id: selectedClient.id, notes: note },
            {
              onSuccess: () => {
                toast.success("Nota guardada correctamente")
                setIsNotesOpen(false)
                setSelectedClient(null)
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
          setSelectedClient(null)
        }}
        title="¿Eliminar cliente?"
        description={`Esta acción no se puede deshacer. Se eliminará de forma permanente el cliente "${selectedClient?.name || ""}" del sistema.`}
        confirmLabel="Eliminar Cliente"
        cancelLabel="Cancelar"
        isLoading={deleteClientMutation.isPending}
        onConfirm={() => {
          if (!selectedClient) return
          deleteClientMutation.mutate(selectedClient.id, {
            onSuccess: () => {
              toast.success("Cliente eliminado correctamente")
              setIsDeleteOpen(false)
              setSelectedClient(null)
            },
            onError: (err) => {
              toast.error("Error al eliminar el cliente", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
