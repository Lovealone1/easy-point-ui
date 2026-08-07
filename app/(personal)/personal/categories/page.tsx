// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/personal/categories/page.tsx
//
// Seeded system categories are shown read-only alongside the user's own, so the
// list reads as one pool — which is exactly how the subscription form offers
// them.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Lock, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { AppIcon } from "@/shared/components/ui/app-icon"
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { CategoryFormModal } from "@/features/user-subscriptions/components/category-form-modal"
import {
  usePersonalCategories,
  useDeletePersonalCategory,
} from "@/features/user-subscriptions/hooks/use-personal-catalog"
import { apiErrorMessage } from "@/shared/utils/api-message"
import {
  isSystemCategory,
  type SubscriptionCategory,
} from "@/features/user-subscriptions/types/user-subscriptions.types"

export default function PersonalCategoriesPage() {
  const [search, setSearch] = React.useState("")
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SubscriptionCategory | null>(null)
  const [deleting, setDeleting] = React.useState<SubscriptionCategory | null>(null)
  const [reassignTo, setReassignTo] = React.useState("")

  const { data: categories, isLoading } = usePersonalCategories()
  const deleteMutation = useDeletePersonalCategory()

  const filtered = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  /** Candidate destinations when a category in use is being removed. */
  // {value,label} rather than the raw records: Base UI's Select labels its
  // closed trigger from `items`, and falls back to the raw id without it.
  const reassignOptions = (categories ?? [])
    .filter((c) => c.id !== deleting?.id)
    .map((c) => ({ value: c.id, label: c.name }))

  function openCreate() {
    setEditing(null)
    setIsFormOpen(true)
  }

  function openEdit(category: SubscriptionCategory) {
    setEditing(category)
    setIsFormOpen(true)
  }

  function openDelete(category: SubscriptionCategory) {
    setDeleting(category)
    setReassignTo("")
  }

  async function handleDelete() {
    if (!deleting) return

    try {
      await deleteMutation.mutateAsync({
        id: deleting.id,
        reassignTo: reassignTo || undefined,
      })
      toast.success("Categoría eliminada")
      setDeleting(null)
    } catch (error) {
      // 409 means it is still in use — surface the message and let the user
      // pick a destination rather than closing the dialog.
      toast.error(apiErrorMessage(error, "No se pudo eliminar la categoría."))
    }
  }

  const columns: ColumnDef<SubscriptionCategory>[] = [
    {
      key: "name",
      header: "Categoría",
      render: (row) => (
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-md grid place-items-center shrink-0"
            style={{
              backgroundColor: `${row.color ?? "#6B7280"}1A`,
              color: row.color ?? "#6B7280",
            }}
          >
            <AppIcon name={row.icon ?? "category-rounded"} className="w-4 h-4" />
          </span>
          <span className="font-medium text-foreground truncate">{row.name}</span>
        </div>
      ),
    },
    {
      key: "userId",
      header: "Origen",
      align: "center",
      render: (row) =>
        isSystemCategory(row) ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-muted text-muted-foreground border-border/40">
            <Lock className="w-3 h-3" />
            Del sistema
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-primary/10 text-primary border-primary/20">
            Propia
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => {
        const isSystem = isSystemCategory(row)

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={isSystem}
              onClick={() => openEdit(row)}
              title={isSystem ? "Las categorías del sistema no se editan" : "Editar"}
              className="h-8 w-8 p-0"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSystem}
              onClick={() => openDelete(row)}
              title={isSystem ? "Las categorías del sistema no se eliminan" : "Eliminar"}
              className={cn("h-8 w-8 p-0", !isSystem && "text-destructive hover:text-destructive")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorías</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Las que trae EasyPoint, más las que crees tú. Se usan al registrar una suscripción.
        </p>
      </div>

      <DataTableToolbar
        searchSection={
          <DataTableSearch value={search} onChange={setSearch} placeholder="Buscar categoría..." />
        }
        actionSection={
          <DataTableAction actionType="create" label="Nueva categoría" onClick={openCreate} />
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        emptyMessage="No se encontraron categorías."
        glassy
      />

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        category={editing}
      />

      {/* Delete needs a destination when the category is still in use, so it is
          a bespoke dialog rather than a plain confirm. */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-5 sm:p-7 gap-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Eliminar categoría
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {deleting
                ? `¿Seguro que quieres eliminar "${deleting.name}"?`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Mover sus suscripciones a{" "}
              <span className="font-normal">(solo si tiene alguna)</span>
            </label>
            <Select
              items={reassignOptions}
              value={reassignTo}
              onValueChange={(value) => setReassignTo(String(value ?? ""))}
            >
              <SelectTrigger className="w-full h-11 bg-background">
                <SelectValue placeholder="Elige una categoría de destino" />
              </SelectTrigger>
              <SelectContent>
                {reassignOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="sm:ml-2"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
