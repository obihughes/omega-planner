// Task interface for the planner
export interface Task {
  id: string;
  name: string;
  startHour: number;
  duration: number;
  dayOffset: number;
  color?: string;
}

// Storage data interface
export interface StorageData {
  version: string;
  tasks: Task[];
  lastUpdated: string;
}

export interface PinnedTask extends Task {
  dueDate: Date;      // Calculated absolute due date/time
  originalId: string; // The ID of the task instance on the timeline that was pinned
  pinnedId: string;   // A unique ID for this pinned instance itself
} 