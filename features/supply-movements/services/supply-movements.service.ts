import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { SupplyMovement } from "../types/supply-movements.types"

export interface CreateSupplyMovementPayload {
  supplyId: string
  stockId: string
  quantity: number
  reason?: string
}

export class SupplyMovementsServiceClass extends BaseClientService<
  SupplyMovement,
  any,
  any
> {
  constructor() {
    super("/supply-movements")
  }

  async createPurchase(payload: CreateSupplyMovementPayload): Promise<SupplyMovement> {
    const { data } = await apiClient.post<SupplyMovement>(`/${this.endpoint}/purchase`, payload)
    return data
  }

  async createProduction(payload: CreateSupplyMovementPayload): Promise<SupplyMovement> {
    const { data } = await apiClient.post<SupplyMovement>(`/${this.endpoint}/production`, payload)
    return data
  }
}

export const supplyMovementsService = new SupplyMovementsServiceClass()
