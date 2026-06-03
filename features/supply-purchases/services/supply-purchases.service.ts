import { BaseClientService } from "@/shared/services/base-client.service";
import { apiClient } from "@/shared/services/api-client";
import type {
  SupplyPurchase,
  CreateSupplyPurchaseDTO,
  CompleteSupplyPurchaseDTO,
  AddItemsSupplyPurchaseDTO
} from "../types/supply-purchases.types";

export class SupplyPurchasesServiceClass extends BaseClientService<
  SupplyPurchase,
  CreateSupplyPurchaseDTO,
  Partial<CreateSupplyPurchaseDTO>
> {
  constructor() {
    super("/supply-purchases");
  }

  /**
   * Completes a PENDING purchase (transitions to COMPLETED, debits bank account).
   * Target: PATCH /supply-purchases/:id/complete
   */
  async complete(id: string, payload: CompleteSupplyPurchaseDTO): Promise<SupplyPurchase> {
    const { data } = await apiClient.patch<SupplyPurchase>(
      `/${this.endpoint}/${id}/complete`,
      payload
    );
    return data;
  }

  /**
   * Adds items to a PENDING purchase.
   * Target: PATCH /supply-purchases/:id/items
   */
  async addItems(id: string, payload: AddItemsSupplyPurchaseDTO): Promise<SupplyPurchase> {
    const { data } = await apiClient.patch<SupplyPurchase>(
      `/${this.endpoint}/${id}/items`,
      payload
    );
    return data;
  }
}

export const supplyPurchasesService = new SupplyPurchasesServiceClass();
