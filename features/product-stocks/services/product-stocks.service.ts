import { BaseClientService } from "@/shared/services/base-client.service"
import type {
  ProductStock,
  CreateProductStockDTO,
  UpdateProductStockDTO,
} from "../types/product-stocks.types"

export class ProductStocksServiceClass extends BaseClientService<
  ProductStock,
  CreateProductStockDTO,
  UpdateProductStockDTO
> {
  constructor() {
    super("/product-stocks")
  }
}

export const productStocksService = new ProductStocksServiceClass()
