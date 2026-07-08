export interface DailyLogEntry {
  /** YYYY-MM-DD */
  date: string;
  /** 0 = Sunday … 6 = Saturday (Date.getDay) */
  dayOfWeek: number;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface DailyLogData {
  version: string;
  entries: Record<string, DailyLogEntry>;
  lastUpdated: string;
}

/** Monday-first display order mapped to Date.getDay() values */
export const DAILY_LOG_WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DAILY_LOG_DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const DAILY_LOG_DAY_SHORT: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};
