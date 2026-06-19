import { useQuery } from "@tanstack/react-query"
import { adminDashboardService } from "../services/admin-dashboard.service"
import type { FindAdminDashboardParams } from "../types/admin-dashboard.types"

export const adminDashboardKeys = {
  all: ["admin-dashboard"] as const,
  stats: (params: FindAdminDashboardParams) => [...adminDashboardKeys.all, "stats", params] as const,
}

export function useAdminDashboardStats(params: FindAdminDashboardParams) {
  return useQuery({
    queryKey: adminDashboardKeys.stats(params),
    queryFn: () => adminDashboardService.getStats(params),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}
