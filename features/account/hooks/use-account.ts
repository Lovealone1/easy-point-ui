// ─────────────────────────────────────────────────────────────────────────────
// features/account/hooks/use-account.ts
//
// React Query wrappers for account settings. Query-key factory and
// invalidation follow docs/CRUD_MODULE_GUIDE.md.
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { accountService } from "../services/account.service"
import type {
  ConfirmEmailChangeDTO,
  RequestEmailChangeDTO,
  UpdateAccountProfileDTO,
} from "../types/account.types"

export const accountKeys = {
  all: ["account"] as const,
  profile: () => [...accountKeys.all, "profile"] as const,
  sessions: () => [...accountKeys.all, "sessions"] as const,
  billing: () => [...accountKeys.all, "billing"] as const,
}

// ── Profile ──────────────────────────────────────────────────────────────────

export function useAccountProfile() {
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: () => accountService.getProfile(),
  })
}

export function useUpdateAccountProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateAccountProfileDTO) => accountService.updateProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(accountKeys.profile(), profile)
      // The header avatar and the sidebar identity card read the name from
      // the auth store's copy, which /auth/me feeds.
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })
}

// ── Email ────────────────────────────────────────────────────────────────────

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: (payload: RequestEmailChangeDTO) => accountService.requestEmailChange(payload),
  })
}

/**
 * No cache invalidation on success, deliberately: confirming the change ends
 * every session, so the next request would 401 anyway. The page signs the
 * person out instead.
 */
export function useConfirmEmailChange() {
  return useMutation({
    mutationFn: (payload: ConfirmEmailChangeDTO) => accountService.confirmEmailChange(payload),
  })
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function useActiveSessions() {
  return useQuery({
    queryKey: accountKeys.sessions(),
    queryFn: () => accountService.getSessions(),
    // lastSeenAt only moves every five minutes on the server, so anything
    // finer would be refetching to read the same row back.
    staleTime: 60_000,
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sid: string) => accountService.revokeSession(sid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions() })
    },
  })
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => accountService.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.sessions() })
    },
  })
}

// ── Electronic invoicing (DIAN) ──────────────────────────────────────────────

export function useAccountBillingProfile() {
  return useQuery({
    queryKey: accountKeys.billing(),
    queryFn: () => accountService.getBillingProfile(),
  })
}

export function useConfigurePersonaNatural() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: unknown) => accountService.configurePersonaNatural(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.billing() })
    },
  })
}

export function useConfigurePersonaJuridica() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: unknown) => accountService.configurePersonaJuridica(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.billing() })
    },
  })
}

export function useDeleteBillingProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => accountService.deleteBillingProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.billing() })
    },
  })
}
