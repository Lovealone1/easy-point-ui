"use client"

import * as React from "react"
import { Loader2, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Textarea } from "@/shared/components/ui/textarea"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"

interface AddNotesModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  initialNote?: string
  onSubmit: (note: string) => void | Promise<void>
  isLoading?: boolean
  maxLength?: number
}

export function AddNotesModal({
  isOpen,
  onClose,
  title = "Agregar nota",
  description = "Escribe una nota administrativa. Esta información será visible de forma interna.",
  initialNote = "",
  onSubmit,
  isLoading = false,
  maxLength = 500,
}: AddNotesModalProps) {
  const [note, setNote] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      setNote(initialNote || "")
    }
  }, [isOpen, initialNote])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(note)
  }

  const remainingChars = maxLength - note.length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl bg-card border border-border/40 shadow-xl p-6 gap-6 duration-200">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <FileText className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-heading font-semibold text-foreground">
              {title}
            </DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-content" className="text-xs font-semibold text-muted-foreground/90">
              Contenido de la nota
            </Label>
            <div className="relative">
              <Textarea
                id="note-content"
                placeholder="Escribe aquí tu nota..."
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, maxLength))}
                className="min-h-[140px] pr-2 pb-8 resize-none text-sm placeholder:text-muted-foreground/60 border-border/60 focus-visible:border-ring/80"
                disabled={isLoading}
              />
              <span className={`absolute bottom-2.5 right-3 text-[10px] font-mono select-none ${
                remainingChars <= 20 
                  ? "text-rose-500 font-bold" 
                  : remainingChars <= 50 
                    ? "text-amber-500 font-semibold" 
                    : "text-muted-foreground/75"
              }`}>
                {note.length} / {maxLength}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 hover:bg-muted/50 rounded-lg text-sm border-border/80"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Nota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
