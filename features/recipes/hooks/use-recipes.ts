import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { recipesService } from "../services/recipes.service"
import type {
  FindRecipesParams,
  CreateRecipeDTO,
  UpdateRecipeDTO,
} from "../types/recipes.types"

// Query keys factory — type-safe cache key management
export const recipeKeys = {
  all: ["recipes"] as const,
  lists: () => [...recipeKeys.all, "list"] as const,
  list: (params: FindRecipesParams) => [...recipeKeys.lists(), params] as const,
  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
  globalLists: () => [...recipeKeys.all, "globalList"] as const,
  globalList: (params: FindRecipesParams) => [...recipeKeys.globalLists(), params] as const,
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of recipes for the organization.
 */
export function useRecipes(params: FindRecipesParams = {}) {
  return useQuery({
    queryKey: recipeKeys.list(params),
    queryFn: () => recipesService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  })
}

/**
 * Hook to retrieve details of a single recipe.
 */
export function useRecipe(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => recipesService.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to retrieve a paginated, sorted, and filtered list of all recipes globally (Global Admin only).
 */
export function useRecipesGlobal(params: FindRecipesParams = {}) {
  return useQuery({
    queryKey: recipeKeys.globalList(params),
    queryFn: () => recipesService.getAllGlobal(params as Record<string, any>),
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to create a new recipe.
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRecipeDTO) => recipesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recipeKeys.globalLists() })
    },
  })
}

/**
 * Hook to update an existing recipe.
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateRecipeDTO }) =>
      recipesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recipeKeys.globalLists() })
    },
  })
}

/**
 * Hook to delete a recipe.
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => recipesService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recipeKeys.globalLists() })
    },
  })
}

/**
 * Hook to toggle a recipe's active state.
 */
export function useToggleRecipeActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      recipesService.toggleActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recipeKeys.globalLists() })
    },
  })
}

/**
 * Hook to append notes to a recipe.
 */
export function useAddRecipeNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      recipesService.addNote(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: recipeKeys.globalLists() })
    },
  })
}
