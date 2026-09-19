// ─────────────────────────────────────────────────────────────────────────────
// features/invoices/services/invoices.service.ts
//
// Client service for global invoices management.
// Inherits standard CRUD actions.
// ─────────────────────────────────────────────────────────────────────────────

import { BaseClientService } from "@/shared/services/base-client.service"
import type { Invoice, CreateInvoiceDTO } from "../types/invoices.types"
import { adminApiClient } from '@/shared/services/admin-api-client';

export class InvoicesServiceClass extends BaseClientService<
  Invoice,
  CreateInvoiceDTO,
  unknown
> {
  constructor() {
    super("/invoices", adminApiClient)
  }
}

export const invoicesService = new InvoicesServiceClass()
