import { Habit, HabitsStorageData, HabitState } from '@/types/habits';

const STORAGE_KEY = 'omega-planner-habits-v1';
const STORAGE_VERSION = '1.0';

export type HabitCompletionsByDate = Record<string, Record<string, number>>;

export const HabitsStorage = {
  load(): { habits: Habit[]; completionsByDate: HabitCompletionsByDate } {
    if (typeof window === 'undefined') return { habits: [], completionsByDate: {} };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { habits: [], completionsByDate: {} };
    try {
      const data: HabitsStorageData = JSON.parse(raw);
      const habits: Habit[] = Array.isArray(data?.habits)
        ? data.habits.map(HabitsStorage.cleanHabit)
        : [];
      const completionsByDate: HabitCompletionsByDate = {};
      if (data && typeof data.completionsByDate === 'object') {
        for (const [dateKey, perHabit] of Object.entries(data.completionsByDate)) {
          const safePerHabit: Record<string, number> = {};
          if (perHabit && typeof perHabit === 'object') {
            for (const [habitId, count] of Object.entries(perHabit as any)) {
              const n = Number(count);
              if (Number.isFinite(n) && n >= 0) safePerHabit[String(habitId)] = Math.floor(n);
            }
          }
          completionsByDate[dateKey] = safePerHabit;
        }
      }
      return { habits, completionsByDate };
    } catch (e) {
      console.error('Failed to load habits storage', e);
      return { habits: [], completionsByDate: {} };
    }
  },

  save(habits: Habit[], completionsByDate: HabitCompletionsByDate): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: HabitsStorageData = {
        version: STORAGE_VERSION,
        habits: habits.map(HabitsStorage.cleanHabit),
        completionsByDate,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save habits storage', e);
    }
  },

  isValidHabit(h: any): h is Habit {
    return (
      h &&
      typeof h.id === 'string' &&
      typeof h.name === 'string' &&
      typeof h.createdAt === 'string' &&
      typeof h.updatedAt === 'string'
    );
  },

  cleanHabit(h: any): Habit {
    const habit: Habit = {
      id: String(h?.id ?? Math.random().toString(36).slice(2)),
      name: String(h?.name ?? '').trim(),
      color: typeof h?.color === 'string' ? h.color : undefined,
      states: Array.isArray(h?.states) ? (h.states as any[]).map(s => HabitsStorage.cleanState(s)).filter(Boolean) as HabitState[] : HabitsStorage.defaultStates(),
      createdAt: String(h?.createdAt ?? new Date().toISOString()),
      updatedAt: String(h?.updatedAt ?? new Date().toISOString())
    };
    return habit;
  }
};

// Helpers for states
(HabitsStorage as any).cleanState = (s: any): HabitState | null => {
  if (!s) return null;
  const label = String(s.label ?? '').trim();
  const level = Number.isFinite(s.level) ? Math.max(1, Math.floor(Number(s.level))) : 1;
  const opacityNum = Number(s.opacity);
  const opacity = Number.isFinite(opacityNum) ? Math.min(1, Math.max(0, opacityNum)) : 1;
  const key = String(s.key ?? `${label}-${level}`);
  if (!label) return null;
  return { key, label, level, opacity };
};

(HabitsStorage as any).defaultStates = (): HabitState[] => ([
  { key: 'partial', label: 'Partial', level: 1, opacity: 0.7 },
  { key: 'full', label: 'Full', level: 2, opacity: 1 },
]);


