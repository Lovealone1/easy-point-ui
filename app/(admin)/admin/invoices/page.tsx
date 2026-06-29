// ─────────────────────────────────────────────────────────────────────────────
// app/(admin)/admin/invoices/page.tsx
//
// Invoices CRUD Administration (Register payment/invoice, list and void invoices).
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Eye,
  Trash2,
  Plus,
  Search,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

// Table & Toolbar
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { Input } from "@/shared/components/ui/input"

// Forms & Confirmation
import { DynamicFormModal, type FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { InvoiceDetailModal } from "@/features/invoices/components/invoice-detail-modal"

// Fetch bindings
import {
  useInvoices,
  useCreateInvoice,
  useDeleteInvoice,
} from "@/features/invoices/hooks/use-invoices"
import type { Invoice, InvoiceStatus } from "@/features/invoices/types/invoices.types"
import { useOrganizationsAdmin } from "@/features/organization/hooks/use-organizations-admin"
import { useSubscriptions } from "@/features/subscriptions/hooks/use-subscriptions"

export default function InvoicesAdminPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Invoice | null>(null)

  // Mutations
  const createMutation = useCreateInvoice()
  const deleteMutation = useDeleteInvoice()

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
  const { data: invoicesResponse, isLoading, error, refetch } = useInvoices({
    page,
    limit: 10,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    invoiceNumber: debouncedSearch || undefined,
  })

  // Load select options
  const { data: orgsResponse } = useOrganizationsAdmin({ limit: 100 })
  const { data: subsResponse } = useSubscriptions({ limit: 100 })

  // Maps for lookups
  const orgMap = useMemo(() => {
    const map = new Map<string, string>()
    orgsResponse?.data?.forEach(o => map.set(o.id, o.name))
    return map
  }, [orgsResponse])

  const planMap = useMemo(() => {
    const map = new Map<string, string>()
    // Since plan belongs to subscription and plan list, let's map from subscriptions
    subsResponse?.data?.forEach(s => {
      if (s.plan) {
        map.set(s.planId, s.plan.name)
      }
    })
    return map
  }, [subsResponse])

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
      name: "subscriptionId",
      label: "Suscripción",
      type: "select",
      required: true,
      options: subsResponse?.data
        ?.filter(s => s.plan && Number(s.plan.monthlyPrice) > 0)
        ?.map(s => {
          const orgName = orgMap.get(s.organizationId) || s.organizationId
          const planName = s.plan?.name || planMap.get(s.planId) || s.planId
          return {
            label: `${orgName} - ${planName} (ID: ${s.id.substring(0, 8)})`,
            value: s.id,
          }
        }) || [],
      gridCols: 1,
    },
    {
      name: "currency",
      label: "Moneda",
      type: "select",
      required: false,
      options: [
        { label: "Pesos Colombianos (COP)", value: "COP" },
        { label: "Dólares Americanos (USD)", value: "USD" },
      ],
      gridCols: 1,
    },
    {
      name: "status",
      label: "Estado Inicial",
      type: "select",
      required: false,
      options: [
        { label: "Pendiente", value: "PENDING" },
        { label: "Pagada", value: "PAID" },
        { label: "Vencida", value: "OVERDUE" },
        { label: "Anulada", value: "VOID" },
      ],
      gridCols: 1,
    },
    {
      name: "paidAt",
      label: "Fecha de Pago (opcional)",
      type: "date",
      required: false,
      gridCols: 1,
    },
    {
      name: "paymentMethod",
      label: "Método de Pago (opcional)",
      type: "text",
      required: false,
      gridCols: 1,
      placeholder: "ej: Nequi, Bancolombia, Tarjeta",
    },
    {
      name: "paymentReference",
      label: "Referencia de Pago (opcional)",
      type: "text",
      required: false,
      gridCols: 1,
      placeholder: "ej: #TRN-12345",
    },
    {
      name: "paymentNotes",
      label: "Notas de Pago (opcional)",
      type: "textarea",
      required: false,
      gridCols: 2,
    },
    {
      name: "notes",
      label: "Notas de la Factura (opcional)",
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
      label: "Metadatos (JSON, opcional)",
      type: "textarea",
      required: false,
      gridCols: 2,
      placeholder: 'ej: {\n  "gatewayId": "ch_abc"\n}',
      showIf: (values) => !!values.showAdvanced,
    },
  ], [orgsResponse, subsResponse, orgMap, planMap])

  // Submit create invoice
  const handleCreateSubmit = (values: Record<string, any>) => {
    let meta = null
    if (values.metadata) {
      try {
        meta = JSON.parse(values.metadata)
      } catch (e) {
        toast.error("Metadatos JSON inválidos")
        return
      }
    }

    const { showAdvanced, ...cleanedValues } = values
    const payload = {
      ...cleanedValues,
      paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : undefined,
      metadata: meta || undefined,
    }

    createMutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success("Factura registrada con éxito")
        setIsCreateOpen(false)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error al registrar la factura")
      },
    })
  }

  // Confirm delete invoice (physical deletion)
  const handleDeleteConfirm = () => {
    if (!selectedRecord) return
    deleteMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Factura eliminada con éxito")
        setIsDeleteOpen(false)
        setSelectedRecord(null)
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error al eliminar la factura")
      },
    })
  }

  // Currency helper
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    return dateStr.slice(0, 10)
  }

  // Columns definition
  const columns: ColumnDef<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Factura",
      render: (row) => (
        <span className="font-semibold text-foreground text-xs font-mono">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      key: "organizationId",
      header: "Organización",
      render: (row) => (
        <span className="text-xs font-medium text-foreground">
          {orgMap.get(row.organizationId) || row.organizationId}
        </span>
      ),
    },
    {
      key: "subscriptionId",
      header: "Plan / Suscripción",
      render: (row) => {
        const planName = row.subscription?.plan?.name || planMap.get(row.subscription?.planId || "") || "Suscripción"
        return (
          <span className="text-xs text-muted-foreground">
            {planName} ({row.subscriptionId.substring(0, 8)})
          </span>
        )
      },
    },
    {
      key: "amount",
      header: "Monto",
      render: (row) => (
        <span className="text-xs font-mono font-bold text-foreground">
          {formatCurrency(Number(row.amount), row.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => {
        let styles = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
        let label = row.status as string
        if (row.status === "PAID") {
          styles = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          label = "Pagada"
        } else if (row.status === "PENDING") {
          styles = "bg-amber-500/10 text-amber-600 border-amber-500/20"
          label = "Pendiente"
        } else if (row.status === "OVERDUE") {
          styles = "bg-rose-500/10 text-rose-600 border-rose-500/20"
          label = "Vencida"
        } else if (row.status === "VOID") {
          styles = "bg-zinc-500/5 text-zinc-400 border-dashed border-zinc-300 dark:border-zinc-800"
          label = "Anulada"
        }
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles}`}>
            {label}
          </span>
        )
      },
    },
    {
      key: "dueDate",
      header: "Vencimiento",
      render: (row) => <span className="text-xs">{formatDate(row.dueDate)}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      className: "w-[100px]",
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsDetailsOpen(true)
            }}
            title="Ver detalles"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsDeleteOpen(true)
            }}
            title="Eliminar factura"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-600/10 transition-all active:scale-90 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
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
            placeholder="Buscar por número de factura..."
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
          Registrar Factura
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
          <p className="text-xs text-muted-foreground font-semibold">Error al cargar facturas</p>
          <button onClick={() => refetch()} className="text-xs text-brand-500 font-semibold underline">Reintentar</button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoicesResponse?.data || []}
          loading={isLoading}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={setSortKey}
          emptyMessage="No se encontraron facturas registradas."
          pagination={{
            currentPage: page,
            totalPages: invoicesResponse?.meta?.pageCount || 1,
            onPageChange: setPage,
            totalItems: invoicesResponse?.meta?.itemCount || 0,
            itemsPerPage: 10,
          }}
          onRowClick={(row) => {
            setSelectedRecord(row)
            setIsDetailsOpen(true)
          }}
          glassy={true}
        />
      )}

      {/* Create/Register Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Factura / Pago"
        description="Completa la información para registrar una factura y su correspondiente estado de pago."
        fields={formFields}
        submitLabel="Registrar Factura"
        isLoading={createMutation.isPending}
        onSubmit={handleCreateSubmit}
      />

      {/* Deletion Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRecord(null)
        }}
        title="¿Eliminar Factura?"
        description="Esta acción eliminará de forma permanente el registro de la factura de la base de datos. No se puede deshacer."
        confirmLabel="Eliminar Factura"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      {/* Premium Electronic Invoice Details Modal */}
      <InvoiceDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedRecord(null)
        }}
        invoice={selectedRecord}
        orgName={selectedRecord ? (orgMap.get(selectedRecord.organizationId) || "Cargando...") : undefined}
        planName={selectedRecord ? (selectedRecord.subscription?.plan?.name || planMap.get(selectedRecord.subscription?.planId || "") || "Cargando...") : undefined}
      />
    </div>
  )
}
