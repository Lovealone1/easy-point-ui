import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
} from "../types/expenses.types"

export class ExpensesServiceClass extends BaseClientService<
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO
> {
  constructor() {
    super("/expenses")
  }
}

export const expensesService = new ExpensesServiceClass()
