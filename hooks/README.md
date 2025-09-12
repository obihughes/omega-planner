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

### useMeals

`useMeals` provides localStorage-backed state for weekly meal planning.

**Features:**
- Add, remove, and update items per date and meal slot
- Automatic persistence and simple IDs
- Slot types: `breakfast | lunch | dinner`

**Usage:**
```tsx
import { useMeals } from '@/hooks';

function MealsExample() {
  const { getMeals, addMeal, removeMeal } = useMeals();
  const dateKey = '2025-09-12';
  const breakfast = getMeals(dateKey, 'breakfast');
  return (
    <div>
      <button onClick={() => addMeal(dateKey, 'breakfast', 'Oatmeal')}>Add</button>
      {breakfast.map(i => (
        <div key={i.id}>
          {i.name}
          <button onClick={() => removeMeal(dateKey, 'breakfast', i.id)}>x</button>
        </div>
      ))}
    </div>
  );
}
```

### usePantry

LocalStorage-backed pantry list with helper functions to determine if meals are cookable.

**API:**
- `items`: current pantry items
- `addItem(name, quantity?, category?)`
- `removeItem(id)` / `updateItem(id, updates)`
- `canCook(meal)` and `missingFor(meal)`