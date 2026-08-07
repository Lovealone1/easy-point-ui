// ─────────────────────────────────────────────────────────────────────────────
// features/user-onboarding/components/personal-onboarding-wizard.tsx
//
// Personal Space onboarding: goal → region (timezone + currency) → reminders.
// The server owns the step, so a reload mid-wizard resumes where the user left
// off rather than restarting.
//
// The reminders step is deliberately partial: the preferences are persisted,
// but nothing sends a notification yet.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Check,
  Globe2,
  Loader2,
  PiggyBank,
  LineChart,
  Users,
  CalendarClock,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Switch } from "@/shared/components/ui/switch"
import { Input } from "@/shared/components/ui/input"
import { PageLoader } from "@/shared/components/ui/spinner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/shared/components/ui/select"
import { apiErrorMessage } from "@/shared/utils/api-message"
import { CurrencyPicker } from "./currency-picker"
import {
  useOnboardingState,
  useOnboardingGoals,
  useSetOnboardingGoal,
  useSetOnboardingRegion,
  useSetOnboardingReminders,
  useCompleteOnboarding,
} from "../hooks/use-user-onboarding"
import {
  TIMEZONE_OPTIONS,
  TIMEZONE_ITEMS,
  detectTimezone,
  type OnboardingGoal,
  type OnboardingStep,
} from "../types/user-onboarding.types"

/** Icons live here rather than in the API payload, which ships only a name. */
const GOAL_ICONS: Record<OnboardingGoal, React.ComponentType<{ className?: string }>> = {
  SAVE_MONEY: PiggyBank,
  TRACK_SPENDING: LineChart,
  MANAGE_FAMILY: Users,
  NEVER_MISS_RENEWAL: CalendarClock,
}

const WIZARD_STEPS: Array<{ key: OnboardingStep; label: string }> = [
  { key: "GOAL", label: "Objetivo" },
  { key: "REGION", label: "Región" },
  { key: "REMINDERS", label: "Recordatorios" },
]

function StepIndicator({ current }: { current: OnboardingStep }) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === current)
  // The DONE step has no tile of its own; treat it as "past the last one".
  const effectiveIndex = currentIndex === -1 ? WIZARD_STEPS.length : currentIndex

  return (
    <div className="flex items-center gap-2 mb-8">
      {WIZARD_STEPS.map((step, index) => {
        const isDone = index < effectiveIndex
        const isCurrent = index === effectiveIndex

        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold transition-colors",
                  isDone && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/15 text-primary border border-primary/40",
                  !isDone && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <span className={cn("flex-1 h-px", isDone ? "bg-primary/40" : "bg-border/60")} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

interface PersonalOnboardingWizardProps {
  /** Returns to the "create org vs personal" choice. */
  onBack: () => void
}

export function PersonalOnboardingWizard({ onBack }: PersonalOnboardingWizardProps) {
  const router = useRouter()

  const { data: state, isLoading } = useOnboardingState()
  const { data: goals } = useOnboardingGoals()

  const setGoal = useSetOnboardingGoal()
  const setRegion = useSetOnboardingRegion()
  const setReminders = useSetOnboardingReminders()
  const complete = useCompleteOnboarding()

  // Local step lets the user walk back through answered steps without the
  // server's monotonic progress dragging them forward again.
  const [step, setStep] = React.useState<OnboardingStep | null>(null)
  const [timezone, setTimezone] = React.useState("")
  const [currency, setCurrency] = React.useState("")
  const [remindersEnabled, setRemindersEnabled] = React.useState(true)
  const [daysBefore, setDaysBefore] = React.useState(3)

  // Hydrate once from the server so a reload resumes mid-wizard. Adjusting
  // state during render (rather than in an effect) is React's sanctioned way to
  // seed from props/query data without a second render pass.
  if (state && step === null) {
    setStep(state.step === "DONE" ? "REMINDERS" : state.step)
    setTimezone(state.timezone || detectTimezone())
    setCurrency(state.preferredCurrency || "COP")
    setRemindersEnabled(state.reminders.enabled)
    setDaysBefore(state.reminders.renewalReminderDaysBefore)
  }

  function handleError(error: unknown, fallback: string) {
    toast.error(apiErrorMessage(error, fallback))
  }

  function handleSelectGoal(goal: OnboardingGoal) {
    setGoal.mutate(goal, {
      onSuccess: () => setStep("REGION"),
      onError: (error) => handleError(error, "No se pudo guardar tu objetivo."),
    })
  }

  function handleSaveRegion() {
    if (!timezone || !currency) return

    setRegion.mutate(
      { timezone, preferredCurrency: currency },
      {
        onSuccess: () => setStep("REMINDERS"),
        onError: (error) => handleError(error, "No se pudo guardar tu configuración regional."),
      }
    )
  }

  function handleFinish() {
    setReminders.mutate(
      { remindersEnabled, renewalReminderDaysBefore: daysBefore },
      {
        onSuccess: () => {
          complete.mutate(undefined, {
            onSuccess: () => {
              toast.success("¡Todo listo! Empecemos con tus suscripciones.")
              router.replace("/personal/dashboard")
            },
            onError: (error) => handleError(error, "No se pudo finalizar la configuración."),
          })
        },
        onError: (error) => handleError(error, "No se pudieron guardar tus recordatorios."),
      }
    )
  }

  if (isLoading || step === null) {
    return <PageLoader label="Preparando tu espacio personal..." />
  }

  const isFinishing = setReminders.isPending || complete.isPending

  return (
    <div className="w-full max-w-2xl glassy-card rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md animate-in fade-in duration-300">
      <button
        type="button"
        onClick={() => (step === "GOAL" ? onBack() : setStep(step === "REMINDERS" ? "REGION" : "GOAL"))}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group mb-6"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Volver
      </button>

      <StepIndicator current={step} />

      {step === "GOAL" && (
        <div className="animate-in fade-in duration-300">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
              ¿Qué quieres lograr?
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Elige tu objetivo principal. Adaptaremos lo que ves primero a lo que te importa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(goals ?? []).map((goal) => {
              const Icon = GOAL_ICONS[goal.key] ?? PiggyBank
              const isSelected = state?.goal === goal.key

              return (
                <button
                  key={goal.key}
                  type="button"
                  disabled={setGoal.isPending}
                  onClick={() => handleSelectGoal(goal.key)}
                  className={cn(
                    "group flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait",
                    isSelected
                      ? "border-primary/60 bg-primary/5"
                      : "border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 mb-3 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-bold text-foreground mb-1">{goal.label}</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">{goal.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === "REGION" && (
        <div className="animate-in fade-in duration-300">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
              Tu zona y tu moneda
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Usamos la zona horaria para calcular las fechas de cobro, y la moneda para mostrarte
              todos los totales en una sola unidad, aunque pagues en varias.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-muted-foreground" />
                Zona horaria
              </label>
              <Select items={TIMEZONE_ITEMS} value={timezone} onValueChange={(value) => setTimezone(String(value ?? ""))}>
                <SelectTrigger className="w-full h-11 bg-background">
                  <SelectValue placeholder="Selecciona tu zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((group) => (
                    <SelectGroup key={group.group}>
                      <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.group}
                      </div>
                      {group.zones.map((zone) => (
                        <SelectItem key={zone.value} value={zone.value}>
                          {zone.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Moneda principal</label>
              <CurrencyPicker value={currency} onChange={setCurrency} />
              <p className="text-xs text-muted-foreground">
                Si pagas una suscripción en otra moneda, la convertimos a esta para los totales.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleSaveRegion}
              disabled={!timezone || !currency || setRegion.isPending}
              className="w-full h-12 rounded-md text-base font-semibold transition-transform active:scale-[0.98]"
            >
              {setRegion.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
                </>
              ) : (
                <>
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "REMINDERS" && (
        <div className="animate-in fade-in duration-300">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
              Recordatorios
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Te avisamos antes de cada renovación para que ninguna te tome por sorpresa.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-border/60 bg-background">
              <div className="flex gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 h-fit">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground mb-1">Avisarme de renovaciones</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Un aviso antes de cada cobro y cuando termine un período de prueba.
                  </p>
                </div>
              </div>
              <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
            </div>

            {remindersEnabled && (
              <div className="space-y-2 p-5 rounded-2xl border border-border/60 bg-background animate-in fade-in duration-200">
                <label className="text-sm font-medium text-foreground">
                  ¿Con cuánta antelación?
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={90}
                    value={daysBefore}
                    onChange={(e) => setDaysBefore(Number(e.target.value))}
                    className="h-11 w-24 bg-background"
                  />
                  <span className="text-sm text-muted-foreground">
                    días antes de cada renovación
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground/80 leading-relaxed px-1">
              Guardamos tu preferencia desde ya. El envío de notificaciones llega en una próxima
              versión.
            </p>

            <Button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="w-full h-12 rounded-md text-base font-semibold transition-transform active:scale-[0.98]"
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Finalizando...
                </>
              ) : (
                <>
                  Empezar a usar EasyPoint <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
