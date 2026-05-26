"use client"

import * as React from "react"
import { useAddRecipeNote } from "../hooks/use-recipes"
import type { Recipe } from "../types/recipes.types"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"

interface RecipeNoteModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe | null
}

export function RecipeNoteModal({ isOpen, onClose, recipe }: RecipeNoteModalProps) {
  const [noteText, setNoteText] = React.useState("")
  const addNoteMutation = useAddRecipeNote()

  React.useEffect(() => {
    if (isOpen) {
      setNoteText("")
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipe) return
    if (!noteText.trim()) {
      toast.error("La nota no puede estar vacía")
      return
    }

    addNoteMutation.mutate(
      { id: recipe.id, notes: noteText.trim() },
      {
        onSuccess: () => {
          toast.success("Nota agregada con éxito")
          onClose()
        },
        onError: (err) => {
          toast.error("Error al guardar la nota", {
            description: err instanceof Error ? err.message : "Intente nuevamente.",
          })
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl overflow-hidden p-5 sm:p-7 gap-5 sm:gap-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-semibold text-foreground">
            Agregar Nota a la Receta
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Añade anotaciones adicionales o instrucciones especiales para la preparación de {recipe?.name}. Las notas se acumularán al historial existente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recipe-note" className="text-xs font-bold text-muted-foreground/90">
              Contenido de la Nota
            </Label>
            <Textarea
              id="recipe-note"
              placeholder="Escribe aquí los detalles o aclaraciones sobre la receta..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[120px] rounded-lg border border-input focus-visible:ring-ring"
            />
          </div>

          {recipe?.notes && (
            <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Notas previas acumuladas:</span>
              <div className="max-h-[100px] overflow-y-auto text-xs text-foreground/80 whitespace-pre-line font-sans">
                {recipe.notes}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addNoteMutation.isPending}
              className="px-4 py-2 hover:bg-muted/50 rounded-lg text-sm border-border/80"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addNoteMutation.isPending}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
            >
              {addNoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Nota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
