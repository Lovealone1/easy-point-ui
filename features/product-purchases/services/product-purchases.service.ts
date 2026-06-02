import { BaseClientService } from "@/shared/services/base-client.service";
import { apiClient } from "@/shared/services/api-client";
import type {
  ProductPurchase,
  CreateProductPurchaseDTO,
  CompleteProductPurchaseDTO,
  AddItemsProductPurchaseDTO
} from "../types/product-purchases.types";

export class ProductPurchasesServiceClass extends BaseClientService<
  ProductPurchase,
  CreateProductPurchaseDTO,
  Partial<CreateProductPurchaseDTO>
> {
  constructor() {
    super("/product-purchases");
  }

  /**
   * Completes a PENDING purchase (transitions to COMPLETED, debits bank account).
   * Target: PATCH /product-purchases/:id/complete
   */
  async complete(id: string, payload: CompleteProductPurchaseDTO): Promise<ProductPurchase> {
    const { data } = await apiClient.patch<ProductPurchase>(
      `/${this.endpoint}/${id}/complete`,
      payload
    );
    return data;
  }

  /**
   * Adds items to a PENDING purchase.
   * Target: PATCH /product-purchases/:id/items
   */
  async addItems(id: string, payload: AddItemsProductPurchaseDTO): Promise<ProductPurchase> {
    const { data } = await apiClient.patch<ProductPurchase>(
      `/${this.endpoint}/${id}/items`,
      payload
    );
    return data;
  }
}

export const productPurchasesService = new ProductPurchasesServiceClass();
