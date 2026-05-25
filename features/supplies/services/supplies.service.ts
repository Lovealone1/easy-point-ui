import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { Supply, CreateSupplyDTO, UpdateSupplyDTO } from "../types/supplies.types"

export class SuppliesServiceClass extends BaseClientService<
  Supply,
  CreateSupplyDTO,
  UpdateSupplyDTO
> {
  constructor() {
    super("/supplies")
  }

  /**
   * Toggles the active status of a supply.
   * Target: PATCH /supplies/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<Supply> {
    const { data } = await apiClient.patch<Supply>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data;
  }

  /**
   * Appends an administrative note to the supply.
   * Target: POST /supplies/:id/notes
   */
  async addNote(id: string, notes: string): Promise<Supply> {
    const { data } = await apiClient.post<Supply>(
      `/${this.endpoint}/${id}/notes`,
      { notes }
    )
    return data;
  }
}

export const suppliesService = new SuppliesServiceClass()
