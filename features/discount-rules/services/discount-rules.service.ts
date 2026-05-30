import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  DiscountRule,
  CreateDiscountRuleDTO,
  UpdateDiscountRuleDTO,
} from "../types/discount-rules.types"

export class DiscountRulesServiceClass extends BaseClientService<
  DiscountRule,
  CreateDiscountRuleDTO,
  UpdateDiscountRuleDTO
> {
  constructor() {
    super("/discount-rules")
  }

  /**
   * Toggles the active status of a discount rule.
   * Target: PATCH /discount-rules/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<DiscountRule> {
    const { data } = await apiClient.patch<DiscountRule>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data
  }

  /**
   * Finds a discount rule by its short code.
   * Target: GET /discount-rules/by-code/:code
   */
  async findByCode(code: string): Promise<DiscountRule> {
    const { data } = await apiClient.get<DiscountRule>(
      `/${this.endpoint}/by-code/${code}`
    )
    return data
  }
}

export const discountRulesService = new DiscountRulesServiceClass()
