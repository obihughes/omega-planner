import { PantryItem, PantryStorageData } from '@/types/pantry';
import { normalizeIngredientName } from './ingredientUtils';

const STORAGE_KEY = 'omega-planner-pantry';
const STORAGE_VERSION = '1.0';

export const PantryStorage = {
  load(): PantryItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed: any = JSON.parse(raw);
      // Backward compatibility: accept both array and object shapes
      const itemsArray: any[] = Array.isArray(parsed)
        ? parsed
        : (parsed && Array.isArray((parsed as PantryStorageData).items)
            ? (parsed as PantryStorageData).items
            : []);
      if (!Array.isArray(itemsArray)) return [];
      const cleaned = itemsArray.filter(PantryStorage.isValid).map(PantryStorage.clean);
      // Deduplicate by normalized name, keeping the most recently updated
      const map = new Map<string, PantryItem>();
      for (const item of cleaned) {
        const key = normalizeIngredientName(item.name);
        const existing = map.get(key);
        if (!existing) { map.set(key, item); continue; }
        if (new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
          map.set(key, item);
        }
      }
      return Array.from(map.values());
    } catch (e) {
      console.error('Failed to load pantry', e);
      return [];
    }
  },
  save(items: PantryItem[]): void {
    if (typeof window === 'undefined') return;
    console.log('🥫 PantryStorage.save: Attempting to save:', items);
    try {
      const payload: PantryStorageData = {
        version: STORAGE_VERSION,
        items,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      console.log('🥫 PantryStorage.save: Successfully saved to localStorage');
    } catch (e) {
      console.error('🥫 PantryStorage.save: Failed to save pantry', e);
    }
  },
  isValid(item: any): item is PantryItem {
    return item && typeof item.id === 'string' && typeof item.name === 'string';
  },
  clean(item: any): PantryItem {
    return {
      id: String(item.id),
      name: String(item.name || '').trim(),
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || new Date().toISOString())
    };
  }
};


