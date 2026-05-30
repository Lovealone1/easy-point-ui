"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Filter } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export interface DataTableFilterOption {
  label: string
  value: string
}

export interface DataTableFilterProps {
  title: string
  value: string
  onChange: (value: string) => void
  options: DataTableFilterOption[]
  className?: string
  placeholder?: string
  showIcon?: boolean
  shape?: "pill" | "md" | "sm"
}

export function DataTableFilter({
  title,
  value,
  onChange,
  options,
  className,
  placeholder = "Todos",
  showIcon = false,
  shape = "md",
}: DataTableFilterProps) {
  const shapeClass = React.useMemo(() => {
    switch (shape) {
      case "pill":
        return "rounded-full"
      case "md":
        return "rounded-[11px]"
      case "sm":
        return "rounded-[8px]"
      default:
        return "rounded-md"
    }
  }, [shape])

  const displayLabel = React.useMemo(() => {
    if (value === "all") return placeholder
    const found = options.find((opt) => opt.value === value)
    return found ? found.label : placeholder
  }, [value, options, placeholder])

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Select value={value} onValueChange={(val) => onChange(val ?? "all")}>
        <SelectTrigger
          size="sm"
          className={cn(
            "h-9 px-3.5 border border-border/40 bg-card/45 hover:border-border/70 hover:bg-card/75 shadow-2xs backdrop-blur-md text-xs font-medium text-muted-foreground transition-all duration-200 data-[placeholder=false]:text-foreground dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50",
            shapeClass
          )}
        >
          <div className="flex items-center gap-1.5">
            {showIcon && <Filter className="h-3 w-3 shrink-0 text-muted-foreground/60" />}
            <span className="text-muted-foreground/75 font-normal">{title}:</span>
            <SelectValue placeholder={placeholder}>
              {displayLabel}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="min-w-[140px] rounded-xl p-1 bg-popover/90 backdrop-blur-md border border-border/25 shadow-md">
          {/* Default/All option */}
          <SelectItem value="all" className="rounded-lg text-xs py-1.5 focus:bg-primary/10 focus:text-primary">
            {placeholder}
          </SelectItem>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="rounded-lg text-xs py-1.5 focus:bg-primary/10 focus:text-primary"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
