/**
 * Available color options for tasks in the daily planner
 * Each color includes both light and dark mode variants
 */
export const TASK_COLORS = [
  "bg-red-300 dark:bg-red-700",
  "bg-red-200 dark:bg-red-600",     // Lighter Red
  "bg-rose-300 dark:bg-rose-700",
  "bg-pink-300 dark:bg-pink-700",
  "bg-orange-300 dark:bg-orange-700",
  "bg-amber-300 dark:bg-amber-700",
  "bg-yellow-300 dark:bg-yellow-700", 
  "bg-yellow-200 dark:bg-yellow-500", // Lighter Yellow
  // Row 2: Greens -> Blues
  "bg-lime-300 dark:bg-lime-700",
  "bg-green-300 dark:bg-green-700",
  "bg-green-200 dark:bg-green-600",   // Lighter Green
  "bg-emerald-300 dark:bg-emerald-700",
  "bg-teal-300 dark:bg-teal-700",
  "bg-cyan-300 dark:bg-cyan-700",
  "bg-sky-300 dark:bg-sky-700",
  "bg-blue-300 dark:bg-blue-700",
  // Row 3: Blues -> Purples -> Greys
  "bg-blue-200 dark:bg-blue-600",    // Lighter Blue
  "bg-indigo-300 dark:bg-indigo-700",
  "bg-violet-300 dark:bg-violet-700",
  "bg-purple-300 dark:bg-purple-700",
  "bg-fuchsia-300 dark:bg-fuchsia-700",
  "bg-gray-300 dark:bg-gray-600",    // Grey 1
  "bg-slate-300 dark:bg-slate-600",   // Grey 2
  "bg-stone-300 dark:bg-stone-600",   // Grey 3 (Brownish)
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