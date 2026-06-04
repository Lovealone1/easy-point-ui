import { useQuery } from "@tanstack/react-query"
import { utilitiesService } from "../services/utilities.service"
import type { FindUtilitiesParams } from "../types/utilities.types"

export const utilityKeys = {
  all: ["utilities"] as const,
  lists: () => [...utilityKeys.all, "list"] as const,
  list: (params: FindUtilitiesParams) => [...utilityKeys.lists(), params] as const,
  summaries: () => [...utilityKeys.all, "summary"] as const,
  summary: (params: FindUtilitiesParams) => [...utilityKeys.summaries(), params] as const,
  byProducts: () => [...utilityKeys.all, "by-product"] as const,
  byProduct: (params: FindUtilitiesParams) => [...utilityKeys.byProducts(), params] as const,
  byCategories: () => [...utilityKeys.all, "by-category"] as const,
  byCategory: (params: FindUtilitiesParams) => [...utilityKeys.byCategories(), params] as const,
  details: () => [...utilityKeys.all, "detail"] as const,
  detail: (id: string) => [...utilityKeys.details(), id] as const,
}

export function useUtilities(params: FindUtilitiesParams = {}) {
  return useQuery({
    queryKey: utilityKeys.list(params),
    queryFn: () => utilitiesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

export function useUtilitySummary(params: FindUtilitiesParams = {}) {
  return useQuery({
    queryKey: utilityKeys.summary(params),
    queryFn: () => utilitiesService.getSummary(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useUtilitiesByProduct(params: FindUtilitiesParams = {}) {
  return useQuery({
    queryKey: utilityKeys.byProduct(params),
    queryFn: () => utilitiesService.getByProduct(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useUtilitiesByCategory(params: FindUtilitiesParams = {}) {
  return useQuery({
    queryKey: utilityKeys.byCategory(params),
    queryFn: () => utilitiesService.getByCategory(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useUtility(id: string) {
  return useQuery({
    queryKey: utilityKeys.detail(id),
    queryFn: () => utilitiesService.getById(id),
    enabled: !!id,
  })
}
