"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRecipe, useUpdateRecipe } from "@/features/recipes/hooks/use-recipes"
import { useSupplies } from "@/features/supplies/hooks/use-supplies"
import type { RecipeIngredient, RecipeStep } from "@/features/recipes/types/recipes.types"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/shared/components/ui/command"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import * as LucideIcons from "lucide-react"
import {
  ChevronLeft,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Save,
  Clock,
  Tag,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
  Gift,
  ChefHat,
  Scale,
  ListOrdered,
} from "lucide-react"

// Baking / Cooking icons matching the form modal
const AVAILABLE_ICONS = [
  { name: "Cake", label: "Pastel", icon: LucideIcons.Cake },
  { name: "Cookie", label: "Galleta", icon: LucideIcons.Cookie },
  { name: "Coffee", label: "Café", icon: LucideIcons.Coffee },
  { name: "Croissant", label: "Panadería", icon: LucideIcons.Croissant },
  { name: "IceCream", label: "Helado", icon: LucideIcons.IceCream },
  { name: "Pizza", label: "Pizza/Masa", icon: LucideIcons.Pizza },
  { name: "Apple", label: "Fruta", icon: LucideIcons.Apple },
  { name: "Beef", label: "Salado", icon: LucideIcons.Beef },
  { name: "Soup", label: "Platos", icon: LucideIcons.Soup },
  { name: "Egg", label: "Huevo", icon: LucideIcons.Egg },
  { name: "Donut", label: "Dona", icon: LucideIcons.Donut },
  { name: "Candy", label: "Dulce", icon: LucideIcons.Candy },
  { name: "Wheat", label: "Harina", icon: LucideIcons.Wheat },
  { name: "Cherry", label: "Cereza", icon: LucideIcons.Cherry },
  { name: "Flame", label: "Horno", icon: LucideIcons.Flame },
  { name: "Milk", label: "Lácteo", icon: LucideIcons.Milk },
  { name: "ChefHat", label: "Gourmet", icon: LucideIcons.ChefHat },
  { name: "Utensils", label: "General", icon: LucideIcons.Utensils },
]

const mapUnit = (unit: string): string => {
  if (!unit) return "und"
  const u = unit.toUpperCase()
  if (u === "GRAM" || u === "GRAMO" || u === "G") return "g"
  if (u === "MILLILITER" || u === "MILILITRO" || u === "ML") return "ml"
  if (u === "UNIT" || u === "UNIDAD" || u === "UND") return "und"
  return unit.toLowerCase()
}

const getUnitDisplay = (unit: string): string => {
  const mapped = mapUnit(unit)
  if (mapped === "g") return "Gramos (g)"
  if (mapped === "ml") return "Mililitros (ml)"
  if (mapped === "und") return "Unidades (und)"
  return mapped
}

const RecipeIconComponent = ({ name, className }: { name?: string; className?: string }) => {
  const IconComponent = (LucideIcons as Record<string, any>)[name || "Utensils"] || LucideIcons.Utensils
  return <IconComponent className={className} />
}

export default function RecipeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const id = resolvedParams.id
  const router = useRouter()

  // API Queries & Mutations
  const { data: recipe, isLoading, error } = useRecipe(id)
  const { data: suppliesResponse } = useSupplies({ limit: 100, isActive: true })
  const supplies = suppliesResponse?.data || []
  const updateRecipeMutation = useUpdateRecipe()

  // Form Local State
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [estimatedTime, setEstimatedTime] = React.useState("")
  const [yieldQuantity, setYieldQuantity] = React.useState("1")
  const [yieldUnit, setYieldUnit] = React.useState("Unidades")
  const [selectedIcon, setSelectedIcon] = React.useState("Utensils")
  const [ingredients, setIngredients] = React.useState<RecipeIngredient[]>([])
  const [steps, setSteps] = React.useState<RecipeStep[]>([])

  // UI States
  const [isDirty, setIsDirty] = React.useState(false)
  const [openPopoverIndex, setOpenPopoverIndex] = React.useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})
  const [showExitDialog, setShowExitDialog] = React.useState(false)
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(null)

  // Initialize form values when recipe is fetched
  React.useEffect(() => {
    if (recipe) {
      setName(recipe.name || "")
      setDescription(recipe.description || "")
      setCategory(recipe.category || "")
      setEstimatedTime(recipe.estimatedTime !== null ? String(recipe.estimatedTime) : "")
      
      const meta = recipe.content?.metadata || { yieldQuantity: 1, yieldUnit: "Unidades" }
      setYieldQuantity(String(meta.yieldQuantity))
      setYieldUnit(meta.yieldUnit)
      setSelectedIcon(recipe.content?.icon || "Utensils")
      setIngredients(recipe.content?.ingredients || [])
      setSteps(recipe.content?.steps || [])
      setIsDirty(false)
    }
  }, [recipe])

  // Track changes to form fields to toggle isDirty state
  const handleFieldChange = () => {
    setIsDirty(true)
  }

  // Add an empty ingredient row
  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      {
        supplyId: "",
        name: "",
        quantity: 1,
        unit: "und",
      },
    ])
    setIsDirty(true)
  }

  // Remove an ingredient row
  const removeIngredientRow = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  // Update specific ingredient fields
  const updateIngredient = (index: number, fields: Partial<RecipeIngredient>) => {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...fields } : item))
    )
    setIsDirty(true)
  }

  // Add an empty step row
  const addStepRow = () => {
    setSteps((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        instruction: "",
      },
    ])
    setIsDirty(true)
  }

  // Remove a step row and adjust orders
  const removeStepRow = (index: number) => {
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      return filtered.map((step, idx) => ({ ...step, order: idx + 1 }))
    })
    setIsDirty(true)
  }

  // Update specific step instruction
  const updateStepInstruction = (index: number, text: string) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, instruction: text } : step))
    )
    setIsDirty(true)
  }

  // Move step up or down (Accessibility / Manual Reorder)
  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= steps.length) return

    setSteps((prev) => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[targetIndex]
      updated[targetIndex] = temp
      return updated.map((step, idx) => ({ ...step, order: idx + 1 }))
    })
    setIsDirty(true)
  }

  // Drag and Drop handlers for step reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    setSteps((prev) => {
      const updated = [...prev]
      const [draggedItem] = updated.splice(draggedIndex, 1)
      updated.splice(targetIndex, 0, draggedItem)
      return updated.map((step, idx) => ({ ...step, order: idx + 1 }))
    })
    setDraggedIndex(null)
    setIsDirty(true)
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = "El nombre de la receta es obligatorio"
    if (estimatedTime && isNaN(Number(estimatedTime))) errors.estimatedTime = "Debe ser un número válido en horas"
    if (!yieldQuantity.trim() || isNaN(Number(yieldQuantity)) || Number(yieldQuantity) <= 0) {
      errors.yieldQuantity = "Debe ser un número mayor a 0"
    }
    if (!yieldUnit.trim()) errors.yieldUnit = "La unidad de rendimiento es obligatoria"

    // Validate ingredients selection
    ingredients.forEach((ing, i) => {
      if (!ing.supplyId) {
        errors[`ingredient-${i}`] = "Seleccione un insumo"
      }
      if (ing.quantity <= 0) {
        errors[`ingredient-qty-${i}`] = "Debe ser > 0"
      }
    })

    // Validate steps instruction
    steps.forEach((step, i) => {
      if (!step.instruction.trim()) {
        errors[`step-${i}`] = "La instrucción no puede estar vacía"
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!recipe) return
    if (!validate()) {
      toast.error("Por favor corrija los errores del formulario")
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      content: {
        ingredients: ingredients.map((ing) => ({
          supplyId: ing.supplyId,
          name: ing.name,
          quantity: Number(ing.quantity),
          unit: ing.unit,
        })),
        steps: steps.map((step) => ({
          order: step.order,
          instruction: step.instruction.trim(),
        })),
        metadata: {
          yieldQuantity: Number(yieldQuantity),
          yieldUnit: yieldUnit.trim(),
        },
        icon: selectedIcon,
      },
    }

    updateRecipeMutation.mutate(
      { id: recipe.id, payload },
      {
        onSuccess: () => {
          toast.success("Receta guardada con éxito")
          setIsDirty(false)
          setValidationErrors({})
        },
        onError: (err) => {
          toast.error("Error al guardar la receta", {
            description: err instanceof Error ? err.message : "Intente nuevamente.",
          })
        },
      }
    )
  }

  // Prevent closing tab/reload if dirty
  React.useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  // Intercept internal Next.js Links globally on this page if dirty
  React.useEffect(() => {
    if (!isDirty) return
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest("a")
      if (target && target.href) {
        if (target.href !== window.location.href && !target.href.includes('#')) {
          e.preventDefault()
          e.stopPropagation()
          setPendingNavigation(target.href)
          setShowExitDialog(true)
        }
      }
    }
    // Use capture phase to ensure we run before Next.js router intercepts the click
    document.addEventListener("click", handleGlobalClick, { capture: true })
    return () => document.removeEventListener("click", handleGlobalClick, { capture: true })
  }, [isDirty])

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 animate-pulse">
        <div className="h-6 w-32 bg-muted/60 rounded-lg" />
        <div className="space-y-3">
          <div className="h-10 w-3/4 bg-muted/60 rounded-xl" />
          <div className="h-14 w-full bg-muted/60 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-14 bg-muted/60 rounded-xl" />
          <div className="h-14 bg-muted/60 rounded-xl" />
          <div className="h-14 bg-muted/60 rounded-xl" />
          <div className="h-14 bg-muted/60 rounded-xl" />
        </div>
        <div className="h-64 bg-muted/60 rounded-xl" />
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 border border-border/40 rounded-2xl bg-card glassy-card space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Info className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Error al cargar la receta</h3>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "No se pudo recuperar la información de la receta."}
        </p>
        <Link href="/recipes" passHref>
          <Button variant="outline" className="mt-2">
            <ChevronLeft className="h-4 w-4 mr-1.5" /> Volver a recetas
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <style>{`
        ::-webkit-scrollbar {
          display: none !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      <div className="w-full pb-12 px-4 sm:px-8 animate-in fade-in duration-300">
        
        <ConfirmModal
          isOpen={showExitDialog}
          onClose={() => {
            setShowExitDialog(false)
            setPendingNavigation(null)
          }}
          onConfirm={() => {
            setIsDirty(false)
            setShowExitDialog(false)
            if (pendingNavigation) {
              window.location.href = pendingNavigation
            }
          }}
          title="Cambios sin guardar"
          description="Tienes modificaciones pendientes en esta receta. Si sales ahora, todos los cambios no guardados se perderán."
          confirmLabel="Salir sin guardar"
          cancelLabel="Quedarme"
          variant="warning"
        />

        {/* Sticky Header Wrapper: Navigation + Title */}
        <div className="relative lg:sticky lg:top-0 lg:z-40 bg-background flex flex-col gap-5 pt-1 pb-4 mb-4 -mx-4 sm:-mx-8 px-4 sm:px-8 border-b border-brand-100 dark:border-brand-500/20">
          
          {/* Navigation Header with Cancel & Save Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/recipes"
          className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors gap-1.5 group select-none"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Volver a recetas
        </Link>

        <div className="flex items-center gap-3.5 ml-auto sm:ml-0">
          {isDirty && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
              Cambios sin guardar
            </span>
          )}

          <Link href="/recipes" passHref>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-semibold border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground rounded-lg"
            >
              Cancelar
            </Button>
          </Link>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || updateRecipeMutation.isPending}
            className="h-8 px-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {updateRecipeMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Guardar Receta
          </Button>
        </div>
      </div>
        
        {/* Editor Top Section: Title, Desc & Meta Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Left Side: Icon, Title & Desc */}
          <div className="grid grid-cols-[auto_1fr] gap-x-4 sm:gap-x-5 gap-y-2 sm:gap-y-0 items-center flex-1 w-full">
          
          {/* Circular Themed Icon Selector Trigger */}
          <Popover>
            <PopoverTrigger
              className="flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-xs hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500/20 dark:hover:text-brand-300 transition-all duration-300 shrink-0 group select-none cursor-pointer relative"
              title="Cambiar icono de receta"
              onClick={handleFieldChange}
            >
              <RecipeIconComponent name={selectedIcon} className="h-8 w-8 stroke-[1.5]" />
              <span className="absolute -bottom-1 -right-1 bg-zinc-800 text-white rounded-full p-0.5 border border-border/30 scale-75 group-hover:scale-90 transition-transform">
                <Sparkles className="h-3 w-3" />
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-popover rounded-2xl border border-border/30 shadow-lg" align="start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-1">
                Elegir Icono de Receta
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedIcon === item.name
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(item.name)
                        setIsDirty(true)
                      }}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg border text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer",
                        isSelected
                          ? "bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/30"
                          : "bg-transparent border-transparent hover:bg-muted/40"
                      )}
                      title={item.label}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Title Input */}
          <div className="relative group/title w-full self-center">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                handleFieldChange()
                if (validationErrors.name) {
                  setValidationErrors((prev) => ({ ...prev, name: "" }))
                }
              }}
              className={cn(
                "w-full text-2xl sm:text-3xl font-bold tracking-tight bg-transparent border-b border-transparent hover:border-border/30 focus:border-brand-500/50 outline-none transition-all py-1 font-heading text-foreground",
                validationErrors.name && "border-destructive/60 hover:border-destructive/60 focus:border-destructive"
              )}
              placeholder="Nombre de la Receta..."
            />
            {validationErrors.name && (
              <span className="text-xs text-destructive block mt-1">{validationErrors.name}</span>
            )}
          </div>

          {/* Description Input */}
          <div className="col-span-2 w-full mt-1 sm:mt-2">
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                handleFieldChange()
              }}
              rows={2}
              className="w-full text-sm sm:text-base text-muted-foreground bg-transparent border-b border-transparent hover:border-border/10 focus:border-brand-500/20 outline-none transition-all resize-none py-1 leading-relaxed"
              placeholder="Añade una descripción general sobre la preparación de esta receta..."
            />
          </div>

          </div>

        {/* Right Side: Structured Meta Grid (Properties) */}
        <div className="w-full lg:w-[380px] shrink-0 grid grid-cols-2 gap-x-4 gap-y-3 p-4 bg-brand-500/5 border border-brand-500/20 rounded-xl shadow-sm lg:ml-auto">
          
          {/* Category Property */}
          <div className="flex flex-col gap-1 group">
            <Label htmlFor="category" className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
              <Tag className="h-3.5 w-3.5 text-brand-500 opacity-80" /> Categoría
            </Label>
            <div className="relative">
              <input
                id="category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  handleFieldChange()
                }}
                placeholder="Vacío"
                className="w-full h-7 text-xs text-foreground bg-transparent border-transparent hover:bg-brand-500/10 focus:bg-brand-500/10 outline-none px-2 -ml-2 rounded transition-all placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Prep Time Property */}
          <div className="flex flex-col gap-1 group relative">
            <Label htmlFor="estimatedTime" className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
              <Clock className="h-3.5 w-3.5 text-brand-500 opacity-80" /> Preparación (hrs)
            </Label>
            <div className="relative">
              <input
                id="estimatedTime"
                type="number"
                min="0.1"
                step="0.1"
                value={estimatedTime}
                onChange={(e) => {
                  setEstimatedTime(e.target.value)
                  handleFieldChange()
                  if (validationErrors.estimatedTime) {
                    setValidationErrors((prev) => ({ ...prev, estimatedTime: "" }))
                  }
                }}
                placeholder="Vacío"
                className={cn(
                  "w-full h-7 text-xs text-foreground bg-transparent border-transparent hover:bg-brand-500/10 focus:bg-brand-500/10 outline-none px-2 -ml-2 rounded transition-all placeholder:text-muted-foreground/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  validationErrors.estimatedTime && "bg-destructive/10 text-destructive focus:bg-destructive/20 hover:bg-destructive/20"
                )}
              />
            </div>
          </div>

          {/* Yield Quantity Property */}
          <div className="flex flex-col gap-1 group relative">
            <Label htmlFor="yieldQuantity" className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
              <Scale className="h-3.5 w-3.5 text-brand-500 opacity-80" /> Cantidad
            </Label>
            <div className="relative">
              <input
                id="yieldQuantity"
                type="number"
                min="1"
                step="1"
                value={yieldQuantity}
                onChange={(e) => {
                  setYieldQuantity(e.target.value)
                  handleFieldChange()
                  if (validationErrors.yieldQuantity) {
                    setValidationErrors((prev) => ({ ...prev, yieldQuantity: "" }))
                  }
                }}
                placeholder="Vacío"
                className={cn(
                  "w-full h-7 text-xs text-foreground bg-transparent border-transparent hover:bg-brand-500/10 focus:bg-brand-500/10 outline-none px-2 -ml-2 rounded transition-all placeholder:text-muted-foreground/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  validationErrors.yieldQuantity && "bg-destructive/10 text-destructive focus:bg-destructive/20 hover:bg-destructive/20"
                )}
              />
            </div>
          </div>

          {/* Yield Unit Property */}
          <div className="flex flex-col gap-1 group relative">
            <Label htmlFor="yieldUnit" className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none">
              <Gift className="h-3.5 w-3.5 text-brand-500 opacity-80" /> Unidad
            </Label>
            <div className="relative">
              <input
                id="yieldUnit"
                value={yieldUnit}
                onChange={(e) => {
                  setYieldUnit(e.target.value)
                  handleFieldChange()
                  if (validationErrors.yieldUnit) {
                    setValidationErrors((prev) => ({ ...prev, yieldUnit: "" }))
                  }
                }}
                placeholder="Vacío"
                className={cn(
                  "w-full h-7 text-xs text-foreground bg-transparent border-transparent hover:bg-brand-500/10 focus:bg-brand-500/10 outline-none px-2 -ml-2 rounded transition-all placeholder:text-muted-foreground/40",
                  validationErrors.yieldUnit && "bg-destructive/10 text-destructive focus:bg-destructive/20 hover:bg-destructive/20"
                )}
              />
            </div>
          </div>

        </div>
      </div>
      </div>

      {/* Notion-style Editor Canvas (Body) */}
      <div className="space-y-8 relative">

        {/* Vertical Layout: Ingredients (Top) & Steps (Bottom) */}
        <div className="flex flex-col gap-8 pt-4">
          
          {/* SECTION 1: INGREDIENTES */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between border-b border-border/10 pb-2">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-brand-500 stroke-[1.75]" />
                <h4 className="text-sm sm:text-base font-bold text-foreground">
                  Ingredientes de la Receta
                </h4>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredientRow}
                className="h-8 text-xs gap-1.5 border-brand-500/20 hover:border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/5 cursor-pointer rounded-lg font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </Button>
            </div>

            {ingredients.length === 0 ? (
              <div className="h-24 border border-dashed border-border/20 rounded-2xl flex flex-col items-center justify-center bg-muted/5 text-muted-foreground select-none gap-1 py-4">
                <ChefHat className="h-7 w-7 text-muted-foreground/35 animate-bounce" />
                <span className="text-xs font-medium">No hay ingredientes.</span>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-[11px] text-brand-500 hover:underline cursor-pointer"
                >
                  Crear el primero
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {ingredients.map((item, index) => {
                  const selectedSupply = supplies.find((s) => s.id === item.supplyId)
                  const labelText = selectedSupply
                    ? `${selectedSupply.name} (${getUnitDisplay(selectedSupply.unitOfMeasure)})`
                    : item.name || "Seleccionar insumo..."

                  return (
                    <div
                      key={`ingredient-row-${index}`}
                      className="flex flex-col sm:grid sm:grid-cols-[1fr_110px_45px_auto] gap-2 items-start sm:items-center bg-muted/10 p-3 sm:p-0 sm:bg-transparent rounded-xl border border-border/25 sm:border-0"
                    >
                      
                      {/* Combobox Insumo selector */}
                      <div className="w-full relative">
                        <Popover
                          open={openPopoverIndex === index}
                          onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
                        >
                          <PopoverTrigger
                            className={cn(
                              "flex w-full items-center justify-between gap-1.5 rounded-lg border border-border/40 bg-transparent py-2 px-3 text-xs text-left h-9 transition-colors hover:bg-muted/40 cursor-pointer text-foreground",
                              validationErrors[`ingredient-${index}`] && "border-destructive/60 text-destructive"
                            )}
                          >
                            <span className="truncate">{labelText}</span>
                            <LucideIcons.ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-55" />
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 rounded-xl bg-popover border border-border/25 shadow-lg max-h-64 overflow-y-auto" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar insumo..." className="text-xs h-9!" />
                              <CommandEmpty className="text-xs py-4 text-center">No se encontraron insumos.</CommandEmpty>
                              <CommandList className="p-1">
                                <CommandGroup>
                                  {supplies.map((supply) => (
                                    <CommandItem
                                      key={supply.id}
                                      value={supply.name}
                                      className="rounded-lg text-xs py-1.5 cursor-pointer"
                                      onSelect={() => {
                                        updateIngredient(index, {
                                          supplyId: supply.id,
                                          name: supply.name,
                                          unit: mapUnit(supply.unitOfMeasure),
                                        })
                                        setOpenPopoverIndex(null)
                                        if (validationErrors[`ingredient-${index}`]) {
                                          setValidationErrors((prev) => ({
                                            ...prev,
                                            [`ingredient-${index}`]: "",
                                          }))
                                        }
                                      }}
                                    >
                                      {supply.name} ({getUnitDisplay(supply.unitOfMeasure)})
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {validationErrors[`ingredient-${index}`] && (
                          <span className="text-[10px] text-destructive block mt-0.5 pl-1">
                            {validationErrors[`ingredient-${index}`]}
                          </span>
                        )}
                      </div>

                      {/* Mobile Row Wrapper for Quantity, Unit, & Remove */}
                      <div className="flex flex-row items-center gap-3 w-full sm:contents mt-1 sm:mt-0">
                        {/* Quantity input */}
                        <div className="flex-1 sm:flex-none sm:w-[110px] relative">
                          <div className={cn(
                            "flex items-center h-9 rounded-lg border border-border/40 bg-transparent overflow-hidden",
                            validationErrors[`ingredient-qty-${index}`] && "border-destructive/60"
                          )}>
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = Number(item.quantity) || 0;
                                const newQty = Math.max(1, currentQty - 1);
                                updateIngredient(index, { quantity: newQty });
                                if (validationErrors[`ingredient-qty-${index}`]) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    [`ingredient-qty-${index}`]: "",
                                  }))
                                }
                              }}
                              className="h-full px-2.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
                            >
                              <LucideIcons.Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Cant."
                              value={item.quantity || ""}
                              onChange={(e) => {
                                updateIngredient(index, { quantity: Number(e.target.value) })
                                if (validationErrors[`ingredient-qty-${index}`]) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    [`ingredient-qty-${index}`]: "",
                                  }))
                                }
                              }}
                              className="w-full h-full bg-transparent text-center text-xs outline-none focus:bg-muted/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = Number(item.quantity) || 0;
                                const newQty = currentQty + 1;
                                updateIngredient(index, { quantity: newQty });
                                if (validationErrors[`ingredient-qty-${index}`]) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    [`ingredient-qty-${index}`]: "",
                                  }))
                                }
                              }}
                              className="h-full px-2.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
                            >
                              <LucideIcons.Plus className="h-3 w-3" />
                            </button>
                          </div>
                          {validationErrors[`ingredient-qty-${index}`] && (
                            <span className="text-[10px] text-destructive block mt-0.5 text-center absolute -bottom-4 left-0 w-full">
                              {validationErrors[`ingredient-qty-${index}`]}
                            </span>
                          )}
                        </div>

                        {/* Unit Label Badge */}
                        <div className="flex items-center justify-center font-mono font-bold text-[10px] bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/20 px-2 py-1 rounded-md h-9 min-w-[36px] tracking-wider shrink-0 uppercase select-none">
                          {mapUnit(item.unit)}
                        </div>

                        {/* Remove Action Button */}
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(index)}
                          className="h-9 w-9 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-150 cursor-pointer shrink-0"
                          title="Eliminar ingrediente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: PASOS */}
          <div className="w-full space-y-4 border-t border-border/10 pt-6">
            <div className="flex items-center justify-between border-b border-border/10 pb-2">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-brand-500 stroke-[1.75]" />
                <h4 className="text-sm sm:text-base font-bold text-foreground">
                  Instrucciones de Preparación (Pasos)
                </h4>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStepRow}
                className="h-8 text-xs gap-1.5 border-brand-500/20 hover:border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/5 cursor-pointer rounded-lg font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar Paso
              </Button>
            </div>

            {steps.length === 0 ? (
              <div className="h-28 border border-dashed border-border/20 rounded-2xl flex flex-col items-center justify-center bg-muted/5 text-muted-foreground select-none gap-1 py-4">
                <ListOrdered className="h-7 w-7 text-muted-foreground/35 animate-bounce" />
                <span className="text-xs font-medium">No se han configurado pasos en las instrucciones.</span>
                <button
                  type="button"
                  onClick={addStepRow}
                  className="text-[11px] text-brand-500 hover:underline cursor-pointer"
                >
                  Crear el primero
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {steps.map((step, index) => {
                  const isDraggingOver = draggedIndex !== null && draggedIndex !== index

                  return (
                    <div
                      key={`step-row-${index}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={cn(
                        "flex items-start gap-3 bg-muted/5 border border-border/20 dark:border-border/10 rounded-xl p-3.5 transition-all duration-200 hover:bg-muted/10",
                        draggedIndex === index && "opacity-40 border-brand-500 border-dashed bg-brand-500/5",
                        isDraggingOver && "hover:bg-muted/20"
                      )}
                    >
                      
                      {/* Drag Handle */}
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground/75 p-1 shrink-0 select-none">
                        <GripVertical className="h-4.5 w-4.5" />
                      </div>

                      {/* Step Number Badge */}
                      <div className="flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-foreground text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 select-none uppercase tracking-wider">
                        Paso {step.order}
                      </div>

                      {/* Instruction TextArea */}
                      <div className="flex-1 w-full space-y-1">
                        <Textarea
                          value={step.instruction}
                          onChange={(e) => {
                            updateStepInstruction(index, e.target.value)
                            if (validationErrors[`step-${index}`]) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                [`step-${index}`]: "",
                              }))
                            }
                          }}
                          placeholder="Instrucción del paso..."
                          className={cn(
                            "min-h-[50px] w-full text-xs rounded-xl bg-background/50 border-border/30 resize-none font-sans leading-relaxed p-2.5",
                            validationErrors[`step-${index}`] && "border-destructive/60"
                          )}
                        />
                        {validationErrors[`step-${index}`] && (
                          <span className="text-[10px] text-destructive block pl-1">
                            {validationErrors[`step-${index}`]}
                          </span>
                        )}
                      </div>

                      {/* Accessibility Reorder Button Group & Delete */}
                      <div className="flex flex-col gap-1 items-center shrink-0">
                        
                        <div className="flex flex-row bg-background/45 border border-border/30 rounded-lg p-0.5">
                          {/* Up button */}
                          <button
                            type="button"
                            onClick={() => moveStep(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Subir paso"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>

                          {/* Down button */}
                          <button
                            type="button"
                            onClick={() => moveStep(index, "down")}
                            disabled={index === steps.length - 1}
                            className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                            title="Bajar paso"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Delete step button */}
                        <button
                          type="button"
                          onClick={() => removeStepRow(index)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 cursor-pointer mt-1"
                          title="Eliminar paso"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </>
  )
}
