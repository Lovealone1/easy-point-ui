"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Factory,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableFilter } from "@/shared/components/ui/data-table-filter"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"

import {
  useProductions,
  useCreateProduction,
  useDeleteProduction,
  useUpdateProduction,
} from "@/features/productions/hooks/use-productions"
import { ProductionCard } from "@/features/productions/components/production-card"
import { ProductionFormModal } from "@/features/productions/components/production-form-modal"
import type {
  Production,
  ProductionStatus,
  ProductionType,
} from "@/features/productions/types/productions.types"

// ─── Filter options ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: "Completada", value: "COMPLETED" },
  { label: "Borrador", value: "DRAFT" },
  { label: "Cancelada", value: "CANCELLED" },
]

const TYPE_OPTIONS = [
  { label: "Vendible", value: "SELLABLE" },
  { label: "Intermedia", value: "INTERMEDIATE" },
]

const ITEMS_PER_PAGE = 12

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductionsPage() {
  // ── Mutations ──────────────────────────────────────────────────────────────
  const createProductionMutation = useCreateProduction()
  const deleteProductionMutation = useDeleteProduction()
  const updateProductionMutation = useUpdateProduction()

  // ── Modal states ───────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedProduction, setSelectedProduction] =
    React.useState<Production | null>(null)

  // ── Filter / pagination state ──────────────────────────────────────────────
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")

  // ── Debounce search ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, typeFilter])

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: response, isLoading, error } = useProductions({
    page,
    limit: ITEMS_PER_PAGE,
    order: "DESC",
    orderBy: "productionDate",
    ...(statusFilter !== "all" && { status: statusFilter as ProductionStatus }),
    ...(typeFilter !== "all" && { type: typeFilter as ProductionType }),
  })

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar producciones", {
        description:
          error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // ── Client-side name/notes search (backend no expone search param) ─────────
  const productions = React.useMemo(() => {
    const all = response?.data ?? []
    if (!debouncedSearch) return all
    const lower = debouncedSearch.toLowerCase()
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        (p.notes?.toLowerCase().includes(lower) ?? false)
    )
  }, [response, debouncedSearch])

  const totalPages = response?.meta?.pageCount ?? 1
  const totalItems = response?.meta?.itemCount ?? 0

  // ── Edit fields schema (notes only) ───────────────────────────────────────
  const editFields = React.useMemo<FormFieldSchema[]>(
    () => [
      {
        name: "notes",
        label: "Notas",
        type: "textarea",
        placeholder: "Observaciones sobre este lote de producción...",
        required: false,
        gridCols: 2,
      },
    ],
    []
  )

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openEdit(production: Production) {
    setSelectedProduction(production)
    setIsEditOpen(true)
  }

  function openDelete(production: Production) {
    setSelectedProduction(production)
    setIsDeleteOpen(true)
  }

  // ── Skeleton card ──────────────────────────────────────────────────────────
  const SkeletonCard = () => (
    <div className="glassy-card animate-pulse rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted/60" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded-md bg-muted/60" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-5 w-20 rounded-full bg-muted/60" />
          <div className="h-5 w-16 rounded-full bg-muted/40" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/40" />
        ))}
      </div>
      <div className="flex justify-end gap-2 border-t border-border/25 pt-3">
        <div className="h-7 w-20 rounded-lg bg-muted/40" />
        <div className="h-7 w-20 rounded-lg bg-muted/40" />
      </div>
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o notas..."
            shortcutKey="/"
            shape="md"
          />
        }
        filterSection={
          <>
            <DataTableFilter
              title="Estado"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              shape="md"
              placeholder="Todos"
            />
            <DataTableFilter
              title="Tipo"
              value={typeFilter}
              onChange={setTypeFilter}
              options={TYPE_OPTIONS}
              shape="md"
              placeholder="Todos"
            />
          </>
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nueva Producción"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* ── Cards grid ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : productions.length === 0 ? (
        <div className="glassy-card flex flex-col items-center justify-center gap-4 rounded-xl py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
            <Inbox className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Sin producciones</p>
            <p className="text-xs text-muted-foreground">
              {debouncedSearch || statusFilter !== "all" || typeFilter !== "all"
                ? "No hay producciones que coincidan con los filtros actuales."
                : "Aún no se han registrado producciones para esta organización."}
            </p>
          </div>
          {(debouncedSearch || statusFilter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("")
                setStatusFilter("all")
                setTypeFilter("all")
              }}
              className="cursor-pointer rounded-lg border border-border/40 bg-card/45 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border/70 hover:text-foreground"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productions.map((production) => (
            <ProductionCard
              key={production.id}
              production={production}
              onEdit={openEdit}
              onDelete={openDelete}
              isDeleting={
                deleteProductionMutation.isPending &&
                deleteProductionMutation.variables === production.id
              }
            />
          ))}
        </div>
      )}

      {/* ── Pagination (same pattern as recipes) ────────────────── */}
      {response && response.meta && response.meta.pageCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border border-border/30 rounded-2xl bg-muted/20 dark:bg-muted/10 select-none mt-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            {totalItems !== undefined && (
              <div>
                Total:{" "}
                <span className="font-semibold text-foreground">{totalItems}</span>{" "}
                producción{totalItems !== 1 ? "es" : ""}
              </div>
            )}
            <div>
              Página{" "}
              <span className="font-semibold text-foreground">{page}</span> de{" "}
              <span className="font-semibold text-foreground">{totalPages}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────────── */}
      <ProductionFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        isLoading={createProductionMutation.isPending}
        onSubmit={(payload) => {
          createProductionMutation.mutate(payload, {
            onSuccess: () => {
              toast.success("Producción registrada correctamente")
              setIsCreateOpen(false)
            },
            onError: (err) => {
              toast.error("Error al registrar la producción", {
                description:
                  err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />

      {/* ── Edit modal (notes only) ──────────────────────────────── */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedProduction(null)
        }}
        title="Editar Producción"
        description="Solo las notas pueden modificarse en una producción existente."
        fields={editFields}
        submitLabel="Guardar Cambios"
        defaultValues={selectedProduction || undefined}
        isLoading={updateProductionMutation.isPending}
        onSubmit={(values) => {
          if (!selectedProduction) return

          const newNotes = (values as any).notes ?? ""
          const oldNotes = selectedProduction.notes ?? ""

          if (newNotes === oldNotes) {
            toast.info("No se realizaron modificaciones")
            setIsEditOpen(false)
            setSelectedProduction(null)
            return
          }

          updateProductionMutation.mutate(
            { id: selectedProduction.id, payload: { notes: newNotes || undefined } },
            {
              onSuccess: () => {
                toast.success("Producción actualizada")
                setIsEditOpen(false)
                setSelectedProduction(null)
              },
              onError: (err) => {
                toast.error("Error al actualizar", {
                  description:
                    err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* ── Delete confirm modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedProduction(null)
        }}
        title="¿Eliminar producción?"
        description={
          selectedProduction?.status === "COMPLETED"
            ? `Esta producción está Completada. Al eliminarla, se restablecerá el stock de insumos consumidos y se descontará la cantidad del producto fabricado de su stock. Esta acción no se puede deshacer.`
            : `Esta acción no se puede deshacer. Se eliminará permanentemente "${selectedProduction?.name ?? ""}".`
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isLoading={deleteProductionMutation.isPending}
        onConfirm={() => {
          if (!selectedProduction) return
          deleteProductionMutation.mutate(selectedProduction.id, {
            onSuccess: () => {
              toast.success("Producción eliminada correctamente")
              setIsDeleteOpen(false)
              setSelectedProduction(null)
            },
            onError: (err) => {
              toast.error("Error al eliminar", {
                description:
                  err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
