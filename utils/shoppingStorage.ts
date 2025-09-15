import { ShoppingItem, ShoppingStorageData } from '@/types/shopping';

const STORAGE_KEY = 'omega-planner-shopping';
const STORAGE_VERSION = '1.0';

export const ShoppingStorage = {
  load(): ShoppingItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const data: ShoppingStorageData = JSON.parse(raw);
      if (!data || !Array.isArray(data.items)) return [];
      return data.items.map(ShoppingStorage.clean).filter(ShoppingStorage.isValid);
    } catch (e) { return []; }
  },
  save(items: ShoppingItem[]) {
    if (typeof window === 'undefined') return;
    const payload: ShoppingStorageData = { version: STORAGE_VERSION, items, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },
  isValid(item: any): item is ShoppingItem { return item && typeof item.id === 'string' && typeof item.name === 'string'; },
  clean(item: any): ShoppingItem {
    return {
      id: String(item.id || `shop_${Date.now()}_${Math.random().toString(36).slice(2,6)}`),
      name: String(item.name || '').trim(),
      quantity: typeof item.quantity === 'string' ? item.quantity : undefined,
      checked: !!item.checked,
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || new Date().toISOString())
    };
  }
};


