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
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useChangeBankAccountStatus,
} from "@/features/bank-accounts/hooks/use-bank-accounts"
import type { BankAccount, BankAccountStatus } from "@/features/bank-accounts/types/bank-accounts.types"
import { BANK_ACCOUNT_STATUS_LABELS } from "@/features/bank-accounts/types/bank-accounts.types"
import { Pencil, Eye, Trash2, Loader2, DollarSign, Hash, QrCode } from "lucide-react"

// Shared and feature-specific modals
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { BankAccountDetailModal } from "@/features/bank-accounts/components/bank-account-detail-modal"
import { BankAccountQrCodeModal } from "@/features/bank-accounts/components/bank-account-qrcode-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

export default function BankAccountsPage() {
  // Mutations for CRUD and status actions
  const createBankAccountMutation = useCreateBankAccount()
  const updateBankAccountMutation = useUpdateBankAccount()
  const deleteBankAccountMutation = useDeleteBankAccount()
  const changeStatusMutation = useChangeBankAccountStatus()

  // Modal state management
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isQrOpen, setIsQrOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedAccount, setSelectedAccount] = React.useState<BankAccount | null>(null)

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

  // Fetch paginated bank accounts from BFF proxy
  const { data: response, isLoading, error } = useBankAccounts({
    page,
    limit: 8,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  // Display error toast if fetching fails
  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar cuentas bancarias", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Form fields for CREATING a bank account (includes QR file field)
  const createFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "name",
      label: "Nombre de la Cuenta",
      type: "text",
      placeholder: "Ej. Cuenta Corriente Principal",
      required: true,
      gridCols: 2,
    },
    {
      name: "accountNumber",
      label: "Número de Cuenta",
      type: "text",
      placeholder: "Ej. 123-456789-01",
      required: false,
      gridCols: 2,
    },
    {
      name: "currency",
      label: "Divisa / Moneda",
      type: "select",
      placeholder: "Seleccione moneda",
      required: false,
      gridCols: 2,
      defaultValue: "COP",
      options: [
        { label: "Peso Colombiano (COP)", value: "COP" },
        { label: "Peso Chileno (CLP)", value: "CLP" },
        { label: "Dólar Estadounidense (USD)", value: "USD" },
        { label: "Euro (EUR)", value: "EUR" },
      ],
    },
    {
      name: "file",
      label: "Código QR (Opcional)",
      type: "file",
      placeholder: "image/png,image/jpeg,image/jpg,image/webp",
      required: false,
      gridCols: 2,
    },
  ], [])

  // Form fields for EDITING a bank account (excludes file field, QR managed separately)
  const editFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "name",
      label: "Nombre de la Cuenta",
      type: "text",
      placeholder: "Ej. Cuenta Corriente Principal",
      required: true,
      gridCols: 2,
    },
    {
      name: "accountNumber",
      label: "Número de Cuenta",
      type: "text",
      placeholder: "Ej. 123-456789-01",
      required: false,
      gridCols: 2,
    },
    {
      name: "currency",
      label: "Divisa / Moneda",
      type: "select",
      placeholder: "Seleccione moneda",
      required: false,
      gridCols: 2,
      defaultValue: "COP",
      options: [
        { label: "Peso Colombiano (COP)", value: "COP" },
        { label: "Peso Chileno (CLP)", value: "CLP" },
        { label: "Dólar Estadounidense (USD)", value: "USD" },
        { label: "Euro (EUR)", value: "EUR" },
      ],
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
    setPage(1)
  }

  // Format currency value based on its specific currency code
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: currency || "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Column definitions matching system aesthetics
  const columns: ColumnDef<BankAccount>[] = [
    {
      key: "name",
      header: "Cuenta Bancaria",
      sortable: true,
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">{row.name}</span>
          <span className="text-xs text-muted-foreground/80 mt-0.5 font-mono truncate">
            ID: {row.id.substring(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      key: "accountNumber",
      header: "Número de Cuenta",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-sm font-mono text-foreground/80 truncate max-w-[150px]">
            {row.accountNumber || "Sin registrar"}
          </span>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Saldo Disponible",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500/80 shrink-0" />
          <span className="text-sm font-mono font-semibold text-foreground">
            {formatCurrency(row.balance, row.currency)}
          </span>
        </div>
      ),
    },
    {
      key: "currency",
      header: "Moneda",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          {row.currency}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const isPending =
          changeStatusMutation.isPending &&
          changeStatusMutation.variables?.id === row.id
        
        let badgeStyle = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
        if (row.status === "ACTIVE") {
          badgeStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
        } else if (row.status === "FROZEN") {
          badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15"
        }

        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const statusOrder: BankAccountStatus[] = ["ACTIVE", "FROZEN", "INACTIVE"]
              const currentIndex = statusOrder.indexOf(row.status)
              const nextIndex = (currentIndex + 1) % statusOrder.length
              const nextStatus = statusOrder[nextIndex]

              changeStatusMutation.mutate(
                { id: row.id, status: nextStatus },
                {
                  onSuccess: (res) =>
                    toast.success(
                      `Cuenta cambiada a ${BANK_ACCOUNT_STATUS_LABELS[res.status]} con éxito`
                    ),
                  onError: () =>
                    toast.error("Error al cambiar el estado de la cuenta"),
                }
              )
            }}
            disabled={isPending}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all hover:brightness-95 active:scale-95 disabled:opacity-50 cursor-pointer ${badgeStyle}`}
            title="Cambiar estado de cuenta"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : null}
            {BANK_ACCOUNT_STATUS_LABELS[row.status] || row.status}
          </button>
        )
      },
    },
    {
      key: "acciones",
      header: "Acciones",
      className: "w-[150px]",
      render: (row) => {
        const isDeleting =
          deleteBankAccountMutation.isPending && deleteBankAccountMutation.variables === row.id
        const isEditing =
          updateBankAccountMutation.isPending && updateBankAccountMutation.variables?.id === row.id

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Ver detalles */}
            <button
              onClick={() => {
                setSelectedAccount(row)
                setIsDetailsOpen(true)
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Ver detalles"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {/* Código QR (Acción Dinámica) */}
            <button
              onClick={() => {
                setSelectedAccount(row)
                setIsQrOpen(true)
              }}
              className={`p-1.5 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer ${
                row.qrCode
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 border border-dashed border-muted-foreground/30"
              }`}
              title={row.qrCode ? "Ver Código QR" : "Subir Código QR"}
            >
              <QrCode className="h-3.5 w-3.5" />
            </button>

            {/* Editar */}
            <button
              onClick={() => {
                setSelectedAccount(row)
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

            {/* Eliminar */}
            <button
              onClick={() => {
                setSelectedAccount(row)
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

  // Update selected account object in other states when it updates in React Query cache
  React.useEffect(() => {
    if (selectedAccount && response?.data) {
      const freshRecord = response.data.find((item) => item.id === selectedAccount.id)
      if (freshRecord) {
        setSelectedAccount(freshRecord)
      }
    }
  }, [response, selectedAccount])

  return (
    <div className="space-y-4">
      {/* Control Header: Search bar + Create button */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o número..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nueva Cuenta"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: response?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: response?.meta?.itemCount || 0,
          itemsPerPage: 8,
        }}
        onRowClick={(row) => {
          setSelectedAccount(row)
          setIsDetailsOpen(true)
        }}
        glassy={true}
      />

      {/* Creation Modal (supporting file uploads) */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nueva Cuenta Bancaria"
        description="Completa la información para registrar una nueva cuenta de la organización."
        fields={createFields}
        submitLabel="Crear Cuenta"
        isLoading={createBankAccountMutation.isPending}
        onSubmit={(values) => {
          createBankAccountMutation.mutate(values as any, {
            onSuccess: () => {
              toast.success("Cuenta bancaria creada con éxito")
              setIsCreateOpen(false)
            },
            onError: (err) => {
              toast.error("Error al crear la cuenta bancaria", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />

      {/* Edition Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedAccount(null)
        }}
        title="Editar Cuenta Bancaria"
        description="Actualiza la información general de la cuenta seleccionada."
        fields={editFields}
        submitLabel="Guardar Cambios"
        defaultValues={selectedAccount || undefined}
        isLoading={updateBankAccountMutation.isPending}
        onSubmit={(values) => {
          if (!selectedAccount) return

          // Filter to only send modified fields (dirty fields)
          const patchPayload: Record<string, any> = {}
          Object.keys(values).forEach((key) => {
            const newValue = values[key]
            const oldValue = (selectedAccount as any)[key]

            const isOldFalsy = oldValue === null || oldValue === undefined || oldValue === ""
            const isNewFalsy = newValue === null || newValue === undefined || newValue === ""
            if (isOldFalsy && isNewFalsy) return

            if (newValue !== oldValue) {
              patchPayload[key] = newValue
            }
          })

          if (Object.keys(patchPayload).length === 0) {
            toast.info("No se realizaron modificaciones")
            setIsEditOpen(false)
            setSelectedAccount(null)
            return
          }

          updateBankAccountMutation.mutate(
            { id: selectedAccount.id, payload: patchPayload },
            {
              onSuccess: () => {
                toast.success("Cuenta bancaria actualizada con éxito")
                setIsEditOpen(false)
                setSelectedAccount(null)
              },
              onError: (err) => {
                toast.error("Error al actualizar la cuenta bancaria", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* Details Modal (no QR link button as requested) */}
      <BankAccountDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedAccount(null)
        }}
        account={selectedAccount}
      />

      {/* QR Code Upload / Manage Modal */}
      <BankAccountQrCodeModal
        isOpen={isQrOpen}
        onClose={() => {
          setIsQrOpen(false)
          setSelectedAccount(null)
        }}
        account={selectedAccount}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedAccount(null)
        }}
        title="¿Eliminar cuenta bancaria?"
        description={`Esta acción no se puede deshacer. Se eliminará la cuenta bancaria "${selectedAccount?.name || ""}" y todos los archivos adjuntos (como su código QR) asociados de forma permanente.`}
        confirmLabel="Eliminar Cuenta"
        cancelLabel="Cancelar"
        isLoading={deleteBankAccountMutation.isPending}
        onConfirm={() => {
          if (!selectedAccount) return
          deleteBankAccountMutation.mutate(selectedAccount.id, {
            onSuccess: () => {
              toast.success("Cuenta bancaria eliminada correctamente")
              setIsDeleteOpen(false)
              setSelectedAccount(null)
            },
            onError: (err) => {
              toast.error("Error al eliminar la cuenta bancaria", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
