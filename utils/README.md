# Utility Functions

This directory contains utility functions used throughout the application.

## Available Utilities

### Storage (storage.ts)

`TaskStorage` handles all interactions with localStorage for persistent storage of tasks, settings, and other data.

**Key Functions:**
- `save(tasks: Task[])`: Save tasks to localStorage
- `load(): Task[] | null`: Load tasks from localStorage
- `savePoolTasks(tasks: Task[])`: Save pool tasks to localStorage
- `loadPoolTasks(): Task[] | null`: Load pool tasks from localStorage
- `savePinnedTasks(tasks: PinnedTask[])`: Save pinned tasks to localStorage
- `loadPinnedTasks(): PinnedTask[] | null`: Load pinned tasks from localStorage
- `saveNextId(id: number)`: Save the next available task ID
- `loadNextId(): number | null`: Load the next available task ID
- `saveDayViewSettings(settings: DayViewSettings)`: Save day view settings
- `loadDayViewSettings(): DayViewSettings | null`: Load day view settings

**Usage:**
```typescript
import TaskStorage from '@/utils/storage';
// Or, using the barrel export:
import { TaskStorage } from '@/utils';

// Save tasks
TaskStorage.save(tasks);

// Load tasks
const loadedTasks = TaskStorage.load();
```

### Formatters (formatters.ts)

Formatting utilities for displaying time and duration values in a user-friendly way.

**Functions:**
- `formatTime(hour: number): string`: Format decimal hour to time string (e.g., 8.5 -> "8:30")
- `formatDuration(hours: number): string`: Format duration in hours to human-readable string

**Usage:**
```typescript
import { formatTime, formatDuration } from '@/utils/formatters';
// Or, using the barrel export:
import { formatTime, formatDuration } from '@/utils';

const timeString = formatTime(8.5); // "8:30"
const durationString = formatDuration(1.5); // "1h 30m"
``` 