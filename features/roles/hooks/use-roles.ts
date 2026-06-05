import { useQuery } from "@tanstack/react-query"
import { rolesService } from "../services/roles.service"

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: (params: Record<string, any>) => [...roleKeys.lists(), params] as const,
}

export function useRoles(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => rolesService.getAll(params),
    placeholderData: (previousData) => previousData,
  })
}
