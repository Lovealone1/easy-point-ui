"use client"

import * as React from "react"
import type { Recipe } from "../types/recipes.types"
import * as LucideIcons from "lucide-react"
import { Clock, CheckCircle, XCircle, Tag, FileText, Gift } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"

interface RecipeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe | null
}

const RecipeIcon = ({ name, className }: { name?: string; className?: string }) => {
  const IconComponent = (LucideIcons as Record<string, any>)[name || "Utensils"] || LucideIcons.Utensils
  return <IconComponent className={className} />
}

export function RecipeDetailModal({ isOpen, onClose, recipe }: RecipeDetailModalProps) {
  if (!recipe) return null

  const { name, category, description, estimatedTime, isActive, notes, content } = recipe
  const { yieldQuantity, yieldUnit } = content?.metadata || { yieldQuantity: 1, yieldUnit: "Unidad" }
  const iconName = content?.icon || "Utensils"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl overflow-hidden p-5 sm:p-7 gap-5 sm:gap-6">
        <DialogHeader className="gap-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                <RecipeIcon name={iconName} className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-heading font-semibold text-foreground truncate">
                {name}
              </DialogTitle>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
              }`}
            >
              {isActive ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Activa
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Inactiva
                </>
              )}
            </span>
          </div>
          <DialogDescription className="text-sm text-muted-foreground truncate">
            Detalles y metadatos generales de la receta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {/* Category & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/5 p-3.5 shadow-2xs">
              <Tag className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categoría</span>
                <span className="text-sm font-semibold text-foreground truncate">
                  {category || "Sin Categoría"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/5 p-3.5 shadow-2xs">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preparación</span>
                <span className="text-sm font-semibold text-foreground truncate">
                  {estimatedTime ? `${estimatedTime} horas` : "No estimado"}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-border/30 bg-muted/5 p-3.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descripción General</span>
              <p className="text-sm text-foreground/80 leading-relaxed font-sans whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Metadata Yield Section (JSONB) */}
          <div className="flex flex-col gap-3 rounded-lg border border-indigo-500/10 bg-indigo-500/5 p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                Rendimiento de Producción (JSONB Metadata)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-indigo-500/10 pt-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground/80">Cantidad de Rendimiento</span>
                <span className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
                  {yieldQuantity}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-muted-foreground/80">Unidad de Medida</span>
                <span className="text-sm font-bold text-foreground">
                  {yieldUnit || "Unidad"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes History */}
          <div className="flex flex-col gap-2 rounded-lg border border-border/30 bg-muted/5 p-3.5">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notas de la Receta</span>
            </div>
            {notes ? (
              <div className="max-h-[120px] overflow-y-auto text-xs text-foreground/80 whitespace-pre-line font-sans border-t border-border/20 pt-2 leading-relaxed">
                {notes}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/70 italic border-t border-border/20 pt-2">
                No hay anotaciones registradas para esta receta.
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-4 py-2 hover:bg-muted/50 rounded-lg text-sm border-border/80"
          >
            Cerrar Detalles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
