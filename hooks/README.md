# Custom Hooks

This directory contains custom React hooks used throughout the application.

## Available Hooks

### useDailyPlanner

`useDailyPlanner` is the main state management hook for the planner application. It handles:

- Core data state (tasks, poolTasks, pinnedTasks)
- UI state (active tab, dragging/resizing state, modals)
- Task manipulation functions (add, delete, update)
- Batch pool helpers (`addPoolTasksForDate` for Plan Day quick entry)
- Copy helpers: `copyTaskToPool(task | id)` adds an unscheduled copy to that day's date-specific pool (task-card Copy). `startCopy` / `handleDropCopy` remain for edit-modal click-to-paste.
- Data persistence via localStorage

**Usage:**
```jsx
import { useDailyPlanner } from '@/hooks';

function YourComponent() {
  const { 
    tasks, 
    handleAddTask, 
    handleDeleteTask, 
    // ...other state and functions 
  } = useDailyPlanner();

  // Use the state and functions in your component
}
```

### useModalManager

`useModalManager` centralizes all modal-related state and functionality to keep the main planner hook cleaner.

**Features:**
- Manages edit task modals
- Handles color pickers
- Controls confirmation dialogs
- Provides utility functions for all modal interactions

**Usage:**
```jsx
import { useModalManager } from '@/hooks';

function YourComponent() {
  const modalManager = useModalManager({
    onUpdateTask: handleUpdateTask,
    onUpdatePoolTask: handleUpdatePoolTask,
    onClearPool: clearPool,
    onCloneTasks: cloneDayTasks,
    topDayOffset: topDayOffset
  });

  const {
    openEditModal,
    closeEditModal,
    saveTaskFromModal,
    // ...other modal functions and state
  } = modalManager;

  // Use the modal functions in your component
}
```

### useMeals

LocalStorage-backed meals list for the Meals page (`/meals`).

**API:** `meals`, `hydrated`, `add({ name, ingredients })`, `update(id, partial)`, `remove(id)`

Migrates legacy `omega-planner-recipes` data on first load when meals storage is empty.

### useMealsNotes

Debounced localStorage scratchpad for the Meals page left notes panel.

**API:** `text`, `setNotes(value)`, `hydrated`

**Storage key:** `omega-planner-meals-notes-v1` (`utils/mealsNotesStorage.ts`)

### useDayNotes

Debounced localStorage map of per-day notes for the Daily Planner weekly timeline view.

**API:** `getNotes(dateKey)`, `setNotes(dateKey, text)`, `deleteNotes(dateKey)`, `hasNotes(dateKey)`, `flushNotes()`, `hydrated`, `notesByDate`

**Storage key:** `daily-planner-day-notes-v1` (`utils/dayNotesStorage.ts`)

### useCalendarData

Shared calendar events/periods store (`omega-calendar-data`) via `useSyncExternalStore`. Hydrates without a blocking spinner. Mutations persist immediately; multiple hook instances share one in-memory snapshot.

**API:** `data`, `isLoading` (always `false`, kept for callers), `addEvent`, `updateEvent`, `deleteEvent`, `addPeriod`, `updatePeriod`, `deletePeriod`, `clearAllData`, `resetToDefault`, `importData`, `exportData`

**Storage key:** `omega-calendar-data`

### usePrimaryGoalCalendarEvents

Builds read-only `CalendarEvent`s from Weekly Overview goals whose `goalType` is `primary`. Reads `omega-planner-weekly-goals-v1` through `GoalsStorage.loadAll()` in an effect, so server and client first paint match. Reloads on mount, on the `storage` event for that key, on window `focus`, and on the same-tab `WEEKLY_GOALS_CHANGED_EVENT` (`omega:weekly-goals-changed`, dispatched by `GoalsStorage.saveAll`). The `storage` event does not fire in the tab that wrote, so the custom event keeps the Weekly View in sync after edits in its day popover. Each event has id `primary-goal:<goalId>`, `source: 'primary-goal'`, `readOnly: true`, and a hex color from `getGoalColorHex`. Goals with empty titles are skipped. Nothing is written to calendar storage. Consumers should use `useMergedCalendarEvents` rather than merging it themselves.

**API:** `usePrimaryGoalCalendarEvents(): CalendarEvent[]`

**Exports:** `PRIMARY_GOAL_EVENT_PREFIX` (`'primary-goal:'`)

**Storage key (read only):** `omega-planner-weekly-goals-v1`

### useMergedCalendarEvents

Single merge of calendar events and primary weekly goals. Wraps `useCalendarData()` and `usePrimaryGoalCalendarEvents()`. The merged list is memoized.

**Returns:** everything from `useCalendarData()`, plus:
- `mergedData: CalendarData`: `{ events: [...stored, ...primaryGoalEvents], periods }`. Use for read-only display (calendar month/year/timeline, Weekly View left column).
- `events: CalendarEvent[]`: `mergedData.events`.

`data` is intentionally the **raw** stored calendar data. `exportData` serializes `data`, so overriding it with merged events would write derived goal events back into calendar storage on export. CRUD (`addEvent`, `updateEvent`, `deleteEvent`) still acts on stored events only, and goal events are blocked by the read-only ID prefix in `app/calendar/page.tsx`.

**API:** `useMergedCalendarEvents(): ReturnType<typeof useCalendarData> & { mergedData: CalendarData; events: CalendarEvent[] }`

**Consumers:** `app/calendar/page.tsx`, `components/planner/WeeklyView.tsx`

### useClassScheduleState

Recurring class timetable for `/class-schedule`, stored by day-of-week. Starts empty and sets `hydrated` after reading localStorage so SSR matches the first client paint. Saves only after `hydrated` so the empty initial state cannot wipe storage. `initialShowDailyTasks` from the URL overrides the persisted Classes | Daily Tasks toggle.

**API:** `weekMeta`, `tasksByDate`, `classTasks`, `hydrated`, `showDailyTasks`, `setShowDailyTasks`, `upsertFromModal`, `deleteTaskById`, `updateClassTaskTime`

**Storage key:** `omega-planner-class-schedule` (`utils/classScheduleStorage.ts`)

### useSubjectsManager

Subjects and topics for the Subjects page (`/subjects`). Loads after mount and sets `hydrated`. Keeps `selectedSubjectId`; if that subject is deleted (or none is selected) it falls back to the first subject. A newly added subject becomes selected.

**API:** `hydrated`, `subjects`, `topics`, `selectedSubjectId`, `selectedSubject`, `selectedTopics`, `progressBySubject`, `selectSubject`, `addSubject(name, color?)`, `updateSubject`, `removeSubject`, `addTopic(subjectId, title, status?, notes?)`, `updateTopic`, `removeTopic`

**Exports:** `SUBJECT_COLORS`, `TopicProgress`

**Storage key:** `omega-planner-subjects-v1` (`utils/subjectsStorage.ts`)

### useTheme

Wraps `next-themes` for light, dark, forest, sunset, ocean, and system appearance.

**API:** `theme`, `resolvedTheme`, `setTheme`, `toggleTheme` (cycles light → dark → forest → sunset → ocean), `isDark`, `isLight`, `isForest`, `isSunset`, `isOcean`, `mounted`

**Exports:** `THEME_OPTIONS`, `THEME_LABELS`, `ThemeOption`

**Storage key:** `omega-planner-theme` (via `ThemeProvider` in `app/providers.tsx`)