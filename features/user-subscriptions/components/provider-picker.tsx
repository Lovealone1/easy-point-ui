// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/components/provider-picker.tsx
//
// Searchable picker over the seeded provider catalog. Picking a provider is
// what makes a subscription "catalog-backed": its category, logo and website
// all come from the catalog and the form locks those fields.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Sparkles } from "lucide-react"
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
import { useSubscriptionProviders } from "../hooks/use-user-subscriptions"
import type { SubscriptionProvider } from "../types/user-subscriptions.types"

interface ProviderPickerProps {
  value: string | null
  onChange: (provider: SubscriptionProvider | null) => void
  disabled?: boolean
}

export function ProviderPicker({ value, onChange, disabled }: ProviderPickerProps) {
  const [open, setOpen] = React.useState(false)
  const { data, isLoading } = useSubscriptionProviders()

  const providers = data?.data ?? []
  const selected = providers.find((p) => p.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled || isLoading}
        className={cn(
          // Same token set as the Input primitive — see CurrencyPicker.
          "flex h-11 w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] dark:bg-input/30 dark:hover:bg-input/50",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          (disabled || isLoading) && "cursor-not-allowed opacity-50"
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <ProviderLogo provider={selected} />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            {isLoading ? "Cargando servicios..." : "Busca un servicio del catálogo"}
          </span>
        )}
        <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
      </PopoverTrigger>

      <PopoverContent className="w-[--anchor-width] min-w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Netflix, Spotify, ChatGPT..." />
          <CommandList className="max-h-72">
            <CommandEmpty>
              <div className="py-4 px-3 text-center">
                <p className="text-sm text-muted-foreground mb-1">No encontramos ese servicio.</p>
                <p className="text-xs text-muted-foreground/80">
                  Puedes crearlo como suscripción personalizada.
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {providers.map((provider) => (
                <CommandItem
                  key={provider.id}
                  value={`${provider.name} ${provider.category?.name ?? ""}`}
                  onSelect={() => {
                    onChange(provider)
                    setOpen(false)
                  }}
                  className="gap-2"
                >
                  <Check
                    className={cn("w-4 h-4 shrink-0", value === provider.id ? "opacity-100" : "opacity-0")}
                  />
                  <ProviderLogo provider={provider} />
                  <span className="flex-1 truncate">{provider.name}</span>
                  {provider.category && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {provider.category.name}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Brand-coloured initial as the fallback: catalog logos are remote SVGs and a
 * broken image is worse than a tidy monogram.
 */
export function ProviderLogo({
  provider,
  size = 20,
}: {
  provider: Pick<SubscriptionProvider, "name" | "logoUrl" | "brandColor">
  size?: number
}) {
  const [failed, setFailed] = React.useState(false)

  if (provider.logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote CDN + signed S3 URLs, outside next/image's configured domains
      <img
        src={provider.logoUrl}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded object-contain shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className="rounded grid place-items-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: provider.brandColor ?? "#6366F1",
        fontSize: size * 0.55,
      }}
    >
      {provider.name.charAt(0).toUpperCase()}
    </span>
  )
}

export function CustomServiceIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      className="rounded grid place-items-center bg-muted text-muted-foreground shrink-0"
      style={{ width: size, height: size }}
    >
      <Sparkles style={{ width: size * 0.6, height: size * 0.6 }} />
    </span>
  )
}
