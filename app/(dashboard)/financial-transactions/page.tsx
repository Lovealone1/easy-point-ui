"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  DataTable,
  ColumnDef,
} from "@/shared/components/ui/data-table"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Button } from "@/shared/components/ui/button"
import {
  useFinancialTransactions,
  useCreateFinancialTransaction,
  useDeleteFinancialTransaction,
} from "@/features/financial-transactions/hooks/use-financial-transactions"
import { useBankAccounts } from "@/features/bank-accounts/hooks/use-bank-accounts"
import { useTransactionCategories } from "@/features/transaction-categories/hooks/use-transaction-categories"
import type { FinancialTransaction } from "@/features/financial-transactions/types/financial-transactions.types"
import {
  TRANSACTION_TYPE_LABELS,
  OPERATION_TYPE_LABELS,
} from "@/features/financial-transactions/types/financial-transactions.types"
import {
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Loader2,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

// Modals
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { FinancialTransactionDetailModal } from "@/features/financial-transactions/components/financial-transaction-detail-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover"

export default function FinancialTransactionsPage() {
  // Mutations and queries
  const createTransactionMutation = useCreateFinancialTransaction()
  const deleteTransactionMutation = useDeleteFinancialTransaction()

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedTx, setSelectedTx] = React.useState<FinancialTransaction | null>(null)
  const [txToDelete, setTxToDelete] = React.useState<FinancialTransaction | null>(null)

  // Filters state
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL")
  const [accountFilter, setAccountFilter] = React.useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL")

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset to first page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, typeFilter, accountFilter, categoryFilter])

  // Fetch transactions
  const { data: response, isLoading, error } = useFinancialTransactions({
    page,
    limit: 9,
    orderBy: "createdAt",
    order: "DESC",
    type: typeFilter === "ALL" ? undefined : (typeFilter as any),
    bankAccountId: accountFilter === "ALL" ? undefined : accountFilter,
    categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
    search: debouncedSearch.trim() || undefined,
  })

  // Fetch accounts and categories to populate options and filters
  const { data: bankAccountsResponse } = useBankAccounts({ limit: 100, status: "ACTIVE" })
  const { data: categoriesResponse } = useTransactionCategories({ limit: 100, isActive: true })

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar transacciones financieras", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Map option lists for the creation form modal
  const bankAccountsOptions = React.useMemo(() => {
    return bankAccountsResponse?.data?.map((acc) => ({
      label: `${acc.name} (${acc.currency})`,
      value: acc.id,
    })) || []
  }, [bankAccountsResponse])

  const categoriesOptions = React.useMemo(() => {
    return categoriesResponse?.data?.map((cat) => ({
      label: `${cat.name} (${cat.type === "INCOME" ? "Ingreso" : "Egreso"})`,
      value: cat.id,
    })) || []
  }, [categoriesResponse])

  // Form fields for creating a manual transaction (adjustment)
  const createFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "bankAccountId",
      label: "Cuenta Bancaria",
      type: "select",
      placeholder: "Selecciona cuenta bancaria",
      required: true,
      gridCols: 2,
      options: bankAccountsOptions,
    },
    {
      name: "type",
      label: "Tipo de Ajuste",
      type: "select",
      placeholder: "Selecciona tipo de ajuste",
      required: true,
      gridCols: 1,
      options: [
        { label: "Ingreso (+)", value: "CREDIT" },
        { label: "Egreso (-)", value: "DEBIT" },
      ],
    },
    {
      name: "amount",
      label: "Monto",
      type: "number",
      placeholder: "Ej. 50000",
      required: true,
      gridCols: 1,
    },
    {
      name: "categoryId",
      label: "Categoría",
      type: "select",
      placeholder: "Selecciona categoría (Opcional)",
      required: false,
      gridCols: 2,
      options: categoriesOptions,
    },
    {
      name: "paymentMethod",
      label: "Método de Pago",
      type: "select",
      placeholder: "Selecciona método de pago (Opcional)",
      required: false,
      gridCols: 2,
      options: [
        { label: "Efectivo", value: "CASH" },
        { label: "Tarjeta de Crédito", value: "CREDIT_CARD" },
        { label: "Tarjeta de Débito", value: "DEBIT_CARD" },
        { label: "Transferencia Bancaria", value: "BANK_TRANSFER" },
        { label: "Cheque", value: "CHECK" },
        { label: "Otro", value: "OTHER" },
      ],
    },
    {
      name: "description",
      label: "Descripción",
      type: "textarea",
      placeholder: "Motivo o detalles del ajuste financiero...",
      required: false,
      gridCols: 2,
    },
  ], [bankAccountsOptions, categoriesOptions])

  // Formatter helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  // Column definitions
  const columns: ColumnDef<FinancialTransaction>[] = [
    {
      key: "transactionNumber",
      header: "Transacción",
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">
            {row.transactionNumber}
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground/80 font-mono">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatDate(row.createdAt)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "bankAccountName",
      header: "Cuenta Bancaria",
      render: (row) => (
        <span className="text-sm font-medium text-foreground/80 truncate max-w-[160px]">
          {row.bankAccountName || "Sin registrar"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (row) => {
        const isCredit = row.type === "CREDIT"
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all ${
              isCredit
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            }`}
          >
            {isCredit ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownLeft className="h-3 w-3 text-rose-500" />
            )}
            {TRANSACTION_TYPE_LABELS[row.type] || row.type}
          </span>
        )
      },
    },
    {
      key: "amount",
      header: "Monto",
      render: (row) => (
        <span className={`text-sm font-mono font-semibold ${row.type === "CREDIT" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {row.type === "CREDIT" ? "+" : "-"} {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "categoryName",
      header: "Categoría",
      render: (row) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
          {row.categoryName || "Sin categoría"}
        </span>
      ),
    },
    {
      key: "operationType",
      header: "Operación",
      render: (row) => (
        <span className="text-xs font-medium text-foreground/70">
          {OPERATION_TYPE_LABELS[row.operationType] || row.operationType}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "center",
      className: "w-[90px]",
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedTx(row)
              setIsDetailsOpen(true)
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
            title="Ver detalles"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {row.operationType === "ADJUSTMENT" && (
            <button
              onClick={() => {
                setTxToDelete(row)
                setIsDeleteOpen(true)
              }}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Eliminar ajuste"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ]

  // Update selected transaction object in detail modal state when response changes
  React.useEffect(() => {
    if (selectedTx && response?.data) {
      const freshRecord = response.data.find((item) => item.id === selectedTx.id)
      if (freshRecord) {
        setSelectedTx(freshRecord)
      }
    }
  }, [response, selectedTx])

  return (
    <div className="-mt-2 sm:-mt-3.5 space-y-2.5">
      {/* Control Header: Filters + Create Button */}
      <DataTableToolbar
        className="pb-1.5"
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar transacción, ref o desc..."
            shortcutKey="/"
            shape="md"
          />
        }
        filterSection={
          <>
            {/* Filter by Type */}
            <div className="flex flex-col items-start gap-1 w-full sm:flex-row sm:items-center sm:gap-2 sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground select-none shrink-0">
                Tipo:
              </span>
              <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "ALL")}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs rounded-lg border-border/60 bg-background focus:ring-1">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1 bg-popover border border-border/25 shadow-lg">
                  <SelectItem value="ALL" className="rounded-lg text-xs cursor-pointer">
                    Todos los tipos
                  </SelectItem>
                  <SelectItem value="CREDIT" className="rounded-lg text-xs cursor-pointer">
                    Ingresos
                  </SelectItem>
                  <SelectItem value="DEBIT" className="rounded-lg text-xs cursor-pointer">
                    Egresos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Bank Account */}
            <div className="flex flex-col items-start gap-1 w-full sm:flex-row sm:items-center sm:gap-2 sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground select-none shrink-0">
                Cuenta:
              </span>
              <Select value={accountFilter} onValueChange={(val) => setAccountFilter(val || "ALL")}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs rounded-lg border-border/60 bg-background focus:ring-1">
                  <SelectValue placeholder="Cuenta bancaria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1 bg-popover border border-border/25 shadow-lg">
                  <SelectItem value="ALL" className="rounded-lg text-xs cursor-pointer">
                    Todas las cuentas
                  </SelectItem>
                  {bankAccountsResponse?.data?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="rounded-lg text-xs cursor-pointer">
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Category */}
            <div className="flex flex-col items-start gap-1 w-full sm:flex-row sm:items-center sm:gap-2 sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground select-none shrink-0">
                Categoría:
              </span>
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "ALL")}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs rounded-lg border-border/60 bg-background focus:ring-1">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                  <SelectItem value="ALL" className="rounded-lg text-xs cursor-pointer">
                    Todas las categorías
                  </SelectItem>
                  {categoriesResponse?.data?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-lg text-xs cursor-pointer">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Ajuste Manual"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Data Table (Desktop only) */}
      <DataTable
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        pagination={{
          currentPage: page,
          totalPages: response?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: response?.meta?.itemCount || 0,
          itemsPerPage: 9,
        }}
        onRowClick={(row) => {
          setSelectedTx(row)
          setIsDetailsOpen(true)
        }}
        glassy={true}
        className="hidden sm:block"
      />

      {/* Mobile Card List View */}
      <div className="flex flex-col gap-3 sm:hidden pb-4">
        {isLoading ? (
          // Skeleton loading cards
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="glassy-card p-4 rounded-xl border border-border/30 space-y-3 animate-pulse bg-card/20">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="h-3 w-40 bg-muted rounded" />
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : response?.data?.length === 0 ? (
          <div className="glassy-card p-8 rounded-xl border border-border/30 text-center text-muted-foreground text-xs font-medium bg-card/25">
            No se encontraron transacciones financieras.
          </div>
        ) : (
          response?.data?.map((row) => {
            const isCredit = row.type === "CREDIT"
            return (
              <div
                key={row.id}
                onClick={() => {
                  setSelectedTx(row)
                  setIsDetailsOpen(true)
                }}
                className="glassy-card p-4 rounded-xl border border-border/30 bg-card/45 hover:bg-card/70 transition-colors shadow-2xs cursor-pointer flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-foreground text-sm truncate">
                      {row.transactionNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(row.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border select-none ${
                        isCredit
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {TRANSACTION_TYPE_LABELS[row.type] || row.type}
                    </span>
                    
                    {/* Action Dropdown per row */}
                    <Popover>
                      <PopoverTrigger
                        render={
                          <button className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                      />
                      <PopoverContent className="w-40 p-1 gap-0.5 flex flex-col rounded-xl border border-border/25 shadow-lg bg-popover text-foreground">
                        <button
                          onClick={() => {
                            setSelectedTx(row)
                            setIsDetailsOpen(true)
                          }}
                          className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-2 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Ver detalles</span>
                        </button>
                        {row.operationType === "ADJUSTMENT" && (
                          <button
                            onClick={() => {
                              setTxToDelete(row)
                              setIsDeleteOpen(true)
                            }}
                            className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-2 font-semibold text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Eliminar ajuste</span>
                          </button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/20 pt-2 text-xs">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Cuenta
                    </span>
                    <span className="font-semibold text-foreground/80 truncate">
                      {row.bankAccountName || "Sin registrar"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Monto
                    </span>
                    <span className={`font-mono font-bold ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {isCredit ? "+" : "-"} {formatCurrency(row.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/20 pt-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Categoría
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 self-start">
                      {row.categoryName || "Sin categoría"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Operación
                    </span>
                    <span className="text-xs font-semibold text-foreground/75">
                      {OPERATION_TYPE_LABELS[row.operationType] || row.operationType}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Mobile Pagination */}
        {response?.meta && response.meta.pageCount > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 glassy-card rounded-xl border border-border/30 bg-muted/10">
            <div className="text-[11px] text-muted-foreground font-medium">
              Pág. {page} de {response.meta.pageCount} ({response.meta.itemCount} reg.)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || isLoading}
                className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 text-muted-foreground hover:bg-muted"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || isLoading}
                className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 text-muted-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= response.meta.pageCount || isLoading}
                className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 text-muted-foreground hover:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setPage(response.meta.pageCount)}
                disabled={page >= response.meta.pageCount || isLoading}
                className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 text-muted-foreground hover:bg-muted"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal (Manual Transaction) */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Ajuste Financiero"
        description="Registra un movimiento manual (ajuste) directamente en una cuenta bancaria."
        fields={createFields}
        submitLabel="Registrar Ajuste"
        isLoading={createTransactionMutation.isPending}
        onSubmit={(values) => {
          createTransactionMutation.mutate(
            {
              ...values,
              amount: Number(values.amount),
              operationType: "ADJUSTMENT",
            } as any,
            {
              onSuccess: () => {
                toast.success("Ajuste financiero registrado con éxito")
                setIsCreateOpen(false)
              },
              onError: (err) => {
                toast.error("Error al registrar el ajuste", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* Details Modal */}
      <FinancialTransactionDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedTx(null)
        }}
        transaction={selectedTx}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setTxToDelete(null)
        }}
        title="Eliminar Ajuste Financiero"
        description={`¿Estás seguro de que deseas eliminar la transacción ${txToDelete?.transactionNumber}? Esta acción es irreversible y revertirá de forma atómica el saldo correspondiente en la cuenta bancaria.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteTransactionMutation.isPending}
        onConfirm={() => {
          if (!txToDelete) return
          deleteTransactionMutation.mutate(txToDelete.id, {
            onSuccess: () => {
              toast.success("Ajuste financiero eliminado con éxito")
              setIsDeleteOpen(false)
              setTxToDelete(null)
            },
            onError: (err) => {
              toast.error("Error al eliminar el ajuste financiero", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
