import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  InventoryMovement,
} from "../types/inventory-movements.types"

export class InventoryMovementsServiceClass extends BaseClientService<
  InventoryMovement,
  any,
  any
> {
  constructor() {
    super("/inventory-movements")
  }
}

export const inventoryMovementsService = new InventoryMovementsServiceClass()
