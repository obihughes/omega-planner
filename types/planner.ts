/**
 * Base Task interface representing a task in the planner
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  
  /** Name/title of the task */
  name: string;
  
  /** Start time in decimal hours (e.g., 8.5 for 8:30 AM) */
  startHour: number;
  
  /** Duration in decimal hours (e.g., 1.5 for 1 hour 30 minutes) */
  duration: number;
  
  /** Day offset relative to base date (0 = today, 1 = tomorrow, -1 = yesterday) */
  dayOffset: number;
  
  /** CSS background color class for the task (Tailwind class name) */
  color?: string;
  
  /** ISO string of the date when the task was created (reference date for dayOffset) */
  baseDate: string;
  
  /** Notes associated with the task */
  notes?: string;
  
  /** Indicates whether the task is completed */
  completed?: boolean;
}

/**
 * Storage data interface for persisting tasks
 */
export interface StorageData {
  /** Version of the storage schema */
  version: string;
  
  /** Array of tasks to be stored */
  tasks: Task[];
  
  /** Timestamp of when the data was last updated */
  lastUpdated: string;
}

/**
 * Extended Task interface for tasks that have been pinned
 * Includes additional properties specific to pinned tasks
 */
export interface PinnedTask extends Task {
  /** Calculated absolute due date/time */
  dueDate: Date;
  
  /** The ID of the task instance on the timeline that was pinned */
  originalId: string;
  
  /** A unique ID for this pinned instance itself */
  pinnedId: string;
} 