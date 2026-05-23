import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { Supplier, CreateSupplierDTO, UpdateSupplierDTO } from "../types/suppliers.types"

export class SuppliersServiceClass extends BaseClientService<
  Supplier,
  CreateSupplierDTO,
  UpdateSupplierDTO
> {
  constructor() {
    super("/suppliers")
  }

  /**
   * Toggles the active status of a supplier.
   * Target: PATCH /suppliers/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<Supplier> {
    const { data } = await apiClient.patch<Supplier>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data;
  }

  /**
   * Appends an administrative note to the supplier.
   * Target: POST /suppliers/:id/notes
   */
  async addNote(id: string, notes: string): Promise<Supplier> {
    const { data } = await apiClient.post<Supplier>(
      `/${this.endpoint}/${id}/notes`,
      { notes }
    )
    return data;
  }
}

export const suppliersService = new SuppliersServiceClass()
