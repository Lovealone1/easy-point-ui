import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { employeesService } from "../services/employees.service"
import type {
  FindEmployeesParams,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeStatus,
} from "../types/employees.types"

// Query keys factory — type-safe cache key management
export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  list: (params: FindEmployeesParams) => [...employeeKeys.lists(), params] as const,
  details: () => [...employeeKeys.all, "detail"] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of employees.
 */
export function useEmployees(params: FindEmployeesParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to retrieve details of a single employee.
 */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a new employee.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEmployeeDTO) => employeesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing employee.
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateEmployeeDTO }) =>
      employeesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

/**
 * Hook to delete an employee.
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string | number) => employeesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

/**
 * Hook to update the status of an employee.
 */
export function useUpdateEmployeeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EmployeeStatus }) =>
      employeesService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

/**
 * Hook to assign (or un-assign) an organization user to an employee.
 */
export function useAssignEmployeeUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string | null }) =>
      employeesService.assignUser(id, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

/**
 * Hook to append notes to an employee.
 */
export function useAddEmployeeNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      employeesService.addNote(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
