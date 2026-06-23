/**
 * Export all types from a single entry point for cleaner imports
 */

export type { 
  Task, 
  StorageData, 
  PinnedTask 
} from './planner';

// Weekly Goals
export type { WeeklyGoal, ImportantDate, WeekGoals, WeeklyGoalsStorageData } from './goals';

// Export all project-related types including the new SubTask
export type {
  Project,
  ProjectTask,
  SubTask,
  ProjectFolder,
  ProjectsStorageData,
  ProjectSeries,
} from './projects';

export type {
  Document,
  DocumentFolder,
  DocumentsStorageData,
  DocumentEditorProps,
  DocumentListProps
} from './documents';

export type {
  CalendarEvent,
  CalendarPeriod,
  CalendarData,
  MonthlyEvents,
  DayInfo,
  PeriodPosition,
  CalendarProps
} from './calendar';

export type {
  MealItem,
  MealIngredient,
  MealsStorageData
} from './meals';

export type { Subject, StudyEntry, StudyStorageData } from './study';

export type { TodoItem, TodoStorageData } from './todo';

export type {
  HierarchyGoalItem,
  HierarchyDaySlot,
  HierarchyWeekSlot,
  HierarchyMonthSlot,
  GoalHierarchyStorageData,
} from './goalHierarchy';
export { GOAL_HIERARCHY_WEEKDAY_COUNT } from './goalHierarchy';

export type {
  MonthBoardNote,
  MonthBoardWeekSlot,
  MonthBoardState,
  MonthNoteSource,
  MonthNoteTarget,
} from './monthBoard';
export { MONTH_BOARD_WEEK_COUNT, DAYS_PER_WEEK } from './monthBoard';