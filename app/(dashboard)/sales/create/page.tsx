"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  DollarSign,
  Tag,
  BadgePercent,
  ShoppingCart,
  Users,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Receipt,
  FileText,
  AlertCircle,
  Package,
} from "lucide-react"

import { useProducts } from "@/features/products/hooks/use-products"
import { useClients } from "@/features/clients/hooks/use-clients"
import { useBankAccounts } from "@/features/bank-accounts/hooks/use-bank-accounts"
import { useTransactionCategories } from "@/features/transaction-categories/hooks/use-transaction-categories"
import { useDiscountRules } from "@/features/discount-rules/hooks/use-discount-rules"
import { useCreateSale } from "@/features/sales/hooks/use-sales"
import type { SaleStatus, SalePaymentMethod } from "@/features/sales/types/sales.types"

interface CartItem {
  id: string // react key
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function CreateSalePage() {
  const router = useRouter()
  const createSaleMutation = useCreateSale()

  // ─── Query Hooks ───
  const { data: productsRes, isLoading: loadingProducts } = useProducts({ limit: 100 })
  const { data: clientsRes } = useClients({ isActive: true, limit: 100 })
  const { data: bankAccountsRes } = useBankAccounts({ status: "ACTIVE", limit: 100 })
  const { data: categoriesRes } = useTransactionCategories({ type: "INCOME", isActive: true, limit: 100 })
  const { data: discountRulesRes } = useDiscountRules({ isActive: true, limit: 100 })

  // Filter active products client-side to prevent hitting API validation limits (Max 100)
  const activeProducts = React.useMemo(() => {
    if (!productsRes?.data) return []
    return productsRes.data.filter((p) => p.isActive)
  }, [productsRes])

  // ─── Local State ───
  const [items, setItems] = React.useState<CartItem[]>([])
  const [clientId, setClientId] = React.useState<string>("")
  const [status, setStatus] = React.useState<SaleStatus>("COMPLETED")
  const [paymentMethod, setPaymentMethod] = React.useState<SalePaymentMethod>("CASH")
  const [bankAccountId, setBankAccountId] = React.useState<string>("")
  const [categoryId, setCategoryId] = React.useState<string>("")
  const [notes, setNotes] = React.useState<string>("")
  const [couponCode, setCouponCode] = React.useState<string>("")

  // Set default category and bank account when lists load
  React.useEffect(() => {
    if (bankAccountsRes?.data && bankAccountsRes.data.length > 0 && !bankAccountId) {
      setBankAccountId(bankAccountsRes.data[0].id)
    }
  }, [bankAccountsRes, bankAccountId])

  React.useEffect(() => {
    if (categoriesRes?.data && categoriesRes.data.length > 0 && !categoryId) {
      setCategoryId(categoriesRes.data[0].id)
    }
  }, [categoriesRes, categoryId])

  // ─── Calculations ───
  const subtotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }, [items])

  const discountDetails = React.useMemo(() => {
    const code = couponCode.trim().toUpperCase()
    if (!code || !discountRulesRes?.data) {
      return { discount: 0, error: null, success: null }
    }

    const rule = discountRulesRes.data.find(
      (r) => r.code.toUpperCase() === code
    )

    if (!rule) {
      return { discount: 0, error: "Código de cupón no válido o inactivo", success: null }
    }

    if (rule.minSaleAmount && subtotal < rule.minSaleAmount) {
      return {
        discount: 0,
        error: `Monto mínimo de compra requerido: ${formatCurrency(rule.minSaleAmount)}`,
        success: null,
      }
    }

    if (rule.scope === "CLIENT" && rule.clientId && rule.clientId !== clientId) {
      return {
        discount: 0,
        error: "Este cupón es exclusivo para otro cliente registrado",
        success: null,
      }
    }

    let discount = 0
    if (rule.type === "PERCENTAGE") {
      discount = subtotal * (rule.value / 100)
      if (rule.maxDiscountAmount && discount > rule.maxDiscountAmount) {
        discount = rule.maxDiscountAmount
      }
    } else {
      discount = rule.value
    }

    // Discount cannot exceed subtotal
    discount = Math.min(discount, subtotal)

    return {
      discount,
      error: null,
      success: `Cupón "${rule.code}" aplicado (-${
        rule.type === "PERCENTAGE" ? `${rule.value}%` : formatCurrency(rule.value)
      })`,
    }
  }, [couponCode, discountRulesRes, subtotal, clientId])

  const total = React.useMemo(() => {
    return Math.max(0, subtotal - discountDetails.discount)
  }, [subtotal, discountDetails.discount])


  // ─── Actions ───
  const handleAddItem = () => {
    const newItem: CartItem = {
      id: Math.random().toString(36).substring(7),
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
    }
    setItems((prev) => [...prev, newItem])
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof CartItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item

        const updated = { ...item, [field]: value }

        // If product changes, auto-fill unitPrice
        if (field === "productId" && productsRes?.data) {
          const product = productsRes.data.find((p) => p.id === value)
          if (product) {
            updated.productName = product.name
            updated.unitPrice = product.salePrice
          }
        }

        return updated
      })
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error("Debes agregar al menos un producto al carrito")
      return
    }

    const invalidItem = items.find((item) => !item.productId || item.quantity <= 0 || item.unitPrice < 0)
    if (invalidItem) {
      toast.error("Por favor completa todos los datos de los productos agregados")
      return
    }

    if (status === "COMPLETED") {
      if (!bankAccountId) {
        toast.error("Debe seleccionar una cuenta bancaria para una venta completada")
        return
      }
      if (!categoryId) {
        toast.error("Debe seleccionar una categoría de transacción")
        return
      }
    }

    // Build payload matching backend expectation (excluding location as requested)
    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      clientId: clientId || undefined,
      status,
      discountCode: couponCode.trim() && !discountDetails.error ? couponCode.trim().toUpperCase() : undefined,
      notes: notes.trim() || undefined,
      ...(status === "COMPLETED"
        ? {
            bankAccountId,
            paymentMethod,
            categoryId,
          }
        : {}),
    }

    createSaleMutation.mutate(payload as any, {
      onSuccess: () => {
        toast.success("Venta registrada con éxito")
        router.push("/sales")
      },
      onError: (err: any) => {
        const backendMessage = err.response?.data?.error?.message || err.response?.data?.message
        let description = ""

        if (Array.isArray(backendMessage)) {
          description = backendMessage.join(", ")
        } else if (typeof backendMessage === "string") {
          if (backendMessage.toLowerCase().includes("insufficient stock")) {
            description = "No hay stock para este producto"
          } else {
            description = backendMessage
          }
        } else {
          description = err.message || "Intente nuevamente."
        }

        toast.error("Error al registrar la venta", {
          description,
        })
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* SEO Title Simulation and Navigation Header */}
      <title>Registrar Nueva Venta | EasyPoint</title>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/sales")}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/20 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
          title="Volver a la lista"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">
            Registrar Venta
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crea una nueva transacción de venta para tu organización
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section: Cart Items (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cart Card */}
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <ShoppingCart className="h-4 w-4 text-brand-500" />
                Ítems del Carrito
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer shadow-sm hover:shadow-brand-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Producto
              </button>
            </div>

            {items.length === 0 ? (
              <div className="py-12 border border-dashed border-border/20 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-muted/30 text-muted-foreground rounded-full">
                  <Package className="h-6 w-6 opacity-40" />
                </div>
                <div className="max-w-[280px]">
                  <p className="text-xs font-bold text-foreground">El carrito está vacío</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Agrega productos al carrito e introduce su cantidad para iniciar la cotización o venta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-border/30 hover:border-border/60 rounded-lg text-xs font-semibold text-foreground/80 hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
                >
                  Agregar primer ítem
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header for items on larger screens */}
                <div className="hidden sm:grid grid-cols-[2fr_100px_130px_100px_40px] gap-3 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Producto</span>
                  <span className="text-center">Cantidad</span>
                  <span className="text-right">Precio Unit.</span>
                  <span className="text-right">Subtotal</span>
                  <span className="w-8"></span>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  {items.map((item) => {
                    const rowTotal = item.quantity * item.unitPrice
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 sm:grid-cols-[2fr_100px_130px_100px_40px] gap-3 items-center p-3 rounded-xl bg-muted/10 dark:bg-muted/5 border border-border/10 transition-all duration-150 hover:bg-muted/20"
                      >
                        {/* Product Dropdown */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase sm:hidden block">
                            Producto
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateItem(item.id, "productId", e.target.value)}
                            className="w-full h-9 rounded-lg border border-border/40 bg-card px-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-brand-500/50 outline-none transition-all cursor-pointer"
                          >
                            <option value="">Selecciona un producto...</option>
                            {loadingProducts ? (
                              <option disabled>Cargando productos...</option>
                            ) : (
                              activeProducts.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} ({formatCurrency(prod.salePrice)})
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase sm:hidden block">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="0.0001"
                            step="any"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                "quantity",
                                e.target.value === "" ? 0 : Number(e.target.value)
                              )
                            }
                            placeholder="1"
                            className="w-full h-9 rounded-lg border border-border/40 bg-card px-2.5 text-center text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground/40 focus:border-brand-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        {/* Price Unit */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase sm:hidden block">
                            Precio Unitario
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice === 0 ? "" : item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "unitPrice",
                                  e.target.value === "" ? 0 : Number(e.target.value)
                                )
                              }
                              placeholder="0.00"
                              className="w-full h-9 rounded-lg border border-border/40 bg-card pl-6 pr-2.5 text-right text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground/40 focus:border-brand-500/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right sm:block flex justify-between items-center py-1 border-t border-dashed border-border/10 sm:border-none">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase sm:hidden block">
                            Subtotal
                          </span>
                          <span className="text-xs font-mono font-bold text-foreground">
                            {formatCurrency(rowTotal)}
                          </span>
                        </div>

                        {/* Remove Row Button */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                            title="Quitar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Discount Coupon Card */}
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
              <Tag className="h-4 w-4 text-brand-500" />
              Cupón de Descuento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ej. PROM10, PROM25"
                  className="w-full h-9 rounded-lg border border-border/40 bg-transparent px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground/40 focus:border-brand-500/50 outline-none transition-all uppercase"
                />
              </div>

              <div className="text-xs">
                {discountDetails.error && (
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium py-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{discountDetails.error}</span>
                  </div>
                )}
                {discountDetails.success && (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{discountDetails.success}</span>
                  </div>
                )}
                {!couponCode.trim() && (
                  <p className="text-[10px] text-muted-foreground/80 py-1.5 leading-normal">
                    Ingresa un código para aplicar reglas de descuento activas en tiempo real.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Sale Settings and Summary (1 Column) */}
        <div className="space-y-6">
          
          {/* Sale Settings Card */}
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground pb-3 border-b border-border/10 uppercase tracking-wide">
              Configuración de Venta
            </h2>

            {/* Client selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Cliente
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/40 bg-transparent px-2.5 text-xs text-foreground focus:border-brand-500/50 outline-none transition-all cursor-pointer"
              >
                <option value="">Anónimo (Venta general)</option>
                {clientsRes?.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sale Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Estado de la venta</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("COMPLETED")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer ${
                    status === "COMPLETED"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-transparent border-border/30 text-muted-foreground hover:border-border/60 hover:bg-muted/30"
                  }`}
                >
                  Completada
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("PENDING")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer ${
                    status === "PENDING"
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400"
                      : "bg-transparent border-border/30 text-muted-foreground hover:border-border/60 hover:bg-muted/30"
                  }`}
                >
                  Pendiente
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/80 leading-normal mt-1">
                {status === "COMPLETED"
                  ? "Se registrará el pago y se acreditará el dinero en la cuenta bancaria inmediatamente."
                  : "Se reserva el inventario pero no se registra transacción financiera hasta completar el pago."}
              </p>
            </div>

            {/* Conditional Financial Fields (only if status is COMPLETED) */}
            {status === "COMPLETED" && (
              <div className="space-y-4 pt-2 border-t border-dashed border-border/15 animate-in fade-in duration-200">
                
                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Método de pago</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: "Efectivo", value: "CASH", icon: Banknote },
                      { label: "T. Crédito", value: "CREDIT_CARD", icon: CreditCard },
                      { label: "T. Débito", value: "DEBIT_CARD", icon: CreditCard },
                      { label: "Transferencia", value: "BANK_TRANSFER", icon: ArrowRightLeft },
                      { label: "Cheque", value: "CHECK", icon: Receipt },
                      { label: "Otro", value: "OTHER", icon: Tag },
                    ].map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPaymentMethod(opt.value as SalePaymentMethod)}
                          className={`flex flex-col items-center gap-1 py-1.5 rounded-lg border text-[10px] font-semibold transition-all duration-150 cursor-pointer ${
                            paymentMethod === opt.value
                              ? "bg-brand-500/10 border-brand-500/40 text-brand-700 dark:text-brand-300"
                              : "bg-transparent border-border/30 text-muted-foreground hover:border-border/50"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bank Account */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Cuenta bancaria destino</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border/40 bg-transparent px-2.5 text-xs text-foreground focus:border-brand-500/50 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Selecciona cuenta bancaria...</option>
                    {bankAccountsRes?.data?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Categoría de transacción</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border/40 bg-transparent px-2.5 text-xs text-foreground focus:border-brand-500/50 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Selecciona categoría...</option>
                    {categoriesRes?.data?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Notas de la venta
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales sobre la venta..."
                className="w-full rounded-lg border border-border/40 bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-brand-500/50 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Pricing Summary Card */}
          <div className="bg-card border border-border/40 rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground pb-3 border-b border-border/10 uppercase tracking-wide">
              Resumen Financiero
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal bruto</span>
                <span className="font-semibold text-foreground font-mono">{formatCurrency(subtotal)}</span>
              </div>

              {discountDetails.discount > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Descuento aplicado
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    -{formatCurrency(discountDetails.discount)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-border/20 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Total a pagar</span>
                <span className="text-lg font-bold text-brand-600 dark:text-brand-400 font-mono">
                  {formatCurrency(total)}
                </span>
              </div>


            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/sales")}
                disabled={createSaleMutation.isPending}
                className="py-2.5 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/40 text-xs font-bold transition-all text-center disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createSaleMutation.isPending || items.length === 0}
                className="py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:pointer-events-none"
              >
                {createSaleMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Registrar Venta
              </button>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}
