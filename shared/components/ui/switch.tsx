"use client"

// ─────────────────────────────────────────────────────────────────────────────
// shared/components/ui/switch.tsx
//
// Accessible toggle switch built with @base-ui/react Switch primitives.
// Styled to match the app's design system (brand-500 accent, smooth transitions).
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { Switch as BaseSwitch } from "@base-ui/react/switch"
import { cn } from "@/shared/lib/utils"

interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
}

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  className,
}: SwitchProps) {
  return (
    <BaseSwitch.Root
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={(state) => cn(
        // Track
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Checked vs unchecked
        state.checked ? "bg-brand-500" : "bg-muted-foreground/25",
        // Disabled
        state.disabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      <BaseSwitch.Thumb
        className={(state) => cn(
          // Thumb
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm",
          "ring-0 transition-transform duration-200 ease-in-out",
          state.checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </BaseSwitch.Root>
  )
}
