import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { Recipe, CreateRecipeDTO, UpdateRecipeDTO } from "../types/recipes.types"
import type { PaginatedApiResponse } from "@/shared/types/api.types"

export class RecipesServiceClass extends BaseClientService<
  Recipe,
  CreateRecipeDTO,
  UpdateRecipeDTO
> {
  constructor() {
    super("/recipes")
  }

  /**
   * Toggles the active status of a recipe.
   * Target: PATCH /recipes/:id/toggle-active
   */
  async toggleActive(id: string, isActive: boolean): Promise<Recipe> {
    const { data } = await apiClient.patch<Recipe>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data;
  }

  /**
   * Appends an administrative note to the recipe.
   * Target: POST /recipes/:id/notes
   */
  async addNote(id: string, notes: string): Promise<Recipe> {
    const { data } = await apiClient.post<Recipe>(
      `/${this.endpoint}/${id}/notes`,
      { notes }
    )
    return data;
  }

  /**
   * Gets all recipes globally across all organizations (Global Admin).
   * Target: GET /recipes/global/all
   */
  async getAllGlobal(params?: Record<string, unknown>): Promise<PaginatedApiResponse<Recipe>> {
    const { data } = await apiClient.get<PaginatedApiResponse<Recipe>>(
      `/${this.endpoint}/global/all`,
      { params }
    )
    return data;
  }
}

export const recipesService = new RecipesServiceClass()
