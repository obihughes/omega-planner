/**
 * Available color options for tasks in the daily planner.
 * Each color string now includes classes for both light and dark modes
 * to ensure high contrast and readability in either theme.
 * Light mode: Rich, dark background with light text.
 * Dark mode: Softer, light background with dark text.
 */
export const TASK_COLORS = [
  // Row 1: Warm colors
  'bg-red-600 text-white dark:bg-red-200 dark:text-red-900',      // Deep Red
  'bg-orange-600 text-white dark:bg-orange-200 dark:text-orange-900',   // Deep Orange  
  'bg-amber-600 text-white dark:bg-amber-200 dark:text-amber-900',    // Deep Amber
  'bg-yellow-600 text-white dark:bg-yellow-200 dark:text-yellow-900',   // Deep Yellow
  'bg-lime-600 text-white dark:bg-lime-200 dark:text-lime-900',     // Deep Lime
  'bg-green-600 text-white dark:bg-green-200 dark:text-green-900',    // Deep Green

  // Row 2: Cool colors
  'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-emerald-900',  // Deep Emerald
  'bg-teal-600 text-white dark:bg-teal-200 dark:text-teal-900',     // Deep Teal
  'bg-cyan-600 text-white dark:bg-cyan-200 dark:text-cyan-900',     // Deep Cyan
  'bg-sky-600 text-white dark:bg-sky-200 dark:text-sky-900',      // Deep Sky Blue
  'bg-blue-600 text-white dark:bg-blue-200 dark:text-blue-900',     // Deep Blue
  'bg-indigo-600 text-white dark:bg-indigo-200 dark:text-indigo-900',   // Deep Indigo

  // Row 3: Purples and neutrals
  'bg-violet-600 text-white dark:bg-violet-200 dark:text-violet-900',   // Deep Violet
  'bg-purple-600 text-white dark:bg-purple-200 dark:text-purple-900',   // Deep Purple
  'bg-fuchsia-600 text-white dark:bg-fuchsia-200 dark:text-fuchsia-900',  // Deep Fuchsia
  'bg-pink-600 text-white dark:bg-pink-200 dark:text-pink-900',     // Deep Pink
  'bg-slate-600 text-white dark:bg-slate-300 dark:text-slate-900',    // Deep Slate
  'bg-gray-600 text-white dark:bg-gray-300 dark:text-gray-900',     // Deep Gray
];

/** The earliest hour shown on the timeline (4 AM) */
export const TIMELINE_START_HOUR = 4;

/** The latest hour shown on the timeline (1 AM next day) */
export const TIMELINE_END_HOUR = 25; // Extends to 1 AM next day for overnight tasks

/** Minimum duration of a task in hours (15 minutes) */
export const MIN_TASK_DURATION = 0.25; 

/** Horizontal pixels per hour on the timeline */
export const PIXELS_PER_HOUR = 140; 

/** Horizontal pixels per minute on the timeline */
export const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

/** Default duration for newly created tasks (1 hour) */
export const DEFAULT_TASK_DURATION = 1;

/** Default day offset for the top timeline (Today) */
export const DEFAULT_TOP_DAY_OFFSET = 0;

/** Default day offset for the bottom timeline (Next Day) */
export const DEFAULT_BOTTOM_DAY_OFFSET = 1; 

/** Default color index for newly created tasks (Blue) */
export const DEFAULT_TASK_COLOR_INDEX = 10;

// Constants from DailyPlanner.tsx
export const TIMELINE_COLUMN_HEIGHT = 100;
export const TASK_BASE_TOP = 0;
export const TASK_BASE_BOTTOM_PADDING = 33;
// TASK_HEIGHT is derived: TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING;
// It can be calculated where needed or defined here if preferred, like:
// export const TASK_HEIGHT = TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING;
export const TIMELINE_SPLIT_HOUR_1 = 11; // Morning/Afternoon split
export const TIMELINE_SPLIT_HOUR_2 = 18; // Afternoon/Evening split
export const TIMELINE_HEADER_HEIGHT_PX = 28;
export const GRID_LINE_STYLE = "border-l border-border/20 z-10"; // Subtle solid lines instead of dashed

/** Duration options for task editing modals */
export const DURATION_OPTIONS = [
    { value: 0.25, label: '15 minutes' },
    { value: 0.5, label: '30 minutes' },
    { value: 0.75, label: '45 minutes' },
    { value: 1, label: '1 hour' },
    { value: 1.5, label: '1 hour 30 minutes' },
    { value: 2, label: '2 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
    { value: 6, label: '6 hours' },
    { value: 8, label: '8 hours' }
]; 