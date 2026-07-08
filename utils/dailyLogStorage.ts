import { DailyLogData, DailyLogEntry } from '@/types/dailyLog';
import { dateFromDateKey } from '@/utils/dateUtils';

const STORAGE_KEY = 'omega-planner-daily-log-v1';
const STORAGE_VERSION = '1.0';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function emptyData(): DailyLogData {
  return {
    version: STORAGE_VERSION,
    entries: {},
    lastUpdated: new Date(0).toISOString(),
  };
}

function cleanEntry(raw: unknown): DailyLogEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Partial<DailyLogEntry>;
  if (typeof entry.date !== 'string' || !DATE_KEY_RE.test(entry.date)) return null;
  if (typeof entry.content !== 'string') return null;

  const createdAt =
    typeof entry.createdAt === 'number' && Number.isFinite(entry.createdAt)
      ? entry.createdAt
      : Date.now();
  const updatedAt =
    typeof entry.updatedAt === 'number' && Number.isFinite(entry.updatedAt)
      ? entry.updatedAt
      : createdAt;

  const dayOfWeek =
    typeof entry.dayOfWeek === 'number' &&
    entry.dayOfWeek >= 0 &&
    entry.dayOfWeek <= 6
      ? entry.dayOfWeek
      : dateFromDateKey(entry.date).getDay();

  return {
    date: entry.date,
    dayOfWeek,
    content: entry.content,
    createdAt,
    updatedAt,
  };
}

export const DAILY_LOG_STORAGE_KEY = STORAGE_KEY;

export const DailyLogStorage = {
  load(): DailyLogData {
    if (typeof window === 'undefined') return emptyData();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid daily log data');

      const entries: Record<string, DailyLogEntry> = {};
      if (parsed.entries && typeof parsed.entries === 'object') {
        for (const [key, value] of Object.entries(
          parsed.entries as Record<string, unknown>
        )) {
          const cleaned = cleanEntry(value);
          if (cleaned) entries[String(key)] = cleaned;
        }
      }

      return {
        version: String(parsed.version || STORAGE_VERSION),
        entries,
        lastUpdated: String(parsed.lastUpdated || new Date(0).toISOString()),
      };
    } catch (error) {
      console.error('Failed to load daily log storage', error);
      return emptyData();
    }
  },

  save(data: DailyLogData): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: DailyLogData = {
        version: STORAGE_VERSION,
        entries: data.entries,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save daily log storage', error);
    }
  },
};
