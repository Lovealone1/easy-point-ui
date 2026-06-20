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
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/features/expenses/hooks/use-expenses"
import { useBankAccounts } from "@/features/bank-accounts/hooks/use-bank-accounts"
import { useExpenseCategories } from "@/features/expense-categories/hooks/use-expense-categories"
import type { Expense } from "@/features/expenses/types/expenses.types"
import {
  Eye,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Bookmark,
  Activity,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

// Modals
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { ExpenseDetailModal } from "@/features/expenses/components/expense-detail-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover"

export default function ExpensesPage() {
  // Mutations
  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()
  const deleteMutation = useDeleteExpense()

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  
  const [selectedRecord, setSelectedRecord] = React.useState<Expense | null>(null)

  // Filters state
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [accountFilter, setAccountFilter] = React.useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL")

  // Debounce search query (searches by description in backend)
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, accountFilter, categoryFilter])

  // Fetch expenses
  const { data: response, isLoading, error } = useExpenses({
    page,
    limit: 9,
    orderBy: "createdAt",
    order: "DESC",
    bankAccountId: accountFilter === "ALL" ? undefined : accountFilter,
    categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
    description: debouncedSearch.trim() || undefined,
  })

  // Fetch bank accounts and categories for options & filters
  const { data: bankAccountsResponse } = useBankAccounts({ limit: 100, status: "ACTIVE" })
  const { data: categoriesResponse } = useExpenseCategories({ limit: 100, isActive: true })

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar gastos", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Map option lists for create/edit form
  const bankAccountsOptions = React.useMemo(() => {
    return bankAccountsResponse?.data?.map((acc) => ({
      label: `${acc.name} (${acc.currency})`,
      value: acc.id,
    })) || []
  }, [bankAccountsResponse])

  const categoriesOptions = React.useMemo(() => {
    return categoriesResponse?.data?.map((cat) => ({
      label: cat.name,
      value: cat.id,
    })) || []
  }, [categoriesResponse])

  // Map related data to maps for quick O(1) rendering lookups
  const bankAccountMap = React.useMemo(() => {
    return new Map(bankAccountsResponse?.data?.map((acc) => [acc.id, acc.name]))
  }, [bankAccountsResponse])

  const categoryMap = React.useMemo(() => {
    return new Map(categoriesResponse?.data?.map((cat) => [cat.id, cat.name]))
  }, [categoriesResponse])

  // Form schemas
  const createFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "categoryId",
      label: "Categoría de Gasto",
      type: "select",
      placeholder: "Selecciona una categoría",
      required: true,
      gridCols: 2,
      options: categoriesOptions,
    },
    {
      name: "bankAccountId",
      label: "Cuenta Bancaria (para debitar fondos)",
      type: "select",
      placeholder: "Selecciona cuenta bancaria",
      required: true,
      gridCols: 2,
      options: bankAccountsOptions,
    },
    {
      name: "amount",
      label: "Monto",
      type: "number",
      placeholder: "Ej. 45000",
      required: true,
      gridCols: 2,
    },
    {
      name: "createdAt",
      label: "Fecha del Gasto",
      type: "date",
      required: true,
      gridCols: 2,
    },
    {
      name: "description",
      label: "Descripción / Concepto",
      type: "textarea",
      placeholder: "Motivo, proveedor u observaciones del gasto...",
      required: false,
      gridCols: 2,
    },
  ], [bankAccountsOptions, categoriesOptions])

  const editFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "categoryId",
      label: "Categoría de Gasto",
      type: "select",
      placeholder: "Selecciona una categoría",
      required: true,
      gridCols: 2,
      options: categoriesOptions,
    },
    {
      name: "description",
      label: "Descripción / Concepto",
      type: "textarea",
      placeholder: "Motivo, proveedor u observaciones del gasto...",
      required: false,
      gridCols: 2,
    },
  ], [categoriesOptions])

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
  const columns: ColumnDef<Expense>[] = [
    {
      key: "id",
      header: "Gasto",
      className: "font-medium text-foreground",
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate font-mono text-xs">
            #{row.id.substring(0, 8)}
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground/80 font-mono">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatDate(row.createdAt)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "bankAccountId",
      header: "Cuenta Bancaria",
      render: (row) => (
        <span className="text-sm font-medium text-foreground/80 truncate max-w-[160px]">
          {bankAccountMap.get(row.bankAccountId) || "Cargando..."}
        </span>
      ),
    },
    {
      key: "categoryId",
      header: "Categoría",
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
          {categoryMap.get(row.categoryId) || "Cargando..."}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Monto",
      render: (row) => (
        <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
          - {formatCurrency(Number(row.amount))}
        </span>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={row.description || ""}>
          {row.description || "Sin descripción"}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "center",
      className: "w-[120px]",
      render: (row) => (
        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsDetailsOpen(true)
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
            title="Ver detalles"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsEditOpen(true)
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
            title="Editar gasto"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsDeleteOpen(true)
            }}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
            title="Eliminar gasto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  // Update selected record in details modal state when response changes
  React.useEffect(() => {
    if (selectedRecord && response?.data) {
      const freshRecord = response.data.find((item) => item.id === selectedRecord.id)
      if (freshRecord) {
        setSelectedRecord(freshRecord)
      }
    }
  }, [response, selectedRecord])

  // Handlers
  function handleCreate(values: Record<string, any>) {
    createMutation.mutate(
      {
        categoryId: values.categoryId,
        bankAccountId: values.bankAccountId,
        amount: Number(values.amount),
        description: values.description || undefined,
        createdAt: values.createdAt ? new Date(values.createdAt).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Gasto registrado con éxito")
          setIsCreateOpen(false)
        },
        onError: (err) => {
          toast.error("Error al registrar el gasto", {
            description: err instanceof Error ? err.message : "Intente nuevamente.",
          })
        },
      }
    )
  }

  function handleEdit(values: Record<string, any>) {
    if (!selectedRecord) return

    const patchPayload: Record<string, any> = {}
    Object.keys(values).forEach((key) => {
      const newVal = values[key]
      const oldVal = (selectedRecord as any)[key]
      const isOldFalsy = oldVal === null || oldVal === undefined || oldVal === ""
      const isNewFalsy = newVal === null || newVal === undefined || newVal === ""
      if (isOldFalsy && isNewFalsy) return
      if (newVal !== oldVal) patchPayload[key] = newVal
    })

    if (Object.keys(patchPayload).length === 0) {
      toast.info("No se realizaron cambios")
      setIsEditOpen(false)
      return
    }

    updateMutation.mutate(
      { id: selectedRecord.id, payload: patchPayload },
      {
        onSuccess: () => {
          toast.success("Gasto actualizado con éxito")
          setIsEditOpen(false)
          setSelectedRecord(null)
        },
        onError: (err) => {
          toast.error("Error al actualizar el gasto", {
            description: err instanceof Error ? err.message : "Intente nuevamente.",
          })
        },
      }
    )
  }

  function handleDelete() {
    if (!selectedRecord) return
    deleteMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Gasto eliminado correctamente")
        setIsDeleteOpen(false)
        setSelectedRecord(null)
      },
      onError: (err) => {
        toast.error("Error al eliminar el gasto", {
          description: err instanceof Error ? err.message : "Intente nuevamente.",
        })
      },
    })
  }

  return (
    <div className="sm:-mt-2 space-y-5">
      {/* Control Toolbar: Filters + Create Button */}
      <DataTableToolbar
        className="pb-2.5"
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por descripción..."
            shortcutKey="/"
            shape="md"
          />
        }
        filterSection={
          <>
            {/* Filter by Bank Account */}
            <div className="flex flex-col items-start gap-1 w-full sm:flex-row sm:items-center sm:gap-2 sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground select-none shrink-0">
                Cuenta:
              </span>
              <Select value={accountFilter} onValueChange={(val) => setAccountFilter(val || "ALL")}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs rounded-lg border-border/60 bg-background focus:ring-1">
                  <SelectValue placeholder="Todos">
                    {accountFilter === "ALL" ? "Todos" : (bankAccountMap.get(accountFilter) || "Todos")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1 bg-popover border border-border/25 shadow-lg">
                  <SelectItem value="ALL" className="rounded-lg text-xs cursor-pointer">
                    Todos
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
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs rounded-lg border-border/60 bg-background focus:ring-1">
                  <SelectValue placeholder="Todos">
                    {categoryFilter === "ALL" ? "Todos" : (categoryMap.get(categoryFilter) || "Todos")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                  <SelectItem value="ALL" className="rounded-lg text-xs cursor-pointer">
                    Todos
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
            label="Registrar Gasto"
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
          setSelectedRecord(row)
          setIsDetailsOpen(true)
        }}
        glassy={true}
        className="hidden sm:block [&_td]:py-3"
      />

      {/* Mobile Card List View */}
      <div className="flex flex-col gap-3 sm:hidden pb-4">
        {isLoading ? (
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
            No se encontraron gastos registrados.
          </div>
        ) : (
          response?.data?.map((row) => {
            return (
              <div
                key={row.id}
                onClick={() => {
                  setSelectedRecord(row)
                  setIsDetailsOpen(true)
                }}
                className="glassy-card p-4 rounded-xl border border-border/30 bg-card/45 hover:bg-card/70 transition-colors shadow-2xs cursor-pointer flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-foreground text-sm truncate font-mono">
                      #{row.id.substring(0, 8)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDate(row.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                      {categoryMap.get(row.categoryId) || "Cargando..."}
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
                            setSelectedRecord(row)
                            setIsDetailsOpen(true)
                          }}
                          className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-2 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Ver detalles</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(row)
                            setIsEditOpen(true)
                          }}
                          className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center gap-2 font-semibold"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Editar gasto</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(row)
                            setIsDeleteOpen(true)
                          }}
                          className="w-full text-left rounded-lg text-xs py-2 px-3 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-2 font-semibold text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar gasto</span>
                        </button>
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
                      {bankAccountMap.get(row.bankAccountId) || "Cargando..."}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Monto
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      - {formatCurrency(Number(row.amount))}
                    </span>
                  </div>
                </div>

                {row.description && (
                  <div className="flex flex-col border-t border-border/20 pt-2 text-[11px] text-muted-foreground">
                    <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider mb-0.5">
                      Descripción
                    </span>
                    <span className="truncate">{row.description}</span>
                  </div>
                )}
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

      {/* Create Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Registrar Gasto"
        description="Registra un egreso de fondos vinculándolo a una categoría y cuenta bancaria."
        fields={createFields}
        submitLabel="Registrar Gasto"
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
      />

      {/* Edit Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedRecord(null)
        }}
        title="Editar Gasto"
        description="Modifica los datos mutables del gasto. El monto y la cuenta bancaria no pueden ser alterados."
        fields={editFields}
        defaultValues={selectedRecord ?? undefined}
        submitLabel="Guardar cambios"
        isLoading={updateMutation.isPending}
        onSubmit={handleEdit}
      />

      {/* Details Modal */}
      <ExpenseDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedRecord(null)
        }}
        expense={selectedRecord}
        categoryName={selectedRecord ? categoryMap.get(selectedRecord.categoryId) : undefined}
        bankAccountName={selectedRecord ? bankAccountMap.get(selectedRecord.bankAccountId) : undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRecord(null)
        }}
        title="Eliminar Gasto"
        description={
          selectedRecord
            ? `¿Estás seguro de que deseas eliminar este gasto por valor de ${formatCurrency(Number(selectedRecord.amount))}? Esta acción es irreversible y realizará un REEMBOLSO automático de los fondos correspondientes a la cuenta bancaria.`
            : "¿Estás seguro de eliminar este gasto?"
        }
        confirmLabel="Eliminar y Reembolsar"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
