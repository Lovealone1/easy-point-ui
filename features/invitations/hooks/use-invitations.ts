import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invitationsService } from "../services/invitations.service"
import type { CreateInvitationDTO } from "../types/invitations.types"

export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  list: (params: Record<string, any>) => [...invitationKeys.lists(), params] as const,
}

export function useInvitations(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: invitationKeys.list(params),
    queryFn: () => invitationsService.getAll(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateInvitationDTO) => invitationsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => invitationsService.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
    },
  })
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => invitationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
    },
  })
}
