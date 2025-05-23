/**
 * Available color options for tasks in the daily planner
 * Each color includes both light and dark mode variants
 */
export const TASK_COLORS = [
  // Row 1: Deep & Light Reds, Pinks, Oranges
  'bg-red-400 dark:bg-red-800',          // Deep Red
  'bg-red-200 dark:bg-red-600',          // Light Red
  'bg-pink-400 dark:bg-pink-800',        // Deep Pink
  'bg-pink-200 dark:bg-pink-600',        // Light Pink
  'bg-rose-200 dark:bg-rose-600',        // Light Rose (softer pink/red)
  'bg-orange-400 dark:bg-orange-800',    // Deep Orange
  'bg-orange-200 dark:bg-orange-600',    // Light Orange
  'bg-amber-200 dark:bg-amber-600',      // Light Amber (transition to yellow)

  // Row 2: Yellows, Greens, Teals, Cyans
  'bg-yellow-200 dark:bg-yellow-600',    // Light Yellow
  'bg-lime-200 dark:bg-lime-600',        // Light Lime Green
  'bg-emerald-400 dark:bg-emerald-800',  // Deep Emerald Green
  'bg-green-200 dark:bg-green-600',      // Light Green
  'bg-emerald-200 dark:bg-emerald-600',  // Light Emerald
  'bg-teal-200 dark:bg-teal-600',        // Light Teal
  'bg-cyan-400 dark:bg-cyan-800',        // Deep Cyan
  'bg-cyan-200 dark:bg-cyan-600',        // Light Cyan

  // Row 3: Sky Blues, Blues, Indigos, Violets, Purples
  'bg-sky-200 dark:bg-sky-600',          // Light Sky Blue
  'bg-blue-400 dark:bg-blue-800',        // Deep Blue (Index 16)
  'bg-blue-200 dark:bg-blue-600',        // Light Blue
  'bg-indigo-200 dark:bg-indigo-600',    // Light Indigo
  'bg-violet-200 dark:bg-violet-600',    // Light Violet
  'bg-purple-400 dark:bg-purple-800',    // Deep Purple
  'bg-purple-200 dark:bg-purple-600',    // Light Purple
  'bg-fuchsia-400 dark:bg-fuchsia-800',  // Deep Fuchsia
  
  // Row 4: Fuchsias & Greys
  'bg-fuchsia-200 dark:bg-fuchsia-600',  // Light Fuchsia
  'bg-slate-300 dark:bg-slate-700',      // Deeper Slate
  'bg-slate-200 dark:bg-slate-600',      // Light Slate
  'bg-zinc-300 dark:bg-zinc-700',        // Deeper Zinc
  'bg-zinc-200 dark:bg-zinc-600',        // Light Zinc
  'bg-gray-200 dark:bg-gray-600',        // Light Gray
  'bg-neutral-200 dark:bg-neutral-600',  // Light Neutral
  'bg-stone-200 dark:bg-stone-600',      // Light Stone
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

/** Default color index for newly created tasks (Deep Blue) */
export const DEFAULT_TASK_COLOR_INDEX = 16;

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
export const GRID_LINE_STYLE = "border-l-2 border-gray-400 z-10"; // Example, might need to be Tailwind class string 

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