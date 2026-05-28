import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { clientsService } from "../services/clients.service"
import type {
  FindClientsParams,
  CreateClientDTO,
  UpdateClientDTO,
} from "../types/clients.types"

// Query keys factory — type-safe cache key management
export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (params: FindClientsParams) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of clients.
 */
export function useClients(params: FindClientsParams = {}) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single client.
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new client.
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateClientDTO) => clientsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing client.
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateClientDTO }) =>
      clientsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Hook to delete a client.
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => clientsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Hook to toggle a client's active state.
 */
export function useToggleClientActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      clientsService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}

/**
 * Hook to append notes to a client.
 */
export function useAddClientNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      clientsService.addNote(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
    },
  })
}
