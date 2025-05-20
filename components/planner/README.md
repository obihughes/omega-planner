# Planner Components

This directory contains the core components for the Daily Planner application.

## Components

### DailyPlanner

`DailyPlanner` is the main orchestrator component that renders the entire planner interface including:
- Timeline views for multiple days
- Task cards within timelines
- Sidebar with task pool and pinned tasks
- Modal dialogs for editing, confirmation, etc.

**Usage:**
```jsx
import { DailyPlanner } from '@/components/planner';

export default function PlannerPage() {
  return <DailyPlanner />;
}
```

### TaskCard

`TaskCard` is a reusable component that represents a single task in the timeline.

**Features:**
- Displays task name, time range, and duration
- Handles inline editing
- Provides buttons for actions (edit, copy, pin)
- Supports dragging and resizing

**Props:**
```typescript
export interface TaskCardProps {
  task: Task;
  height: number;
  onStartEdit: (task: Task) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;
  onDelete: (taskId: string) => void;
  onCopy: (task: Task) => void;
  onColorChange: (taskId: string, color: string) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  onMoveToPool: (taskId: string) => void;
  onPinTask?: (task: Task) => void;
}
```

### TaskPoolSidebar

`TaskPoolSidebar` manages the "unscheduled" tasks that aren't currently on the timeline.

**Features:**
- Displays a list of tasks in the pool
- Allows adding new tasks to the pool
- Provides buttons to copy tasks to the timeline
- Allows editing and deleting pool tasks

### PinnedTasksSidebar

`PinnedTasksSidebar` displays tasks that have been pinned for quick access.

**Features:**
- Shows pinned tasks sorted by due time
- Displays time remaining for each task
- Allows unpinning tasks 