import { Recipe, RecipesStorageData } from '@/types/recipes';

const RECIPES_STORAGE_KEY = 'omega_planner_recipes';
const CURRENT_VERSION = '1.0.0';

function getDefaultData(): RecipesStorageData {
  return {
    version: CURRENT_VERSION,
    recipes: [],
    lastUpdated: new Date().toISOString()
  };
}

export const RecipesStorage = {
  save(recipes: Recipe[]): void {
    try {
      const data: RecipesStorageData = {
        version: CURRENT_VERSION,
        recipes,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save recipes to localStorage:', error);
    }
  },

  load(): Recipe[] {
    try {
      const stored = localStorage.getItem(RECIPES_STORAGE_KEY);
      if (!stored) return [];
      
      const data = JSON.parse(stored) as RecipesStorageData;
      
      // Version migration could be added here if needed
      if (data.version !== CURRENT_VERSION) {
        console.warn(`Recipes data version mismatch. Expected ${CURRENT_VERSION}, got ${data.version}`);
      }
      
      return Array.isArray(data.recipes) ? data.recipes : [];
    } catch (error) {
      console.error('Failed to load recipes from localStorage:', error);
      return [];
    }
  }
};
