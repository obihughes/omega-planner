import { RecipeItem, RecipesStorageData } from '@/types/recipes';

const STORAGE_KEY = 'omega-planner-recipes';
const STORAGE_VERSION = '1.0';

export const RecipesStorage = {
  load(): RecipeItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const data: RecipesStorageData = JSON.parse(raw);
      if (!data || !Array.isArray(data.recipes)) return [];
      return data.recipes.map(RecipesStorage.clean).filter(RecipesStorage.isValid);
    } catch (e) {
      console.error('Failed to load recipes', e);
      return [];
    }
  },
  save(recipes: RecipeItem[]) {
    if (typeof window === 'undefined') return;
    console.log('🧑‍🍳 RecipesStorage.save: Attempting to save:', recipes);
    try {
      const payload: RecipesStorageData = { version: STORAGE_VERSION, recipes, lastUpdated: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      console.log('🧑‍🍳 RecipesStorage.save: Successfully saved to localStorage');
    } catch (e) {
      console.error('🧑‍🍳 RecipesStorage.save: Failed to save recipes', e);
    }
  },
  isValid(r: any): r is RecipeItem { return r && typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.ingredients); },
  clean(r: any): RecipeItem {
    return {
      id: String(r.id || `recipe_${Date.now()}_${Math.random().toString(36).slice(2,6)}`),
      name: String(r.name || '').trim(),
      description: typeof r.description === 'string' ? r.description : undefined,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients.map((i: any) => ({ name: String(i?.name || '').trim(), quantity: typeof i?.quantity === 'string' ? i.quantity : undefined })).filter((i: any) => i.name.length > 0) : [],
      cookTimeMinutes: typeof r.cookTimeMinutes === 'number' ? r.cookTimeMinutes : undefined,
      servings: typeof r.servings === 'number' ? r.servings : undefined,
      category: typeof r.category === 'string' ? r.category : undefined,
      createdAt: String(r.createdAt || new Date().toISOString()),
      updatedAt: String(r.updatedAt || new Date().toISOString())
    };
  }
};


