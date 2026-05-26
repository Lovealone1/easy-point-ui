"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as LucideIcons from "lucide-react"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

const RecipeIcon = ({ name, className }: { name?: string; className?: string }) => {
  const IconComponent = (LucideIcons as Record<string, any>)[name || "Utensils"] || LucideIcons.Utensils
  return <IconComponent className={className} />
}
import {
  useRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useToggleRecipeActive,
} from "@/features/recipes/hooks/use-recipes"
import type { Recipe } from "@/features/recipes/types/recipes.types"
import {
  Clock,
  BookOpen,
  Power,
  Info,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Tag,
} from "lucide-react"

// Import recipe modals
import { RecipeFormModal } from "@/features/recipes/components/recipe-form-modal"
import { RecipeDetailModal } from "@/features/recipes/components/recipe-detail-modal"
import { RecipeNoteModal } from "@/features/recipes/components/recipe-note-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

export default function RecipesPage() {
  const router = useRouter()
  // Mutations
  const createRecipeMutation = useCreateRecipe()
  const updateRecipeMutation = useUpdateRecipe()
  const deleteRecipeMutation = useDeleteRecipe()
  const toggleActiveMutation = useToggleRecipeActive()

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [isNoteOpen, setIsNoteOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null)

  // Filters and Query State
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  // Debounce search input (350ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset to page 1 on search change
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch recipes (6 max per page)
  const { data: response, isLoading, error } = useRecipes({
    page,
    limit: 6,
    name: debouncedSearch || undefined,
  })

  // Display error toast if retrieval fails
  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar recetas", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // Synchronize selected recipe with latest details from list response if modified
  React.useEffect(() => {
    if (selectedRecipe && response?.data) {
      const freshRecord = response.data.find((item) => item.id === selectedRecipe.id)
      if (freshRecord) {
        setSelectedRecipe(freshRecord)
      }
    }
  }, [response, selectedRecipe])

  return (
    <div className="space-y-4">
      {/* Search and Action Toolbar */}
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar recetas por nombre..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nueva Receta"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      {/* Grid List or Loading/Empty States */}
      {isLoading ? (
        // Skeleton cards loading state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-card-${index}`}
              className="h-[140px] w-full animate-pulse rounded-2xl border border-border/30 bg-muted/60"
            />
          ))}
        </div>
      ) : !response?.data || response.data.length === 0 ? (
        // Empty state
        <div className="h-64 border border-border/30 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 text-muted-foreground bg-muted/5 glassy-card">
          <Inbox className="h-10 w-10 stroke-1 text-muted-foreground/45 animate-pulse" />
          <span className="text-sm font-medium">No se encontraron recetas.</span>
        </div>
      ) : (
        // Cards Grid (Max 6)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {response.data.map((recipe) => {
            const isToggling =
              toggleActiveMutation.isPending &&
              toggleActiveMutation.variables?.id === recipe.id
            const isDeleting =
              deleteRecipeMutation.isPending &&
              deleteRecipeMutation.variables === recipe.id

            return (
              <div
                key={recipe.id}
                className={cn(
                  "flex flex-col sm:flex-row p-5 rounded-2xl border border-border/35 shadow-2xs hover:shadow-md transition-all duration-300 relative glassy-card hover:scale-[1.015] bg-card/45 group/card overflow-hidden",
                  !recipe.isActive && "opacity-65 dark:opacity-50 grayscale-35"
                )}
              >
                {/* Left Side Accent Color Strip (Design Palette) */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 to-brand-600 rounded-l-2xl" />

                {/* Clickable Area pointing to Detail Page - Grid Layout */}
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 flex-1"
                >
                  {/* Decorative Icon inside themed circle */}
                  <div className="col-start-1 row-start-1 flex items-center justify-center h-12 w-12 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0 group-hover/card:bg-brand-500 group-hover/card:text-white dark:group-hover/card:bg-brand-500/20 dark:group-hover/card:text-brand-300 transition-all duration-300">
                    <RecipeIcon name={recipe.content?.icon} className="h-6 w-6 stroke-[1.75]" />
                  </div>

                  {/* Title (Primacy) */}
                  <div className="col-start-2 row-start-1 flex items-center min-w-0 py-1">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground line-clamp-2 min-h-[3.25rem] group-hover/card:text-brand-600 dark:group-hover/card:text-brand-400 transition-colors leading-snug">
                      {recipe.name}
                    </h3>
                  </div>

                  {/* Description (Occupies space under the icon) */}
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2 font-sans leading-relaxed min-h-[2.5rem]">
                      {recipe.description || "Sin descripción disponible."}
                    </p>
                  </div>

                  {/* Category & Preparation Time with explicit labels (Occupies space under the icon) */}
                  <div className="col-span-2 flex flex-col gap-2 mt-2 pt-2 border-t border-border/10">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground/90 font-medium min-w-[75px]">Categoría:</span>
                      {recipe.category ? (
                        <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/20 uppercase tracking-wider">
                          {recipe.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 italic text-[11px]">Sin registrar</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground/90 font-medium min-w-[75px]">Preparación:</span>
                      <div className="flex items-center gap-1.5 text-foreground font-semibold">
                        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>
                          {recipe.estimatedTime
                            ? `${recipe.estimatedTime} ${recipe.estimatedTime === 1 ? "hora" : "horas"}`
                            : "Tiempo no estimado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Vertical Action Bar (Themed actions) */}
                <div
                  className="mt-4 sm:mt-0 sm:ml-4 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border/20 flex flex-row sm:flex-col items-center justify-end sm:justify-center gap-1.5 shrink-0 sm:pl-4 min-w-[110px]"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <div className="flex items-center sm:flex-col gap-1 w-full justify-end sm:justify-center">
                    
                    {/* Add Notes */}
                    <button
                      onClick={() => {
                        setSelectedRecipe(recipe)
                        setIsNoteOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Agregar Notas"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                    </button>

                    {/* View JSONB Metadata (Yield) */}
                    <button
                      onClick={() => {
                        setSelectedRecipe(recipe)
                        setIsDetailsOpen(true)
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Ver Rendimiento (Metadata)"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>

                    {/* Toggle Active Status */}
                    <button
                      onClick={() => {
                        toggleActiveMutation.mutate(
                          { id: recipe.id, isActive: !recipe.isActive },
                          {
                            onSuccess: (res) =>
                              toast.success(
                                `Receta ${res.isActive ? "activada" : "desactivada"} con éxito`
                              ),
                            onError: () =>
                              toast.error("Error al cambiar el estado de la receta"),
                          }
                        )
                      }}
                      disabled={isToggling}
                      className={cn(
                        "p-1.5 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50",
                        recipe.isActive
                          ? "text-emerald-500 hover:bg-emerald-500/10"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/70"
                      )}
                      title={recipe.isActive ? "Desactivar Receta" : "Activar Receta"}
                    >
                      {isToggling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Edit Recipe */}
                    <button
                      onClick={() => {
                        router.push(`/recipes/${recipe.id}`)
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete Recipe */}
                    <button
                      onClick={() => {
                        setSelectedRecipe(recipe)
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
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {response && response.meta && response.meta.pageCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border border-border/30 rounded-2xl bg-muted/20 dark:bg-muted/10 select-none mt-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            {response.meta.itemCount !== undefined && (
              <div>
                Total de recetas: <span className="font-semibold text-foreground">{response.meta.itemCount}</span>
              </div>
            )}
            <div>
              Página <span className="font-semibold text-foreground">{page}</span> de{" "}
              <span className="font-semibold text-foreground">{response.meta.pageCount}</span>
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
              disabled={page >= response.meta.pageCount || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <RecipeFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nueva Receta"
        description="Agrega los datos básicos de la receta y configura su rendimiento general de producción."
        submitLabel="Crear Receta"
        isLoading={createRecipeMutation.isPending}
        onSubmit={(payload) => {
          createRecipeMutation.mutate(payload, {
            onSuccess: (data) => {
              toast.success("Receta creada correctamente")
              setIsCreateOpen(false)
              router.push(`/recipes/${data.id}`)
            },
            onError: (err) => {
              toast.error("Error al crear la receta", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />

      {/* Edit Modal */}
      <RecipeFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedRecipe(null)
        }}
        title="Editar Receta"
        description="Actualiza la información básica o el rendimiento general de producción de la receta."
        submitLabel="Guardar Cambios"
        recipe={selectedRecipe}
        isLoading={updateRecipeMutation.isPending}
        onSubmit={(payload) => {
          if (!selectedRecipe) return
          updateRecipeMutation.mutate(
            { id: selectedRecipe.id, payload },
            {
              onSuccess: () => {
                toast.success("Receta actualizada correctamente")
                setIsEditOpen(false)
                setSelectedRecipe(null)
              },
              onError: (err) => {
                toast.error("Error al actualizar la receta", {
                  description: err instanceof Error ? err.message : "Intente nuevamente.",
                })
              },
            }
          )
        }}
      />

      {/* Details & Metadata Viewer Modal */}
      <RecipeDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false)
          setSelectedRecipe(null)
        }}
        recipe={selectedRecipe}
      />

      {/* Add Notes Modal */}
      <RecipeNoteModal
        isOpen={isNoteOpen}
        onClose={() => {
          setIsNoteOpen(false)
          setSelectedRecipe(null)
        }}
        recipe={selectedRecipe}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRecipe(null)
        }}
        title="¿Eliminar receta?"
        description={`Esta acción no se puede deshacer. Se eliminará la receta "${selectedRecipe?.name || ""}" de forma permanente de la organización.`}
        confirmLabel="Eliminar Receta"
        cancelLabel="Cancelar"
        isLoading={deleteRecipeMutation.isPending}
        onConfirm={() => {
          if (!selectedRecipe) return
          deleteRecipeMutation.mutate(selectedRecipe.id, {
            onSuccess: () => {
              toast.success("Receta eliminada correctamente")
              setIsDeleteOpen(false)
              setSelectedRecipe(null)
            },
            onError: (err) => {
              toast.error("Error al eliminar la receta", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              })
            },
          })
        }}
      />
    </div>
  )
}
