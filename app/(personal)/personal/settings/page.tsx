// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/personal-settings/page.tsx
//
// Edit the choices made during onboarding. Same fields, no wizard.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Loader2, BellRing } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Switch } from "@/shared/components/ui/switch"
import { PageLoader } from "@/shared/components/ui/spinner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/shared/components/ui/select"
import { CurrencyPicker } from "@/features/user-onboarding/components/currency-picker"
import { apiErrorMessage } from "@/shared/utils/api-message"
import {
  useUserPreferences,
  useUpdateUserPreferences,
} from "@/features/user-onboarding/hooks/use-user-onboarding"
import { TIMEZONE_OPTIONS, TIMEZONE_ITEMS } from "@/features/user-onboarding/types/user-onboarding.types"

export default function PersonalSettingsPage() {
  const { data: preferences, isLoading } = useUserPreferences()
  const updateMutation = useUpdateUserPreferences()

  const [timezone, setTimezone] = React.useState("")
  const [currency, setCurrency] = React.useState("")
  const [remindersEnabled, setRemindersEnabled] = React.useState(true)
  const [daysBefore, setDaysBefore] = React.useState(3)
  const [hydrated, setHydrated] = React.useState(false)

  // Seed from the server during render rather than in an effect — React's
  // sanctioned pattern for deriving state from freshly loaded data.
  if (preferences && !hydrated) {
    setTimezone(preferences.timezone)
    setCurrency(preferences.preferredCurrency)
    setRemindersEnabled(preferences.remindersEnabled)
    setDaysBefore(preferences.renewalReminderDaysBefore)
    setHydrated(true)
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({
        timezone,
        preferredCurrency: currency,
        remindersEnabled,
        renewalReminderDaysBefore: daysBefore,
      })
      toast.success("Preferencias guardadas")
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudieron guardar tus preferencias."))
    }
  }

  if (isLoading || !hydrated) {
    return <PageLoader label="Cargando tus preferencias..." />
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tu zona horaria, tu moneda y cómo quieres que te avisemos.
        </p>
      </div>

      <section className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Región</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Zona horaria</label>
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
            Convertimos a esta moneda todo lo que pagues en otra.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Recordatorios</h2>

        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 h-fit">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Avisarme de renovaciones</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Guardamos tu preferencia; el envío de notificaciones llega en una próxima versión.
              </p>
            </div>
          </div>
          <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
        </div>

        {remindersEnabled && (
          <div className="flex items-center gap-3 pt-2 border-t border-border/40">
            <Input
              type="number"
              min={0}
              max={90}
              value={daysBefore}
              onChange={(e) => setDaysBefore(Number(e.target.value))}
              className="h-11 w-24 bg-background"
            />
            <span className="text-sm text-muted-foreground">días antes de cada renovación</span>
          </div>
        )}
      </section>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="h-11">
        {updateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
          </>
        ) : (
          "Guardar cambios"
        )}
      </Button>
    </div>
  )
}
