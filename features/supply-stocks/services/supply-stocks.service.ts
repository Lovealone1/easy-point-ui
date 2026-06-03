import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  SupplyStock,
  CreateSupplyStockDTO,
  UpdateSupplyStockDTO,
} from "../types/supply-stocks.types"

export class SupplyStocksServiceClass extends BaseClientService<
  SupplyStock,
  CreateSupplyStockDTO,
  UpdateSupplyStockDTO
> {
  constructor() {
    super("/supply-stocks")
  }
}

export const supplyStocksService = new SupplyStocksServiceClass()
