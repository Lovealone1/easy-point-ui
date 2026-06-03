import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  SupplyStockEntry,
  CreateSupplyStockEntryDTO,
} from "../types/supply-stocks-entries.types"

export class SupplyStockEntriesServiceClass extends BaseClientService<
  SupplyStockEntry,
  CreateSupplyStockEntryDTO,
  never
> {
  constructor() {
    super("/supply-stock-entries")
  }

  /**
   * POST /supply-stock-entries/initialize-missing
   * Crea un SupplyStockEntry vacío para cada SupplyStock que no tenga entries.
   * Útil para datos legacy migrados antes de activar el módulo de producción.
   */
  async initializeMissing(): Promise<{ initialized: number; stockIds: string[] }> {
    const { data } = await apiClient.post<{ initialized: number; stockIds: string[] }>(
      `/${this.endpoint}/initialize-missing`
    )
    return data
  }
}

export const supplyStockEntriesService = new SupplyStockEntriesServiceClass()
