import { nanoid } from 'nanoid';
import type {
  GoalHierarchyStorageData,
  HierarchyDaySlot,
  HierarchyGoalItem,
  HierarchyMonthSlot,
  HierarchyWeekSlot,
} from '@/types/goalHierarchy';
import { getWeekdayDates, getWeeksInMonth } from '@/utils/goalHierarchyDates';

export const GOAL_HIERARCHY_STORAGE_KEY = 'omega-planner-goal-hierarchy-v1';
const STORAGE_VERSION = '1.0';

function emptyItem(raw: Partial<HierarchyGoalItem>): HierarchyGoalItem {
  const now = new Date().toISOString();
  return {
    id: String(raw.id || nanoid()),
    title: String(raw.title || '').trim(),
    done: Boolean(raw.done),
    createdAt: String(raw.createdAt || now),
  };
}

function emptyDay(dateKey: string, raw?: Partial<HierarchyDaySlot>): HierarchyDaySlot {
  return {
    dateKey,
    summary: String(raw?.summary ?? ''),
    items: Array.isArray(raw?.items) ? raw!.items.map(emptyItem) : [],
  };
}

function emptyWeek(
  weekIndex: number,
  weekStartKey: string,
  raw?: Partial<HierarchyWeekSlot>
): HierarchyWeekSlot {
  const weekdayDates = getWeekdayDates(weekStartKey);
  const rawDays = raw?.days;
  return {
    weekIndex,
    weekStartKey,
    summary: String(raw?.summary ?? ''),
    items: Array.isArray(raw?.items) ? raw!.items.map(emptyItem) : [],
    days: weekdayDates.map((dateKey, i) => {
      const existing = rawDays?.find((d) => d.dateKey === dateKey) ?? rawDays?.[i];
      return emptyDay(dateKey, existing);
    }),
  };
}

function emptyMonth(monthKey: string, raw?: Partial<HierarchyMonthSlot>): HierarchyMonthSlot {
  const weekDefs = getWeeksInMonth(monthKey);
  const rawWeeks = raw?.weeks;
  return {
    monthKey,
    summary: String(raw?.summary ?? ''),
    items: Array.isArray(raw?.items) ? raw!.items.map(emptyItem) : [],
    weeks: weekDefs.map(({ weekIndex, weekStartKey }) => {
      const existing =
        rawWeeks?.find((w) => w.weekStartKey === weekStartKey) ??
        rawWeeks?.find((w) => w.weekIndex === weekIndex);
      return emptyWeek(weekIndex, weekStartKey, existing);
    }),
  };
}

export const GoalHierarchyStorage = {
  load(): GoalHierarchyStorageData {
    if (typeof window === 'undefined') {
      return { version: STORAGE_VERSION, months: {}, lastUpdated: new Date().toISOString() };
    }
    const raw = localStorage.getItem(GOAL_HIERARCHY_STORAGE_KEY);
    if (!raw) {
      return { version: STORAGE_VERSION, months: {}, lastUpdated: new Date().toISOString() };
    }
    try {
      const data = JSON.parse(raw) as GoalHierarchyStorageData;
      if (!data || typeof data !== 'object') {
        return { version: STORAGE_VERSION, months: {}, lastUpdated: new Date().toISOString() };
      }
      const months: Record<string, HierarchyMonthSlot> = {};
      for (const [key, month] of Object.entries(data.months || {})) {
        if (month && typeof month === 'object') {
          months[key] = emptyMonth(key, month as Partial<HierarchyMonthSlot>);
        }
      }
      return {
        version: String(data.version || STORAGE_VERSION),
        months,
        lastUpdated: String(data.lastUpdated || new Date().toISOString()),
      };
    } catch {
      return { version: STORAGE_VERSION, months: {}, lastUpdated: new Date().toISOString() };
    }
  },

  save(data: GoalHierarchyStorageData) {
    if (typeof window === 'undefined') return;
    const payload: GoalHierarchyStorageData = {
      version: STORAGE_VERSION,
      months: data.months,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(GOAL_HIERARCHY_STORAGE_KEY, JSON.stringify(payload));
  },

  ensureMonth(data: GoalHierarchyStorageData, monthKey: string): HierarchyMonthSlot {
    const existing = data.months[monthKey];
    const month = emptyMonth(monthKey, existing);
    return month;
  },

  ensureWeek(month: HierarchyMonthSlot, weekIndex: number): HierarchyWeekSlot {
    const weekDefs = getWeeksInMonth(month.monthKey);
    const def = weekDefs.find((w) => w.weekIndex === weekIndex) ?? weekDefs[0];
    if (!def) {
      throw new Error(`No weeks for month ${month.monthKey}`);
    }
    const existing = month.weeks.find((w) => w.weekIndex === weekIndex);
    return emptyWeek(def.weekIndex, def.weekStartKey, existing);
  },

  ensureDay(week: HierarchyWeekSlot, dateKey: string): HierarchyDaySlot {
    const existing = week.days.find((d) => d.dateKey === dateKey);
    return emptyDay(dateKey, existing);
  },

  createItem(title: string): HierarchyGoalItem {
    return emptyItem({ title: title.trim(), done: false });
  },
};
