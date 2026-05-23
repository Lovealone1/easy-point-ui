import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { ApiResponse } from "@/shared/types/api.types"
import type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductCategory,
} from "../types/products.types"

export class ProductsServiceClass extends BaseClientService<
  Product,
  CreateProductDTO,
  UpdateProductDTO
> {
  constructor() {
    super("/products")
  }

  /**
   * Toggles the active status of a product.
   * Target: PATCH /products/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<ApiResponse<Product>> {
    const { data } = await apiClient.patch<ApiResponse<Product>>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data;
  }

  /**
   * Appends an administrative note to the product.
   * Target: POST /products/:id/notes
   */
  async addNote(id: string, notes: string): Promise<ApiResponse<Product>> {
    const { data } = await apiClient.post<ApiResponse<Product>>(
      `/${this.endpoint}/${id}/notes`,
      { notes }
    )
    return data;
  }

  /**
   * Returns the endpoint path for displaying a product's barcode EAN-13 PNG.
   * Target: GET /products/:id/barcode
   */
  getBarcodeUrl(id: string): string {
    return `/api/v1/${this.endpoint}/${id}/barcode`
  }
}

export const productsService = new ProductsServiceClass()

// Reuse generic BaseClientService for product categories (DRY pattern)
export const productCategoriesService = new BaseClientService<ProductCategory>(
  "/product-categories"
)
