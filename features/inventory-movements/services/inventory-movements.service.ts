import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  InventoryMovement,
} from "../types/inventory-movements.types"

export interface CreateMovementPayload {
  productId: string
  stockId: string
  quantity: number
  reason?: string
}

export class InventoryMovementsServiceClass extends BaseClientService<
  InventoryMovement,
  any,
  any
> {
  constructor() {
    super("/inventory-movements")
  }

  async createAdjustment(payload: CreateMovementPayload): Promise<InventoryMovement> {
    const { data } = await apiClient.post<InventoryMovement>(`/${this.endpoint}/adjustment`, payload)
    return data
  }

  async createWaste(payload: CreateMovementPayload): Promise<InventoryMovement> {
    const { data } = await apiClient.post<InventoryMovement>(`/${this.endpoint}/waste`, payload)
    return data
  }

  async createTests(payload: CreateMovementPayload): Promise<InventoryMovement> {
    const { data } = await apiClient.post<InventoryMovement>(`/${this.endpoint}/tests`, payload)
    return data
  }

  async createProduction(payload: CreateMovementPayload): Promise<InventoryMovement> {
    const { data } = await apiClient.post<InventoryMovement>(`/${this.endpoint}/production`, payload)
    return data
  }
}

export const inventoryMovementsService = new InventoryMovementsServiceClass()
