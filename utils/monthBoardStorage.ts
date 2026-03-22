import type { MonthBoardNote, MonthBoardState, MonthBoardWeekSlot } from '@/types/monthBoard';
import { DAYS_PER_WEEK, MONTH_BOARD_WEEK_COUNT } from '@/types/monthBoard';
import { getDateKey } from '@/utils/dateUtils';
import { startOfWeek } from 'date-fns';

const STORAGE_KEY = 'omega-planner-month-board-v1';
const STORAGE_VERSION = '1.0';

function emptyWeek(): MonthBoardWeekSlot {
  const days: MonthBoardWeekSlot['days'] = [];
  for (let d = 0; d < DAYS_PER_WEEK; d++) {
    days.push([]);
  }
  return { weekNotes: [], days };
}

/** Monday of the current week (local), as YYYY-MM-DD */
export function getDefaultHorizonMondayKey(): string {
  const d = startOfWeek(new Date(), { weekStartsOn: 1 });
  return getDateKey(d);
}

export function createInitialMonthBoardState(horizonStartKey?: string): MonthBoardState {
  const start = horizonStartKey ?? getDefaultHorizonMondayKey();
  const weeks: MonthBoardWeekSlot[] = [];
  for (let i = 0; i < MONTH_BOARD_WEEK_COUNT; i++) {
    weeks.push(emptyWeek());
  }
  return {
    version: STORAGE_VERSION,
    horizonStartKey: start,
    backlog: [],
    weeks,
    lastUpdated: new Date().toISOString(),
  };
}

function cleanWeek(raw: unknown): MonthBoardWeekSlot | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Record<string, unknown>;
  const weekNotes = Array.isArray(w.weekNotes)
    ? (w.weekNotes as unknown[])
        .filter((n) => n && typeof n === 'object' && typeof (n as { id?: string }).id === 'string')
        .map((n) => {
          const o = n as { id: string; text?: string };
          return { id: o.id, text: typeof o.text === 'string' ? o.text : '' };
        })
    : [];
  let days: MonthBoardNote[][] = [];
  if (Array.isArray(w.days) && w.days.length === DAYS_PER_WEEK) {
    days = (w.days as unknown[]).map((col) =>
      Array.isArray(col)
        ? col
            .filter((n) => n && typeof n === 'object' && typeof (n as { id?: string }).id === 'string')
            .map((n) => {
              const o = n as { id: string; text?: string };
              return { id: o.id, text: typeof o.text === 'string' ? o.text : '' };
            })
        : []
    ) as MonthBoardNote[][];
  } else {
    days = emptyWeek().days;
  }
  return { weekNotes, days };
}

export const MonthBoardStorage = {
  load(): MonthBoardState {
    if (typeof window === 'undefined') {
      return createInitialMonthBoardState();
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialMonthBoardState();
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const horizonStartKey =
        typeof parsed.horizonStartKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.horizonStartKey)
          ? parsed.horizonStartKey
          : getDefaultHorizonMondayKey();
      const backlog = Array.isArray(parsed.backlog)
        ? (parsed.backlog as unknown[])
            .filter((n) => n && typeof n === 'object' && typeof (n as { id?: string }).id === 'string')
            .map((n) => {
              const o = n as { id: string; text?: string };
              return { id: o.id, text: typeof o.text === 'string' ? o.text : '' };
            })
        : [];
      let weeks: MonthBoardWeekSlot[] = [];
      if (Array.isArray(parsed.weeks) && parsed.weeks.length === MONTH_BOARD_WEEK_COUNT) {
        weeks = parsed.weeks.map((wk) => cleanWeek(wk) ?? emptyWeek());
      } else {
        weeks = createInitialMonthBoardState(horizonStartKey).weeks;
      }
      return {
        version: STORAGE_VERSION,
        horizonStartKey,
        backlog,
        weeks,
        lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date().toISOString(),
      };
    } catch (e) {
      console.error('MonthBoardStorage.load failed', e);
      return createInitialMonthBoardState();
    }
  },

  save(state: MonthBoardState): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: MonthBoardState = {
        ...state,
        version: STORAGE_VERSION,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('MonthBoardStorage.save failed', e);
    }
  },
};
