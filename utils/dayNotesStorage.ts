const STORAGE_KEY = 'daily-planner-day-notes-v1';
const STORAGE_VERSION = '1.0';

export const DAY_NOTES_STORAGE_KEY = STORAGE_KEY;

export type DayNotesMap = Record<string, string>;

function cleanNotesMap(raw: unknown): DayNotesMap {
  if (!raw || typeof raw !== 'object') return {};

  const cleaned: DayNotesMap = {};
  for (const [dateKey, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) cleaned[dateKey] = value;
  }
  return cleaned;
}

export const DayNotesStorage = {
  load(): DayNotesMap {
    if (typeof window === 'undefined') return {};

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
      const data = JSON.parse(raw) as { notes?: unknown; version?: string };
      if (data && typeof data === 'object' && data.notes) {
        return cleanNotesMap(data.notes);
      }
      return cleanNotesMap(data);
    } catch (error) {
      console.error('Failed to load day notes:', error);
      return {};
    }
  },

  save(notes: DayNotesMap): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          notes: cleanNotesMap(notes),
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to save day notes:', error);
    }
  },

  loadForDate(dateKey: string): string {
    return this.load()[dateKey] ?? '';
  },
};
