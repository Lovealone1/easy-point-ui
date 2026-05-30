"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { DynamicFormModal } from "@/shared/components/ui/dynamic-form-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { Button } from "@/shared/components/ui/button"
import {
  useDiscountRules,
  useCreateDiscountRule,
  useUpdateDiscountRule,
  useDeleteDiscountRule,
  useToggleDiscountRuleActive,
} from "@/features/discount-rules/hooks/use-discount-rules"
import { useClients } from "@/features/clients/hooks/use-clients"
import type {
  DiscountRule,
  DiscountScope,
  DiscountCategory,
} from "@/features/discount-rules/types/discount-rules.types"
import {
  Percent,
  DollarSign,
  Tag,
  Users,
  Globe,
  Calendar,
  Zap,
  Power,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Hash,
  BarChart2,
} from "lucide-react"
import type { FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatValue(rule: DiscountRule): string {
  if (rule.type === "PERCENTAGE") return `${rule.value}%`
  return `$${Number(rule.value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ─── Scope Toggle (pill-style) ───────────────────────────────────────────────

const SCOPE_OPTIONS: { label: string; value: DiscountScope | "ALL"; icon: React.ElementType }[] =
  [
    { label: "Todos", value: "ALL", icon: BarChart2 },
    { label: "Globales", value: "GLOBAL", icon: Globe },
    { label: "Por cliente", value: "CLIENT", icon: Users },
  ]

// ─── Category Filter chips ───────────────────────────────────────────────────

const CATEGORY_OPTIONS: { label: string; value: DiscountCategory | "ALL"; icon: React.ElementType }[] =
  [
    { label: "Todos", value: "ALL", icon: Tag },
    { label: "Puntuales", value: "ONE_TIME", icon: Zap },
    { label: "Periódicos", value: "PERIODIC", icon: Calendar },
  ]

// ─── Card component ──────────────────────────────────────────────────────────

interface DiscountRuleCardProps {
  rule: DiscountRule
  onEdit: (rule: DiscountRule) => void
  onDelete: (rule: DiscountRule) => void
  onToggle: (rule: DiscountRule) => void
  isToggling: boolean
  isDeleting: boolean
}

function DiscountRuleCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
  isToggling,
  isDeleting,
}: DiscountRuleCardProps) {
  const isPercentage = rule.type === "PERCENTAGE"
  const isGlobal = rule.scope === "GLOBAL"
  const isPeriodic = rule.category === "PERIODIC"

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-border/35 bg-card/50 shadow-2xs hover:shadow-md transition-all duration-300 group/card overflow-hidden",
        !rule.isActive && "opacity-60 grayscale-[0.3]"
      )}
    >
      {/* Top accent bar — brand palette only */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl",
          isPercentage
            ? "bg-gradient-to-r from-brand-300 to-brand-500"
            : "bg-gradient-to-r from-brand-500 to-brand-700"
        )}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 p-3.5 pt-4.5 gap-2.5">

        {/* Header row: icon + name + value badge */}
        <div className="flex items-start gap-2.5">
          {/* Type icon */}
          <div
            className="flex items-center justify-center h-8.5 w-8.5 rounded-lg border shrink-0 transition-all duration-300 bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400 group-hover/card:bg-brand-500/20"
          >
            {isPercentage ? (
              <Percent className="h-4 w-4 stroke-[1.75]" />
            ) : (
              <DollarSign className="h-4 w-4 stroke-[1.75]" />
            )}
          </div>

          {/* Name + description */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-1">
              {rule.name}
            </h3>
            {rule.description && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-1">
                {rule.description}
              </p>
            )}
          </div>

          {/* Discount value */}
          <div className="shrink-0 px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums bg-brand-500/10 text-brand-700 dark:text-brand-300">
            {formatValue(rule)}
          </div>
        </div>

        {/* Code + Status badges */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Code chip */}
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted/60 border border-border/50 text-muted-foreground uppercase tracking-wider">
            <Hash className="h-2 w-2" />
            {rule.code}
          </span>

          {/* Scope badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
              isGlobal
                ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
            )}
          >
            {isGlobal ? <Globe className="h-2 w-2" /> : <Users className="h-2 w-2" />}
            {isGlobal ? "Global" : "Cliente"}
          </span>

          {/* Category badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
              isPeriodic
                ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20"
                : "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
            )}
          >
            {isPeriodic ? <Calendar className="h-2 w-2" /> : <Zap className="h-2 w-2" />}
            {isPeriodic ? "Periódico" : "Puntual"}
          </span>

          {/* Active status */}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border ml-auto",
              rule.isActive
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
            )}
          >
            <span
              className={cn(
                "h-1 w-1 rounded-full",
                rule.isActive ? "bg-emerald-500" : "bg-zinc-400"
              )}
            />
            {rule.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/15" />

        {/* Metadata row */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
          {/* Usage */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <BarChart2 className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">
              Usos:{" "}
              <span className="font-semibold text-foreground">
                {rule.usageCount}
                {rule.maxUsages ? `/${rule.maxUsages}` : "/∞"}
              </span>
            </span>
          </div>

          {/* Min sale */}
          {rule.minSaleAmount != null && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">
                Mín:{" "}
                <span className="font-semibold text-foreground">
                  ${Number(rule.minSaleAmount).toLocaleString("es-MX")}
                </span>
              </span>
            </div>
          )}

          {/* Starts */}
          {rule.startsAt && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">
                Inicio:{" "}
                <span className="font-semibold text-foreground">
                  {formatDate(rule.startsAt)}
                </span>
              </span>
            </div>
          )}

          {/* Expires */}
          {rule.expiresAt && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">
                Vence:{" "}
                <span className="font-semibold text-foreground">
                  {formatDate(rule.expiresAt)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action footer */}
      <div
        className="flex items-center justify-end gap-1 px-3 py-1.5 border-t border-border/15 bg-muted/10"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {/* Toggle */}
        <button
          onClick={() => onToggle(rule)}
          disabled={isToggling}
          title={rule.isActive ? "Desactivar" : "Activar"}
          className={cn(
            "p-1 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50",
            rule.isActive
              ? "text-emerald-500 hover:bg-emerald-500/10"
              : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/70"
          )}
        >
          {isToggling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Power className="h-3 w-3" />
          )}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(rule)}
          title="Editar"
          className="p-1 rounded-lg text-muted-foreground hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
        >
          <Pencil className="h-3 w-3" />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(rule)}
          disabled={isDeleting}
          title="Eliminar"
          className="p-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12

export default function DiscountRulesPage() {
  // Mutations
  const createMutation = useCreateDiscountRule()
  const updateMutation = useUpdateDiscountRule()
  const deleteMutation = useDeleteDiscountRule()
  const toggleMutation = useToggleDiscountRuleActive()

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedRule, setSelectedRule] = React.useState<DiscountRule | null>(null)

  // Fetch clients for dropdown selection
  const { data: clientsResponse } = useClients({ limit: 100, isActive: true })

  // Format clients for dropdown options
  const clientOptions = React.useMemo(() => {
    if (!clientsResponse?.data) return []
    return clientsResponse.data.map((c) => ({
      label: c.name,
      value: c.id,
    }))
  }, [clientsResponse])

  // Filter state
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [scopeFilter, setScopeFilter] = React.useState<DiscountScope | "ALL">("ALL")
  const [categoryFilter, setCategoryFilter] = React.useState<DiscountCategory | "ALL">("ALL")

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  // Reset page on filter changes
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, scopeFilter, categoryFilter])

  // Query
  const { data: response, isLoading, error } = useDiscountRules({
    page,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
    scope: scopeFilter !== "ALL" ? scopeFilter : undefined,
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
  })

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar las reglas de descuento", {
        description: error instanceof Error ? error.message : "Intente nuevamente.",
      })
    }
  }, [error])

  // Field schema (create / edit)
  const formFields = React.useMemo<FormFieldSchema[]>(
    () => [
      { name: "name", label: "Nombre", type: "text", required: true, gridCols: 2, placeholder: "Ej: Promoción Verano 25%" },
      { name: "description", label: "Descripción", type: "textarea", gridCols: 2, placeholder: "Descripción interna del descuento..." },
      { name: "code", label: "Código corto", type: "text", gridCols: 1, placeholder: "Ej: PROM25 (opcional)" },
      {
        name: "type",
        label: "Tipo",
        type: "select",
        required: true,
        gridCols: 1,
        options: [
          { label: "Porcentaje (%)", value: "PERCENTAGE" },
          { label: "Monto fijo ($)", value: "FIXED_AMOUNT" },
        ],
      },
      { name: "value", label: "Valor del descuento", type: "number", required: true, gridCols: 1, placeholder: "Ej: 15 (para 15%)" },
      { name: "minSaleAmount", label: "Venta mínima ($)", type: "number", gridCols: 1, placeholder: "Monto mínimo de venta" },
      {
        name: "scope",
        label: "Alcance",
        type: "select",
        required: true,
        gridCols: 1,
        options: [
          { label: "Global", value: "GLOBAL" },
          { label: "Cliente específico", value: "CLIENT" },
        ],
      },
      {
        name: "clientId",
        label: "Cliente",
        type: "select",
        required: true,
        gridCols: 1,
        options: clientOptions,
        placeholder: "Selecciona un cliente",
        showIf: (values) => values.scope === "CLIENT",
      },
      {
        name: "category",
        label: "Categoría",
        type: "select",
        required: true,
        gridCols: 1,
        options: [
          { label: "Puntual", value: "ONE_TIME" },
          { label: "Periódico", value: "PERIODIC" },
        ],
      },
      { name: "maxDiscountAmount", label: "Techo de descuento ($)", type: "number", gridCols: 1, placeholder: "Límite máximo en $" },
      { name: "maxUsages", label: "Usos máximos", type: "number", gridCols: 1, placeholder: "Vacío = ilimitado" },
      { name: "startsAt", label: "Inicio de vigencia", type: "text", gridCols: 1, placeholder: "YYYY-MM-DD" },
      { name: "expiresAt", label: "Fecha de expiración", type: "text", gridCols: 1, placeholder: "YYYY-MM-DD" },
      { name: "notes", label: "Notas internas", type: "textarea", gridCols: 2, placeholder: "Observaciones..." },
      { name: "isActive", label: "Activo", type: "boolean", gridCols: 2, placeholder: "El descuento estará disponible para usarse" },
    ],
    [clientOptions]
  )

  // Edit fields — exclude immutable type & scope
  const editFields = React.useMemo<FormFieldSchema[]>(
    () => formFields.filter((f) => f.name !== "type" && f.name !== "scope"),
    [formFields]
  )

  // Handlers
  function handleCreate(values: Record<string, any>) {
    const payload = {
      ...values,
      value: Number(values.value),
      minSaleAmount: values.minSaleAmount ? Number(values.minSaleAmount) : undefined,
      maxDiscountAmount: values.maxDiscountAmount ? Number(values.maxDiscountAmount) : undefined,
      maxUsages: values.maxUsages ? Number(values.maxUsages) : undefined,
      startsAt: values.startsAt || undefined,
      expiresAt: values.expiresAt || undefined,
      code: values.code || undefined,
      notes: values.notes || undefined,
    }
    createMutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success("Regla de descuento creada correctamente")
        setIsCreateOpen(false)
      },
      onError: () => toast.error("Error al crear la regla de descuento"),
    })
  }

  function handleEdit(values: Record<string, any>) {
    if (!selectedRule) return
    const patchPayload: Record<string, any> = {}
    Object.keys(values).forEach((key) => {
      const newVal = values[key]
      const oldVal = (selectedRule as any)[key]
      const isOldFalsy = oldVal === null || oldVal === undefined || oldVal === ""
      const isNewFalsy = newVal === null || newVal === undefined || newVal === ""
      if (isOldFalsy && isNewFalsy) return
      if (newVal !== oldVal) patchPayload[key] = newVal
    })
    if (Object.keys(patchPayload).length === 0) {
      toast.info("No se realizaron cambios")
      setIsEditOpen(false)
      return
    }
    updateMutation.mutate(
      { id: selectedRule.id, payload: patchPayload as any },
      {
        onSuccess: () => {
          toast.success("Regla actualizada correctamente")
          setIsEditOpen(false)
          setSelectedRule(null)
        },
        onError: () => toast.error("Error al actualizar la regla"),
      }
    )
  }

  function handleDelete() {
    if (!selectedRule) return
    deleteMutation.mutate(selectedRule.id, {
      onSuccess: () => {
        toast.success("Regla eliminada correctamente")
        setIsDeleteOpen(false)
        setSelectedRule(null)
      },
      onError: () => toast.error("Error al eliminar la regla"),
    })
  }

  function handleToggle(rule: DiscountRule) {
    toggleMutation.mutate(
      { id: rule.id, isActive: !rule.isActive },
      {
        onSuccess: (res) =>
          toast.success(`Descuento ${res.isActive ? "activado" : "desactivado"}`),
        onError: () => toast.error("Error al cambiar el estado"),
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar & Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 w-full">
        {/* Search bar */}
        <div className="w-full lg:w-[240px] xl:w-[320px] shrink-0 mb-2 lg:mb-0">
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o código..."
            shortcutKey="/"
            shape="md"
          />
        </div>

        {/* Filters and Button Group */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 lg:gap-4 flex-1 w-full">
          {/* Filters Sub-container */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            {/* Scope toggles — full width on mobile */}
            <div className="flex items-center w-full sm:w-auto bg-muted/30 border border-border/30 rounded-xl p-1 gap-0.5 shrink-0">
              {SCOPE_OPTIONS.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setScopeFilter(value as any)}
                  className={cn(
                    "flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
                    scopeFilter === value
                      ? "bg-background shadow-sm text-foreground border border-border/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Separator — only on desktop */}
            <div className="h-6 w-px bg-border/40 hidden sm:block shrink-0" />

            {/* Category chips — full width on mobile */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              {CATEGORY_OPTIONS.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setCategoryFilter(value as any)}
                  className={cn(
                    "flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer select-none",
                    categoryFilter === value
                      ? "bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-300"
                      : "bg-transparent border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-muted/30"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Spacer to push button to the far right on desktop */}
          <div className="hidden lg:block flex-1" />

          {/* Button — on mobile, a small gap from the filters */}
          <div className="w-full lg:w-auto shrink-0 mt-0">
            <DataTableAction
              actionType="create"
              label="Nuevo Descuento"
              shape="md"
              onClick={() => setIsCreateOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* ── Cards Grid ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="h-[165px] w-full animate-pulse rounded-2xl border border-border/30 bg-muted/40"
            />
          ))}
        </div>
      ) : !response?.data || response.data.length === 0 ? (
        <div className="h-64 border border-border/30 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 text-muted-foreground bg-muted/5">
          <Inbox className="h-10 w-10 stroke-1 text-muted-foreground/40 animate-pulse" />
          <span className="text-sm font-medium">No se encontraron reglas de descuento.</span>
          <span className="text-xs text-muted-foreground/60">
            Ajusta los filtros o crea una nueva regla.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {response.data.map((rule) => (
            <DiscountRuleCard
              key={rule.id}
              rule={rule}
              onEdit={(r) => {
                setSelectedRule(r)
                setIsEditOpen(true)
              }}
              onDelete={(r) => {
                setSelectedRule(r)
                setIsDeleteOpen(true)
              }}
              onToggle={handleToggle}
              isToggling={
                toggleMutation.isPending && toggleMutation.variables?.id === rule.id
              }
              isDeleting={
                deleteMutation.isPending && deleteMutation.variables === rule.id
              }
            />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {response?.meta && response.meta.pageCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border border-border/30 rounded-2xl bg-muted/20 dark:bg-muted/10 select-none animate-in fade-in duration-300">
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            {response.meta.itemCount !== undefined && (
              <div>
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {response.meta.itemCount}
                </span>{" "}
                descuentos
              </div>
            )}
            <div>
              Página{" "}
              <span className="font-semibold text-foreground">{page}</span> de{" "}
              <span className="font-semibold text-foreground">{response.meta.pageCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= response.meta.pageCount || isLoading}
              className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nueva Regla de Descuento"
        description="Configura los parámetros del descuento. El código se genera automáticamente si no lo especificas."
        fields={formFields}
        submitLabel="Crear Descuento"
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
      />

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedRule(null)
        }}
        title="Editar Regla de Descuento"
        description="Actualiza los parámetros. El tipo y el alcance no pueden modificarse una vez creados."
        fields={editFields}
        defaultValues={selectedRule ?? undefined}
        submitLabel="Guardar Cambios"
        isLoading={updateMutation.isPending}
        onSubmit={handleEdit}
      />

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRule(null)
        }}
        title="¿Eliminar regla de descuento?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente la regla "${selectedRule?.name ?? ""}".`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
