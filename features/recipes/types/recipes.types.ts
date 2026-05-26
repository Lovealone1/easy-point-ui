export interface RecipeIngredient {
  /** UUID of the related Supply */
  supplyId: string;
  /** Name of the ingredient (denormalized, optional as backend can resolve it) */
  name?: string;
  /** Numeric quantity of the ingredient */
  quantity: number;
  /** Unit of measurement (e.g. gr, ml, und, kg, lt) */
  unit: string;
}

export interface RecipeStep {
  /** Order number of the step (1-based, ascending) */
  order: number;
  /** Step instruction text */
  instruction: string;
}

export interface RecipeMetadata {
  /** Quantity of units produced by the recipe */
  yieldQuantity: number;
  /** Description of the yield unit (e.g. "Porciones", "Bizcocho Grande") */
  yieldUnit: string;
}

/** Complete structure of the `content` JSONB field */
export interface RecipeContent {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  metadata: RecipeMetadata;
  icon?: string;
}

/** Domain Entity: Recipe */
export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  content: RecipeContent;
  category: string | null;
  estimatedTime: number | null;
  isActive: boolean;
  notes: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindRecipesParams {
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  orderBy?: string;
  name?: string;
  category?: string;
  isActive?: boolean;
  organizationId?: string; // Admin global filter
}

export interface CreateRecipeDTO {
  name: string;
  description?: string;
  content: RecipeContent;
  category?: string;
  estimatedTime?: number;
  productId?: string;
  notes?: string;
}

export type UpdateRecipeDTO = Partial<CreateRecipeDTO>;
