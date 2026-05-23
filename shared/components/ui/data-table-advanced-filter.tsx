"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"

export interface DataTableAdvancedFilterProps
  extends React.ComponentProps<typeof Button> {
  active?: boolean
  badgeCount?: number
  label?: string
}

export function DataTableAdvancedFilter({
  active = false,
  badgeCount = 0,
  label = "Filtros",
  className,
  ...props
}: DataTableAdvancedFilterProps) {
  const hasActiveFilters = badgeCount > 0

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-9 px-3.5 gap-2 rounded-full border border-border/40 bg-card/45 text-xs text-muted-foreground font-medium transition-all duration-200 hover:border-border/70 hover:bg-card/75 active:scale-[0.97] dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50",
        active && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:bg-primary/20",
        hasActiveFilters && !active && "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
        className
      )}
      {...props}
    >
      <SlidersHorizontal className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", active && "rotate-18") } />
      <span>{label}</span>
      {badgeCount > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground leading-none animate-in zoom-in-50 duration-200">
          {badgeCount}
        </span>
      )}
    </Button>
  )
}
