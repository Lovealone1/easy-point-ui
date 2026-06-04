import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  FinancialTransaction,
  CreateFinancialTransactionDTO,
} from "../types/financial-transactions.types"

export class FinancialTransactionsServiceClass extends BaseClientService<
  FinancialTransaction,
  CreateFinancialTransactionDTO,
  any
> {
  constructor() {
    super("/financial-transactions")
  }
}

export const financialTransactionsService = new FinancialTransactionsServiceClass()
