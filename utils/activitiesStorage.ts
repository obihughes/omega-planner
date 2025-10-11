// LocalStorage schema for activities text entries per date per item
// Keyed by ISO date string (YYYY-MM-DD), then by activityId
export type ActivitiesByDate = Record<string, Record<string, string>>;

const STORAGE_KEY = 'omega-planner-activities-v1';
const STORAGE_VERSION = '1.0';

export interface ActivitiesStorageData {
  version: string;
  entriesByDate: ActivitiesByDate;
  lastUpdated: string;
}

export const ActivitiesStorage = {
  load(): ActivitiesByDate {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed: any = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};

      // Migration: support legacy shape where the stored value was directly the map of dateKey -> activityId -> string
      // Detect by seeing if there is no entriesByDate field but top-level keys look like YYYY-MM-DD
      const looksLikeLegacyMap = !('entriesByDate' in parsed) && !Array.isArray(parsed) && Object.keys(parsed).some((k) => /^(\d{4})-(\d{2})-(\d{2})$/.test(k));

      const src = looksLikeLegacyMap ? parsed : (parsed as ActivitiesStorageData).entriesByDate || {};
      const byDate: ActivitiesByDate = {};
      for (const [dateKey, perActivity] of Object.entries(src)) {
        if (!perActivity || typeof perActivity !== 'object') continue;
        const safe: Record<string, string> = {};
        for (const [activityId, val] of Object.entries(perActivity as any)) {
          if (typeof val === 'string') safe[String(activityId)] = val;
        }
        byDate[dateKey] = safe;
      }
      return byDate;
    } catch (e) {
      console.error('Failed to load activities storage', e);
      return {};
    }
  },

  save(entriesByDate: ActivitiesByDate): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: ActivitiesStorageData = {
        version: STORAGE_VERSION,
        entriesByDate,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save activities storage', e);
    }
  },

  removeActivityFromAllDates(entriesByDate: ActivitiesByDate, activityId: string): ActivitiesByDate {
    const next: ActivitiesByDate = {};
    for (const [dateKey, perActivity] of Object.entries(entriesByDate)) {
      if (!perActivity || typeof perActivity !== 'object') continue;
      const { [activityId]: _omit, ...rest } = perActivity;
      next[dateKey] = rest;
    }
    return next;
  },

  getDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
};

// Editable list of Activities (independent from Workspace Projects)
export interface ActivityItem {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivitiesListDataV1 {
  version: string;
  items: ActivityItem[];
  lastUpdated: string;
}

const LIST_KEY = 'omega-planner-activities-list-v1';
const LIST_VERSION = '1.0';

function safeNowISO(): string {
  try {
    return new Date().toISOString();
  } catch {
    return '';
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try { return (crypto as any).randomUUID(); } catch {}
  }
  return `act_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export const ActivitiesListStorage = {
  load(): ActivityItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    try {
      const parsed: any = JSON.parse(raw);
      // Migration: support legacy shape where the stored value was directly an array of items
      const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : []);
      return items.filter(Boolean).map((it) => ({
        id: String((it as any).id || generateId()),
        name: String((it as any).name || 'Untitled'),
        color: typeof (it as any).color === 'string' ? (it as any).color : undefined,
        createdAt: typeof (it as any).createdAt === 'string' ? (it as any).createdAt : safeNowISO(),
        updatedAt: typeof (it as any).updatedAt === 'string' ? (it as any).updatedAt : safeNowISO(),
      }));
    } catch (e) {
      console.error('Failed to load activities list', e);
      return [];
    }
  },

  save(items: ActivityItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: ActivitiesListDataV1 = {
        version: LIST_VERSION,
        items,
        lastUpdated: safeNowISO(),
      };
      localStorage.setItem(LIST_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save activities list', e);
    }
  },

  create(name: string, color?: string): ActivityItem {
    const now = safeNowISO();
    return { id: generateId(), name: name || 'Untitled', color, createdAt: now, updatedAt: now };
  },

  upsert(items: ActivityItem[], item: ActivityItem): ActivityItem[] {
    const idx = items.findIndex((it) => it.id === item.id);
    if (idx >= 0) {
      const next = items.slice();
      next[idx] = { ...item, updatedAt: safeNowISO() };
      return next;
    }
    return [...items, { ...item, updatedAt: safeNowISO() }];
  },

  remove(items: ActivityItem[], id: string): ActivityItem[] {
    return items.filter((it) => it.id !== id);
  },

  reorder(items: ActivityItem[], fromIndex: number, toIndex: number): ActivityItem[] {
    const next = items.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  }
};

