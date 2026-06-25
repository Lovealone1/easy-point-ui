// ─────────────────────────────────────────────────────────────────────────────
// app/(admin)/admin/plans/page.tsx
//
// Pricing Plans CRUD Administration.
// Global administrators can view, filter, sort, paginate, create, edit, toggle,
// and delete pricing plans.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Pencil,
  Trash2,
  Plus,
  Award,
  Loader2,
  AlertCircle,
  Eye,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"

// Table and Toolbar shared primitives
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { Input } from "@/shared/components/ui/input"

// Modal shared primitives
import { DynamicFormModal, type FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

// Feature bindings
import {
  usePlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useTogglePlanActive,
} from "@/features/plans/hooks/use-plans"
import { PlansDetailModal } from "@/features/plans/components/plans-detail-modal"
import type { Plan } from "@/features/plans/types/plans.types"

export default function PlansAdminPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modals visibility state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Plan | null>(null)

  // Mutations
  const createMutation = useCreatePlan()
  const updateMutation = useUpdatePlan()
  const deleteMutation = useDeletePlan()
  const toggleMutation = useTogglePlanActive()

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when query filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch paginated pricing plans
  const { data: plansResponse, isLoading, error, refetch } = usePlans({
    page,
    limit: 10,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  // Format currency helper
  const formatCurrency = (value: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: currencyCode || "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)
    } catch {
      return `${currencyCode} ${value}`
    }
  }

  // Handle column sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
    setPage(1)
  }

  // Create Form Fields
  const createFields = useMemo<FormFieldSchema[]>(() => [
    {
      name: "name",
      label: "Nombre del Plan",
      type: "text",
      required: true,
      gridCols: 2,
      placeholder: "ej: Plan Premium",
    },
    {
      name: "monthlyPrice",
      label: "Precio Mensual",
      type: "number",
      required: true,
      gridCols: 1,
      placeholder: "ej: 49900",
    },
    {
      name: "yearlyPrice",
      label: "Precio Anual",
      type: "number",
      required: true,
      gridCols: 1,
      placeholder: "ej: 499000",
    },
    {
      name: "currency",
      label: "Moneda (ISO 3 letras)",
      type: "text",
      required: false,
      gridCols: 1,
      placeholder: "ej: COP",
    },
    {
      name: "isActive",
      label: "Activo por defecto",
      type: "boolean",
      gridCols: 1,
    },
    {
      name: "description",
      label: "Descripción del Plan",
      type: "textarea",
      required: false,
      gridCols: 2,
      placeholder: "Beneficios y especificaciones del plan...",
    },
    {
      name: "metadata",
      label: "Metadatos Adicionales (Formato JSON)",
      type: "textarea",
      required: false,
      gridCols: 2,
      placeholder: 'ej: {\n  "maxUsers": 10,\n  "hasInvoiceModule": true\n}',
    },
  ], [])

  // Default values for edit mode (pre-stringifying the metadata JSON object)
  const defaultEditValues = useMemo(() => {
    if (!selectedRecord) return undefined
    return {
      ...selectedRecord,
      metadata: selectedRecord.metadata ? JSON.stringify(selectedRecord.metadata, null, 2) : "",
    }
  }, [selectedRecord])

  // Submit handlers
  const handleCreateSubmit = (values: Record<string, any>) => {
    let parsedMetadata = null
    if (values.metadata) {
      try {
        parsedMetadata = JSON.parse(values.metadata)
      } catch (e) {
        toast.error("El campo Metadatos debe tener un formato JSON válido")
        return
      }
    }

    const payload = {
      ...values,
      monthlyPrice: Number(values.monthlyPrice),
      yearlyPrice: Number(values.yearlyPrice),
      currency: values.currency || "COP",
      metadata: parsedMetadata,
    }

    createMutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success("Plan creado con éxito")
        setIsCreateOpen(false)
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || "Error al crear el plan"
        toast.error(message)
      },
    })
  }

  const handleEditSubmit = (values: Record<string, any>) => {
    if (!selectedRecord) return

    let parsedMetadata = undefined
    if (values.metadata !== undefined) {
      if (values.metadata === "" || values.metadata === null || values.metadata === undefined) {
        parsedMetadata = null
      } else {
        try {
          parsedMetadata = JSON.parse(values.metadata)
        } catch (e) {
          toast.error("El campo Metadatos debe tener un formato JSON válido")
          return
        }
      }
    }

    const payload: Record<string, any> = {
      ...values,
      monthlyPrice: values.monthlyPrice !== undefined ? Number(values.monthlyPrice) : undefined,
      yearlyPrice: values.yearlyPrice !== undefined ? Number(values.yearlyPrice) : undefined,
      metadata: parsedMetadata,
    }

    // Filter to only send modified fields (dirty-field diffing)
    const patchPayload: Record<string, any> = {}
    Object.keys(payload).forEach((key) => {
      const newVal = payload[key]

      if (key === "metadata") {
        const oldVal = selectedRecord.metadata
        const oldValStr = oldVal ? JSON.stringify(oldVal) : ""
        const newValStr = newVal ? JSON.stringify(newVal) : ""
        if (oldValStr !== newValStr) {
          patchPayload[key] = newVal
        }
        return
      }

      const oldVal = (selectedRecord as any)[key]
      const isOldFalsy = oldVal === null || oldVal === undefined || oldVal === ""
      const isNewFalsy = newVal === null || newVal === undefined || newVal === ""
      if (isOldFalsy && isNewFalsy) return

      if (newVal !== oldVal) {
        patchPayload[key] = newVal
      }
    })

    if (Object.keys(patchPayload).length === 0) {
      toast.info("No se realizaron cambios")
      setIsEditOpen(false)
      setSelectedRecord(null)
      return
    }

    updateMutation.mutate(
      { id: selectedRecord.id, payload: patchPayload },
      {
        onSuccess: () => {
          toast.success("Plan actualizado con éxito")
          setIsEditOpen(false)
          setSelectedRecord(null)
        },
        onError: (err: any) => {
          const message = err.response?.data?.message || "Error al actualizar el plan"
          toast.error(message)
        },
      }
    )
  }

  const handleDeleteConfirm = () => {
    if (!selectedRecord) return
    deleteMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Plan eliminado con éxito")
        setIsDeleteOpen(false)
        setSelectedRecord(null)
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || "Error al eliminar el plan"
        toast.error(message)
      },
    })
  }

  // Table Columns
  const columns: ColumnDef<Plan>[] = [
    {
      key: "name",
      header: "Plan",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
            <Award className="h-4 w-4 stroke-[1.5]" />
          </div>
          <span className="font-semibold text-foreground text-xs">{row.name}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (row) => (
        <span className="text-muted-foreground/90 truncate max-w-[220px] block text-xs">
          {row.description || <span className="italic text-muted-foreground/45">Sin descripción</span>}
        </span>
      ),
    },
    {
      key: "monthlyPrice",
      header: "Precio Mensual",
      sortable: true,
      className: "font-mono font-semibold text-brand-500 dark:text-brand-400",
      render: (row) => formatCurrency(row.monthlyPrice, row.currency),
    },
    {
      key: "yearlyPrice",
      header: "Precio Anual",
      sortable: true,
      className: "font-mono font-semibold text-indigo-500 dark:text-indigo-400",
      render: (row) => formatCurrency(row.yearlyPrice, row.currency),
    },
    {
      key: "isActive",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const isPending = toggleMutation.isPending && toggleMutation.variables?.id === row.id
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleMutation.mutate(
                { id: row.id, isActive: !row.isActive },
                {
                  onSuccess: (res) => toast.success(`Plan ${res.isActive ? "activado" : "desactivado"} con éxito`),
                  onError: () => toast.error("Error al actualizar estado del plan"),
                }
              )
            }}
            disabled={isPending}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 cursor-pointer ${
              row.isActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/15"
            }`}
            title={row.isActive ? "Desactivar plan" : "Activar plan"}
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
      key: "actions",
      header: "Acciones",
      className: "w-[120px]",
      render: (row) => {
        const isEditing = updateMutation.isPending && updateMutation.variables?.id === row.id
        const isDeleting = deleteMutation.isPending && deleteMutation.variables === row.id

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setSelectedRecord(row)
                setIsDetailOpen(true)
              }}
              title="Ver detalles"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setSelectedRecord(row)
                setIsEditOpen(true)
              }}
              disabled={isEditing}
              title="Editar plan"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer disabled:opacity-50"
            >
              {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => {
                setSelectedRecord(row)
                setIsDeleteOpen(true)
              }}
              disabled={isDeleting}
              title="Eliminar plan"
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Toolbar: search + create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder="Buscar plan por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-xs border-border bg-card focus-visible:ring-brand-500 placeholder:text-muted-foreground/50 shadow-sm"
          />
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white rounded-[11px] gap-1.5 flex items-center justify-center px-4 h-10 transition-all duration-150 active:scale-95 cursor-pointer text-xs font-semibold shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Nuevo Plan
        </button>
      </div>

      {/* Content Area */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50 select-none">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Error al cargar planes</h3>
            <p className="text-[11px] text-muted-foreground">
              Ocurrió un error al conectar con el servidor.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline cursor-pointer"
          >
            Reintentar consulta
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={plansResponse?.data || []}
          loading={isLoading}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No se encontraron planes registrados."
          pagination={{
            currentPage: page,
            totalPages: plansResponse?.meta?.pageCount || 1,
            onPageChange: setPage,
            totalItems: plansResponse?.meta?.itemCount || 0,
            itemsPerPage: 10,
          }}
          onRowClick={(row) => {
            setSelectedRecord(row)
            setIsDetailOpen(true)
          }}
          glassy={true}
        />
      )}

      {/* Create Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo Plan de Precios"
        description="Registra un nuevo plan de suscripción en el sistema."
        fields={createFields}
        submitLabel="Crear Plan"
        isLoading={createMutation.isPending}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedRecord(null)
        }}
        title="Editar Plan de Precios"
        description="Actualiza las tarifas y características del plan de suscripción."
        fields={createFields}
        defaultValues={defaultEditValues}
        submitLabel="Guardar Cambios"
        isLoading={updateMutation.isPending}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRecord(null)
        }}
        title="¿Eliminar plan de precios?"
        description={`Esta acción eliminará el plan "${selectedRecord?.name || ""}" del sistema. Los clientes existentes que utilicen este plan podrían verse afectados.`}
        confirmLabel="Eliminar Plan"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      {/* Detail Modal */}
      <PlansDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedRecord(null)
        }}
        record={selectedRecord}
      />
    </div>
  )
}
