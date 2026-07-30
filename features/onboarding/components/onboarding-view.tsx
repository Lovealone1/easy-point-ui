// ─────────────────────────────────────────────────────────────────────────────
// features/onboarding/components/onboarding-view.tsx
//
// Self-service organization creation — the landing page for a logged-in
// user who does not belong to any organization yet. Three steps:
//   1. Choose "create an organization" (only real option today) or
//      "personal use" (disabled, coming soon). Split screen w/ brand panel.
//   2. Organization name / email. Split screen, form centered in the middle.
//   3. Pick exactly 5 base modules (admin-governance modules are always on,
//      not shown here). Full-bleed — the brand panel is dropped so the grid
//      can use the entire screen width.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import * as LucideIcons from "lucide-react"
import {
  Building2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Puzzle,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { PageLoader } from "@/shared/components/ui/spinner"
import { useAuthStore } from "@/shared/store/use-auth-store"
import { getMe } from "@/features/auth/services/auth.service"
import { useAuthBrandingReset } from "@/shared/components/providers/branding-provider"
import { resolveActiveOrg } from "@/shared/utils/resolve-active-org"
import {
  useSelfServiceCatalog,
  useCreateMyOrganization,
} from "../hooks/use-onboarding"
import type { BaseModule } from "../types/onboarding.types"

// ─────────────────────────────────────────────────────────────────────────────
// Module Icon Resolver — module.icon stores Lucide PascalCase names
// (same catalog used by the admin org-modules panel).
// ─────────────────────────────────────────────────────────────────────────────

function ModuleIcon({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return <Puzzle className={className} />

  const IconComponent =
    (LucideIcons as Record<string, any>)[name] || Puzzle

  return <IconComponent className={className} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand Panel — decorative left column, shown for the choice & org-form
// steps only. Dropped for the modules step so the grid gets the full screen.
// ─────────────────────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[38%] p-2 lg:p-4 shrink-0">
      <div className="w-full h-full relative bg-[#090014] rounded-2xl overflow-hidden shadow-2xl p-10 xl:p-14">
        <Image
          src="/assets/abstract-erp-wallpaper.png"
          alt="EasyPoint"
          fill
          sizes="38vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0" />
        <div className="relative z-10 flex flex-col h-full justify-end">
          <div className="mb-12 max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold leading-[1.15] text-white tracking-tight mb-5">
              Configura tu espacio en minutos
            </h2>
            <p className="text-lg text-white/80 leading-relaxed font-medium">
              Elige los módulos que tu negocio necesita hoy. Podrás activar más cuando estés listo.
            </p>
          </div>
          <p className="text-sm font-bold tracking-widest text-white/60 uppercase flex items-center gap-4">
            <span className="w-12 h-px bg-white/30" />
            Hecho por emprendedores para emprendedores
          </p>
        </div>
      </div>
    </div>
  )
}

type Step = "choice" | "org-form" | "modules"

export function OnboardingView() {
  useAuthBrandingReset()
  const router = useRouter()

  const setUserFromLogin = useAuthStore((s) => s.setUserFromLogin)
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile)
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization)
  const setOrganizationConfig = useAuthStore((s) => s.setOrganizationConfig)

  const [step, setStep] = React.useState<Step>("choice")
  const [isCheckingSession, setIsCheckingSession] = React.useState(true)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [selectedModuleIds, setSelectedModuleIds] = React.useState<string[]>([])

  const { data: catalog, isLoading: isLoadingCatalog, error: catalogError } =
    useSelfServiceCatalog()
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
        if (activeOrg) {
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

  const selectionSize = catalog?.selectionSize ?? 5
  const isSelectionComplete = selectedModuleIds.length === selectionSize

  function toggleModule(module: BaseModule) {
    setSelectedModuleIds((prev) => {
      if (prev.includes(module.id)) {
        return prev.filter((id) => id !== module.id)
      }
      if (prev.length >= selectionSize) return prev
      return [...prev, module.id]
    })
  }

  async function handleCreateOrganization() {
    if (!name.trim() || !isSelectionComplete || createOrgMutation.isPending) return

    createOrgMutation.mutate(
      {
        name: name.trim(),
        email: email.trim() || undefined,
        moduleIds: selectedModuleIds,
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

  const isModulesStep = step === "modules"

  return (
    <div className="h-full w-full flex overflow-hidden">
      {!isModulesStep && <BrandPanel />}

      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 w-[380px] h-[380px] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse-slow" />

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
                      Configura tu propio espacio de trabajo, elige tus módulos y empieza a operar
                      en minutos.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Empezar <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  <div
                    className="relative flex flex-col items-start text-left p-6 rounded-2xl border border-border/40 bg-muted/20 opacity-60 cursor-not-allowed select-none"
                    title="Próximamente"
                  >
                    <span className="absolute top-4 right-4 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded-full border border-border/30">
                      Pronto
                    </span>
                    <div className="p-3 rounded-xl bg-muted text-muted-foreground border border-border/30 mb-4">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h2 className="text-base font-bold text-foreground mb-1.5">Uso personal</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Un espacio individual sin organización, ideal para uso independiente.
                    </p>
                  </div>
                </div>
              </div>
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
                    Tu organización nace en el plan{" "}
                    <span className="font-semibold text-primary">Free</span>. Podrás actualizarlo
                    más adelante.
                  </p>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!name.trim()) return
                    setStep("modules")
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
                    disabled={!name.trim()}
                    className="w-full h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
                  >
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            </div>
          )}

          {step === "modules" && (
            <div className="w-full max-w-[1800px] mx-auto animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => setStep("org-form")}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group mb-6"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Volver
              </button>

              <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                    Elige tus módulos base
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Selecciona exactamente {selectionSize} módulos para activar en tu organización.
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                    isSelectionComplete
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isSelectionComplete && <Check className="w-3.5 h-3.5" />}
                  {selectedModuleIds.length} / {selectionSize} seleccionados
                </span>
              </div>

              {isLoadingCatalog ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={`cat-skel-${i}`}
                      className="border border-border/20 bg-muted/5 rounded-2xl p-5 h-[120px] animate-pulse"
                    />
                  ))}
                </div>
              ) : catalogError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldAlert className="h-8 w-8 text-destructive/60 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No se pudo cargar el catálogo de módulos. Intenta de nuevo más tarde.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-6">
                  {catalog?.selectableModules.map((module) => {
                    const isChecked = selectedModuleIds.includes(module.id)
                    const isDisabled = !isChecked && isSelectionComplete

                    return (
                      <button
                        key={module.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleModule(module)}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200",
                          isChecked
                            ? "border-primary/40 bg-primary/[0.04]"
                            : "border-border/20 bg-muted/5",
                          isDisabled
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:border-primary/30 hover:bg-muted/10 cursor-pointer"
                        )}
                      >
                        <div
                          className={cn(
                            "shrink-0 p-1.5 rounded-lg border",
                            isChecked
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted/40 text-muted-foreground border-border/20"
                          )}
                        >
                          <ModuleIcon name={module.icon} className="h-4 w-4 stroke-[1.5]" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-foreground truncate">
                              {module.name}
                            </span>
                            {isChecked && <Check className="w-4 h-4 text-primary shrink-0" />}
                          </div>
                          {module.description && (
                            <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-2">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {isModulesStep && (
          <footer className="shrink-0 relative z-10 border-t border-border/40 bg-background/80 backdrop-blur-md px-6 sm:px-10 lg:px-14 py-4">
            <div className="max-w-[1800px] mx-auto flex justify-end">
              <Button
                type="button"
                disabled={!isSelectionComplete || createOrgMutation.isPending}
                onClick={handleCreateOrganization}
                className="w-full sm:w-auto sm:min-w-[240px] h-12 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-base font-semibold transition-transform active:scale-[0.98]"
              >
                {createOrgMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creando organización...
                  </>
                ) : (
                  "Crear organización"
                )}
              </Button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
