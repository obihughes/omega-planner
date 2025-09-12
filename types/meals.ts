export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export interface MealItem {
  id: string;
  name: string;
  notes?: string;
  url?: string;
  calories?: number;
  ingredients?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MealsBySlot {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
}

export interface MealsStorageData {
  version: string;
  mealsByDate: Record<string, MealsBySlot>;
  lastUpdated: string;
}

export const MEAL_SLOTS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner'] as const;

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner'
};


