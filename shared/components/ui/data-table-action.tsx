"use client"

import * as React from "react"
import { Plus, Download, Upload, LucideIcon } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"

export type DataTableActionType = "create" | "export" | "import" | "custom"

export interface DataTableActionProps
  extends React.ComponentProps<typeof Button> {
  actionType: DataTableActionType
  label?: string
  icon?: LucideIcon
  customBg?: string // E.g. "#10b981" or "oklch(0.65 0.2 140)"
  customText?: string // E.g. "#ffffff"
  customHoverBg?: string // E.g. "#059669"
  shape?: "pill" | "md" | "sm"
}

export function DataTableAction({
  actionType,
  label,
  icon: CustomIcon,
  customBg,
  customText,
  customHoverBg,
  shape = "pill",
  className,
  style,
  children,
  ...props
}: DataTableActionProps) {
  // Determine icon
  const IconComponent = React.useMemo(() => {
    if (CustomIcon) return CustomIcon
    switch (actionType) {
      case "create":
        return Plus
      case "export":
        return Download
      case "import":
        return Upload
      default:
        return null
    }
  }, [actionType, CustomIcon])

  // Determine default label
  const defaultLabel = React.useMemo(() => {
    switch (actionType) {
      case "create":
        return "Nuevo registro"
      case "export":
        return "Exportar"
      case "import":
        return "Importar"
      default:
        return ""
    }
  }, [actionType])

  const buttonLabel = label ?? defaultLabel

  // Map shape to tailwind classes
  const shapeClass = React.useMemo(() => {
    switch (shape) {
      case "pill":
        return "rounded-full"
      case "md":
        return "rounded-[11px]" // md in docs/design.md
      case "sm":
        return "rounded-[8px]" // sm in docs/design.md
      default:
        return "rounded-md"
    }
  }, [shape])

  // Determine button variants based on actionType
  const defaultVariant = React.useMemo(() => {
    if (customBg) return "default" // we will override inline styles anyway
    switch (actionType) {
      case "create":
        return "default" // Brand primary color
      case "export":
      case "import":
        return "outline" // subtle utility card outline
      default:
        return "secondary"
    }
  }, [actionType, customBg])

  // Custom inline styling support for themes/branding
  const inlineStyles: React.CSSProperties = {
    ...style,
  }

  if (customBg) {
    inlineStyles.backgroundColor = customBg
    // Set custom text color if provided, otherwise default to high contrast text-white
    inlineStyles.color = customText ?? "#ffffff"
  }

  // Create state to manage hover state for custom inline styles
  const [isHovered, setIsHovered] = React.useState(false)
  if (customBg && isHovered && customHoverBg) {
    inlineStyles.backgroundColor = customHoverBg
  }

  return (
    <Button
      variant={defaultVariant}
      className={cn(
        "h-9 px-4 gap-2 text-xs font-semibold select-none transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs border border-transparent w-full sm:w-auto",
        shapeClass,
        actionType === "create" && !customBg && "bg-primary text-primary-foreground hover:bg-primary/90",
        (actionType === "export" || actionType === "import") && !customBg && "border-border/40 bg-card/45 text-muted-foreground hover:border-border/70 hover:bg-card/75 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50",
        customBg && "border-transparent",
        className
      )}
      style={inlineStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {IconComponent && <IconComponent className="h-3.5 w-3.5 shrink-0" />}
      {children ?? (buttonLabel && <span>{buttonLabel}</span>)}
    </Button>
  )
}
