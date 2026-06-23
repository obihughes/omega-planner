/** Freeform note on the Month board */
export interface MonthBoardNote {
  id: string;
  text: string;
}

/** One week slot: week goal notes + seven day rows (Mon–Sun) */
export interface MonthBoardWeekSlot {
  weekNotes: MonthBoardNote[];
  /** Index 0 = Monday of that week */
  days: MonthBoardNote[][];
}

/** YYYY-MM */
export type MonthBoardMonthKey = string;

/** YYYY-MM-DD (Monday) */
export type MonthBoardWeekStartKey = string;

/** Days shown per week (Mon–Sun) */
export const DAYS_PER_WEEK = 7;

export interface MonthBoardState {
  version: string;
  /** Calendar year for the month picker (current year on first load) */
  year: number;
  /** Selected month (YYYY-MM) */
  selectedMonthKey: MonthBoardMonthKey;
  /** Monday of the selected week (YYYY-MM-DD) */
  selectedWeekStartKey: MonthBoardWeekStartKey;
  /** Week data keyed by Monday date key */
  weeks: Record<MonthBoardWeekStartKey, MonthBoardWeekSlot>;
  lastUpdated: string;
}

export type MonthNoteSource =
  | { kind: 'week'; weekStartKey: MonthBoardWeekStartKey }
  | { kind: 'day'; weekStartKey: MonthBoardWeekStartKey; dayIndex: number };

export type MonthNoteTarget =
  | { kind: 'week'; weekStartKey: MonthBoardWeekStartKey }
  | { kind: 'day'; weekStartKey: MonthBoardWeekStartKey; dayIndex: number };
