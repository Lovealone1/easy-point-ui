// ─────────────────────────────────────────────────────────────────────────────
// features/user-info/hooks/use-user-info.ts
//
// React Query hooks wrapper for user info electronic billing configurations.
// Follows CRUD Module Guide query key factory and invalidation patterns.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userInfoService } from "../services/user-info.service"

export const userInfoKeys = {
  all: ["user-info"] as const,
  billing: (userId: string) => [...userInfoKeys.all, "billing", userId] as const,
}

export const useBillingProfile = (userId: string) => {
  return useQuery({
    queryKey: userInfoKeys.billing(userId),
    queryFn: () => userInfoService.getBillingProfile(userId),
    enabled: !!userId,
  })
}

export const useConfigurePersonaNatural = (userId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => userInfoService.configurePersonaNatural(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userInfoKeys.billing(userId) })
    },
  })
}

export const useConfigurePersonaJuridica = (userId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: any) => userInfoService.configurePersonaJuridica(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userInfoKeys.billing(userId) })
    },
  })
}

export const useDeleteBillingProfile = (userId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => userInfoService.deleteBillingProfile(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userInfoKeys.billing(userId) })
    },
  })
}
