// ─────────────────────────────────────────────────────────────────────────────
// app/(personal)/personal/dashboard/page.tsx
//
// Personal Space home. Deliberately a first cut: headline figures, the
// per-currency breakdown and what is about to be charged. Charts and the usage
// / zombie-subscription views come later — the endpoints for them already
// exist (/me/subscriptions/zombies, /cash-flow-calendar).
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, CalendarClock, TrendingUp, Wallet } from "lucide-react"
import { StatCard } from "@/features/user-subscriptions/components/stat-card"
import { useSubscriptionsSummary } from "@/features/user-subscriptions/hooks/use-user-subscriptions"
import { useUserPreferences } from "@/features/user-onboarding/hooks/use-user-onboarding"
import { formatCurrency, formatApproximate } from "@/shared/utils/format-currency"
import { useAuthStore } from "@/shared/store/use-auth-store"

export default function PersonalDashboardPage() {
  const { data: summary, isLoading } = useSubscriptionsSummary()
  const { data: preferences } = useUserPreferences()
  const user = useAuthStore((s) => s.user)

  const preferredCurrency = summary?.preferredCurrency ?? preferences?.preferredCurrency ?? "COP"
  // Without rates the converted totals are null; fall back to the raw sum and
  // let the banner explain why it may be mixing currencies.
  const ratesUnavailable = summary?.rates.unavailable ?? false
  const monthlyDisplay = summary?.monthlyTotalConverted ?? summary?.monthlyTotal ?? "0"
  const yearlyDisplay = summary?.yearlyTotalConverted ?? summary?.yearlyTotal ?? "0"

  const greeting = user?.firstName ? `Hola, ${user.firstName}` : "Tu espacio personal"
  const hasSubscriptions = (summary?.activeCount ?? 0) > 0 || (summary?.pausedCount ?? 0) > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Un resumen de lo que pagas y de lo que viene.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Wallet}
          label="Gasto mensual"
          value={isLoading ? "—" : formatCurrency(monthlyDisplay, preferredCurrency)}
          hint={ratesUnavailable ? "Sin conversión disponible" : undefined}
        />
        <StatCard
          icon={TrendingUp}
          label="Proyección anual"
          value={isLoading ? "—" : formatCurrency(yearlyDisplay, preferredCurrency)}
        />
        <StatCard
          icon={CalendarClock}
          label="Suscripciones activas"
          value={isLoading ? "—" : String(summary?.activeCount ?? 0)}
          hint={summary?.pausedCount ? `${summary.pausedCount} pausadas` : undefined}
        />
        <StatCard
          icon={Wallet}
          label="Pagos únicos del mes"
          value={
            summary?.oneTimeTotalThisMonth
              ? formatCurrency(summary.oneTimeTotalThisMonth, preferredCurrency)
              : "—"
          }
        />
      </div>

      {ratesUnavailable && (summary?.byCurrency.length ?? 0) > 1 && (
        <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            No pudimos obtener las tasas de cambio, así que los totales suman monedas distintas sin
            convertir. El desglose por moneda sigue siendo exacto.
          </p>
        </div>
      )}

      {!isLoading && !hasSubscriptions && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 px-6 py-10 text-center">
          <h2 className="text-base font-semibold text-foreground mb-1">
            Aún no registras suscripciones
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Agrega la primera y empieza a ver cuánto se te va cada mes.
          </p>
          <Link
            href="/personal/subscriptions"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98]"
          >
            Agregar suscripción <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {hasSubscriptions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming charges */}
          <section className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Próximos cobros</h2>
              <Link
                href="/personal/subscriptions"
                className="text-xs font-medium text-primary hover:underline"
              >
                Ver todas
              </Link>
            </div>

            {(summary?.upcoming.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nada por cobrar en los próximos 30 días.
              </p>
            ) : (
              <ul className="space-y-3">
                {summary!.upcoming.slice(0, 6).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.nextBillingDate
                          ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
                              new Date(item.nextBillingDate)
                            )
                          : "Sin fecha"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                      {item.convertedAmount && item.currency !== preferredCurrency && (
                        <p className="text-xs text-muted-foreground">
                          {formatApproximate(item.convertedAmount, preferredCurrency)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Spend by category */}
          <section className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Gasto por categoría</h2>
              <Link
                href="/personal/categories"
                className="text-xs font-medium text-primary hover:underline"
              >
                Gestionar
              </Link>
            </div>

            {(summary?.byCategory.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Sin datos todavía.</p>
            ) : (
              <ul className="space-y-3">
                {[...summary!.byCategory]
                  .sort((a, b) => Number(b.total) - Number(a.total))
                  .slice(0, 6)
                  .map((entry) => (
                    <li
                      key={entry.categoryId ?? "none"}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-foreground truncate">{entry.categoryName}</span>
                      <span className="text-sm font-semibold text-foreground shrink-0">
                        {formatCurrency(entry.total, entry.currency)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {summary?.rates && !summary.rates.unavailable && (
        <p className="text-[11px] text-muted-foreground/60 text-right">
          {summary.rates.attribution}
          {summary.rates.stale && " · tasas no actualizadas hoy"}
        </p>
      )}
    </div>
  )
}
