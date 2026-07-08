# Custom Hooks

This directory contains custom React hooks used throughout the application.

## Available Hooks

### useDailyPlanner

`useDailyPlanner` is the main state management hook for the planner application. It handles:

- Core data state (tasks, poolTasks, pinnedTasks)
- UI state (active tab, dragging/resizing state, modals)
- Task manipulation functions (add, delete, update)
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

### useProjects

Reads from global `ProjectsProvider` (not per-page state). Provides projects, folders, tasks CRUD, series helpers, and `loading` (true only until the first localStorage hydrate).

**Usage:**
```jsx
import { useProjects } from '@/hooks';

function YourComponent() {
  const { projects, folders, createProject, addTaskToProject } = useProjects();
}
```

Must be used under `ProjectsProvider` in [`app/providers.tsx`](../app/providers.tsx).

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

### useTheme

Wraps `next-themes` for light, dark, forest, sunset, ocean, and system appearance.

**API:** `theme`, `resolvedTheme`, `setTheme`, `toggleTheme` (cycles light → dark → forest → sunset → ocean), `isDark`, `isLight`, `isForest`, `isSunset`, `isOcean`, `mounted`

**Exports:** `THEME_OPTIONS`, `THEME_LABELS`, `ThemeOption`

**Storage key:** `omega-planner-theme` (via `ThemeProvider` in `app/providers.tsx`)