export interface RecipeIngredient {
  name: string;
  quantity?: string;
}

export interface RecipeItem {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  cookTimeMinutes?: number;
  servings?: number;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipesStorageData {
  version: string;
  recipes: RecipeItem[];
  lastUpdated: string;
}


