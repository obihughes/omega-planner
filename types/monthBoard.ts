/** Freeform note on the Month board */
export interface MonthBoardNote {
  id: string;
  text: string;
}

/** One week slot: coarse notes + seven day columns (Mon–Sun) */
export interface MonthBoardWeekSlot {
  weekNotes: MonthBoardNote[];
  /** Index 0 = Monday of that week (relative to horizon) */
  days: MonthBoardNote[][];
}

export const MONTH_BOARD_WEEK_COUNT = 12;
export const DAYS_PER_WEEK = 7;

export interface MonthBoardState {
  version: string;
  /** YYYY-MM-DD for the Monday of week index 0 */
  horizonStartKey: string;
  backlog: MonthBoardNote[];
  weeks: MonthBoardWeekSlot[];
  lastUpdated: string;
}

export type MonthNoteSource =
  | { kind: 'backlog' }
  | { kind: 'week'; weekIndex: number }
  | { kind: 'day'; weekIndex: number; dayIndex: number };

export type MonthNoteTarget =
  | { kind: 'backlog' }
  | { kind: 'week'; weekIndex: number }
  | { kind: 'day'; weekIndex: number; dayIndex: number };
