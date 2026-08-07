// ─────────────────────────────────────────────────────────────────────────────
// features/user-onboarding/components/currency-picker.tsx
//
// Searchable currency picker. Built on cmdk inside a Popover because the app's
// Select has no search, and ~160 currencies is far past the point where an
// unsearchable dropdown is usable.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command"
import { useCurrencies } from "@/features/user-subscriptions/hooks/use-currencies"

interface CurrencyPickerProps {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function CurrencyPicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Selecciona una moneda",
}: CurrencyPickerProps) {
  const [open, setOpen] = React.useState(false)
  const { data: currencies, isLoading } = useCurrencies()

  const selected = currencies?.find((c) => c.code === value)

  // Popular currencies get their own section so the common choice is one click
  // away instead of buried alphabetically.
  const { popular, rest } = React.useMemo(() => {
    const list = currencies ?? []
    return {
      popular: list.filter((c) => c.isPopular),
      rest: list.filter((c) => !c.isPopular),
    }
  }, [currencies])

  function renderItem(code: string, label: string, symbol: string | null) {
    return (
      <CommandItem
        key={code}
        value={`${code} ${label}`}
        onSelect={() => {
          onChange(code)
          setOpen(false)
        }}
        className="gap-2"
      >
        <Check className={cn("w-4 h-4 shrink-0", value === code ? "opacity-100" : "opacity-0")} />
        <span className="font-mono text-xs font-semibold w-10 shrink-0">{code}</span>
        <span className="flex-1 truncate">{label}</span>
        {symbol && <span className="text-muted-foreground text-xs shrink-0">{symbol}</span>}
      </CommandItem>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled || isLoading}
        className={cn(
          // Mirrors the Input primitive token for token. It used to set a bare
          // `bg-background`, which in dark mode is the near-black page ground
          // rather than the lifted `input/30` every field beside it uses — the
          // control read as a black slab in the middle of the form.
          "flex h-9 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] dark:bg-input/30 dark:hover:bg-input/50",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          (disabled || isLoading) && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando monedas...
          </span>
        ) : selected ? (
          <span className="flex items-center gap-2 truncate">
            <span className="font-mono text-xs font-semibold">{selected.code}</span>
            <span className="text-muted-foreground truncate">{selected.nameEs}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] min-w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por código o nombre..." />
          <CommandList className="max-h-64">
            <CommandEmpty>No se encontró esa moneda.</CommandEmpty>
            {popular.length > 0 && (
              <CommandGroup heading="Más usadas">
                {popular.map((c) => renderItem(c.code, c.nameEs, c.symbol))}
              </CommandGroup>
            )}
            {rest.length > 0 && (
              <CommandGroup heading="Todas las monedas">
                {rest.map((c) => renderItem(c.code, c.nameEs, c.symbol))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
