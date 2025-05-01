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