"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
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

export type FormFieldType = "text" | "number" | "textarea" | "select" | "boolean"

export interface FormFieldSchema {
  name: string
  label: string
  type: FormFieldType
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  gridCols?: 1 | 2 // Responsive: 1 or 2 columns layout on desktop
}

interface DynamicFormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  fields: FormFieldSchema[]
  onSubmit: (values: Record<string, any>) => void | Promise<void>
  submitLabel?: string
  defaultValues?: Record<string, any>
  isLoading?: boolean
}

export function DynamicFormModal({
  isOpen,
  onClose,
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Guardar",
  defaultValues,
  isLoading = false,
}: DynamicFormModalProps) {
  const [values, setValues] = React.useState<Record<string, any>>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Initialize fields on open or change in defaults
  React.useEffect(() => {
    if (isOpen) {
      const initialValues: Record<string, any> = {}
      fields.forEach((f) => {
        if (defaultValues && defaultValues[f.name] !== undefined && defaultValues[f.name] !== null) {
          initialValues[f.name] = defaultValues[f.name]
        } else {
          initialValues[f.name] = f.type === "boolean" ? false : ""
        }
      })
      setValues(initialValues)
      setErrors({})
    }
  }, [isOpen, defaultValues, fields])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.required) {
        const val = values[f.name]
        if (val === undefined || val === null || String(val).trim() === "") {
          newErrors[f.name] = `${f.label} es obligatorio`
        }
      }
      if (f.type === "number" && values[f.name] !== "" && values[f.name] !== undefined && values[f.name] !== null) {
        if (isNaN(Number(values[f.name]))) {
          newErrors[f.name] = "Debe ser un número válido"
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Pre-process values (mapping "none" option to null, convert numbers)
    const cleanedValues: Record<string, any> = {}
    fields.forEach((f) => {
      let val = values[f.name]
      if (val === "none") {
        cleanedValues[f.name] = null
      } else if (f.type === "number" && val !== "") {
        cleanedValues[f.name] = Number(val)
      } else {
        cleanedValues[f.name] = val
      }
    })

    await onSubmit(cleanedValues)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl overflow-hidden p-7 gap-6 duration-200">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto p-2 -m-2">
            {fields.map((field) => {
              const gridSpan = field.gridCols === 2 ? "sm:col-span-2" : "sm:col-span-1"

              return (
                <div key={field.name} className={cn("flex flex-col gap-1.5", gridSpan)}>
                  {/* Boolean (Switch) */}
                  {field.type === "boolean" && (
                    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 p-3.5 shadow-2xs hover:bg-muted/15 transition-all duration-200 h-[72px]">
                      <div className="flex flex-col gap-0.5 select-none">
                        <span className="text-sm font-semibold text-foreground">
                          {field.label}
                        </span>
                        {field.placeholder && (
                          <span className="text-xs text-muted-foreground/80">
                            {field.placeholder}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!values[field.name]}
                        onClick={() =>
                          setValues((prev) => ({ ...prev, [field.name]: !prev[field.name] }))
                        }
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          values[field.name] ? "bg-brand-500" : "bg-zinc-300 dark:bg-zinc-800"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                            values[field.name] ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  )}

                  {/* Text Input */}
                  {field.type === "text" && (
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor={field.name}
                        className="text-xs font-bold text-muted-foreground/90"
                      >
                        {field.label}{" "}
                        {field.required && <span className="text-destructive font-bold">*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        placeholder={field.placeholder}
                        value={values[field.name] ?? ""}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                          if (errors[field.name]) {
                            setErrors((prev) => ({ ...prev, [field.name]: "" }))
                          }
                        }}
                        aria-invalid={!!errors[field.name]}
                      />
                      {errors[field.name] && (
                        <span className="text-xs text-destructive mt-0.5">
                          {errors[field.name]}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Number Input */}
                  {field.type === "number" && (
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor={field.name}
                        className="text-xs font-bold text-muted-foreground/90"
                      >
                        {field.label}{" "}
                        {field.required && <span className="text-destructive font-bold">*</span>}
                      </Label>
                      <Input
                        id={field.name}
                        type="text" // Use text with numeric validation to prevent browser discrepancies
                        placeholder={field.placeholder}
                        value={values[field.name] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          setValues((prev) => ({ ...prev, [field.name]: val }))
                          if (errors[field.name]) {
                            setErrors((prev) => ({ ...prev, [field.name]: "" }))
                          }
                        }}
                        aria-invalid={!!errors[field.name]}
                      />
                      {errors[field.name] && (
                        <span className="text-xs text-destructive mt-0.5">
                          {errors[field.name]}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Select Dropdown */}
                  {field.type === "select" && (
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor={field.name}
                        className="text-xs font-bold text-muted-foreground/90"
                      >
                        {field.label}{" "}
                        {field.required && <span className="text-destructive font-bold">*</span>}
                      </Label>
                      <Select
                        value={values[field.name] || ""}
                        onValueChange={(val) => {
                          setValues((prev) => ({ ...prev, [field.name]: val }))
                          if (errors[field.name]) {
                            setErrors((prev) => ({ ...prev, [field.name]: "" }))
                          }
                        }}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow]"
                        >
                          <SelectValue placeholder={field.placeholder || "Selecciona una opción"} />
                        </SelectTrigger>
                        <SelectContent className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg max-h-60 overflow-y-auto">
                          {!field.required && (
                            <SelectItem
                              value="none"
                              className="rounded-lg text-xs py-1.5 focus:bg-primary/10 focus:text-primary cursor-pointer text-muted-foreground/80 font-medium"
                            >
                              Ninguno (Sin Categoría)
                            </SelectItem>
                          )}
                          {field.options?.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="rounded-lg text-xs py-1.5 focus:bg-primary/10 focus:text-primary cursor-pointer"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[field.name] && (
                        <span className="text-xs text-destructive mt-0.5">
                          {errors[field.name]}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Textarea */}
                  {field.type === "textarea" && (
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor={field.name}
                        className="text-xs font-bold text-muted-foreground/90"
                      >
                        {field.label}{" "}
                        {field.required && <span className="text-destructive font-bold">*</span>}
                      </Label>
                      <Textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        value={values[field.name] ?? ""}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                          if (errors[field.name]) {
                            setErrors((prev) => ({ ...prev, [field.name]: "" }))
                          }
                        }}
                        className="min-h-[80px]"
                        aria-invalid={!!errors[field.name]}
                      />
                      {errors[field.name] && (
                        <span className="text-xs text-destructive mt-0.5">
                          {errors[field.name]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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
