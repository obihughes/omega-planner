/** Checkable sub-goal at any hierarchy level */
export interface HierarchyGoalItem {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

/** One day slot (Mon–Sun). Goals are stored as plain text in `summary` (bullets, checkboxes, multiline). */
export interface HierarchyDaySlot {
  dateKey: string;
  /** Free-form day goals: plain text, `•` bullets, `[ ]` / `[x]` checkboxes. */
  summary: string;
  /** Legacy field; no longer used for day goals. Kept for storage compatibility. */
  items: HierarchyGoalItem[];
}

/** One week within a calendar month */
export interface HierarchyWeekSlot {
  weekIndex: number;
  weekStartKey: string;
  summary: string;
  items: HierarchyGoalItem[];
  days: HierarchyDaySlot[];
}

/** One calendar month */
export interface HierarchyMonthSlot {
  monthKey: string;
  summary: string;
  items: HierarchyGoalItem[];
  weeks: HierarchyWeekSlot[];
}

export interface GoalHierarchyStorageData {
  version: string;
  months: Record<string, HierarchyMonthSlot>;
  lastUpdated: string;
}

/** Full week stored per slot (Mon–Sun). */
export const GOAL_HIERARCHY_WEEKDAY_COUNT = 7;

/** Primary row in the day grid (Mon–Fri). */
export const GOAL_HIERARCHY_PRIMARY_ROW_COUNT = 5;

/** Secondary row in the day grid (Sat–Wed preview). */
export const GOAL_HIERARCHY_PREVIEW_ROW_COUNT = 5;
