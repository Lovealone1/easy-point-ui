import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  ProductStock,
  CreateProductStockDTO,
} from "../types/product-stocks.types"

export class ProductStocksServiceClass extends BaseClientService<
  ProductStock,
  CreateProductStockDTO,
  never // We don't have update via PATCH for stocks in the requested scope
> {
  constructor() {
    super("/product-stocks")
  }
}

export const productStocksService = new ProductStocksServiceClass()
