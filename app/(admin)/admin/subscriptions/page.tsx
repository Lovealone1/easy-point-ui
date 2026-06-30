// ─────────────────────────────────────────────────────────────────────────────
// app/(admin)/admin/subscriptions/page.tsx
//
// Organization Subscriptions CRUD Administration.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Pencil,
  Trash2,
  Plus,
  Play,
  Pause,
  XCircle,
  AlertCircle,
  Eye,
  Search,
  Loader2,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"

// Table & Toolbar
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { Input } from "@/shared/components/ui/input"

// Forms & Confirmation
import { DynamicFormModal, type FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

// Fetch bindings
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
} from "@/features/subscriptions/hooks/use-subscriptions"
import type { Subscription, BillingCycle, SubscriptionStatus } from "@/features/subscriptions/types/subscriptions.types"
import { useOrganizationsAdmin } from "@/features/organization/hooks/use-organizations-admin"
import { usePlans } from "@/features/plans/hooks/use-plans"

export default function SubscriptionsAdminPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPauseOpen, setIsPauseOpen] = useState(false)
  const [isResumeOpen, setIsResumeOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Subscription | null>(null)

  // Mutations
  const createMutation = useCreateSubscription()
  const updateMutation = useUpdateSubscription()
  const deleteMutation = useDeleteSubscription()
  const pauseMutation = usePauseSubscription()
  const resumeMutation = useResumeSubscription()
  const cancelMutation = useCancelSubscription()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch lists
  const { data: subResponse, isLoading, error, refetch } = useSubscriptions({
    page,
    limit: 10,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  // Load select options
  const { data: orgsResponse } = useOrganizationsAdmin({ limit: 100 })
  const { data: plansResponse } = usePlans({ limit: 100 })

  // Maps for lookups
  const orgMap = useMemo(() => {
    const map = new Map<string, string>()
    orgsResponse?.data?.forEach(o => map.set(o.id, o.name))
    return map
  }, [orgsResponse])

  const planMap = useMemo(() => {
    const map = new Map<string, string>()
    plansResponse?.data?.forEach(p => map.set(p.id, p.name))
    return map
  }, [plansResponse])

  // Form Fields
  const formFields = useMemo<FormFieldSchema[]>(() => [
    {
      name: "organizationId",
      label: "Organización",
      type: "select",
      required: true,
      options: orgsResponse?.data?.map(o => ({ label: o.name, value: o.id })) || [],
      gridCols: 1,
    },
    {
      name: "planId",
      label: "Plan de Precios",
      type: "select",
      required: true,
      options: plansResponse?.data?.map(p => ({ label: p.name, value: p.id })) || [],
      gridCols: 1,
    },
    {
      name: "billingCycle",
      label: "Ciclo de Facturación",
      type: "select",
      required: true,
      options: [
        { label: "Mensual", value: "MONTHLY" },
        { label: "Anual", value: "YEARLY" },
      ],
      gridCols: 1,
    },
    {
      name: "status",
      label: "Estado",
      type: "select",
      required: false,
      options: [
        { label: "Activa", value: "ACTIVE" },
        { label: "Pendiente de Pago", value: "PENDING_PAYMENT" },
        { label: "Prueba (Trial)", value: "TRIALING" },
        { label: "Vencida", value: "PAST_DUE" },
        { label: "Cancelada", value: "CANCELLED" },
        { label: "Expirada", value: "EXPIRED" },
      ],
      gridCols: 1,
    },
    {
      name: "currentPeriodStart",
      label: "Inicio Período",
      type: "date",
      required: false,
      gridCols: 1,
    },
    {
      name: "currentPeriodEnd",
      label: "Fin Período",
      type: "date",
      required: false,
      gridCols: 1,
    },
    {
      name: "trialEndsAt",
      label: "Fin Período Prueba",
      type: "date",
      required: false,
      gridCols: 1,
      showIf: (values) => values.status === "TRIALING",
    },
    {
      name: "notes",
      label: "Notas",
      type: "textarea",
      required: false,
      gridCols: 2,
    },
    {
      name: "showAdvanced",
      label: "Configuraciones Avanzadas",
      type: "boolean",
      required: false,
      gridCols: 2,
    },
    {
      name: "metadata",
      label: "Metadatos (JSON)",
      type: "textarea",
      required: false,
      gridCols: 2,
      placeholder: 'ej: {\n  "gatewayId": "sub_abc"\n}',
      showIf: (values) => !!values.showAdvanced,
    },
  ], [orgsResponse, plansResponse])

  const editDefaultValues = useMemo(() => {
    if (!selectedRecord) return undefined
    const start = selectedRecord.currentPeriodStart ? new Date(selectedRecord.currentPeriodStart) : undefined
    const end = selectedRecord.currentPeriodEnd ? new Date(selectedRecord.currentPeriodEnd) : undefined
    const trial = selectedRecord.trialEndsAt ? new Date(selectedRecord.trialEndsAt) : undefined

    return {
      ...selectedRecord,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      trialEndsAt: trial,
      showAdvanced: !!selectedRecord.metadata,
      metadata: selectedRecord.metadata ? JSON.stringify(selectedRecord.metadata, null, 2) : "",
    }
  }, [selectedRecord])

  // Submits
  const handleCreateSubmit = (values: Record<string, any>) => {
    let meta = null
    if (values.metadata) {
      try { meta = JSON.parse(values.metadata) } catch (e) {
        toast.error("Metadatos JSON inválidos")
        return
      }
    }

    const { showAdvanced, ...cleanedValues } = values
    const payload = {
      ...cleanedValues,
      currentPeriodStart: cleanedValues.currentPeriodStart ? new Date(cleanedValues.currentPeriodStart).toISOString() : undefined,
      currentPeriodEnd: cleanedValues.currentPeriodEnd ? new Date(cleanedValues.currentPeriodEnd).toISOString() : undefined,
      trialEndsAt: cleanedValues.trialEndsAt ? new Date(cleanedValues.trialEndsAt).toISOString() : undefined,
      metadata: meta,
    }

    createMutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success("Suscripción creada con éxito")
        setIsCreateOpen(false)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error al crear la suscripción")
      },
    })
  }

  const handleEditSubmit = (values: Record<string, any>) => {
    if (!selectedRecord) return

    let meta = undefined
    if (values.metadata !== undefined) {
      if (values.metadata === "" || values.metadata === null) {
        meta = null
      } else {
        try { meta = JSON.parse(values.metadata) } catch (e) {
          toast.error("Metadatos JSON inválidos")
          return
        }
      }
    }

    const { showAdvanced, ...cleanedValues } = values
    const payload: Record<string, any> = {
      ...cleanedValues,
      currentPeriodStart: cleanedValues.currentPeriodStart ? new Date(cleanedValues.currentPeriodStart).toISOString() : undefined,
      currentPeriodEnd: cleanedValues.currentPeriodEnd ? new Date(cleanedValues.currentPeriodEnd).toISOString() : undefined,
      trialEndsAt: cleanedValues.trialEndsAt ? new Date(cleanedValues.trialEndsAt).toISOString() : undefined,
      metadata: meta,
    }

    const patchPayload: Record<string, any> = {}
    Object.keys(payload).forEach((key) => {
      const newVal = payload[key]
      if (key === "metadata") {
        const oldValStr = selectedRecord.metadata ? JSON.stringify(selectedRecord.metadata) : ""
        const newValStr = newVal ? JSON.stringify(newVal) : ""
        if (oldValStr !== newValStr) patchPayload[key] = newVal
        return
      }
      const oldVal = (selectedRecord as any)[key]
      if (["currentPeriodStart", "currentPeriodEnd", "trialEndsAt"].includes(key)) {
        const oldDateStr = oldVal ? new Date(oldVal).toISOString().slice(0, 10) : ""
        const newDateStr = newVal ? new Date(newVal).toISOString().slice(0, 10) : ""
        if (oldDateStr !== newDateStr) patchPayload[key] = newVal
        return
      }
      if (newVal !== oldVal) patchPayload[key] = newVal
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
          toast.success("Suscripción actualizada con éxito")
          setIsEditOpen(false)
          setSelectedRecord(null)
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Error al actualizar la suscripción")
        },
      }
    )
  }

  const handleDeleteConfirm = () => {
    if (!selectedRecord) return
    deleteMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Suscripción eliminada con éxito")
        setIsDeleteOpen(false)
        setSelectedRecord(null)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error al eliminar la suscripción")
      },
    })
  }

  const handlePauseConfirm = () => {
    if (!selectedRecord) return
    pauseMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Suscripción pausada con éxito")
        setIsPauseOpen(false)
        setSelectedRecord(null)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error al pausar la suscripción")
      },
    })
  }

  const handleResumeConfirm = () => {
    if (!selectedRecord) return
    resumeMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Suscripción reactivada con éxito")
        setIsResumeOpen(false)
        setSelectedRecord(null)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error al reactivar la suscripción")
      },
    })
  }

  const handleCancelConfirm = () => {
    if (!selectedRecord) return
    cancelMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Suscripción cancelada con éxito")
        setIsCancelOpen(false)
        setSelectedRecord(null)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error al cancelar la suscripción")
      },
    })
  }

  // Handle columns
  const columns: ColumnDef<Subscription>[] = [
    {
      key: "organizationId",
      header: "Organización",
      render: (row) => <span className="font-semibold text-foreground text-xs">{orgMap.get(row.organizationId) || row.organizationId}</span>,
    },
    {
      key: "planId",
      header: "Plan",
      render: (row) => <span className="text-xs">{row.plan?.name || planMap.get(row.planId) || row.planId}</span>,
    },
    {
      key: "billingCycle",
      header: "Ciclo",
      render: (row) => <span className="text-xs">{row.billingCycle === "MONTHLY" ? "Mensual" : "Anual"}</span>,
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => {
        let styles = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
        let label = row.status as string
        if (row.status === "ACTIVE") {
          styles = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          label = "Activa"
        } else if (row.status === "PENDING_PAYMENT") {
          styles = "bg-amber-500/10 text-amber-600 border-amber-500/20"
          label = "Pendiente de Pago"
        } else if (row.status === "TRIALING") {
          styles = "bg-blue-500/10 text-blue-600 border-blue-500/20"
          label = "Prueba"
        } else if (row.status === "PAST_DUE") {
          styles = "bg-rose-500/10 text-rose-600 border-rose-500/20"
          label = "Vencida"
        } else if (row.status === "CANCELLED") {
          styles = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
          label = "Cancelada"
        }
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles}`}>
            {label} {row.isPaused && "(Pausada)"}
          </span>
        )
      },
    },
    {
      key: "currentPeriodEnd",
      header: "Vence el",
      render: (row) => <span className="text-xs">{row.currentPeriodEnd ? row.currentPeriodEnd.slice(0, 10) : "-"}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "center",
      className: "w-[180px]",
      render: (row) => {
        const isEditing = updateMutation.isPending && updateMutation.variables?.id === row.id

        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setSelectedRecord(row); setIsDetailsOpen(true) }}
              title="Ver detalles"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setSelectedRecord(row); setIsEditOpen(true) }}
              disabled={isEditing}
              title="Editar"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {row.isPaused ? (
              <button
                onClick={() => { setSelectedRecord(row); setIsResumeOpen(true) }}
                title="Reactivar"
                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-all active:scale-90 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => { setSelectedRecord(row); setIsPauseOpen(true) }}
                title="Pausar"
                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all active:scale-90 cursor-pointer"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            {row.status !== "CANCELLED" && (
              <button
                onClick={() => { setSelectedRecord(row); setIsCancelOpen(true) }}
                title="Cancelar"
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => { setSelectedRecord(row); setIsDeleteOpen(true) }}
              title="Eliminar"
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-600/10 transition-all active:scale-90 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Toolbar: search + create */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder="Buscar por ID de organización o plan..."
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
          Nueva Suscripción
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
          <p className="text-xs text-muted-foreground font-semibold">Error al cargar suscripciones</p>
          <button onClick={() => refetch()} className="text-xs text-brand-500 font-semibold underline">Reintentar</button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={subResponse?.data || []}
          loading={isLoading}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={setSortKey}
          emptyMessage="No se encontraron suscripciones."
          pagination={{
            currentPage: page,
            totalPages: subResponse?.meta?.pageCount || 1,
            onPageChange: setPage,
            totalItems: subResponse?.meta?.itemCount || 0,
            itemsPerPage: 10,
          }}
          onRowClick={(row) => { setSelectedRecord(row); setIsDetailsOpen(true) }}
          glassy={true}
        />
      )}

      {/* Create Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nueva Suscripción"
        description="Completa la información para crear una suscripción a una organización."
        fields={formFields}
        submitLabel="Crear Suscripción"
        isLoading={createMutation.isPending}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedRecord(null) }}
        title="Editar Suscripción"
        description="Actualiza la configuración de la suscripción seleccionada."
        fields={formFields}
        defaultValues={editDefaultValues}
        submitLabel="Guardar Cambios"
        isLoading={updateMutation.isPending}
        onSubmit={handleEditSubmit}
      />

      {/* Pause Confirmation */}
      <ConfirmModal
        isOpen={isPauseOpen}
        onClose={() => { setIsPauseOpen(false); setSelectedRecord(null) }}
        title="¿Pausar Suscripción?"
        description="Esta acción pausará temporalmente el acceso de la organización a sus módulos correspondientes."
        confirmLabel="Pausar Suscripción"
        cancelLabel="Cancelar"
        isLoading={pauseMutation.isPending}
        onConfirm={handlePauseConfirm}
        variant="warning"
      />

      {/* Resume Confirmation */}
      <ConfirmModal
        isOpen={isResumeOpen}
        onClose={() => { setIsResumeOpen(false); setSelectedRecord(null) }}
        title="¿Reactivar Suscripción?"
        description="Esta acción reactivará la suscripción pausada restableciendo el acceso a los módulos."
        confirmLabel="Reactivar Suscripción"
        cancelLabel="Cancelar"
        isLoading={resumeMutation.isPending}
        onConfirm={handleResumeConfirm}
      />

      {/* Cancel Confirmation */}
      <ConfirmModal
        isOpen={isCancelOpen}
        onClose={() => { setIsCancelOpen(false); setSelectedRecord(null) }}
        title="¿Cancelar Suscripción?"
        description="Esta acción marcará la suscripción como cancelada. No se puede deshacer de forma directa."
        confirmLabel="Cancelar Suscripción"
        cancelLabel="Cancelar"
        isLoading={cancelMutation.isPending}
        onConfirm={handleCancelConfirm}
        variant="danger"
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedRecord(null) }}
        title="¿Eliminar Suscripción?"
        description="Esta acción eliminará de forma permanente el registro de la suscripción. No se puede deshacer."
        confirmLabel="Eliminar Suscripción"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      {/* Details View (Temporary basic layout modal as per guidelines) */}
      <ConfirmModal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedRecord(null) }}
        title="Detalles de la Suscripción"
        description={
          selectedRecord ? (
            <div className="space-y-2.5 text-left text-xs text-foreground/80 mt-4 border border-border/40 p-4 rounded-xl bg-muted/5 font-mono leading-relaxed">
              <div><strong>ID:</strong> {selectedRecord.id}</div>
              <div><strong>Organización ID:</strong> {selectedRecord.organizationId}</div>
              <div><strong>Organización:</strong> {orgMap.get(selectedRecord.organizationId) || "Cargando..."}</div>
              <div><strong>Plan ID:</strong> {selectedRecord.planId}</div>
              <div><strong>Plan:</strong> {selectedRecord.plan?.name || planMap.get(selectedRecord.planId) || "Cargando..."}</div>
              <div><strong>Ciclo Facturación:</strong> {selectedRecord.billingCycle}</div>
              <div><strong>Estado:</strong> {selectedRecord.status}</div>
              <div><strong>¿Pausada?:</strong> {selectedRecord.isPaused ? "Sí" : "No"}</div>
              <div><strong>Inicio Período:</strong> {selectedRecord.currentPeriodStart}</div>
              <div><strong>Fin Período:</strong> {selectedRecord.currentPeriodEnd}</div>
              <div><strong>Fin Prueba:</strong> {selectedRecord.trialEndsAt || "-"}</div>
              <div><strong>Cancelado en:</strong> {selectedRecord.cancelledAt || "-"}</div>
              <div><strong>Notas:</strong> {selectedRecord.notes || "-"}</div>
              <div><strong>Metadatos:</strong> {selectedRecord.metadata ? JSON.stringify(selectedRecord.metadata) : "-"}</div>
            </div>
          ) : ""
        }
        confirmLabel="Cerrar"
        onConfirm={() => setIsDetailsOpen(false)}
      />
    </div>
  )
}
