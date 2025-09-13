export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: string[];
  instructions?: string[];
  cookTime?: number; // in minutes
  servings?: number;
  category?: string; // e.g., "breakfast", "lunch", "dinner", "snack", "dessert"
  tags?: string[]; // e.g., ["vegetarian", "quick", "healthy"]
  createdAt: string;
  updatedAt: string;
}

export interface RecipesStorageData {
  version: string;
  recipes: Recipe[];
  lastUpdated: string;
}
