// ─────────────────────────────────────────────────────────────────────────────
// app/(account)/account/email/page.tsx
//
// "Correo y acceso" — what stands in for "change password" in a product that
// has no passwords. Sign-in is a code sent to your address, so the address IS
// the credential, and changing it is the credential change.
//
// Two steps, because the code goes to the NEW address: that is what proves the
// person actually controls the mailbox they are moving to. Confirming ends
// every session, this one included — the address is inside the signed token.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, KeyRound, Loader2, MailCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { PageLoader } from "@/shared/components/ui/spinner"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/components/ui/input-otp"
import { useAuthStore } from "@/shared/store/use-auth-store"
import { apiErrorMessage } from "@/shared/utils/api-message"
import { AccountPage, AccountSection } from "@/features/account/components/account-page"
import {
  useAccountProfile,
  useConfirmEmailChange,
  useRequestEmailChange,
} from "@/features/account/hooks/use-account"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AccountEmailPage() {
  const router = useRouter()
  const clearSession = useAuthStore((s) => s.clearSession)

  const { data: profile, isLoading } = useAccountProfile()
  const requestMutation = useRequestEmailChange()
  const confirmMutation = useConfirmEmailChange()

  const [newEmail, setNewEmail] = React.useState("")
  const [otp, setOtp] = React.useState("")
  /** Set once the code is on its way; it also freezes the address field. */
  const [awaitingCode, setAwaitingCode] = React.useState(false)

  if (isLoading || !profile) {
    return <PageLoader label="Cargando tu correo..." />
  }

  const trimmed = newEmail.trim()
  const isSameAddress = trimmed.toLowerCase() === profile.email.toLowerCase()
  const canRequest = EMAIL_PATTERN.test(trimmed) && !isSameAddress

  async function handleRequest(event: React.FormEvent) {
    event.preventDefault()
    if (!canRequest) return

    try {
      await requestMutation.mutateAsync({ newEmail: trimmed })
      setAwaitingCode(true)
      toast.success(`Enviamos un código a ${trimmed}`)
    } catch (error) {
      toast.error(apiErrorMessage(error, "No pudimos enviar el código."))
    }
  }

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault()

    try {
      await confirmMutation.mutateAsync({ newEmail: trimmed, otp })
      toast.success("Correo actualizado. Vuelve a entrar con tu nueva dirección.")
      // Not optional housekeeping: the API just ended every session, so the
      // store and the cookies are describing something that no longer exists.
      clearSession()
      router.replace("/auth")
    } catch (error) {
      setOtp("")
      toast.error(apiErrorMessage(error, "El código no es válido o ya expiró."))
    }
  }

  function handleStartOver() {
    setAwaitingCode(false)
    setOtp("")
  }

  return (
    <AccountPage
      title="Correo y acceso"
      description="Entras a Easy Point con un código enviado a tu correo, así que tu dirección es tu credencial. No hay contraseña que cambiar."
    >
      <AccountSection
        title="Correo actual"
        description="A esta dirección llegan tus códigos de acceso."
      >
        <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/40 px-3 h-11">
          <MailCheck className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate">{profile.email}</span>
        </div>
      </AccountSection>

      {!awaitingCode ? (
        <form onSubmit={handleRequest}>
          <AccountSection
            title="Cambiar de correo"
            description="Te enviaremos un código a la dirección nueva para confirmar que es tuya."
          >
            <div className="space-y-2">
              <Label htmlFor="newEmail" className="text-sm font-medium">
                Nuevo correo
              </Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="tu-nuevo-correo@empresa.com"
                className="h-11 bg-background"
                autoComplete="email"
              />
              {isSameAddress && trimmed.length > 0 && (
                <p className="text-xs text-amber-500">Ese ya es tu correo actual.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!canRequest || requestMutation.isPending}
              className="h-11"
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando código...
                </>
              ) : (
                "Enviar código"
              )}
            </Button>
          </AccountSection>
        </form>
      ) : (
        <form onSubmit={handleConfirm}>
          <AccountSection
            title="Confirma el código"
            description={`Escribe el código de 6 dígitos que enviamos a ${trimmed}.`}
          >
            <div className="flex justify-center py-2">
              {/* Same slot treatment as the sign-in screen — this is the same
                  act, so it should not look like a different control. */}
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={confirmMutation.isPending}
              >
                <InputOTPGroup className="gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="size-11 sm:size-12 text-lg font-semibold bg-background rounded-lg border border-border/60 focus:border-primary transition-all duration-200"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
              <KeyRound className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                Al confirmar se cerrarán todas tus sesiones, incluida esta. Volverás a entrar con tu
                dirección nueva.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={otp.length !== 6 || confirmMutation.isPending}
                className="h-11"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Confirmando...
                  </>
                ) : (
                  "Confirmar cambio"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleStartOver}
                disabled={confirmMutation.isPending}
                className="h-11"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Usar otra dirección
              </Button>
            </div>
          </AccountSection>
        </form>
      )}
    </AccountPage>
  )
}
