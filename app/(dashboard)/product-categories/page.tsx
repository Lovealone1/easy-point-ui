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
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
  useToggleProductCategoryActive,
} from "@/features/product-categories/hooks/use-product-categories"
import type {
  ProductCategory,
  FindProductCategoriesParams,
} from "@/features/product-categories/types/product-categories.types"
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
// Horizontal pill-style card: [code] [name + status ···] [⏻ | ✏ 🗑]
// Mobile: 1 per row (full width). Desktop: 5 per row.

interface CategoryCardProps {
  category: ProductCategory
  /** Optimistic active state — flips instantly before API responds */
  optimisticActive: boolean
  onEdit: (category: ProductCategory) => void
  onDelete: (category: ProductCategory) => void
  onToggle: (category: ProductCategory) => void
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
        "flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-150",
        "bg-card hover:shadow-sm hover:shadow-black/5",
        optimisticActive
          ? "border-border/40 hover:border-brand-500/25"
          : "border-border/20 opacity-55 hover:opacity-75"
      )}
    >
      {/* Code badge */}
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 h-7 w-10 rounded-lg",
          "text-[10px] font-black tracking-widest border",
          optimisticActive
            ? "bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/20"
            : "bg-muted/40 text-muted-foreground border-border/20"
        )}
      >
        {category.code}
      </span>

      {/* Name + status badge — grows to fill available space */}
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
          {category.notes && (
            <span
              title={category.notes}
              className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-help"
            >
              <NotebookText className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {/* Actions — power button separated by divider, then edit + delete */}
      <div
        className="flex items-center gap-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Power on/off */}
        <button
          onClick={() => onToggle(category)}
          title={optimisticActive ? "Apagar categoría" : "Encender categoría"}
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
            ? "No se encontraron categorías con ese criterio."
            : "Aún no hay categorías registradas. Crea la primera."}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductCategoriesPage() {
  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useCreateProductCategory()
  const updateMutation = useUpdateProductCategory()
  const deleteMutation = useDeleteProductCategory()
  const toggleMutation = useToggleProductCategoryActive()

  // ─── Modal States ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<ProductCategory | null>(null)

  /**
   * Optimistic toggle map — keys are category IDs, values are the
   * *desired* isActive state applied immediately on click.
   * Cleared once the mutation settles (success or error).
   */
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
  const queryParams: FindProductCategoriesParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    order: "ASC",
    orderBy: "name",
  }

  const { data: response, isLoading } = useProductCategories(queryParams)

  const categories = response?.data ?? []
  const meta = response?.meta
  const totalItems = meta?.itemCount ?? 0
  const totalPages = meta?.pageCount ?? 1

  // ─── Field Schema (DynamicFormModal) ───────────────────────────────────────
  const fields = React.useMemo<FormFieldSchema[]>(
    () => [
      {
        name: "name",
        label: "Nombre",
        type: "text",
        required: true,
        gridCols: 2,
        placeholder: "Ej. Bebidas Frías",
      },
      {
        name: "code",
        label: "Código (3 letras)",
        type: "text",
        required: true,
        gridCols: 1,
        placeholder: "Ej. BEV",
      },
      {
        name: "notes",
        label: "Notas",
        type: "textarea",
        required: false,
        gridCols: 2,
        placeholder: "Observaciones internas opcionales...",
      },
    ],
    []
  )

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleCreate(values: Record<string, any>) {
    createMutation.mutate(
      {
        name: values.name,
        code: values.code,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Categoría creada correctamente")
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
          toast.success("Categoría actualizada correctamente")
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
        toast.success("Categoría eliminada correctamente")
        setIsDeleteOpen(false)
        setSelectedRecord(null)
      },
      onError: () => toast.error("Error al eliminar la categoría"),
    })
  }

  /** Optimistic toggle: flips the visual state immediately, API runs in background */
  function handleToggle(category: ProductCategory) {
    const nextActive = !(optimisticToggles[category.id] ?? category.isActive)

    // Apply optimistic state right away
    setOptimisticToggles((prev) => ({ ...prev, [category.id]: nextActive }))

    toggleMutation.mutate(
      { id: category.id, isActive: nextActive },
      {
        onSuccess: () => {
          toast.success(nextActive ? "Categoría activada" : "Categoría desactivada")
        },
        onError: () => {
          // Revert optimistic state on failure
          setOptimisticToggles((prev) => ({
            ...prev,
            [category.id]: !nextActive,
          }))
          toast.error("Error al cambiar el estado")
        },
        onSettled: () => {
          // Remove from optimistic map once server state is synced via cache invalidation
          setOptimisticToggles((prev) => {
            const next = { ...prev }
            delete next[category.id]
            return next
          })
        },
      }
    )
  }

  // ─── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o código..."
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

      {/* Cards Grid — 1 col mobile, 5 cols desktop */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/20 bg-card px-3 py-2 animate-pulse"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="h-7 w-10 rounded-lg bg-muted/60 shrink-0" />
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

      {/* Pagination — always shown when data is loaded */}
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
        title="Nueva Categoría"
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
        title="Editar Categoría"
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
            ? `Estás a punto de eliminar "${selectedRecord.name}" (${selectedRecord.code}). Esta acción no se puede deshacer.`
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
