/**
 * Available color options for tasks in the daily planner.
 * Uses consistent background colors across light and dark modes,
 * but adapts text colors for proper contrast in each theme.
 * Both modes: Rich, dark backgrounds
 * Light mode: White text for contrast
 * Dark mode: Black text for contrast
 */
export const TASK_COLORS = [
  // Row 1: Warm colors
  'bg-red-600 text-white dark:bg-red-600 dark:text-black',      // Deep Red
  'bg-orange-600 text-white dark:bg-orange-600 dark:text-black',   // Deep Orange  
  'bg-amber-600 text-white dark:bg-amber-600 dark:text-black',    // Deep Amber
  'bg-yellow-600 text-white dark:bg-yellow-600 dark:text-black',   // Deep Yellow
  'bg-lime-600 text-white dark:bg-lime-600 dark:text-black',     // Deep Lime
  'bg-green-600 text-white dark:bg-green-600 dark:text-black',    // Deep Green

  // Row 2: Cool colors
  'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-black',  // Deep Emerald
  'bg-teal-600 text-white dark:bg-teal-600 dark:text-black',     // Deep Teal
  'bg-cyan-600 text-white dark:bg-cyan-600 dark:text-black',     // Deep Cyan
  'bg-sky-600 text-white dark:bg-sky-600 dark:text-black',      // Deep Sky Blue
  'bg-blue-600 text-white dark:bg-blue-600 dark:text-black',     // Deep Blue
  'bg-indigo-600 text-white dark:bg-indigo-600 dark:text-black',   // Deep Indigo

  // Row 3: Purples and neutrals
  'bg-violet-600 text-white dark:bg-violet-600 dark:text-black',   // Deep Violet
  'bg-purple-600 text-white dark:bg-purple-600 dark:text-black',   // Deep Purple
  'bg-fuchsia-600 text-white dark:bg-fuchsia-600 dark:text-black',  // Deep Fuchsia
  'bg-pink-600 text-white dark:bg-pink-600 dark:text-black',     // Deep Pink
  'bg-slate-600 text-white dark:bg-slate-600 dark:text-black',    // Deep Slate
  'bg-gray-600 text-white dark:bg-gray-600 dark:text-black',     // Deep Gray
];

/** The earliest hour shown on the timeline (12 AM) */
export const TIMELINE_START_HOUR = 0;

/** The latest hour shown on the timeline (12 AM next day) */
export const TIMELINE_END_HOUR = 24; 

/** Minimum duration of a task in hours (15 minutes) */
export const MIN_TASK_DURATION = 0.25; 

/** Horizontal pixels per hour on the timeline */
export const PIXELS_PER_HOUR = 215; 

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
export const TIMELINE_COLUMN_HEIGHT = 120;
export const TASK_BASE_TOP = 0;
export const TASK_BASE_BOTTOM_PADDING = 24;
// TASK_HEIGHT is derived: TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING;
// It can be calculated where needed or defined here if preferred, like:
// export const TASK_HEIGHT = TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING;
export const TIMELINE_SPLIT_HOUR_1 = 6;  // 12am-6am
export const TIMELINE_SPLIT_HOUR_2 = 12; // 6am-12pm
export const TIMELINE_SPLIT_HOUR_3 = 18; // 12pm-6pm
// The last segment is from 18 to 24 (6pm-12am)
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

export const TASK_POOL_ITEM_HEIGHT = 90;