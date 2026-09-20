// ─────────────────────────────────────────────────────────────────────────────
// features/account/components/account-page.tsx
//
// The page and section frames every account-settings screen is built from.
//
// Extracted rather than repeated because there are five of them and they must
// read as one panel: the same column width, the same heading scale, the same
// card. The shape is lifted verbatim from the personal-space pages
// (/personal/settings, /personal/appearance) so the two areas stay visually
// continuous — the sidebar is the only thing that tells you which one you are in.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface AccountPageProps {
  title: string
  description: string
  children: React.ReactNode
  /** Wider than the default for the DIAN form, which is a two-column grid. */
  wide?: boolean
}

export function AccountPage({ title, description, children, wide = false }: AccountPageProps) {
  return (
    <div className={cn("space-y-6", wide ? "max-w-4xl" : "max-w-2xl")}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}

interface AccountSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  /** Rendered on the heading row — a section-level action such as "Cerrar todo". */
  action?: React.ReactNode
  className?: string
}

export function AccountSection({
  title,
  description,
  children,
  action,
  className,
}: AccountSectionProps) {
  return (
    <section className={cn("rounded-xl border border-border/50 bg-card p-5 space-y-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
