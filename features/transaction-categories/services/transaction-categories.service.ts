import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  TransactionCategory,
} from "../types/transaction-categories.types"

export class TransactionCategoriesServiceClass extends BaseClientService<
  TransactionCategory,
  any, // We only need read capability for now
  any
> {
  constructor() {
    super("/transaction-categories")
  }
}

export const transactionCategoriesService = new TransactionCategoriesServiceClass()
