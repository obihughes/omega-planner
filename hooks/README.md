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

### usePantry

LocalStorage-backed pantry list for the Recipes page.

**API:**
- `items`: current pantry items
- `addItem(name, quantity?, category?)`
- `removeItem(id)` / `updateItem(id, updates)`

### useRecipes

LocalStorage-backed recipe management for the Recipes page.

**API:** `recipes`, `addRecipe`, `removeRecipe`, `updateRecipe`, `cookable`, `suggestedTiered`, `matchPercent`

### useShopping

LocalStorage-backed shopping list state.

**API:** `items`, `add(name, quantity?)`, `remove(id)`, `toggle(id)`, `update(id, updates)`, `clearChecked()`