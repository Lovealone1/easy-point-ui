import { adminApiClient } from "@/shared/services/admin-api-client"
import type { AdminDashboardStats, FindAdminDashboardParams } from "../types/admin-dashboard.types"

export class AdminDashboardServiceClass {
  protected readonly endpoint = "admin-dashboard"

  async getStats(params?: FindAdminDashboardParams): Promise<AdminDashboardStats> {
    const { data } = await adminApiClient.get<AdminDashboardStats>(`/${this.endpoint}/stats`, { params });
    return data;
  }
}

export const adminDashboardService = new AdminDashboardServiceClass()
