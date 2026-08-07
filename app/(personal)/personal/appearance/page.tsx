// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/personal/appearance/page.tsx
//
// The personal-space counterpart of the organization's visual identity page.
// Same live-preview behaviour: the colour is applied to the DOM as you pick it,
// and reverted from a snapshot if you cancel — so "cancel" really undoes what
// you were looking at.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { Loader2, Monitor, Moon, Sun } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { PageLoader } from "@/shared/components/ui/spinner"
import { useUiStore } from "@/shared/store/use-ui-store"
import { applyBrandingToDOM } from "@/shared/utils/apply-branding"
import { apiErrorMessage } from "@/shared/utils/api-message"
import {
  useUserPreferences,
  useUpdateUserPreferences,
} from "@/features/user-onboarding/hooks/use-user-onboarding"
import type { ThemeMode } from "@/features/user-onboarding/types/user-onboarding.types"

const DEFAULT_COLOR = "#8b1fc1"

const COLOR_PRESETS = [
  "#8b1fc1", "#571777", "#0052CC", "#059669",
  "#E50914", "#F97316", "#0EA5E9", "#EC4899",
]

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "LIGHT", label: "Claro", icon: Sun },
  { value: "DARK", label: "Oscuro", icon: Moon },
  { value: "SYSTEM", label: "Según el sistema", icon: Monitor },
]

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/

export default function PersonalAppearancePage() {
  const { data: preferences, isLoading } = useUserPreferences()
  const updateMutation = useUpdateUserPreferences()
  const setTheme = useUiStore((s) => s.setTheme)

  const [color, setColor] = React.useState(DEFAULT_COLOR)
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("SYSTEM")

  /**
   * What "Descartar" restores, captured the first time we hydrate. Held in
   * state rather than a ref because it is read during render (for isDirty) —
   * reading a ref there is exactly what the lint rule forbids.
   */
  const [saved, setSaved] = React.useState<{
    primaryColor: string | null
    defaultTheme: ThemeMode
  } | null>(null)

  // Seeded during render rather than in an effect: the repo lints against
  // setState-in-effect, and an effect would flash the default colour first.
  if (preferences && !saved) {
    setColor(preferences.primaryColor ?? DEFAULT_COLOR)
    setThemeMode(preferences.defaultTheme ?? "SYSTEM")
    setSaved({
      primaryColor: preferences.primaryColor,
      defaultTheme: preferences.defaultTheme ?? "SYSTEM",
    })
  }

  /** Live preview — only for a complete, valid hex. */
  function previewColor(next: string) {
    setColor(next)
    if (HEX_PATTERN.test(next)) {
      applyBrandingToDOM({ primaryColor: next, defaultTheme: themeMode }, setTheme, false)
    }
  }

  function previewTheme(next: ThemeMode) {
    setThemeMode(next)
    applyBrandingToDOM({ primaryColor: color, defaultTheme: next }, setTheme)
  }

  function handleCancel() {
    if (!saved) return

    setColor(saved.primaryColor ?? DEFAULT_COLOR)
    setThemeMode(saved.defaultTheme)
    applyBrandingToDOM(saved, setTheme)
  }

  async function handleSave() {
    if (!HEX_PATTERN.test(color)) {
      toast.error("El color debe ser un hexadecimal de 6 dígitos, por ejemplo #8b1fc1")
      return
    }

    try {
      await updateMutation.mutateAsync({ primaryColor: color, defaultTheme: themeMode })
      setSaved({ primaryColor: color, defaultTheme: themeMode })
      toast.success("Apariencia guardada")
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo guardar la apariencia."))
    }
  }

  if (isLoading || !saved) {
    return <PageLoader label="Cargando tu apariencia..." />
  }

  const isDirty =
    color !== (saved.primaryColor ?? DEFAULT_COLOR) || themeMode !== saved.defaultTheme

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Personalización</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige el color y el tema de tu espacio. Los cambios se ven al instante.
        </p>
      </div>

      <section className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Color principal</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Se usa en botones, enlaces y en el menú lateral.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => previewColor(preset)}
              style={{ backgroundColor: preset }}
              className={cn(
                "w-9 h-9 rounded-md border-2 transition-transform active:scale-95",
                color.toLowerCase() === preset.toLowerCase()
                  ? "border-foreground scale-110"
                  : "border-transparent"
              )}
              aria-label={`Color ${preset}`}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <HexColorPicker color={color} onChange={previewColor} style={{ width: 180, height: 130 }} />
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Código hexadecimal</label>
            <Input
              value={color}
              onChange={(e) => previewColor(e.target.value)}
              className="h-10 w-32 font-mono text-sm bg-background"
              maxLength={7}
            />
            <div
              className="w-32 h-10 rounded-md border border-border/50"
              style={{ backgroundColor: HEX_PATTERN.test(color) ? color : "transparent" }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tema</h2>
          <p className="text-xs text-muted-foreground mt-1">
            El que se aplica cuando abres tu espacio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => previewTheme(option.value)}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-md border text-sm font-medium transition-colors",
                themeMode === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <option.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={updateMutation.isPending || !isDirty} className="h-11">
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
        {isDirty && (
          <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending} className="h-11">
            Descartar
          </Button>
        )}
      </div>
    </div>
  )
}
