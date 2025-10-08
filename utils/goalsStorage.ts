import { ImportantDate, WeekGoals, WeeklyGoal, WeeklyGoalsStorageData } from '@/types/goals';

const STORAGE_KEY = 'omega-planner-weekly-goals-v1';
const STORAGE_VERSION = '1.0';

export const GoalsStorage = {
  loadAll(): WeeklyGoalsStorageData {
    if (typeof window === 'undefined') return { version: STORAGE_VERSION, weeks: {}, lastUpdated: new Date(0).toISOString() };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, weeks: {}, lastUpdated: new Date(0).toISOString() };
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid');
      const weeks: Record<string, WeekGoals> = {};
      if (parsed.weeks && typeof parsed.weeks === 'object') {
        for (const [key, w] of Object.entries(parsed.weeks as Record<string, any>)) {
          const week = GoalsStorage.cleanWeekGoals(w);
          if (week) weeks[String(key)] = week;
        }
      }
      return {
        version: String(parsed.version || STORAGE_VERSION),
        weeks,
        lastUpdated: String(parsed.lastUpdated || new Date(0).toISOString()),
      };
    } catch (e) {
      console.error('Failed to load weekly goals storage', e);
      return { version: STORAGE_VERSION, weeks: {}, lastUpdated: new Date(0).toISOString() };
    }
  },

  saveAll(data: WeeklyGoalsStorageData): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: WeeklyGoalsStorageData = {
        version: STORAGE_VERSION,
        weeks: data.weeks,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save weekly goals storage', e);
    }
  },

  upsertWeek(week: WeekGoals): void {
    const all = GoalsStorage.loadAll();
    all.weeks[week.weekStartKey] = GoalsStorage.cleanWeekGoals(week)!;
    GoalsStorage.saveAll(all);
  },

  loadWeek(weekStartKey: string): WeekGoals {
    const all = GoalsStorage.loadAll();
    const existing = all.weeks[weekStartKey];
    if (existing) return GoalsStorage.cleanWeekGoals(existing)!;
    return {
      weekStartKey,
      goalsByDate: {},
      importantDates: [],
      updatedAt: new Date().toISOString(),
    };
  },

  addGoal(weekStartKey: string, dateKey: string, goal: WeeklyGoal): WeekGoals {
    const week = GoalsStorage.loadWeek(weekStartKey);
    const list = week.goalsByDate[dateKey] || [];
    const trimmed = list.slice(0, 3);
    const next = [...trimmed, GoalsStorage.cleanGoal(goal)];
    week.goalsByDate[dateKey] = next.slice(0, 3);
    week.updatedAt = new Date().toISOString();
    GoalsStorage.upsertWeek(week);
    return week;
  },

  toggleGoal(weekStartKey: string, dateKey: string, goalId: string): WeekGoals {
    const week = GoalsStorage.loadWeek(weekStartKey);
    const list = week.goalsByDate[dateKey] || [];
    week.goalsByDate[dateKey] = list.map(g => g.id === goalId ? { ...g, done: !g.done } : g);
    week.updatedAt = new Date().toISOString();
    GoalsStorage.upsertWeek(week);
    return week;
  },

  removeGoal(weekStartKey: string, dateKey: string, goalId: string): WeekGoals {
    const week = GoalsStorage.loadWeek(weekStartKey);
    const list = week.goalsByDate[dateKey] || [];
    week.goalsByDate[dateKey] = list.filter(g => g.id !== goalId);
    week.updatedAt = new Date().toISOString();
    GoalsStorage.upsertWeek(week);
    return week;
  },

  updateGoalColor(weekStartKey: string, dateKey: string, goalId: string, color: string): WeekGoals {
    const week = GoalsStorage.loadWeek(weekStartKey);
    const list = week.goalsByDate[dateKey] || [];
    week.goalsByDate[dateKey] = list.map(g => g.id === goalId ? { ...g, color } : g);
    week.updatedAt = new Date().toISOString();
    GoalsStorage.upsertWeek(week);
    return week;
  },

  updateGoal(weekStartKey: string, dateKey: string, goalId: string, updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType'>>): WeekGoals {
    const week = GoalsStorage.loadWeek(weekStartKey);
    const list = week.goalsByDate[dateKey] || [];
    week.goalsByDate[dateKey] = list.map(g => {
      if (g.id !== goalId) return g;
      const updated = { ...g };
      if (updates.title !== undefined) updated.title = String(updates.title).trim();
      if (updates.notes !== undefined) updated.notes = updates.notes ? String(updates.notes).trim() : undefined;
      if (updates.goalType !== undefined) updated.goalType = updates.goalType;
      return updated;
    });
    week.updatedAt = new Date().toISOString();
    GoalsStorage.upsertWeek(week);
    return week;
  },

  upsertImportantDate(weekStartKey: string, date: ImportantDate): WeekGoals {
    const week = GoalsStorage.loadWeek(weekStartKey);
    const cleaned = GoalsStorage.cleanImportantDate(date);
    const idx = week.importantDates.findIndex(d => d.id === cleaned.id);
    if (idx >= 0) week.importantDates[idx] = cleaned; else week.importantDates.push(cleaned);
    week.updatedAt = new Date().toISOString();
    GoalsStorage.upsertWeek(week);
    return week;
  },

  removeImportantDate(weekStartKey: string, id: string): WeekGoals {
    const week = GoalsStorage.loadWeek(weekStartKey);
    week.importantDates = week.importantDates.filter(d => d.id !== id);
    week.updatedAt = new Date().toISOString();
    GoalsStorage.upsertWeek(week);
    return week;
  },

  // Cleaning helpers
  cleanWeekGoals(input: any): WeekGoals | null {
    if (!input || typeof input !== 'object') return null;
    const weekStartKey = String(input.weekStartKey || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartKey)) return null;
    const goalsByDate: Record<string, WeeklyGoal[]> = {};
    if (input.goalsByDate && typeof input.goalsByDate === 'object') {
      for (const [k, arr] of Object.entries(input.goalsByDate as Record<string, any[]>)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
        const cleanedArr = Array.isArray(arr) ? arr.map(GoalsStorage.cleanGoal).filter(Boolean).slice(0, 3) as WeeklyGoal[] : [];
        goalsByDate[k] = cleanedArr;
      }
    }
    const importantDates: ImportantDate[] = Array.isArray(input.importantDates)
      ? (input.importantDates as any[]).map(GoalsStorage.cleanImportantDate).filter(Boolean) as ImportantDate[]
      : [];
    return {
      weekStartKey,
      goalsByDate,
      importantDates,
      updatedAt: String(input.updatedAt || new Date().toISOString()),
    };
  },

  cleanGoal(g: any): WeeklyGoal {
    const goalType = g?.goalType === 'primary' || g?.goalType === 'supporting' ? g.goalType : 'supporting';
    return {
      id: String(g?.id ?? Math.random().toString(36).slice(2)),
      title: String(g?.title ?? '').trim(),
      notes: typeof g?.notes === 'string' ? g.notes : undefined,
      done: Boolean(g?.done),
      createdAt: String(g?.createdAt ?? new Date().toISOString()),
      linkedEventId: typeof g?.linkedEventId === 'string' ? g.linkedEventId : undefined,
      color: typeof g?.color === 'string' ? g.color : 'gray',
      goalType,
    };
  },

  cleanImportantDate(d: any): ImportantDate {
    const dateKey = String(d?.dateKey ?? '').trim();
    return {
      id: String(d?.id ?? Math.random().toString(36).slice(2)),
      title: String(d?.title ?? '').trim(),
      dateKey: /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : GoalsStorage.toDateKey(new Date()),
    };
  },

  toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },
};


