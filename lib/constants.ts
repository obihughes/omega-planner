/**
 * Available color options for tasks in the daily planner
 * Each color includes both light and dark mode variants
 */
export const TASK_COLORS = [
  // Row 1: Vibrant Reds, Pinks, Oranges
  'bg-red-500 dark:bg-red-700',          // Vibrant Red
  'bg-rose-500 dark:bg-rose-700',        // Vibrant Rose
  'bg-pink-500 dark:bg-pink-700',        // Vibrant Pink
  'bg-orange-500 dark:bg-orange-700',    // Vibrant Orange
  'bg-amber-500 dark:bg-amber-700',      // Vibrant Amber
  'bg-yellow-500 dark:bg-yellow-700',    // Vibrant Yellow

  // Row 2: Vibrant Greens, Teals, Cyans
  'bg-lime-500 dark:bg-lime-700',        // Vibrant Lime
  'bg-green-500 dark:bg-green-700',      // Vibrant Green
  'bg-emerald-500 dark:bg-emerald-700',  // Vibrant Emerald
  'bg-teal-500 dark:bg-teal-700',        // Vibrant Teal
  'bg-cyan-500 dark:bg-cyan-700',        // Vibrant Cyan
  'bg-sky-500 dark:bg-sky-700',          // Vibrant Sky Blue

  // Row 3: Vibrant Blues, Indigos, Purples
  'bg-blue-500 dark:bg-blue-700',        // Vibrant Blue (Index 12)
  'bg-indigo-500 dark:bg-indigo-700',    // Vibrant Indigo
  'bg-violet-500 dark:bg-violet-700',    // Vibrant Violet
  'bg-purple-500 dark:bg-purple-700',    // Vibrant Purple
  'bg-fuchsia-500 dark:bg-fuchsia-700',  // Vibrant Fuchsia
  'bg-magenta-500 dark:bg-magenta-700',  // Vibrant Magenta
  
  // Row 4: Neutral but modern grays and earth tones
  'bg-slate-500 dark:bg-slate-700',      // Modern Slate
  'bg-zinc-500 dark:bg-zinc-700',        // Modern Zinc  
  'bg-stone-500 dark:bg-stone-700',      // Modern Stone
  'bg-gray-500 dark:bg-gray-700',        // Modern Gray
  'bg-neutral-500 dark:bg-neutral-700',  // Modern Neutral
  'bg-gray-600 dark:bg-gray-800',        // Dark Gray
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

/** Default color index for newly created tasks (Vibrant Blue) */
export const DEFAULT_TASK_COLOR_INDEX = 12;

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