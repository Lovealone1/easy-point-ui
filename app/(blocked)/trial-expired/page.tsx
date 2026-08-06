"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Clock, Check, LogOut, Loader2 } from "lucide-react"
import { useAuthStore } from "@/shared/store/use-auth-store"
import { getMe } from "@/features/auth/services/auth.service"
import { resolveActiveOrg } from "@/shared/utils/resolve-active-org"
import { forceLogout } from "@/shared/utils/apply-branding"
import { PageLoader } from "@/shared/components/ui/spinner"
import { Button } from "@/shared/components/ui/button"
import { useMySubscriptionState } from "@/features/subscriptions/hooks/use-subscriptions"
import { usePlans } from "@/features/plans/hooks/use-plans"

function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function TrialExpiredPage() {
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = React.useState(true)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const setUserFromLogin = useAuthStore((s) => s.setUserFromLogin)
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile)
  const organizationConfig = useAuthStore((s) => s.organizationConfig)

  // ── Guard: only orgs with an actually blocked subscription belong here.
  // No org → /onboarding. Access still valid → /dashboard (BrandingProvider
  // will re-check on every navigation, this just avoids a dead end).
  React.useEffect(() => {
    async function checkSession() {
      try {
        const data = await getMe()
        if (!data || !data.id) {
          router.replace("/auth")
          return
        }

        setUserFromLogin({ id: data.id, email: data.email })
        hydrateProfile({
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          fullName: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
          avatarUrl: undefined,
          globalRole: data.globalRole || null,
        })

        const activeOrg = resolveActiveOrg(data.organizations)
        if (!activeOrg) {
          router.replace("/onboarding")
          return
        }
        if (!activeOrg.config?.accessBlocked) {
          router.replace("/dashboard")
          return
        }

        setIsCheckingSession(false)
      } catch {
        router.replace("/auth")
      }
    }

    void checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: state } = useMySubscriptionState()
  const { data: plansPage, isLoading: isLoadingPlans } = usePlans({ isActive: true, limit: 50 })
  const plans = (plansPage?.data ?? []).filter((p) => p.name.toUpperCase() !== "FREE")

  async function handleLogout() {
    setIsLoggingOut(true)
    await forceLogout()
  }

  if (isCheckingSession) {
    return <PageLoader label="Verificando tu organización..." />
  }

  const isTrial = state?.isTrial ?? organizationConfig?.isTrial ?? true

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col items-center px-6 py-12">
      <header className="w-full max-w-4xl flex items-center justify-between mb-10">
        <Image
          src="/global/easypoint-logo.png"
          alt="EasyPoint"
          width={140}
          height={38}
          className="object-contain w-auto h-auto"
          priority
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isLoggingOut}
          onClick={handleLogout}
          className="text-muted-foreground"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Cerrar sesión
        </Button>
      </header>

      <main className="w-full max-w-4xl flex-1 flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-6">
          <Clock className="w-8 h-8 stroke-[1.5]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-center mb-3">
          {isTrial ? "Tu periodo de prueba ha terminado" : "Tu suscripción ha expirado"}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base text-center max-w-lg mb-10 leading-relaxed">
          {isTrial
            ? "Tuviste 7 días de acceso completo a EasyPoint. Elige un plan para seguir operando sin interrupciones."
            : "Renueva tu plan para recuperar el acceso a tu organización."}
        </p>

        {isLoadingPlans ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
            {[0, 1].map((i) => (
              <div key={i} className="h-64 rounded-2xl border border-border/40 bg-muted/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
            {plans.map((plan) => {
              const metadata = (plan.metadata ?? {}) as { maxUsers?: number | null }
              const isPremium = plan.name.toUpperCase() === "PREMIUM"
              return (
                <div
                  key={plan.id}
                  className="flex flex-col rounded-2xl border border-border/50 bg-background p-6 shadow-sm"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
                    {plan.name}
                  </span>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-foreground">
                      {formatCOP(plan.monthlyPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground"> / mes</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      Todos los módulos incluidos
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {metadata.maxUsers ? `Hasta ${metadata.maxUsers} usuarios` : "Usuarios ilimitados"}
                    </li>
                    {isPremium && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        Soporte prioritario
                      </li>
                    )}
                  </ul>
                  <a
                    href={`mailto:soporte@easypoint.com?subject=${encodeURIComponent(
                      `Quiero contratar el plan ${plan.name}`
                    )}`}
                  >
                    <Button type="button" className="w-full">
                      Elegir {plan.name}
                    </Button>
                  </a>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground/80 text-center mt-8 max-w-md">
          ¿Ya realizaste el pago o tienes dudas? Escríbenos a{" "}
          <a href="mailto:soporte@easypoint.com" className="text-primary underline">
            soporte@easypoint.com
          </a>
          .
        </p>
      </main>
    </div>
  )
}
