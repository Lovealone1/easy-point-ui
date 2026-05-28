import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { Client, CreateClientDTO, UpdateClientDTO } from "../types/clients.types"

export class ClientsServiceClass extends BaseClientService<
  Client,
  CreateClientDTO,
  UpdateClientDTO
> {
  constructor() {
    super("/clients")
  }

  /**
   * Toggles the active status of a client.
   * Target: PATCH /clients/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<Client> {
    const { data } = await apiClient.patch<Client>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data;
  }

  /**
   * Appends an administrative note to the client.
   * Target: POST /clients/:id/notes
   */
  async addNote(id: string, notes: string): Promise<Client> {
    const { data } = await apiClient.post<Client>(
      `/${this.endpoint}/${id}/notes`,
      { notes }
    )
    return data;
  }
}

export const clientsService = new ClientsServiceClass()
