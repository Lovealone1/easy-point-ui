// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/components/category-form-modal.tsx
//
// Create/edit a personal category. System categories never reach this modal —
// the list disables their actions and the API rejects the write anyway.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { AppIcon } from "@/shared/components/ui/app-icon"
import { apiErrorMessage } from "@/shared/utils/api-message"
import {
  useCreatePersonalCategory,
  useUpdatePersonalCategory,
} from "../hooks/use-personal-catalog"
import type { SubscriptionCategory } from "../types/user-subscriptions.types"

const DEFAULT_COLOR = "#8b1fc1"
const DEFAULT_ICON = "category-rounded"

const COLOR_PRESETS = [
  "#8b1fc1", "#E50914", "#1DB954", "#0052CC",
  "#F97316", "#0EA5E9", "#EC4899", "#14B8A6",
]

/** A small pool so the picker stays a choice, not a Material Symbols lookup. */
const ICON_PRESETS = [
  "category-rounded", "pets-rounded", "fitness-center-rounded", "school-rounded",
  "directions-car-rounded", "home-rounded", "restaurant-rounded", "flight-rounded",
  "medical-services-rounded", "sports-esports-rounded", "movie-rounded", "music-note-rounded",
]

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category?: SubscriptionCategory | null
}

export function CategoryFormModal({ isOpen, onClose, category }: CategoryFormModalProps) {
  const isEditing = !!category

  const createMutation = useCreatePersonalCategory()
  const updateMutation = useUpdatePersonalCategory()

  const [name, setName] = React.useState("")
  const [color, setColor] = React.useState(DEFAULT_COLOR)
  const [icon, setIcon] = React.useState(DEFAULT_ICON)

  // Seed from props during render rather than in an effect — the repo lints
  // against setState-in-effect, and an effect would paint one stale frame.
  const hydrationKey = isOpen ? (category?.id ?? "new") : null
  const [hydratedKey, setHydratedKey] = React.useState<string | null>(null)

  if (hydrationKey !== null && hydrationKey !== hydratedKey) {
    setHydratedKey(hydrationKey)
    setName(category?.name ?? "")
    setColor(category?.color ?? DEFAULT_COLOR)
    setIcon(category?.icon ?? DEFAULT_ICON)
  }

  if (hydrationKey === null && hydratedKey !== null) {
    setHydratedKey(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!name.trim()) {
      toast.error("Ponle un nombre a la categoría")
      return
    }

    try {
      const payload = { name: name.trim(), color, icon }

      if (isEditing) {
        await updateMutation.mutateAsync({ id: category!.id, payload })
        toast.success("Categoría actualizada")
      } else {
        await createMutation.mutateAsync(payload)
        toast.success("Categoría creada")
      }

      onClose()
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo guardar la categoría."))
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-5 sm:p-7 gap-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {isEditing ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Agrupa tus suscripciones como tenga sentido para ti.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-muted/30">
            <span
              className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <AppIcon name={icon} className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {name.trim() || "Vista previa"}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Nombre</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mascotas, Transporte, Salud..."
              maxLength={60}
              className="h-11 bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Icono</label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setIcon(preset)}
                  className={cn(
                    "h-10 rounded-md border grid place-items-center transition-colors",
                    icon === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <AppIcon name={preset} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  style={{ backgroundColor: preset }}
                  className={cn(
                    "w-8 h-8 rounded-md border-2 transition-transform active:scale-95",
                    color.toLowerCase() === preset.toLowerCase()
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
            <div className="flex items-start gap-3 pt-1">
              <HexColorPicker color={color} onChange={setColor} style={{ width: 140, height: 100 }} />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-28 font-mono text-xs bg-background"
                maxLength={7}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="sm:ml-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Crear categoría"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
