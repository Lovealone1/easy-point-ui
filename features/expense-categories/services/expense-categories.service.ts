import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  ExpenseCategory,
  CreateExpenseCategoryDTO,
  UpdateExpenseCategoryDTO,
} from "../types/expense-categories.types"

export class ExpenseCategoriesServiceClass extends BaseClientService<
  ExpenseCategory,
  CreateExpenseCategoryDTO,
  UpdateExpenseCategoryDTO
> {
  constructor() {
    super("/expense-categories")
  }

  /**
   * Toggles the active status of an expense category.
   * Target: PATCH /expense-categories/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<ExpenseCategory> {
    const { data } = await apiClient.patch<ExpenseCategory>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data
  }
}

export const expenseCategoriesService = new ExpenseCategoriesServiceClass()
