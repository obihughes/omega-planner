## HabitsStorage

- Key: `omega-planner-habits-v1`
- Structure: `{ version, habits: Habit[], completionsByDate: Record<dateKey, Record<habitId, number>>, lastUpdated }`
- API:
  - `load()` → `{ habits, completionsByDate }`
  - `save(habits, completionsByDate)`

# Utility Functions Documentation

This document provides documentation for the utility functions available in the project.

## Available Utilities

### Formatters (`/utils/formatters.ts`)
Contains formatting utility functions for data transformation and display.

Functions:
- Date and time formatting
- Text formatting
- Number formatting
- Other data transformation utilities

### Storage (`/utils/storage.ts` and calendar/meals storage)
Contains utilities for handling data storage and persistence.

Functions:
- Local storage operations
- Data caching
- State persistence helpers

### Meals Storage (`/utils/mealsStorage.ts`)
- Persists meal plans per date with three slots: breakfast, lunch, dinner.
- Structure: `MealsStorageData` with `mealsByDate: Record<string, MealsBySlot>`.
- Helpers: `ensureMealsForDate()` to initialize per-date structure safely.

## Usage Guidelines

### Best Practices
1. Keep utility functions pure when possible
2. Use TypeScript for type safety
3. Document function parameters and return types
4. Include usage examples in comments
5. Write unit tests for utilities

### Function Structure
```typescript
/**
 * Description of what the function does
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 * @example
 * // Usage example
 * const result = utilityFunction(param);
 */
export function utilityFunction(param: ParamType): ReturnType {
  // implementation
}
```

## Adding New Utilities

When adding new utility functions:
1. Place them in the appropriate file based on functionality
2. If creating a new category, add a new file
3. Follow the TypeScript type system
4. Add JSDoc comments with examples
5. Update this documentation

## Testing Utilities

All utility functions should have corresponding test cases that:
1. Verify expected behavior
2. Test edge cases
3. Ensure type safety
4. Document usage examples

## Organization

Utilities are organized by their primary purpose:
- `formatters.ts` - Data formatting and transformation
- `storage.ts` - Data persistence and storage operations

When adding new utility files, follow the same pattern of grouping related functionality together.

## Task Utilities (`utils/taskUtils.ts`)

### Collision Detection and Resolution

#### `checkOverlap(task1Start, task1Duration, task2Start, task2Duration): boolean`
Determines if two tasks overlap in time.

**Parameters:**
- `task1Start`: Start hour of the first task
- `task1Duration`: Duration in hours of the first task  
- `task2Start`: Start hour of the second task
- `task2Duration`: Duration in hours of the second task

**Returns:** `true` if tasks overlap, `false` otherwise

#### `resolveCollisionsForResize(taskToResizeDetails, proposedStartHour, proposedDuration, allTasks, edgeBeingResized): CollisionResolutionResizeResult`
Handles collision resolution when resizing tasks.

#### `resolveCollisionsForDrag(draggedTaskDetails, proposedStartHour, targetDateKey, allTasks, timelineStartHour, timelineEndHour): CollisionResolutionDragResult`
**Enhanced collision resolution for drag operations with improved date handling.**

Resolves conflicts when dragging tasks to new positions, ensuring proper placement and avoiding overlaps.

**Parameters:**
- `draggedTaskDetails`: Essential details of the task being dragged (id, duration, baseDate)
- `proposedStartHour`: The proposed new start hour
- `targetDateKey`: Target date in YYYY-MM-DD format
- `allTasks`: Array of all tasks for conflict checking
- `timelineStartHour`: Earliest valid hour
- `timelineEndHour`: Latest valid hour

**Returns:** Object with `snappedNewStartHour` and `canMove` boolean

**Key Features:**
- Automatically finds available space when conflicts occur
- Respects timeline boundaries
- Snaps to 15-minute intervals
- Proper date-based task filtering

**Recent Improvements:**
- Enhanced date key consistency for cross-day drag operations
- Improved conflict detection accuracy
- Better handling of edge cases in collision resolution

## Date Utilities (`utils/dateUtils.ts`)

### Date Key Management
All date utilities use consistent YYYY-MM-DD format for reliable date operations. Always prefer passing date keys (YYYY-MM-DD) between pages and parsing them using local-safe helpers to avoid UTC off-by-one shifts.

#### `getDateKeyFromOffset(dayOffset): string`
Generates date key for today + offset days.

#### `dateFromDateKey(dateKey): Date`
Converts YYYY-MM-DD string to Date object using a noon-time construction to avoid timezone shifts.

#### `getTodayDateKey(): string`
Gets today's date in YYYY-MM-DD format.

#### `getCalendarDateForColumn(columnDayOffset): string`
Helper for getting date keys for timeline columns.

**Important:** All date utilities are timezone-safe and use consistent formatting to prevent date-related bugs in drag and drop operations. The calendar now also persists dates as YYYY-MM-DD keys (`dateKey`, `startDateKey`, `endDateKey`) and reconstructs `Date` objects at runtime to match the daily planner's `baseDate` convention.

### Navigation Best Practices
- When navigating from monthly calendar to daily planner, build `?date=` using a local-safe YYYY-MM-DD string, not `toISOString()`.
- When reading `?date=` on the home page, detect YYYY-MM-DD and parse with `dateFromDateKey`.
- For cross-view persistence like "Back to Calendar", store `lastCalendarDate` as a YYYY-MM-DD key and reuse it directly in URLs.

## Storage Utilities (`utils/storage.ts`)

### Task Persistence
Handles local storage operations for tasks, inbox tasks, and planner settings.

#### `TaskStorage.save(tasks)`
Persists main timeline tasks.

#### `TaskStorage.load()`
Retrieves saved timeline tasks.

#### `TaskStorage.savePoolTasks(tasks)`
Persists task inbox.

#### `TaskStorage.loadPoolTasks()`
Retrieves task inbox.

## Formatter Utilities (`utils/formatters.ts`)

### Time Display
Handles consistent time formatting across the application.

#### `formatTime(hour): string`
Converts decimal hour to readable time format (e.g., 14.5 → "2:30 PM").

#### `formatDuration(hours): string`
Formats duration for display. 