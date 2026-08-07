// ─────────────────────────────────────────────────────────────────────────────
// features/onboarding/components/onboarding-view.tsx
//
// Landing page for a logged-in user who does not belong to any organization
// yet, and the entry point for setting up the Personal Space (?space=personal).
// Full-bleed single column on every step — deliberately not the split brand
// panel the auth screens use, so setup does not read as another login. Branches:
//   1. Choose "create an organization" or "personal use".
//   2a. Organization: name / email, then straight into the dashboard.
//   2b. Personal: the Personal Space wizard (goal → region → reminders),
//       which ends on /personal/dashboard.
// Creating the organization grants every module for a 7-day free trial —
// there is no module selection step; see the trial rules on the backend
// (OrganizationsRepository.create).
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Building2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { PageLoader } from "@/shared/components/ui/spinner"
import { useAuthStore } from "@/shared/store/use-auth-store"
import { getMe } from "@/features/auth/services/auth.service"
import { useAuthBrandingReset } from "@/shared/components/providers/branding-provider"
import { resolveActiveOrg } from "@/shared/utils/resolve-active-org"
import { useCreateMyOrganization } from "../hooks/use-onboarding"
import { PersonalOnboardingWizard } from "@/features/user-onboarding/components/personal-onboarding-wizard"
import { userOnboardingService } from "@/features/user-onboarding/services/user-onboarding.service"

type Step = "choice" | "org-form" | "personal"

export function OnboardingView() {
  useAuthBrandingReset()
  const router = useRouter()
  const searchParams = useSearchParams()

  // The workspace picker sends a user here with ?space=personal when they pick
  // "Mi espacio personal" and have not set it up yet. Without that intent this
  // page belongs only to users with no organization, and the guard below sends
  // everyone else back to the picker — which is why a member of an org used to
  // bounce straight back and appear to go nowhere.
  const wantsPersonalSpace = searchParams.get("space") === "personal"

  const setUserFromLogin = useAuthStore((s) => s.setUserFromLogin)
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile)
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization)
  const setOrganizationConfig = useAuthStore((s) => s.setOrganizationConfig)

  const [step, setStep] = React.useState<Step>(wantsPersonalSpace ? "personal" : "choice")
  const [isCheckingSession, setIsCheckingSession] = React.useState(true)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")

  const createOrgMutation = useCreateMyOrganization()

  // ── Guard: if the user already has an organization, this page is a no-op.
  // If the session cannot be recovered at all, kick back to /auth.
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
        if (activeOrg && !wantsPersonalSpace) {
          // Already set up — the picker decides which space they open.
          router.replace("/workspace")
          return
        }

        // No organization is not the same as "not set up": a user who finished
        // the personal onboarding belongs in the Personal Space, not back here.
        try {
          const onboarding = await userOnboardingService.getState()
          if (onboarding.completed) {
            router.replace("/personal/dashboard")
            return
          }
        } catch {
          // Preferences unreachable — fall through and show the choice screen.
        }

        setIsCheckingSession(false)
      } catch {
        router.replace("/auth")
      }
    }

    void checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreateOrganization() {
    if (!name.trim() || createOrgMutation.isPending) return

    createOrgMutation.mutate(
      {
        name: name.trim(),
        email: email.trim() || undefined,
      },
      {
        onSuccess: async () => {
          toast.loading("Cargando configuraciones de tu organización...", {
            id: "loading-org",
          })
          try {
            const data = await getMe()
            if (data && data.id) {
              setUserFromLogin({ id: data.id, email: data.email })
              hydrateProfile({
                firstName: data.firstName || null,
                lastName: data.lastName || null,
                fullName:
                  data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
                avatarUrl: undefined,
                globalRole: data.globalRole || null,
              })

              const activeOrg = resolveActiveOrg(data.organizations)
              if (activeOrg) {
                setActiveOrganization(
                  { id: activeOrg.id, name: activeOrg.name, slug: activeOrg.slug },
                  { orgRoles: [activeOrg.role], permissions: activeOrg.permissions ?? [] }
                )
                if (activeOrg.config) {
                  setOrganizationConfig(activeOrg.config)
                }
              }
            }
            toast.success("¡Organización creada exitosamente!", { id: "loading-org" })
          } catch {
            toast.dismiss("loading-org")
          }
          router.replace("/dashboard")
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message || "No se pudo crear la organización. Intenta de nuevo."
          toast.error(Array.isArray(message) ? message[0] : message)
        },
      }
    )
  }

  if (isCheckingSession) {
    return <PageLoader label="Preparando tu espacio..." />
  }

  return (
    <div className="h-full w-full flex flex-col min-h-0 relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-primary/10 blur-[140px] pointer-events-none animate-pulse-slow" />

      <header className="shrink-0 relative z-10 px-6 sm:px-10 lg:px-14 py-6 lg:py-8 flex items-center">
        <Image
          src="/global/easypoint-logo.png"
          alt="EasyPoint"
          width={160}
          height={44}
          className="object-contain w-auto h-auto"
          priority
        />
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto relative z-10 px-6 sm:px-10 lg:px-14 pb-10">
        {step === "choice" && (
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-2xl glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-300 animate-in fade-in duration-300">
              <div className="mb-8 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
                  ¡Bienvenido a EasyPoint!
                </h1>
                <p className="text-muted-foreground text-sm sm:text-[0.95rem] leading-relaxed">
                  Aún no perteneces a ninguna organización. Elige cómo quieres empezar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStep("org-form")}
                  className="group flex flex-col items-start text-left p-6 rounded-2xl border border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 mb-4 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-base font-bold text-foreground mb-1.5">
                    Crear una organización
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Configura tu propio espacio de trabajo y empieza a operar en minutos, con
                    acceso completo durante 7 días.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Empezar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep("personal")}
                  className="group flex flex-col items-start text-left p-6 rounded-2xl border border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 mb-4 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-base font-bold text-foreground mb-1.5">Uso personal</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lleva el control de tus suscripciones: cuánto pagas, cuándo se renuevan y qué
                    te conviene cancelar.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Empezar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "personal" && (
          <div className="h-full flex items-center justify-center">
            <PersonalOnboardingWizard
              onBack={() =>
                // Arriving with the personal intent means there was no choice
                // step to go back to — the picker is what they came from.
                wantsPersonalSpace ? router.push("/workspace") : setStep("choice")
              }
            />
          </div>
        )}

        {step === "org-form" && (
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-lg glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-300 animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => setStep("choice")}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group mb-6"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Volver
              </button>

              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Datos de tu organización
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Empiezas con{" "}
                  <span className="font-semibold text-primary">7 días de prueba gratis</span> y
                  acceso a todos los módulos. Podrás elegir un plan cuando termine.
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleCreateOrganization()
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Nombre de la organización
                  </label>
                  <Input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mi Tienda"
                    className="h-12 px-4 rounded-lg bg-background border-border/70 focus-visible:border-primary transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email de contacto{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@mitienda.com"
                    className="h-12 px-4 rounded-lg bg-background border-border/70 focus-visible:border-primary transition-all duration-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!name.trim() || createOrgMutation.isPending}
                  className="w-full h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
                >
                  {createOrgMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creando organización...
                    </>
                  ) : (
                    <>
                      Crear organización <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
