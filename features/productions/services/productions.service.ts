import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  Production,
  CreateProductionDTO,
  UpdateProductionDTO,
} from "../types/productions.types"

export class ProductionsServiceClass extends BaseClientService<
  Production,
  CreateProductionDTO,
  UpdateProductionDTO
> {
  constructor() {
    super("/productions")
  }

  /**
   * Cancels a production that is currently in DRAFT status.
   * Only OWNER and ADMINISTRATOR roles are allowed.
   *
   * Target: PATCH /productions/:id/cancel
   */
  async cancel(id: string): Promise<Production> {
    const { data } = await apiClient.patch<Production>(
      `/${this.endpoint}/${id}/cancel`,
      {}
    )
    return data
  }
}

export const productionsService = new ProductionsServiceClass()
