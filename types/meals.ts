export interface MealIngredient {
  name: string;
  quantity?: string;
}

export interface MealItem {
  id: string;
  name: string;
  ingredients: MealIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface MealsStorageData {
  version: string;
  meals: MealItem[];
  lastUpdated: string;
}
