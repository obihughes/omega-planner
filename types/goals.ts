/**
 * Weekly Goals types
 */

export interface WeeklyGoal {
  id: string;
  title: string;
  notes?: string;
  done: boolean;
  createdAt: string;
  linkedEventId?: string;
}

export interface ImportantDate {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  dateKey: string;
}

export interface WeekGoals {
  /** Monday week start in YYYY-MM-DD */
  weekStartKey: string;
  /** Map of YYYY-MM-DD -> up to 3 goals */
  goalsByDate: Record<string, WeeklyGoal[]>;
  importantDates: ImportantDate[];
  updatedAt: string;
}

export interface WeeklyGoalsStorageData {
  version: string;
  weeks: Record<string, WeekGoals>;
  lastUpdated: string;
}


