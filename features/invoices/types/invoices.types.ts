// ─────────────────────────────────────────────────────────────────────────────
// features/invoices/types/invoices.types.ts
//
// TypeScript type definitions for the invoices module.
// ─────────────────────────────────────────────────────────────────────────────

import type { Subscription } from "@/features/subscriptions/types/subscriptions.types"

export type InvoiceStatus = "PENDING" | "PAID" | "VOID" | "OVERDUE"

export interface Invoice {
  id: string
  organizationId: string
  subscriptionId: string
  invoiceNumber: string
  amount: number
  currency: string
  status: InvoiceStatus
  dueDate: string
  paidAt: string | null
  paymentReference: string | null
  paymentMethod: string | null
  paymentNotes: string | null
  billingPeriodStart: string
  billingPeriodEnd: string
  metadata: any | null
  notes: string | null
  createdAt: string
  updatedAt: string

  // Relations
  subscription?: Subscription
}

export interface FindInvoicesParams {
  page?: number
  limit?: number
  order?: "ASC" | "DESC"
  orderBy?: string
  search?: string
  organizationId?: string
  subscriptionId?: string
  status?: InvoiceStatus
  invoiceNumber?: string
}

export interface CreateInvoiceDTO {
  organizationId: string
  subscriptionId: string
  amount: number
  currency?: string
  status?: InvoiceStatus
  dueDate: string
  paidAt?: string
  paymentReference?: string
  paymentMethod?: string
  paymentNotes?: string
  billingPeriodStart: string
  billingPeriodEnd: string
  metadata?: any
  notes?: string
}
