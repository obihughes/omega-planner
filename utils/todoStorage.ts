import { nanoid } from 'nanoid';
import { TodoItem, TodoStorageData } from '@/types/todo';

const STORAGE_KEY = 'omega-planner-todo-v1';
const STORAGE_VERSION = '1.1';

function byCreatedDesc(a: TodoItem, b: TodoItem) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** One-time: keep newest-first as the starting custom order for pre-1.1 lists. */
function migrateToCustomOrder(items: TodoItem[]): TodoItem[] {
  const active = items.filter((i) => !i.done).sort(byCreatedDesc);
  const completed = items.filter((i) => i.done);
  return [...active, ...completed];
}

export const TodoStorage = {
  load(): TodoItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const data: TodoStorageData = JSON.parse(raw);
      if (!data || !Array.isArray(data.items)) return [];
      const items = data.items.map(TodoStorage.clean).filter(TodoStorage.isValid);
      if (data.version === STORAGE_VERSION) return items;
      const migrated = migrateToCustomOrder(items);
      TodoStorage.save(migrated);
      return migrated;
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
      notes: String(raw.notes || ''),
      done: Boolean(raw.done),
      createdAt: String(raw.createdAt || now),
      updatedAt: String(raw.updatedAt || now),
    };
  },
};
