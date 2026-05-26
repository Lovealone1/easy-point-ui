"use client"

import * as React from "react"
import { useProducts } from "@/features/products/hooks/use-products"
import type { Recipe, CreateRecipeDTO } from "../types/recipes.types"
import {
  Loader2,
  Cake,
  Cookie,
  Coffee,
  Croissant,
  IceCream,
  Pizza,
  Apple,
  Beef,
  Soup,
  ChefHat,
  Utensils,
  Egg,
  Donut,
  Candy,
  Wheat,
  Cherry,
  Flame,
  Milk,
} from "lucide-react"

const AVAILABLE_ICONS = [
  { name: "Cake", label: "Pastel", icon: Cake },
  { name: "Cookie", label: "Galleta", icon: Cookie },
  { name: "Coffee", label: "Café", icon: Coffee },
  { name: "Croissant", label: "Panadería", icon: Croissant },
  { name: "IceCream", label: "Helado", icon: IceCream },
  { name: "Pizza", label: "Pizza/Masa", icon: Pizza },
  { name: "Apple", label: "Fruta", icon: Apple },
  { name: "Beef", label: "Salado", icon: Beef },
  { name: "Soup", label: "Platos", icon: Soup },
  { name: "Egg", label: "Huevo", icon: Egg },
  { name: "Donut", label: "Dona", icon: Donut },
  { name: "Candy", label: "Dulce", icon: Candy },
  { name: "Wheat", label: "Harina", icon: Wheat },
  { name: "Cherry", label: "Cereza", icon: Cherry },
  { name: "Flame", label: "Horno", icon: Flame },
  { name: "Milk", label: "Lácteo", icon: Milk },
  { name: "ChefHat", label: "Gourmet", icon: ChefHat },
  { name: "Utensils", label: "General", icon: Utensils },
]
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

interface RecipeFormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  submitLabel?: string
  recipe?: Recipe | null
  onSubmit: (payload: CreateRecipeDTO) => void | Promise<void>
  isLoading?: boolean
}

export function RecipeFormModal({
  isOpen,
  onClose,
  title,
  description,
  submitLabel = "Guardar",
  recipe = null,
  onSubmit,
  isLoading = false,
}: RecipeFormModalProps) {
  // Local state for the inputs
  const [name, setName] = React.useState("")
  const [desc, setDesc] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [estimatedTime, setEstimatedTime] = React.useState("")
  const [productId, setProductId] = React.useState("")
  const [yieldQuantity, setYieldQuantity] = React.useState("1")
  const [yieldUnit, setYieldUnit] = React.useState("Unidad")
  const [selectedIcon, setSelectedIcon] = React.useState("Utensils")
  
  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Fetch products for associated product selection
  const { data: productsResponse } = useProducts({ limit: 1000, isActive: true })
  const products = productsResponse?.data || []

  // Reset or fill form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (recipe) {
        setName(recipe.name || "")
        setDesc(recipe.description || "")
        setCategory(recipe.category || "")
        setEstimatedTime(recipe.estimatedTime !== null ? String(recipe.estimatedTime) : "")
        // Find product ID or default to none
        setProductId(recipe.id ? "" : "") // Product mapping is done on backend when linking or if we have it in recipe metadata. Wait, let's allow setting it.
        const meta = recipe.content?.metadata || { yieldQuantity: 1, yieldUnit: "Unidad" }
        setYieldQuantity(String(meta.yieldQuantity))
        setYieldUnit(meta.yieldUnit)
        setSelectedIcon(recipe.content?.icon || "Utensils")
      } else {
        setName("")
        setDesc("")
        setCategory("")
        setEstimatedTime("")
        setProductId("")
        setYieldQuantity("1")
        setYieldUnit("Unidad")
        setSelectedIcon("Utensils")
      }
      setErrors({})
    }
  }, [isOpen, recipe])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = "El nombre de la receta es obligatorio"
    }
    if (estimatedTime && isNaN(Number(estimatedTime))) {
      newErrors.estimatedTime = "Debe ser un número válido en horas"
    }
    if (!yieldQuantity.trim() || isNaN(Number(yieldQuantity)) || Number(yieldQuantity) <= 0) {
      newErrors.yieldQuantity = "Debe ser un número mayor a 0"
    }
    if (!yieldUnit.trim()) {
      newErrors.yieldUnit = "La unidad de rendimiento es obligatoria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateRecipeDTO = {
      name: name.trim(),
      description: desc.trim() || undefined,
      category: category.trim() || undefined,
      estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      productId: productId === "none" || !productId ? undefined : productId,
      content: {
        ingredients: recipe?.content?.ingredients || [],
        steps: recipe?.content?.steps || [],
        metadata: {
          yieldQuantity: Number(yieldQuantity),
          yieldUnit: yieldUnit.trim(),
        },
        icon: selectedIcon,
      },
    }

    await onSubmit(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl overflow-hidden p-5 sm:p-7 gap-5 sm:gap-6 duration-200">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-heading font-semibold text-foreground">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] sm:max-h-[55vh] overflow-y-auto p-2 -m-2">
            
            {/* Name Input */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="recipe-name" className="text-xs font-bold text-muted-foreground/90">
                Nombre de la Receta <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="recipe-name"
                placeholder="Ej. Bizcocho de Vainilla"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
                }}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <span className="text-xs text-destructive mt-0.5">{errors.name}</span>
              )}
            </div>

            {/* Description Input */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="recipe-description" className="text-xs font-bold text-muted-foreground/90">
                Descripción General
              </Label>
              <Textarea
                id="recipe-description"
                placeholder="Ej. Receta base para pasteles con textura esponjosa..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="min-h-[70px] rounded-lg resize-none"
              />
            </div>

            {/* Category Input (arbitrary, customizable text) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipe-category" className="text-xs font-bold text-muted-foreground/90">
                Categoría (Texto Libre)
              </Label>
              <Input
                id="recipe-category"
                placeholder="Ej. Repostería, Panadería"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Preparation Time (hours) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipe-time" className="text-xs font-bold text-muted-foreground/90">
                Tiempo Estimado (Horas)
              </Label>
              <Input
                id="recipe-time"
                placeholder="Ej. 2 o 1.5"
                value={estimatedTime}
                onChange={(e) => {
                  setEstimatedTime(e.target.value)
                  if (errors.estimatedTime) setErrors((prev) => ({ ...prev, estimatedTime: "" }))
                }}
                aria-invalid={!!errors.estimatedTime}
              />
              {errors.estimatedTime && (
                <span className="text-xs text-destructive mt-0.5">{errors.estimatedTime}</span>
              )}
            </div>

            {/* Associated Product Selection */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="recipe-product" className="text-xs font-bold text-muted-foreground/90">
                Vincular a Producto (Opcional)
              </Label>
              <Select value={productId || "none"} onValueChange={(val) => setProductId(val || "")}>
                <SelectTrigger
                  id="recipe-product"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground"
                >
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                  <SelectItem
                    value="none"
                    className="rounded-lg text-xs py-1.5 cursor-pointer text-muted-foreground/80 font-medium"
                  >
                    Ningún producto vinculado
                  </SelectItem>
                  {products.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="rounded-lg text-xs py-1.5 cursor-pointer"
                    >
                      {p.name} (SKU: {p.sku || "N/A"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Yield Quantity (JSONB Metadata) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipe-yield-qty" className="text-xs font-bold text-muted-foreground/90">
                Cantidad de Rendimiento <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="recipe-yield-qty"
                placeholder="Ej. 12, 1.5"
                value={yieldQuantity}
                onChange={(e) => {
                  setYieldQuantity(e.target.value)
                  if (errors.yieldQuantity) setErrors((prev) => ({ ...prev, yieldQuantity: "" }))
                }}
                aria-invalid={!!errors.yieldQuantity}
              />
              {errors.yieldQuantity && (
                <span className="text-xs text-destructive mt-0.5">{errors.yieldQuantity}</span>
              )}
            </div>

            {/* Yield Unit (JSONB Metadata) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipe-yield-unit" className="text-xs font-bold text-muted-foreground/90">
                Unidad de Rendimiento <span className="text-destructive font-bold">*</span>
              </Label>
              <Input
                id="recipe-yield-unit"
                placeholder="Ej. Porciones, Unidades, kg"
                value={yieldUnit}
                onChange={(e) => {
                  setYieldUnit(e.target.value)
                  if (errors.yieldUnit) setErrors((prev) => ({ ...prev, yieldUnit: "" }))
                }}
                aria-invalid={!!errors.yieldUnit}
              />
              {errors.yieldUnit && (
                <span className="text-xs text-destructive mt-0.5">{errors.yieldUnit}</span>
              )}
            </div>

            {/* Representative Icon Selector */}
            <div className="flex flex-col gap-2 sm:col-span-2 border-t border-border/30 pt-4">
              <Label className="text-xs font-bold text-muted-foreground/90">
                Icono de la Receta (Decoración de Marca)
              </Label>
              <div className="grid grid-cols-6 gap-2 bg-muted/10 p-3 rounded-xl border border-border/30 overflow-hidden">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedIcon === item.name
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedIcon(item.name)}
                      className={cn(
                        "flex items-center justify-center p-3 rounded-lg border text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer",
                        isSelected
                          ? "bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/40 shadow-xs font-semibold"
                          : "bg-transparent border-transparent hover:bg-muted/30"
                      )}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  )
                })}
              </div>
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
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
