// ─────────────────────────────────────────────────────────────────────────────
// app/(account)/account/sessions/page.tsx
//
// Where you are signed in, and how to stop being signed in there.
//
// The list is scoped to the application this session belongs to — a dashboard
// session does not list console sessions, and the reverse. That is enforced by
// the API off the token; see docs/SESSIONS.md in easy-point-api.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { PageLoader } from "@/shared/components/ui/spinner"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { useAuthStore } from "@/shared/store/use-auth-store"
import { apiErrorMessage } from "@/shared/utils/api-message"
import { logout } from "@/features/auth/services/auth.service"
import { AccountPage, AccountSection } from "@/features/account/components/account-page"
import { SessionRow } from "@/features/account/components/session-row"
import {
  useActiveSessions,
  useRevokeOtherSessions,
  useRevokeSession,
} from "@/features/account/hooks/use-account"

export default function AccountSessionsPage() {
  const router = useRouter()
  const clearSession = useAuthStore((s) => s.clearSession)

  const { data: sessions, isLoading } = useActiveSessions()
  const revokeMutation = useRevokeSession()
  const revokeOthersMutation = useRevokeOtherSessions()

  const [pendingSid, setPendingSid] = React.useState<string | null>(null)
  const [confirmRevokeOthers, setConfirmRevokeOthers] = React.useState(false)

  if (isLoading) {
    return <PageLoader label="Buscando tus sesiones..." />
  }

  const rows = sessions ?? []
  const otherCount = rows.filter((session) => !session.current).length
  const pendingIsCurrent = rows.find((s) => s.sid === pendingSid)?.current ?? false

  /**
   * Ending the current session logs this browser out for real: the API clears
   * the cookies, so the very next request would 401 into the splash. Doing the
   * sign-out deliberately is the difference between "I closed this device" and
   * "the app broke".
   */
  async function handleRevoke(sid: string) {
    const isCurrent = rows.find((session) => session.sid === sid)?.current ?? false

    try {
      await revokeMutation.mutateAsync(sid)

      if (isCurrent) {
        clearSession()
        router.replace("/auth")
        return
      }

      toast.success("Sesión cerrada")
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo cerrar la sesión."))
    } finally {
      setPendingSid(null)
    }
  }

  async function handleRevokeOthers() {
    try {
      const result = await revokeOthersMutation.mutateAsync()
      toast.success(
        result.revoked === 1
          ? "Se cerró 1 sesión"
          : `Se cerraron ${result.revoked} sesiones`
      )
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudieron cerrar las otras sesiones."))
    } finally {
      setConfirmRevokeOthers(false)
    }
  }

  /**
   * "Sign out everywhere" is the one action that crosses into the other
   * application, so it goes through the logout endpoint rather than the
   * session list, and it ends this browser's session too.
   */
  async function handleLogoutEverywhere() {
    try {
      await logout()
    } catch {
      /* the cookies are cleared either way */
    } finally {
      clearSession()
      router.replace("/auth")
    }
  }

  return (
    <AccountPage
      title="Sesiones"
      description="Los dispositivos y navegadores donde tu cuenta está abierta. Si no reconoces alguno, ciérralo."
    >
      <AccountSection
        title="Sesiones activas"
        description={
          rows.length === 1
            ? "Solo este dispositivo."
            : `${rows.length} dispositivos, incluido este.`
        }
        action={
          otherCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRevokeOthers(true)}
              disabled={revokeOthersMutation.isPending}
              className="shrink-0"
            >
              {revokeOthersMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Cerrar las demás"
              )}
            </Button>
          ) : undefined
        }
      >
        {rows.length === 0 ? (
          // Unreachable in practice — reading this page needs a session, which
          // the list would contain — but an empty state beats a blank card if
          // the read ever races a revocation.
          <p className="text-sm text-muted-foreground py-4">No hay sesiones activas.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((session) => (
              <SessionRow
                key={session.sid}
                session={session}
                onRevoke={setPendingSid}
                isRevoking={revokeMutation.isPending && pendingSid === session.sid}
              />
            ))}
          </div>
        )}
      </AccountSection>

      <AccountSection
        title="Cerrar sesión en todas partes"
        description="Termina todas tus sesiones, aquí y en el panel de administración. Tendrás que volver a entrar con un código."
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 h-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Úsalo si crees que alguien más entró a tu cuenta. Es lo único que alcanza a las dos
              aplicaciones a la vez.
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogoutEverywhere} className="shrink-0">
            Cerrar todo
          </Button>
        </div>
      </AccountSection>

      <ConfirmModal
        isOpen={pendingSid !== null}
        onClose={() => setPendingSid(null)}
        title={pendingIsCurrent ? "¿Cerrar este dispositivo?" : "¿Cerrar esta sesión?"}
        description={
          pendingIsCurrent
            ? "Es el dispositivo que estás usando ahora: se cerrará tu sesión y volverás a la pantalla de acceso."
            : "El dispositivo tendrá que volver a entrar con un código."
        }
        confirmLabel="Cerrar sesión"
        isLoading={revokeMutation.isPending}
        onConfirm={() => {
          if (pendingSid) return handleRevoke(pendingSid)
        }}
      />

      <ConfirmModal
        isOpen={confirmRevokeOthers}
        onClose={() => setConfirmRevokeOthers(false)}
        title="¿Cerrar las demás sesiones?"
        description={`Se cerrarán ${otherCount} ${otherCount === 1 ? "sesión" : "sesiones"}. Este dispositivo seguirá abierto.`}
        confirmLabel="Cerrar las demás"
        isLoading={revokeOthersMutation.isPending}
        onConfirm={handleRevokeOthers}
      />
    </AccountPage>
  )
}
