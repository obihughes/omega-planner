/**
 * Export all utility functions from a single entry point for cleaner imports
 */

// Storage utilities
export { default as TaskStorage } from './storage';
export type { DayViewSettings } from './storage';

// Goals storage
export { GoalsStorage } from './goalsStorage';

// Formatting utilities
export { formatTime, formatDuration } from './formatters';

// Date utilities
export * from './dateUtils';

// Task utilities
export * from './taskUtils';

// Timeline drag utilities
export * from './timelineDragUtils';

// Class schedule import utilities
export * from './classScheduleUtils';

// Study storage
export { StudyStorage } from './studyStorage';

// Month board
export {
  MonthBoardStorage,
  getDefaultHorizonMondayKey,
  createInitialMonthBoardState,
  getWeekSlot,
  ensureWeekInState,
} from './monthBoardStorage';
export {
  getCurrentYear,
  getCurrentMonthKey as getMonthBoardCurrentMonthKey,
  getYearMonthKeys,
  getWeeksInMonth as getMonthBoardWeeksInMonth,
  getWeekDates,
  getWeekIndexContainingDate as getMonthBoardWeekIndexContainingDate,
  getDefaultWeekStartKeyForMonth,
  getAdjacentMonthKey,
  getPreviousWeek,
  getNextWeek,
  formatMonthLabel as formatMonthBoardMonthLabel,
  formatMonthShortLabel,
  monthKeyToDate as monthBoardMonthKeyToDate,
} from './monthBoardDates';

// Goal hierarchy (beta)
export {
  GoalHierarchyStorage,
  GOAL_HIERARCHY_STORAGE_KEY,
} from './goalHierarchyStorage';
export {
  getCurrentMonthKey,
  getMonthTabs,
  getWeeksInMonth,
  getWeekdayDates,
  getNextWeekStartKey,
  getWeekContextForDate,
  getWeekIndexContainingDate,
  formatMonthLabel,
  monthKeyToDate,
} from './goalHierarchyDates';