// ─────────────────────────────────────────────────────────────────────────────
// features/user-subscriptions/components/subscription-form-modal.tsx
//
// Create/edit form for a personal subscription. Hand-rolled rather than built
// on DynamicFormModal because the conditional behaviour — catalog vs custom,
// locked category, automatic vs uploaded logo, recurrence toggle — is past
// what a flat field schema can express.
//
// Sections follow the product spec: service → category → website → logo →
// billing cycle → dates → recurring switch.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { Loader2, Upload, X, Lock, Globe, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Switch } from "@/shared/components/ui/switch"
import { DatePicker } from "@/shared/components/ui/date-picker"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select"
import { CurrencyPicker } from "@/features/user-onboarding/components/currency-picker"
import { ProviderPicker, ProviderLogo } from "./provider-picker"
import {
  usePaymentCards,
  useCreateUserSubscription,
  useUpdateUserSubscription,
  useUploadSubscriptionLogo,
} from "../hooks/use-user-subscriptions"
// The user's own list, not the public catalog: it includes the categories they
// created themselves.
import { usePersonalCategories } from "../hooks/use-personal-catalog"
import { useCurrencyConversion } from "../hooks/use-currencies"
import { useUserPreferences } from "@/features/user-onboarding/hooks/use-user-onboarding"
import { formatApproximate } from "@/shared/utils/format-currency"
import { apiErrorMessage } from "@/shared/utils/api-message"
import {
  RECURRENCE_UNIT_LABELS,
  type RecurrenceUnit,
  type SubscriptionProvider,
  type UserSubscription,
  type CreateUserSubscriptionDTO,
} from "../types/user-subscriptions.types"

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ACCEPTED_LOGO_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml"

const RECURRENCE_UNITS: RecurrenceUnit[] = ["DAY", "WEEK", "MONTH", "QUARTER", "SEMESTER", "YEAR"]

interface SubscriptionFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Present when editing; absent when creating. */
  subscription?: UserSubscription | null
}

export function SubscriptionFormModal({ isOpen, onClose, subscription }: SubscriptionFormModalProps) {
  const isEditing = !!subscription

  const { data: categories } = usePersonalCategories()
  const { data: cards } = usePaymentCards()
  const { data: preferences } = useUserPreferences()

  const createMutation = useCreateUserSubscription()
  const updateMutation = useUpdateUserSubscription()
  const uploadLogoMutation = useUploadSubscriptionLogo()

  // ── Form state ────────────────────────────────────────────────────────────
  const [isCustom, setIsCustom] = React.useState(false)
  const [provider, setProvider] = React.useState<SubscriptionProvider | null>(null)
  const [customName, setCustomName] = React.useState("")
  const [customCategoryId, setCustomCategoryId] = React.useState("")
  const [customWebsiteUrl, setCustomWebsiteUrl] = React.useState("")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)

  const [planLabel, setPlanLabel] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [currency, setCurrency] = React.useState("COP")
  const [recurrenceUnit, setRecurrenceUnit] = React.useState<RecurrenceUnit>("MONTH")
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1)
  const [isRecurring, setIsRecurring] = React.useState(true)

  const [startedAt, setStartedAt] = React.useState<Date | null>(null)
  const [cardId, setCardId] = React.useState("")
  const [billingCutoffDay, setBillingCutoffDay] = React.useState<string>("")
  const [notes, setNotes] = React.useState("")

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const selectedCard = cards?.find((c) => c.id === cardId)
  // Blank means "inherit"; the placeholder shows what will actually apply.
  const inheritedCutoffDay = selectedCard?.statementDay ?? null
  const isCutoffOverridden = billingCutoffDay !== "" && Number(billingCutoffDay) !== inheritedCutoffDay

  // ── Select labels ─────────────────────────────────────────────────────────
  // Base UI resolves what the closed trigger shows from the Root's `items`, not
  // from the rendered SelectItems — those live in a portal that stays unmounted
  // until the dropdown is first opened. Without `items`, Select.Value falls back
  // to String(value), which is why the trigger read "MONTH" instead of "Mes"
  // (and would have shown a raw UUID for category and card).
  const recurrenceItems = React.useMemo(
    () =>
      Object.fromEntries(
        RECURRENCE_UNITS.map((unit) => [
          unit,
          `${RECURRENCE_UNIT_LABELS[unit]}${recurrenceInterval > 1 ? "s" : ""}`,
        ])
      ) as Record<RecurrenceUnit, string>,
    [recurrenceInterval]
  )

  const categoryItems = React.useMemo(
    () => (categories ?? []).map((category) => ({ value: category.id, label: category.name })),
    [categories]
  )

  const cardItems = React.useMemo(
    () =>
      (cards ?? []).map((card) => ({
        value: card.id,
        label: `${card.label}${card.lastFourDigits ? ` ••••${card.lastFourDigits}` : ""}`,
      })),
    [cards]
  )

  // ── Hydration ─────────────────────────────────────────────────────────────
  // Reset the form whenever the modal opens or switches records. Done during
  // render, not in an effect: an effect would paint one frame of stale values
  // and trips the repo's set-state-in-effect lint rule.
  const hydrationKey = isOpen ? (subscription?.id ?? "new") : null
  const [hydratedKey, setHydratedKey] = React.useState<string | null>(null)

  if (hydrationKey !== null && hydrationKey !== hydratedKey) {
    setHydratedKey(hydrationKey)

    if (subscription) {
      setIsCustom(!subscription.providerId)
      setProvider(subscription.provider ?? null)
      setCustomName(subscription.customName ?? "")
      setCustomCategoryId(subscription.customCategoryId ?? "")
      setCustomWebsiteUrl(subscription.customWebsiteUrl ?? "")
      setLogoPreview(subscription.customLogoUrl ?? null)
      setPlanLabel(subscription.planLabel ?? "")
      setAmount(subscription.amount)
      setCurrency(subscription.currency)
      setRecurrenceUnit(subscription.recurrenceUnit)
      setRecurrenceInterval(subscription.recurrenceInterval)
      setIsRecurring(subscription.isRecurring)
      setStartedAt(new Date(subscription.startedAt))
      setCardId(subscription.cardId ?? "")
      setBillingCutoffDay(subscription.billingCutoffDay?.toString() ?? "")
      setNotes(subscription.notes ?? "")
    } else {
      setIsCustom(false)
      setProvider(null)
      setCustomName("")
      setCustomCategoryId("")
      setCustomWebsiteUrl("")
      setLogoPreview(null)
      setPlanLabel("")
      setAmount("")
      setCurrency(preferences?.preferredCurrency ?? "COP")
      setRecurrenceUnit("MONTH")
      setRecurrenceInterval(1)
      setIsRecurring(true)
      setStartedAt(new Date())
      setCardId("")
      setBillingCutoffDay("")
      setNotes("")
    }

    setLogoFile(null)
  }

  // Closing clears the marker so the next open re-hydrates from scratch.
  if (hydrationKey === null && hydratedKey !== null) {
    setHydratedKey(null)
  }

  // ── Conversion preview ────────────────────────────────────────────────────
  const preferredCurrency = preferences?.preferredCurrency ?? "COP"
  const numericAmount = Number(amount)
  const { data: conversion, isFetching: isConverting } = useCurrencyConversion(
    numericAmount > 0 && currency !== preferredCurrency
      ? { from: currency, to: preferredCurrency, amount: numericAmount }
      : null
  )

  /** Monthly-equivalent preview, mirroring the API's toMonthlyAmount. */
  const monthlyEquivalent = React.useMemo(() => {
    if (!isRecurring || !(numericAmount > 0)) return null

    const monthsPerOccurrence: Record<RecurrenceUnit, number> = {
      DAY: recurrenceInterval / 30.4375,
      WEEK: recurrenceInterval / 4.348214,
      MONTH: recurrenceInterval,
      QUARTER: recurrenceInterval * 3,
      SEMESTER: recurrenceInterval * 6,
      YEAR: recurrenceInterval * 12,
    }

    const base = conversion ? Number(conversion.converted) : numericAmount
    return base / monthsPerOccurrence[recurrenceUnit]
  }, [isRecurring, numericAmount, recurrenceUnit, recurrenceInterval, conversion])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSelectProvider(next: SubscriptionProvider | null) {
    setProvider(next)
    // Category, website and logo all come from the catalog entry from here on.
    if (next) {
      setCustomCategoryId("")
      setCustomWebsiteUrl("")
      setLogoFile(null)
      setLogoPreview(null)
    }
  }

  function handleToggleCustom(custom: boolean) {
    setIsCustom(custom)
    if (custom) {
      setProvider(null)
    } else {
      setCustomName("")
      setCustomCategoryId("")
      setCustomWebsiteUrl("")
      setLogoFile(null)
      setLogoPreview(null)
    }
  }

  function handlePickLogo(file: File | undefined) {
    if (!file) return

    if (file.size > MAX_LOGO_BYTES) {
      toast.error("El logo no puede superar los 2 MB")
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function buildPayload(): CreateUserSubscriptionDTO | null {
    if (!startedAt) {
      toast.error("Indica la fecha de inicio")
      return null
    }
    if (!(numericAmount >= 0) || amount === "") {
      toast.error("Indica el monto que pagas")
      return null
    }
    if (isCustom && !customName.trim()) {
      toast.error("Ponle un nombre a tu suscripción")
      return null
    }
    if (isCustom && !customCategoryId) {
      toast.error("Elige una categoría")
      return null
    }
    if (!isCustom && !provider) {
      toast.error("Elige un servicio del catálogo")
      return null
    }

    const payload: CreateUserSubscriptionDTO = {
      amount: numericAmount,
      currency,
      recurrenceUnit,
      recurrenceInterval: isRecurring ? recurrenceInterval : 1,
      isRecurring,
      startedAt: startedAt.toISOString(),
    }

    if (isCustom) {
      payload.customName = customName.trim()
      payload.customCategoryId = customCategoryId
      if (customWebsiteUrl.trim()) payload.customWebsiteUrl = customWebsiteUrl.trim()
    } else {
      payload.providerId = provider!.id
    }

    if (planLabel.trim()) payload.planLabel = planLabel.trim()
    if (cardId) payload.cardId = cardId
    // Empty means "inherit from the card", which the API models as null.
    if (billingCutoffDay !== "") payload.billingCutoffDay = Number(billingCutoffDay)
    if (notes.trim()) payload.notes = notes.trim()

    return payload
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const payload = buildPayload()
    if (!payload) return

    try {
      const saved = isEditing
        ? await updateMutation.mutateAsync({ id: subscription!.id, payload })
        : await createMutation.mutateAsync(payload)

      // The logo needs the subscription to exist first, so it is a second call.
      if (logoFile && isCustom) {
        try {
          await uploadLogoMutation.mutateAsync({ id: saved.id, file: logoFile })
        } catch {
          toast.warning("Guardamos la suscripción, pero no pudimos subir el logo.")
        }
      }

      toast.success(isEditing ? "Suscripción actualizada" : "Suscripción creada")
      onClose()
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo guardar la suscripción."))
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || uploadLogoMutation.isPending
  const lockedCategory = !isCustom ? provider?.category : null
  const lockedWebsite = !isCustom ? provider?.websiteUrl : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl rounded-xl bg-card border border-border/40 shadow-xl overflow-hidden p-5 sm:p-7 gap-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {isEditing ? "Editar suscripción" : "Nueva suscripción"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Registra cuánto pagas, cada cuánto se renueva y con qué tarjeta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scrolls, but without painting a scrollbar over the form. */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar p-1 -m-1">
            {/* ── Servicio ─────────────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-foreground">Servicio</h3>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  Personalizada
                  <Switch checked={isCustom} onCheckedChange={handleToggleCustom} disabled={isEditing} />
                </label>
              </div>

              {isCustom ? (
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nombre del servicio (ej: Gimnasio del barrio)"
                  className="h-11 bg-background"
                />
              ) : (
                <ProviderPicker
                  value={provider?.id ?? null}
                  onChange={handleSelectProvider}
                  disabled={isEditing}
                />
              )}
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  El servicio no se puede cambiar. Elimina la suscripción y crea otra si necesitas
                  reemplazarlo.
                </p>
              )}
            </section>

            {/* ── Categoría ────────────────────────────────────────────── */}
            <section className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                Categoría
                {lockedCategory && <Lock className="w-3 h-3 text-muted-foreground" />}
              </label>

              {lockedCategory ? (
                <div className="flex items-center gap-2 h-11 px-3 rounded-md border border-border/50 bg-muted/40 text-sm text-muted-foreground">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lockedCategory.color ?? "#6B7280" }}
                  />
                  {lockedCategory.name}
                  <span className="ml-auto text-xs">Del catálogo</span>
                </div>
              ) : (
                <Select
                  items={categoryItems}
                  value={customCategoryId}
                  onValueChange={(value) => setCustomCategoryId(String(value ?? ""))}
                >
                  <SelectTrigger className="w-full h-11 bg-background">
                    <SelectValue placeholder="Elige una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </section>

            {/* ── Sitio web ────────────────────────────────────────────── */}
            <section className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Sitio web <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>

              {lockedWebsite ? (
                <div className="flex items-center h-11 px-3 rounded-md border border-border/50 bg-muted/40 text-sm text-muted-foreground truncate">
                  {lockedWebsite}
                </div>
              ) : (
                <Input
                  type="url"
                  value={customWebsiteUrl}
                  onChange={(e) => setCustomWebsiteUrl(e.target.value)}
                  placeholder="https://ejemplo.com"
                  disabled={!isCustom}
                  className="h-11 bg-background"
                />
              )}
            </section>

            {/* ── Logo ─────────────────────────────────────────────────── */}
            <section className="space-y-2">
              <label className="text-sm font-medium text-foreground">Logo</label>

              {!isCustom ? (
                <div className="flex items-center gap-3 h-14 px-3 rounded-md border border-border/50 bg-muted/40">
                  {provider ? (
                    <>
                      <ProviderLogo provider={provider} size={32} />
                      <span className="text-sm text-muted-foreground">
                        Se toma automáticamente del catálogo
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Elige un servicio para ver su logo
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-md border border-border/60 bg-background grid place-items-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element -- object URL / signed S3 URL
                      <img src={logoPreview} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_LOGO_TYPES}
                      className="hidden"
                      onChange={(e) => handlePickLogo(e.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoPreview ? "Cambiar" : "Subir logo"}
                    </Button>
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                        }}
                        className="h-10 px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG · máx. 2 MB</span>
                  </div>
                </div>
              )}
            </section>

            {/* ── Ciclo de facturación ─────────────────────────────────── */}
            <section className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-foreground">Ciclo de facturación</h3>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  {isRecurring ? "Se renueva" : "Pago único"}
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Monto</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-11 bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Moneda en la que pagas</label>
                  <CurrencyPicker value={currency} onChange={setCurrency} className="h-11 bg-background" />
                </div>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Se renueva cada</label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Math.max(1, Number(e.target.value)))}
                      className="h-11 bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Periodo</label>
                    <Select
                      items={recurrenceItems}
                      value={recurrenceUnit}
                      onValueChange={(value) => setRecurrenceUnit(String(value) as RecurrenceUnit)}
                    >
                      <SelectTrigger className="w-full h-11 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {recurrenceItems[unit]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Live cost preview, converted into the user's currency. */}
              {numericAmount > 0 && (
                <div className="rounded-md bg-muted/40 border border-border/40 px-3 py-2.5 text-sm">
                  {isConverting ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculando conversión...
                    </span>
                  ) : (
                    <div className="space-y-1">
                      {currency !== preferredCurrency && (
                        <p className="text-muted-foreground">
                          {conversion ? (
                            <>
                              Pagas{" "}
                              <span className="font-medium text-foreground">
                                {formatApproximate(conversion.converted, preferredCurrency)}
                              </span>{" "}
                              por cobro
                            </>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-500">
                              No pudimos obtener la tasa de cambio ahora mismo.
                            </span>
                          )}
                        </p>
                      )}
                      {monthlyEquivalent !== null && (
                        <p className="text-muted-foreground">
                          Equivale a{" "}
                          <span className="font-semibold text-foreground">
                            {formatApproximate(monthlyEquivalent, preferredCurrency)}
                          </span>{" "}
                          al mes
                        </p>
                      )}
                      {!isRecurring && (
                        <p className="text-muted-foreground">
                          Es un pago único: no suma al gasto mensual recurrente.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Fechas y tarjeta ─────────────────────────────────────── */}
            <section className="space-y-3 pt-2 border-t border-border/40">
              <h3 className="text-sm font-semibold text-foreground">Fechas y pago</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Fecha de inicio</label>
                  <DatePicker
                    value={startedAt}
                    onChange={setStartedAt}
                    placeholder="Selecciona la fecha"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Tarjeta</label>
                  <Select
                    items={cardItems}
                    value={cardId}
                    onValueChange={(value) => setCardId(String(value ?? ""))}
                  >
                    <SelectTrigger className="w-full h-11 bg-background">
                      <SelectValue placeholder="Sin tarjeta asignada" />
                    </SelectTrigger>
                    <SelectContent>
                      {cardItems.map((card) => (
                        <SelectItem key={card.value} value={card.value}>
                          {card.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-2">
                  Día de corte de la tarjeta
                  {isCutoffOverridden && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Personalizado
                    </span>
                  )}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={billingCutoffDay}
                  onChange={(e) => setBillingCutoffDay(e.target.value)}
                  placeholder={
                    inheritedCutoffDay
                      ? `Día ${inheritedCutoffDay} (heredado de la tarjeta)`
                      : "Sin día de corte configurado"
                  }
                  className={cn("h-11 bg-background", isCutoffOverridden && "border-primary/50")}
                />
                <p className="text-xs text-muted-foreground">
                  {inheritedCutoffDay
                    ? "Déjalo vacío para seguir el día de corte de la tarjeta. Si lo cambias ahí, esta suscripción se actualiza sola."
                    : "Configura el día de corte en la tarjeta para que se herede automáticamente."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Plan <span className="font-normal">(opcional)</span>
                  </label>
                  <Input
                    value={planLabel}
                    onChange={(e) => setPlanLabel(e.target.value)}
                    placeholder="Premium, Familiar..."
                    className="h-11 bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Notas <span className="font-normal">(opcional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cualquier detalle que quieras recordar"
                  rows={2}
                  className="bg-background resize-none"
                />
              </div>
            </section>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} className="sm:ml-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
                </>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Crear suscripción"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
