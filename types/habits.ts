export interface Habit {
  id: string;
  name: string;
  color?: string; // hex color like #10B981
  states?: HabitState[]; // custom states with label and opacity
  createdAt: string;
  updatedAt: string;
}

export interface HabitState {
  key: string; // unique key
  label: string; // e.g., "30 minutes", "1 hour", "1 bottle"
  level: number; // 1..N
  opacity: number; // 0..1 visual intensity
}

export interface HabitsStorageData {
  version: string;
  habits: Habit[];
  completionsByDate: Record<string, Record<string, number>>;
  lastUpdated: string;
}


