"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export interface DataTableSearchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string
  onChange: (value: string) => void
  shortcutKey?: string // e.g. "k" (will trigger on Ctrl/Cmd+K) or "/"
  shape?: "pill" | "md" | "sm"
}

export const DataTableSearch = React.forwardRef<
  HTMLInputElement,
  DataTableSearchProps
>(({ className, value, onChange, placeholder = "Buscar...", shortcutKey = "k", shape = "pill", ...props }, ref) => {
  const localRef = React.useRef<HTMLInputElement | null>(null)

  // Combine internal and external ref
  const combinedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      localRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  const [isFocused, setIsFocused] = React.useState(false)

  // Listen for keyboard shortcut to focus input
  React.useEffect(() => {
    if (!shortcutKey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey
      const key = shortcutKey.toLowerCase()

      if (
        (key === "k" && isCmdOrCtrl && e.key.toLowerCase() === "k") ||
        (key === "/" && e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault()
        localRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcutKey])

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

  return (
    <div
      className={cn(
        "group relative flex h-11 w-full max-w-sm items-center border border-border/40 bg-card/45 px-4 shadow-2xs backdrop-blur-md transition-all duration-200 hover:border-border/70 hover:bg-card/70 focus-within:border-primary focus-within:bg-background focus-within:ring-3 focus-within:ring-primary/15 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50 dark:focus-within:bg-zinc-950/80",
        shapeClass,
        className
      )}
    >
      <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />

      <input
        ref={combinedRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex h-full w-full bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground/50"
        {...props}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("")
            localRef.current?.focus()
          }}
          className="ml-2 rounded-full p-1 text-muted-foreground/60 hover:bg-muted/80 hover:text-foreground transition-all duration-150 active:scale-90"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        shortcutKey && (
          <div className="pointer-events-none ml-2 hidden items-center gap-1 sm:flex">
            <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded-[6px] border border-border/40 bg-muted/60 px-2 font-mono text-[9px] font-medium text-muted-foreground/80">
              {shortcutKey === "k" ? (
                <>
                  <span className="text-[10px]">⌘</span>K
                </>
              ) : (
                "/"
              )}
            </kbd>
          </div>
        )
      )}
    </div>
  )
})

DataTableSearch.displayName = "DataTableSearch"
