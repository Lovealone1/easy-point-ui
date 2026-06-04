import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  TransactionCategory,
  CreateTransactionCategoryDTO,
  UpdateTransactionCategoryDTO,
} from "../types/transaction-categories.types"

export class TransactionCategoriesServiceClass extends BaseClientService<
  TransactionCategory,
  CreateTransactionCategoryDTO,
  UpdateTransactionCategoryDTO
> {
  constructor() {
    super("/transaction-categories")
  }

  /**
   * Toggles the active status of a transaction category.
   * Target: PATCH /transaction-categories/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<TransactionCategory> {
    const { data } = await apiClient.patch<TransactionCategory>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data
  }
}

export const transactionCategoriesService = new TransactionCategoriesServiceClass()
