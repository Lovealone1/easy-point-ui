// ─────────────────────────────────────────────────────────────────────────────
// features/invoices/services/invoices.service.ts
//
// Client service for global invoices management.
// Inherits standard CRUD actions.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseClientService } from "@/shared/services/base-client.service"
import type { Invoice, CreateInvoiceDTO } from "../types/invoices.types"

export class InvoicesServiceClass extends BaseClientService<
  Invoice,
  CreateInvoiceDTO,
  unknown
> {
  constructor() {
    super("/invoices")
  }
}

export const invoicesService = new InvoicesServiceClass()
