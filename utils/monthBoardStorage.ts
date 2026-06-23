import type { MonthBoardNote, MonthBoardState, MonthBoardWeekSlot } from '@/types/monthBoard';
import { DAYS_PER_WEEK } from '@/types/monthBoard';
import { addDaysToDateKey, dateFromDateKey, getDateKey } from '@/utils/dateUtils';
import {
  getCurrentMonthKey,
  getCurrentYear,
  getDefaultWeekStartKeyForMonth,
} from '@/utils/monthBoardDates';
import { startOfWeek } from 'date-fns';

const STORAGE_KEY = 'omega-planner-month-board-v1';
const STORAGE_VERSION = '2.0';
const LEGACY_HORIZON_WEEK_COUNT = 12;

function emptyWeek(): MonthBoardWeekSlot {
  const days: MonthBoardWeekSlot['days'] = [];
  for (let d = 0; d < DAYS_PER_WEEK; d++) {
    days.push([]);
  }
  return { weekNotes: [], days };
}

function cleanNotes(raw: unknown): MonthBoardNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n) => n && typeof n === 'object' && typeof (n as { id?: string }).id === 'string')
    .map((n) => {
      const o = n as { id: string; text?: string };
      return { id: o.id, text: typeof o.text === 'string' ? o.text : '' };
    });
}

function cleanWeek(raw: unknown): MonthBoardWeekSlot | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Record<string, unknown>;
  const weekNotes = cleanNotes(w.weekNotes);

  let days: MonthBoardNote[][] = [];
  if (Array.isArray(w.days)) {
    const rawDays = (w.days as unknown[]).map((col) => cleanNotes(col));
    if (rawDays.length === DAYS_PER_WEEK) {
      days = rawDays;
    } else if (rawDays.length === 5) {
      days = [...rawDays, [], []];
    } else if (rawDays.length > DAYS_PER_WEEK) {
      days = rawDays.slice(0, DAYS_PER_WEEK);
    } else {
      days = emptyWeek().days;
    }
  } else {
    days = emptyWeek().days;
  }

  return { weekNotes, days };
}

function cloneWeekSlot(slot: MonthBoardWeekSlot): MonthBoardWeekSlot {
  return {
    weekNotes: slot.weekNotes.map((n) => ({ ...n })),
    days: slot.days.map((col) => col.map((n) => ({ ...n }))),
  };
}

export function createInitialMonthBoardState(): MonthBoardState {
  const monthKey = getCurrentMonthKey();
  const weekStartKey = getDefaultWeekStartKeyForMonth(monthKey);
  return {
    version: STORAGE_VERSION,
    year: getCurrentYear(),
    selectedMonthKey: monthKey,
    selectedWeekStartKey: weekStartKey,
    weeks: { [weekStartKey]: emptyWeek() },
    lastUpdated: new Date().toISOString(),
  };
}

function ensureWeek(state: MonthBoardState, weekStartKey: string): MonthBoardWeekSlot {
  if (!state.weeks[weekStartKey]) {
    state.weeks[weekStartKey] = emptyWeek();
  }
  return state.weeks[weekStartKey];
}

/** Ensure week slot exists when reading; returns a clone-safe reference */
export function getWeekSlot(state: MonthBoardState, weekStartKey: string): MonthBoardWeekSlot {
  return state.weeks[weekStartKey] ?? emptyWeek();
}

export function ensureWeekInState(draft: MonthBoardState, weekStartKey: string): MonthBoardWeekSlot {
  return ensureWeek(draft, weekStartKey);
}

/** Monday of the current week (local), as YYYY-MM-DD — used for legacy migration */
export function getDefaultHorizonMondayKey(): string {
  const d = startOfWeek(new Date(), { weekStartsOn: 1 });
  return getDateKey(d);
}

interface LegacyHorizonState {
  version?: string;
  horizonStartKey: string;
  weeks: MonthBoardWeekSlot[];
}

function isLegacyHorizonFormat(parsed: Record<string, unknown>): parsed is LegacyHorizonState {
  return (
    typeof parsed.horizonStartKey === 'string' &&
    Array.isArray(parsed.weeks) &&
    !('selectedMonthKey' in parsed)
  );
}

function migrateLegacyHorizon(parsed: LegacyHorizonState): MonthBoardState {
  const weeks: Record<string, MonthBoardWeekSlot> = {};
  const horizonStart = parsed.horizonStartKey;

  parsed.weeks.forEach((rawWeek, i) => {
    const weekStartKey = addDaysToDateKey(horizonStart, i * 7);
    const slot = cleanWeek(rawWeek) ?? emptyWeek();
    weeks[weekStartKey] = slot;
  });

  const monthKey = getCurrentMonthKey();
  const defaultWeek = getDefaultWeekStartKeyForMonth(monthKey);

  return {
    version: STORAGE_VERSION,
    year: getCurrentYear(),
    selectedMonthKey: monthKey,
    selectedWeekStartKey: weeks[defaultWeek] ? defaultWeek : Object.keys(weeks)[0] ?? defaultWeek,
    weeks,
    lastUpdated: new Date().toISOString(),
  };
}

function cleanWeeksRecord(raw: unknown): Record<string, MonthBoardWeekSlot> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, MonthBoardWeekSlot> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    const slot = cleanWeek(value);
    if (slot) result[key] = slot;
  }
  return result;
}

function parseV2State(parsed: Record<string, unknown>): MonthBoardState {
  const year =
    typeof parsed.year === 'number' && parsed.year >= 2000 && parsed.year <= 2100
      ? parsed.year
      : getCurrentYear();

  const selectedMonthKey =
    typeof parsed.selectedMonthKey === 'string' && /^\d{4}-\d{2}$/.test(parsed.selectedMonthKey)
      ? parsed.selectedMonthKey
      : getCurrentMonthKey();

  const selectedWeekStartKey =
    typeof parsed.selectedWeekStartKey === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(parsed.selectedWeekStartKey)
      ? parsed.selectedWeekStartKey
      : getDefaultWeekStartKeyForMonth(selectedMonthKey);

  const weeks = cleanWeeksRecord(parsed.weeks);

  return {
    version: STORAGE_VERSION,
    year,
    selectedMonthKey,
    selectedWeekStartKey,
    weeks,
    lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date().toISOString(),
  };
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

      if (isLegacyHorizonFormat(parsed)) {
        const migrated = migrateLegacyHorizon(parsed);
        // Cap legacy migration to reasonable week count
        const keys = Object.keys(migrated.weeks);
        if (keys.length > LEGACY_HORIZON_WEEK_COUNT + 4) {
          const trimmed: Record<string, MonthBoardWeekSlot> = {};
          keys.slice(0, LEGACY_HORIZON_WEEK_COUNT).forEach((k) => {
            trimmed[k] = migrated.weeks[k];
          });
          migrated.weeks = trimmed;
        }
        return migrated;
      }

      return parseV2State(parsed);
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

export { cloneWeekSlot };
