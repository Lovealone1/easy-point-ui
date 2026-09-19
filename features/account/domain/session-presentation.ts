// ─────────────────────────────────────────────────────────────────────────────
// features/account/domain/session-presentation.ts
//
// Turning a session row into the sentence under its device name. Pure, and
// separate from the component, because the interesting part is not the markup
// — it is the resolution of the underlying value.
// ─────────────────────────────────────────────────────────────────────────────

import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { ActiveSession } from "../types/account.types"

/**
 * The API records `lastSeenAt` at a five-minute resolution, so anything finer
 * would be a precision we cannot stand behind: a session used ten seconds ago
 * and one used four minutes ago carry the same stored value. Everything inside
 * that window reads as "ahora mismo" rather than inventing a number.
 *
 * A malformed timestamp says so instead of rendering "hace 56 años", which is
 * what date-fns does with an invalid date.
 */
export function lastSeenLabel(
  session: Pick<ActiveSession, "current" | "lastSeenAt">,
  now: Date = new Date()
): string {
  if (session.current) return "Este dispositivo"

  const lastSeen = new Date(session.lastSeenAt)
  if (Number.isNaN(lastSeen.getTime())) return "Actividad desconocida"

  const minutesAgo = (now.getTime() - lastSeen.getTime()) / 60_000
  if (minutesAgo < 5) return "Activa ahora mismo"

  return `Última actividad ${formatDistanceToNow(lastSeen, { addSuffix: true, locale: es })}`
}

/** "inició hace 3 días", or nothing at all when the timestamp is unusable. */
export function signedInLabel(createdAt: string): string | null {
  const signedIn = new Date(createdAt)
  if (Number.isNaN(signedIn.getTime())) return null

  return `inició ${formatDistanceToNow(signedIn, { addSuffix: true, locale: es })}`
}
