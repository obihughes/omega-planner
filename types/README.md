# TypeScript Types

This directory contains TypeScript type definitions used throughout the application.

## Core Types

### Task

The `Task` interface represents a single task in the planner timeline:

```typescript
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
}
```

### PinnedTask

The `PinnedTask` interface extends `Task` with additional properties specific to pinned tasks:

```typescript
export interface PinnedTask extends Task {
  /** Calculated absolute due date/time */
  dueDate: Date;
  
  /** The ID of the task instance on the timeline that was pinned */
  originalId: string;
  
  /** A unique ID for this pinned instance itself */
  pinnedId: string;
}
```

### StorageData

The `StorageData` interface is used for persisting tasks to localStorage:

```typescript
export interface StorageData {
  /** Version of the storage schema */
  version: string;
  
  /** Array of tasks to be stored */
  tasks: Task[];
  
  /** Timestamp of when the data was last updated */
  lastUpdated: string;
}
```

### Calendar Types

The calendar aligns with the daily planner's date handling by persisting date-only strings and using `Date` objects in UI:

```typescript
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  // UI/runtime representation
  date: Date;
  // Storage-friendly representation (YYYY-MM-DD)
  dateKey?: string;
  color: string;
  type: 'event';
}

export interface CalendarPeriod {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  // UI/runtime representation
  startDate: Date;
  endDate: Date;
  // Storage-friendly representation (YYYY-MM-DD)
  startDateKey?: string;
  endDateKey?: string;
  color: string;
  type: 'period';
}
```

## Test Types

The `testing-library.d.ts` file extends Jest's matcher types to include the additional matchers provided by `@testing-library/jest-dom`, such as `toBeInTheDocument()`, `toBeVisible()`, etc. 