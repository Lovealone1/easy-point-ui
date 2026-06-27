// ─────────────────────────────────────────────────────────────────────────────
// features/invoices/components/invoice-detail-modal.tsx
//
// A premium Electronic Invoice (Factura Electrónica) details viewer modal.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import {
  Printer,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog"
import type { Invoice } from "../types/invoices.types"

interface InvoiceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice | null
  orgName?: string
  planName?: string
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  orgName = "Cargando...",
  planName = "Cargando...",
}: InvoiceDetailModalProps) {
  if (!invoice) return null

  // Calculation helpers
  const totalAmount = Number(invoice.amount)
  const vatRate = 0.19 // Standard Colombian VAT
  const baseAmount = totalAmount / (1 + vatRate)
  const vatAmount = totalAmount - baseAmount

  // Currency helper
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency || "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
      }).format(new Date(dateStr))
    } catch {
      return dateStr.slice(0, 10)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Status badges configurations
  const statusConfig = {
    PAID: {
      label: "PAGADA",
      icon: <CheckCircle2 className="h-4 w-4" />,
      badgeStyles: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      watermarkText: "PAGADA",
      watermarkStyles: "text-emerald-500/10 dark:text-emerald-500/5 border-emerald-500/15 dark:border-emerald-500/5",
    },
    PENDING: {
      label: "PENDIENTE",
      icon: <Clock className="h-4 w-4" />,
      badgeStyles: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      watermarkText: "PENDIENTE",
      watermarkStyles: "text-amber-500/10 dark:text-amber-500/5 border-amber-500/15 dark:border-amber-500/5",
    },
    OVERDUE: {
      label: "VENCIDA",
      icon: <AlertTriangle className="h-4 w-4" />,
      badgeStyles: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      watermarkText: "VENCIDA",
      watermarkStyles: "text-rose-500/10 dark:text-rose-500/5 border-rose-500/15 dark:border-rose-500/5",
    },
    VOID: {
      label: "ANULADA",
      icon: <XCircle className="h-4 w-4" />,
      badgeStyles: "bg-zinc-500/10 text-zinc-500 border-dashed border-zinc-300 dark:border-zinc-800",
      watermarkText: "ANULADA",
      watermarkStyles: "text-zinc-500/5 dark:text-zinc-500/3 border-zinc-500/10 dark:border-zinc-500/3",
    },
  }

  const currentStatus = statusConfig[invoice.status] || statusConfig.PENDING

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl rounded-xl bg-card border border-border/40 shadow-xl overflow-hidden p-0 duration-200 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Printable Area Wrapper */}
        <div className="relative overflow-y-auto max-h-[85vh] p-6 sm:p-8 space-y-6 print:overflow-visible print:max-h-none print:p-0">
          
          {/* Status Watermark Background (hidden on small screens, shown as background watermark on desktop) */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 select-none border-8 font-heading font-black tracking-[0.2em] text-[72px] sm:text-[96px] rounded-2xl px-8 py-2 z-0 pointer-events-none ${currentStatus.watermarkStyles} print:hidden`}>
            {currentStatus.watermarkText}
          </div>

          <div className="relative z-10 space-y-6">
            {/* 1. Header (Issuer info + Invoice Title/No) */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-6 border-b border-border/40">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white shadow-xs">
                    EP
                  </div>
                  <span className="text-base font-bold text-foreground font-heading leading-none">EasyPoint Solutions</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  EasyPoint SAS • NIT: 901.234.567-8<br />
                  Calle 100 #8A-49, Bogotá, Colombia<br />
                  billing@easypoint.io • +57 1 300 0000
                </p>
              </div>

              <div className="md:text-right space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-card shadow-2xs">
                  FACTURA ELECTRÓNICA DE VENTA
                </span>
                <h3 className="text-xl font-mono font-bold text-foreground leading-none mt-1">
                  No. {invoice.invoiceNumber}
                </h3>
                <div className="flex items-center md:justify-end gap-2 mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentStatus.badgeStyles}`}>
                    {currentStatus.icon}
                    {currentStatus.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Billing Parties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 border border-border/30 p-4 rounded-xl">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Emisor / Proveedor
                </h4>
                <div className="text-xs text-foreground space-y-1">
                  <p className="font-semibold">EasyPoint Solutions SAS</p>
                  <p className="text-muted-foreground">NIT: 901.234.567-8</p>
                  <p className="text-muted-foreground">Actividad Económica: 6201 (Desarrollo Sistemas)</p>
                  <p className="text-muted-foreground">Bogotá D.C., Colombia</p>
                </div>
              </div>

              <div className="space-y-2 border-t md:border-t-0 md:border-l border-border/30 pt-4 md:pt-0 md:pl-6">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Adquirente / Cliente
                </h4>
                <div className="text-xs text-foreground space-y-1">
                  <p className="font-semibold">{orgName}</p>
                  <p className="text-muted-foreground">Organización ID: <span className="font-mono">{invoice.organizationId}</span></p>
                  <p className="text-muted-foreground">Suscripción ID: <span className="font-mono">{invoice.subscriptionId.substring(0, 8)}...</span></p>
                </div>
              </div>
            </div>

            {/* 3. Dates & Period Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fecha Emisión</span>
                <p className="font-semibold flex items-center gap-1 text-foreground"><Calendar className="h-3 w-3 text-muted-foreground" /> {formatDate(invoice.createdAt)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fecha Vencimiento</span>
                <p className="font-semibold flex items-center gap-1 text-foreground"><Calendar className="h-3 w-3 text-muted-foreground" /> {formatDate(invoice.dueDate)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Período Inicio</span>
                <p className="font-semibold flex items-center gap-1 text-foreground"><Calendar className="h-3 w-3 text-muted-foreground" /> {formatDate(invoice.billingPeriodStart)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Período Fin</span>
                <p className="font-semibold flex items-center gap-1 text-foreground"><Calendar className="h-3 w-3 text-muted-foreground" /> {formatDate(invoice.billingPeriodEnd)}</p>
              </div>
            </div>

            {/* 4. Invoice Items Table */}
            <div className="border border-border/40 rounded-xl overflow-hidden shadow-3xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-center w-16">Cant.</th>
                    <th className="px-4 py-3 text-center w-20">Moneda</th>
                    <th className="px-4 py-3 text-right w-28">Precio Unitario</th>
                    <th className="px-4 py-3 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-foreground/90">
                  <tr>
                    <td className="px-4 py-4.5">
                      <div className="font-semibold text-foreground">
                        Licencia de Suscripción EasyPoint
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Plan de Precios: {planName} • Cobertura desde {formatDate(invoice.billingPeriodStart)} hasta {formatDate(invoice.billingPeriodEnd)}
                      </div>
                    </td>
                    <td className="px-4 py-4.5 text-center font-mono">1</td>
                    <td className="px-4 py-4.5 text-center font-mono font-semibold">{invoice.currency}</td>
                    <td className="px-4 py-4.5 text-right font-mono">{formatCurrency(totalAmount, invoice.currency)}</td>
                    <td className="px-4 py-4.5 text-right font-mono font-bold text-foreground">
                      {formatCurrency(totalAmount, invoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Section */}
              <div className="flex justify-end p-4 bg-muted/10 border-t border-border/40">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Excluido</span>
                    <span className="font-mono">{formatCurrency(baseAmount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>IVA (19%)</span>
                    <span className="font-mono">{formatCurrency(vatAmount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2 font-bold text-sm text-foreground">
                    <span>Total Facturado</span>
                    <span className="font-mono text-brand-500">{formatCurrency(totalAmount, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Payment details and metadata if paid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Transacción & Pago
                </h4>
                <div className="text-xs space-y-2 border border-border/30 rounded-xl p-3 bg-muted/5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método Pago:</span>
                    <span className="font-semibold text-foreground">{invoice.paymentMethod || "Ninguno"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referencia:</span>
                    <span className="font-mono font-semibold text-foreground">{invoice.paymentReference || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha Pago:</span>
                    <span className="font-semibold text-foreground">{invoice.paidAt ? formatDate(invoice.paidAt) : "-"}</span>
                  </div>
                  {invoice.paymentNotes && (
                    <div className="pt-1.5 border-t border-border/20">
                      <span className="text-muted-foreground block mb-0.5">Notas de pago:</span>
                      <p className="text-foreground/90 leading-normal bg-card border border-border/30 rounded-lg p-2 font-sans">{invoice.paymentNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Metadatos de Sistema
                </h4>
                <div className="border border-border/30 rounded-xl p-3 bg-muted/5 min-h-[105px] flex flex-col justify-start">
                  {invoice.metadata && typeof invoice.metadata === "object" && Object.keys(invoice.metadata).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      {Object.entries(invoice.metadata).map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-card text-[10px] text-muted-foreground border border-border/40 font-mono shadow-3xs"
                        >
                          <span className="font-semibold text-foreground">{k}:</span>
                          <span>{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center justify-center flex-1 py-4">
                      No hay metadatos adicionales.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="space-y-1.5 border-t border-border/20 pt-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Observaciones de la Factura
                </span>
                <p className="text-xs text-foreground/80 leading-relaxed bg-muted/10 border border-border/30 rounded-xl p-3">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* 6. Footer Disclaimer */}
            <div className="text-center border-t border-border/20 pt-6 space-y-1 select-none">
              <p className="text-[9px] text-muted-foreground tracking-wide uppercase">
                Esta es una representación gráfica de una factura electrónica de venta.
              </p>
              <p className="text-[8px] text-muted-foreground/80">
                EasyPoint SAS • Autorización de Facturación Electrónica DIAN No. 18760000001 emitida el 2026-01-01
              </p>
            </div>
          </div>
        </div>

        {/* Modal Controls (Dialog Footer) */}
        <div className="flex items-center justify-end gap-2 border-t border-border/20 bg-muted/20 px-6 py-4.5 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold border border-border/80 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Factura
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
