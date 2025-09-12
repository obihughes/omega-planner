import { PantryItem, PantryStorageData } from '@/types/pantry';

const STORAGE_KEY = 'omega-planner-pantry';
const STORAGE_VERSION = '1.0';

export const PantryStorage = {
  load(): PantryItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const data: PantryStorageData = JSON.parse(raw);
      if (!data || !Array.isArray(data.items)) return [];
      return data.items.filter(PantryStorage.isValid).map(PantryStorage.clean);
    } catch (e) {
      console.error('Failed to load pantry', e);
      return [];
    }
  },
  save(items: PantryItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: PantryStorageData = {
        version: STORAGE_VERSION,
        items,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save pantry', e);
    }
  },
  isValid(item: any): item is PantryItem {
    return item && typeof item.id === 'string' && typeof item.name === 'string';
  },
  clean(item: any): PantryItem {
    return {
      id: String(item.id),
      name: String(item.name || '').trim(),
      quantity: typeof item.quantity === 'string' ? item.quantity : undefined,
      category: typeof item.category === 'string' ? item.category : undefined,
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || new Date().toISOString())
    };
  }
};


