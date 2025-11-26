/**
 * Base Task interface representing a task in the planner
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  
  /** Name/title of the task */
  name: string;
  
  /** Start time in decimal hours (e.g., 8.5 for 8:30 AM). Undefined for unscheduled/pool tasks */
  startHour?: number;
  
  /** Duration in decimal hours (e.g., 1.5 for 1 hour 30 minutes) */
  duration: number;
  
  /** CSS background color class for the task (Tailwind class name) */
  color: string;
  
  /**
   * Calendar date in YYYY-MM-DD format (e.g., "2023-10-27").
   * Represents the day this task is scheduled for, without timezone information.
   */
  baseDate: string;
  
  /** Notes associated with the task */
  notes: string;
  
  /** Indicates whether the task is completed */
  completed: boolean;
  
  /** ISO timestamp when the task (or pool entry) was created */
  createdAt?: string;
  
  /** Whether this inbox task should automatically roll over to today */
  autoRollover?: boolean;
  
  /** Indicates whether the task is new */
  isNew?: boolean;
  
  /** 
   * Inbox date in YYYY-MM-DD format for unscheduled tasks.
   * When set, indicates this task is in the inbox for a specific date
   */
  poolDate?: string;

  /** 
   * When true, this task will be displayed on the monthly calendar view
   * regardless of whether it is scheduled or not.
   */
  isMonthlyPinned?: boolean;
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

/**
 * Saved Day interface representing a named day template
 */
export interface SavedDay {
  /** Unique identifier for the saved day */
  id: string;

  /** Name/title of the saved day */
  name: string;

  /** Date key in YYYY-MM-DD format */
  dateKey: string;

  /** Timestamp when the saved day was created */
  createdAt: string;
}

/**
 * Class schedule task interface representing a recurring class entry
 * stored by day-of-week instead of a specific calendar date.
 *
 * dayOfWeek follows JavaScript's convention: 0 = Sunday, 6 = Saturday.
 */
export interface ClassScheduleTask {
  /** Unique identifier for the class task */
  id: string;

  /** Name/title of the class (e.g., \"Math 101\") */
  name: string;

  /** Start time in decimal hours (e.g., 8.5 for 8:30 AM) */
  startHour: number;

  /** Duration in decimal hours */
  duration: number;

  /** CSS background color class for the task (Tailwind class name) */
  color: string;

  /** Notes associated with the class */
  notes: string;

  /** Completion flag (not typically used for recurring classes but kept for consistency) */
  completed: boolean;

  /** Day of week this class belongs to (0 = Sunday ... 6 = Saturday) */
  dayOfWeek: number;

  /** ISO timestamp when the class entry was created */
  createdAt?: string;

  /** ISO timestamp when the class entry was last updated */
  updatedAt?: string;
}

/**
 * Storage payload for class schedule tasks
 */
export interface ClassScheduleStorageData {
  /** Version of the storage schema */
  version: string;

  /** Array of recurring class schedule tasks */
  tasks: ClassScheduleTask[];

  /** Timestamp of when the data was last updated */
  lastUpdated: string;
}
 