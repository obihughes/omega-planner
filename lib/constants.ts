/**
 * Available color options for tasks in the daily planner
 * Simplified to 18 meaningful colors in a 6x3 grid
 */
export const TASK_COLORS = [
  // Row 1: Warm colors
  'bg-red-500',      // Red
  'bg-orange-500',   // Orange  
  'bg-amber-500',    // Amber
  'bg-yellow-500',   // Yellow
  'bg-lime-500',     // Lime
  'bg-green-500',    // Green

  // Row 2: Cool colors
  'bg-emerald-500',  // Emerald
  'bg-teal-500',     // Teal
  'bg-cyan-500',     // Cyan
  'bg-sky-500',      // Sky Blue
  'bg-blue-500',     // Blue
  'bg-indigo-500',   // Indigo

  // Row 3: Purples and neutrals
  'bg-violet-500',   // Violet
  'bg-purple-500',   // Purple
  'bg-fuchsia-500',  // Fuchsia
  'bg-pink-500',     // Pink
  'bg-slate-500',    // Slate
  'bg-gray-500',     // Gray
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
export const GRID_LINE_STYLE = "border-l-2 border-gray-200 dark:border-gray-700 z-10"; // Light/dark theme adaptable

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