import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  ProductCategory,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO,
} from "../types/product-categories.types"

export class ProductCategoriesServiceClass extends BaseClientService<
  ProductCategory,
  CreateProductCategoryDTO,
  UpdateProductCategoryDTO
> {
  constructor() {
    super("/product-categories")
  }

  /**
   * Toggles the active status of a product category.
   * Target: PATCH /product-categories/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<ProductCategory> {
    const { data } = await apiClient.patch<ProductCategory>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data
  }
}

export const productCategoriesService = new ProductCategoriesServiceClass()
