import { nanoid } from 'nanoid';
import { TodoItem, TodoStorageData } from '@/types/todo';

const STORAGE_KEY = 'omega-planner-todo-v1';
const STORAGE_VERSION = '1.0';

export const TodoStorage = {
  load(): TodoItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const data: TodoStorageData = JSON.parse(raw);
      if (!data || !Array.isArray(data.items)) return [];
      return data.items.map(TodoStorage.clean).filter(TodoStorage.isValid);
    } catch {
      return [];
    }
  },

  save(items: TodoItem[]) {
    if (typeof window === 'undefined') return;
    const payload: TodoStorageData = {
      version: STORAGE_VERSION,
      items,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },

  isValid(item: unknown): item is TodoItem {
    return (
      !!item &&
      typeof item === 'object' &&
      typeof (item as TodoItem).id === 'string' &&
      typeof (item as TodoItem).title === 'string'
    );
  },

  clean(item: unknown): TodoItem {
    const raw = item as Partial<TodoItem>;
    const now = new Date().toISOString();
    return {
      id: String(raw.id || nanoid()),
      title: String(raw.title || '').trim(),
      done: Boolean(raw.done),
      createdAt: String(raw.createdAt || now),
      updatedAt: String(raw.updatedAt || now),
    };
  },
};
