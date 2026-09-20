// ─────────────────────────────────────────────────────────────────────────────
// features/account/components/session-row.tsx
//
// One device in the session list. The API does the parsing: `device.label` is
// always populated, even for a User-Agent it could not place, so this never
// has to guess or render an empty row.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Loader2, Monitor, Smartphone, Tablet, Bot, HelpCircle } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import { lastSeenLabel, signedInLabel } from "../domain/session-presentation"
import type { ActiveSession, DeviceType } from "../types/account.types"

const DEVICE_ICONS: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  bot: Bot,
  unknown: HelpCircle,
}

interface SessionRowProps {
  session: ActiveSession
  onRevoke: (sid: string) => void
  isRevoking: boolean
}

export function SessionRow({ session, onRevoke, isRevoking }: SessionRowProps) {
  const Icon = DEVICE_ICONS[session.device.type] ?? HelpCircle
  const signedIn = signedInLabel(session.createdAt)

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 p-4 rounded-lg border transition-colors",
        session.current
          ? "border-primary/30 bg-primary/5"
          : "border-border/50 bg-background hover:border-border"
      )}
    >
      <div className="flex gap-3 min-w-0">
        <div
          className={cn(
            "p-2.5 rounded-xl border h-fit shrink-0",
            session.current
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border/50"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">{session.device.label}</p>
            {session.current && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
                Actual
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">{lastSeenLabel(session)}</p>

          <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono truncate">
            {session.ip}
            {signedIn && <span className="font-sans">{` · ${signedIn}`}</span>}
          </p>
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => onRevoke(session.sid)}
        disabled={isRevoking}
        className="shrink-0"
      >
        {isRevoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cerrar"}
      </Button>
    </div>
  )
}
