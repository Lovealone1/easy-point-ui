"use client"

import * as React from "react"
import { toast } from "sonner"
import { DynamicFormModal, type FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { Button } from "@/shared/components/ui/button"
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
  useToggleExpenseCategoryActive,
} from "@/features/expense-categories/hooks/use-expense-categories"
import type {
  ExpenseCategory,
  FindExpenseCategoriesParams,
} from "@/features/expense-categories/types/expense-categories.types"
import {
  Pencil,
  Trash2,
  FolderOpen,
  NotebookText,
  ChevronLeft,
  ChevronRight,
  Power,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"

// ─── Category Card ─────────────────────────────────────────────────────────────
// Horizontal pill-style card: [name + status ···] [⏻ | ✏ 🗑]
// Mobile: 1 per row (full width). Desktop: 5 per row.

interface CategoryCardProps {
  category: ExpenseCategory
  optimisticActive: boolean
  onEdit: (category: ExpenseCategory) => void
  onDelete: (category: ExpenseCategory) => void
  onToggle: (category: ExpenseCategory) => void
}

function CategoryCard({
  category,
  optimisticActive,
  onEdit,
  onDelete,
  onToggle,
}: CategoryCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150",
        "bg-card hover:shadow-sm hover:shadow-black/5",
        optimisticActive
          ? "border-border/40 hover:border-brand-500/25"
          : "border-border/20 opacity-55 hover:opacity-75"
      )}
    >
      {/* Name + status badge */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold text-foreground leading-tight truncate"
          title={category.name}
        >
          {category.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide",
              "px-1.5 py-px rounded-full border",
              optimisticActive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
            )}
          >
            <span
              className={cn(
                "h-1 w-1 rounded-full",
                optimisticActive ? "bg-emerald-500" : "bg-zinc-400"
              )}
            />
            {optimisticActive ? "Activa" : "Inactiva"}
          </span>
          {category.description && (
            <span
              title={category.description}
              className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-help"
            >
              <NotebookText className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toggle active state */}
        <button
          onClick={() => onToggle(category)}
          title={optimisticActive ? "Desactivar categoría" : "Activar categoría"}
          className={cn(
            "p-1.5 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer",
            optimisticActive
              ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/60"
          )}
        >
          <Power className="h-3.5 w-3.5" />
        </button>

        <div className="h-3.5 w-px bg-border/25 mx-0.5" />

        {/* Edit */}
        <button
          id={`edit-category-${category.id}`}
          onClick={() => onEdit(category)}
          title="Editar"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
        </button>

        {/* Delete */}
        <button
          id={`delete-category-${category.id}`}
          onClick={() => onDelete(category)}
          title="Eliminar"
          className="p-1.5 rounded-lg text-rose-500/60 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  isFiltered,
  onClear,
}: {
  isFiltered: boolean
  onClear: () => void
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-muted/40 border border-border/20 text-muted-foreground/40">
        <FolderOpen className="h-7 w-7" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {isFiltered ? "Sin resultados" : "Sin categorías"}
        </p>
        <p className="text-xs text-muted-foreground max-w-[220px]">
          {isFiltered
            ? "No se encontraron categorías de gasto con ese criterio."
            : "Aún no hay categorías de gastos registradas. Crea la primera."}
        </p>
      </div>
      {isFiltered && (
        <button
          onClick={onClear}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
        >
          Limpiar búsqueda
        </button>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border border-border/30 rounded-2xl bg-muted/20 dark:bg-muted/10 select-none animate-in fade-in duration-300">
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
        <div>
          Total:{" "}
          <span className="font-semibold text-foreground">
            {totalItems}
          </span>{" "}
          categorías
        </div>
        <div>
          Página{" "}
          <span className="font-semibold text-foreground">{currentPage}</span> de{" "}
          <span className="font-semibold text-foreground">{totalPages}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExpenseCategoriesPage() {
  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useCreateExpenseCategory()
  const updateMutation = useUpdateExpenseCategory()
  const deleteMutation = useDeleteExpenseCategory()
  const toggleMutation = useToggleExpenseCategoryActive()

  // ─── Modal States ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<ExpenseCategory | null>(null)

  const [optimisticToggles, setOptimisticToggles] = React.useState<
    Record<string, boolean>
  >({})

  // ─── Filter & Pagination State ─────────────────────────────────────────────
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(50)

  // ─── Responsive limits: 50 on desktop, 10 on mobile ────────────────────────
  React.useEffect(() => {
    if (typeof window === "undefined") return
    function handleResize() {
      setLimit(window.innerWidth < 768 ? 10 : 50)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // ─── Debounce Search ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // ─── Reset page on filter or limit change ──────────────────────────────────
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, limit])

  // ─── Query ─────────────────────────────────────────────────────────────────
  const queryParams: FindExpenseCategoriesParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    order: "ASC",
    orderBy: "name",
  }

  const { data: response, isLoading } = useExpenseCategories(queryParams)

  const categories = response?.data ?? []
  const meta = response?.meta
  const totalItems = meta?.itemCount ?? 0
  const totalPages = meta?.pageCount ?? 1

  // ─── Field Schema (DynamicFormModal) ───────────────────────────────────────
  const fields = React.useMemo<FormFieldSchema[]>(
    () => [
      {
        name: "name",
        label: "Nombre de Categoría",
        type: "text",
        required: true,
        gridCols: 2,
        placeholder: "Ej. Arriendos",
      },
      {
        name: "description",
        label: "Descripción",
        type: "textarea",
        required: false,
        gridCols: 2,
        placeholder: "Detalles u observaciones opcionales sobre esta categoría...",
      },
    ],
    []
  )

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleCreate(values: Record<string, any>) {
    createMutation.mutate(
      {
        name: values.name,
        description: values.description || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Categoría de gastos creada correctamente")
          setIsCreateOpen(false)
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ??
            "Error al crear la categoría. Intente nuevamente."
          toast.error(msg)
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
          toast.success("Categoría de gastos actualizada correctamente")
          setIsEditOpen(false)
          setSelectedRecord(null)
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ??
            "Error al actualizar. Intente nuevamente."
          toast.error(msg)
        },
      }
    )
  }

  function handleDelete() {
    if (!selectedRecord) return
    deleteMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Categoría de gastos eliminada correctamente")
        setIsDeleteOpen(false)
        setSelectedRecord(null)
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ??
          "Error al eliminar la categoría. Asegúrese de que no contenga gastos asociados."
        toast.error(msg)
      },
    })
  }

  function handleToggle(category: ExpenseCategory) {
    const nextActive = !(optimisticToggles[category.id] ?? category.isActive)

    setOptimisticToggles((prev) => ({ ...prev, [category.id]: nextActive }))

    toggleMutation.mutate(
      { id: category.id, isActive: nextActive },
      {
        onSuccess: () => {
          toast.success(nextActive ? "Categoría activada" : "Categoría desactivada")
        },
        onError: () => {
          setOptimisticToggles((prev) => ({
            ...prev,
            [category.id]: !nextActive,
          }))
          toast.error("Error al cambiar el estado")
        },
        onSettled: () => {
          setOptimisticToggles((prev) => {
            const next = { ...prev }
            delete next[category.id]
            return next
          })
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nueva categoría"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/20 bg-card px-3 py-2.5 animate-pulse"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 rounded-full bg-muted/60" />
                <div className="h-2.5 w-1/3 rounded-full bg-muted/40" />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="h-5 w-5 rounded-lg bg-muted/40" />
                <div className="h-5 w-5 rounded-lg bg-muted/40" />
                <div className="h-5 w-5 rounded-lg bg-muted/40" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {categories.length === 0 ? (
            <EmptyState
              isFiltered={!!debouncedSearch}
              onClear={() => setSearch("")}
            />
          ) : (
            categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                optimisticActive={optimisticToggles[category.id] ?? category.isActive}
                onEdit={(c) => {
                  setSelectedRecord(c)
                  setIsEditOpen(true)
                }}
                onDelete={(c) => {
                  setSelectedRecord(c)
                  setIsDeleteOpen(true)
                }}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {response?.meta && response.meta.pageCount > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}

      {/* Create Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nueva Categoría de Gastos"
        fields={fields}
        submitLabel="Crear categoría"
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
        title="Editar Categoría de Gastos"
        fields={fields}
        defaultValues={selectedRecord ?? undefined}
        submitLabel="Guardar cambios"
        isLoading={updateMutation.isPending}
        onSubmit={handleEdit}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRecord(null)
        }}
        title="¿Eliminar categoría?"
        description={
          selectedRecord
            ? `Estás a punto de eliminar "${selectedRecord.name}". Esta acción no se puede deshacer y fallará si hay gastos asociados.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
