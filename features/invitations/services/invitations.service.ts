import { apiClient } from "@/shared/services/api-client"
import type { Invitation, CreateInvitationDTO, CreateAdminInvitationDTO } from "../types/invitations.types"

export class InvitationsServiceClass {
  protected readonly endpoint = "invitations"

  async getAll(params?: Record<string, unknown>): Promise<Invitation[]> {
    const { data } = await apiClient.get<Invitation[]>(`/${this.endpoint}`, { params });
    return data;
  }

  async create(payload: CreateInvitationDTO): Promise<Invitation> {
    const { data } = await apiClient.post<Invitation>(`/${this.endpoint}`, payload);
    return data;
  }

  /**
   * Verifies an invitation token (public endpoint)
   * GET /invitations/verify/:token
   */
  async verify(token: string): Promise<{ email: string; role: string; organizationName: string }> {
    const { data } = await apiClient.get<{ email: string; role: string; organizationName: string }>(
      `/${this.endpoint}/verify/${token}`
    )
    return data
  }

  /**
   * Accepts an invitation (authenticated endpoint)
   * POST /invitations/accept
   */
  async accept(token: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      `/${this.endpoint}/accept`,
      { invitationToken: token }
    )
    return data
  }

  /**
   * Deletes a pending invitation (authenticated endpoint)
   * DELETE /invitations/:id
   */
  async delete(id: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/${this.endpoint}/${id}`)
    return data
  }

  /**
   * Gets all invitations globally (Admin Only)
   * GET /invitations/admin
   */
  async getAllAdmin(): Promise<Invitation[]> {
    const { data } = await apiClient.get<Invitation[]>(`/${this.endpoint}/admin`)
    return data
  }

  /**
   * Creates an invitation globally for a specific organization (Admin Only)
   * POST /invitations/admin
   */
  async createAdmin(payload: CreateAdminInvitationDTO): Promise<Invitation> {
    const { data } = await apiClient.post<Invitation>(`/${this.endpoint}/admin`, payload)
    return data
  }

  /**
   * Deletes an invitation globally (Admin Only)
   * DELETE /invitations/admin/:id
   */
  async deleteAdmin(id: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/${this.endpoint}/admin/${id}`)
    return data
  }
}

export const invitationsService = new InvitationsServiceClass()
