import { nanoid } from 'nanoid';
import { MealIngredient, MealItem, MealsStorageData } from '@/types/meals';

const STORAGE_KEY = 'omega-planner-meals-v1';
const LEGACY_RECIPES_KEY = 'omega-planner-recipes';
const STORAGE_VERSION = '1.0';

function cleanIngredient(raw: unknown): MealIngredient | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = String((raw as MealIngredient).name || '').trim();
  if (!name) return null;
  const quantity = (raw as MealIngredient).quantity;
  return {
    name,
    quantity: typeof quantity === 'string' && quantity.trim() ? quantity.trim() : undefined,
  };
}

function migrateFromLegacyRecipes(): MealItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LEGACY_RECIPES_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    const recipes = Array.isArray(data?.recipes) ? data.recipes : [];
    const now = new Date().toISOString();
    return recipes
      .map((r: unknown) => {
        if (!r || typeof r !== 'object') return null;
        const rec = r as { id?: string; name?: string; ingredients?: unknown[]; createdAt?: string; updatedAt?: string };
        const name = String(rec.name || '').trim();
        if (!name) return null;
        const ingredients = Array.isArray(rec.ingredients)
          ? rec.ingredients.map(cleanIngredient).filter((i): i is MealIngredient => i !== null)
          : [];
        return {
          id: String(rec.id || nanoid()),
          name,
          ingredients,
          createdAt: String(rec.createdAt || now),
          updatedAt: String(rec.updatedAt || now),
        } satisfies MealItem;
      })
      .filter((m: MealItem | null): m is MealItem => m !== null);
  } catch {
    return [];
  }
}

export const MealsStorage = {
  load(): MealItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migrated = migrateFromLegacyRecipes();
      if (migrated.length > 0) {
        MealsStorage.save(migrated);
        return migrated;
      }
      return [];
    }
    try {
      const data: MealsStorageData = JSON.parse(raw);
      if (!data || !Array.isArray(data.meals)) return [];
      return data.meals.map(MealsStorage.clean).filter(MealsStorage.isValid);
    } catch {
      return [];
    }
  },

  save(meals: MealItem[]) {
    if (typeof window === 'undefined') return;
    const payload: MealsStorageData = {
      version: STORAGE_VERSION,
      meals,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },

  isValid(meal: unknown): meal is MealItem {
    return (
      !!meal &&
      typeof meal === 'object' &&
      typeof (meal as MealItem).id === 'string' &&
      typeof (meal as MealItem).name === 'string' &&
      Array.isArray((meal as MealItem).ingredients)
    );
  },

  clean(meal: unknown): MealItem {
    const raw = meal as Partial<MealItem>;
    const now = new Date().toISOString();
    const ingredients = Array.isArray(raw.ingredients)
      ? raw.ingredients.map(cleanIngredient).filter((i): i is MealIngredient => i !== null)
      : [];
    return {
      id: String(raw.id || nanoid()),
      name: String(raw.name || '').trim(),
      ingredients,
      createdAt: String(raw.createdAt || now),
      updatedAt: String(raw.updatedAt || now),
    };
  },
};
