import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  Sale,
  CreateSaleDTO,
  CompleteSaleDTO,
} from "../types/sales.types"

export class SalesServiceClass extends BaseClientService<
  Sale,
  CreateSaleDTO,
  never // Las ventas no se actualizan vía PATCH general; usan acciones específicas
> {
  constructor() {
    super("/sales")
  }

  /**
   * Completes a sale that was left in PENDING status.
   * Target: PATCH /sales/:id/complete
   */
  async completeSale(id: string, payload: CompleteSaleDTO): Promise<Sale> {
    const { data } = await apiClient.patch<Sale>(
      `/${this.endpoint}/${id}/complete`,
      payload
    )
    return data
  }
}

export const salesService = new SalesServiceClass()
