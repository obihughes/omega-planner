/**
 * Available color options for tasks in the daily planner
 * Using deeper, richer colors (600-level) for better visual impact
 */
export const TASK_COLORS = [
  // Row 1: Warm colors
  'bg-red-600',      // Deep Red
  'bg-orange-600',   // Deep Orange  
  'bg-amber-600',    // Deep Amber
  'bg-yellow-600',   // Deep Yellow
  'bg-lime-600',     // Deep Lime
  'bg-green-600',    // Deep Green

  // Row 2: Cool colors
  'bg-emerald-600',  // Deep Emerald
  'bg-teal-600',     // Deep Teal
  'bg-cyan-600',     // Deep Cyan
  'bg-sky-600',      // Deep Sky Blue
  'bg-blue-600',     // Deep Blue
  'bg-indigo-600',   // Deep Indigo

  // Row 3: Purples and neutrals
  'bg-violet-600',   // Deep Violet
  'bg-purple-600',   // Deep Purple
  'bg-fuchsia-600',  // Deep Fuchsia
  'bg-pink-600',     // Deep Pink
  'bg-slate-600',    // Deep Slate
  'bg-gray-600',     // Deep Gray
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