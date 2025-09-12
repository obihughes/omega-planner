import { MealsBySlot, MealsStorageData, MealItem, MealSlot, MEAL_SLOTS, IngredientDetail } from '@/types/meals';

const STORAGE_KEY = 'omega-planner-meals';
const STORAGE_VERSION = '1.0';

function createEmptyMealsBySlot(): MealsBySlot {
  return {
    breakfast: [],
    lunch: [],
    dinner: []
  };
}

export const MealsStorage = {
  load(): Record<string, MealsBySlot> {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      const data: MealsStorageData = JSON.parse(raw);
      if (!data || typeof data !== 'object' || typeof data.mealsByDate !== 'object') return {};
      const byDate: Record<string, MealsBySlot> = {};
      for (const [dateKey, slots] of Object.entries(data.mealsByDate)) {
        const safe: MealsBySlot = createEmptyMealsBySlot();
        for (const slot of MEAL_SLOTS) {
          const items: any = (slots as any)[slot];
          safe[slot] = Array.isArray(items) ? items.filter(MealsStorage.isValidMealItem).map(MealsStorage.cleanItem) : [];
        }
        byDate[dateKey] = safe;
      }
      return byDate;
    } catch (e) {
      console.error('Failed to load meals storage', e);
      return {};
    }
  },

  save(mealsByDate: Record<string, MealsBySlot>): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: MealsStorageData = {
        version: STORAGE_VERSION,
        mealsByDate,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save meals storage', e);
    }
  },

  isValidMealItem(item: any): item is MealItem {
    return (
      item &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.createdAt === 'string' &&
      typeof item.updatedAt === 'string'
    );
  },

  cleanItem(item: any): MealItem {
    const i: MealItem = {
      id: String(item.id),
      name: String(item.name || '').trim(),
      notes: typeof item.notes === 'string' ? item.notes : undefined,
      url: typeof item.url === 'string' ? item.url : undefined,
      calories: typeof item.calories === 'number' ? item.calories : undefined,
      ingredients: Array.isArray(item.ingredients)
        ? item.ingredients.map((x: any) => String(x || '').trim()).filter((s: string) => s.length > 0)
        : [],
      ingredientsDetail: Array.isArray(item.ingredientsDetail)
        ? item.ingredientsDetail.map((e: any) => ({
            name: String((e?.name ?? '')).trim(),
            quantity: typeof e?.quantity === 'string' ? e.quantity : undefined
          })).filter((e: IngredientDetail) => e.name.length > 0)
        : undefined,
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || new Date().toISOString())
    };
    return i;
  }
};

export function ensureMealsForDate(map: Record<string, MealsBySlot>, dateKey: string): MealsBySlot {
  if (!map[dateKey]) {
    map[dateKey] = createEmptyMealsBySlot();
  }
  return map[dateKey];
}


