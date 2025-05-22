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
  'bg-blue-400 dark:bg-blue-800',        // Deep Blue
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

/** Default day offset for the bottom timeline (Yesterday) */
export const DEFAULT_BOTTOM_DAY_OFFSET = -1; 