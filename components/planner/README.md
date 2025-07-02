# Planner Components

This directory contains the core components for the Daily Planner application.

## Components

### DailyPlanner

`DailyPlanner` is the main orchestrator component that renders the entire planner interface including:
- Timeline views for multiple days
- Task cards within timelines
- Sidebar with task pool, pinned tasks, and calendar assignment
- Modal dialogs for editing, confirmation, etc.

**Usage:**
```jsx
import { DailyPlanner } from '@/components/planner';

export default function PlannerPage() {
  return <DailyPlanner />;
}
```

### TaskAssignmentCalendar

`TaskAssignmentCalendar` is a calendar view component for assigning unscheduled tasks to specific dates.

**Features:**
- Month grid layout matching projects calendar style
- Visual display of pool tasks for assignment
- Drag & drop task assignment to dates
- Click-to-assign workflow (click task, then click date)
- Task rescheduling between dates
- Monthly navigation
- Summary statistics

**Integration:**
- Accessible via "Calendar" tab in daily planner sidebar
- Uses existing task pool and scheduled tasks data
- Integrates with task edit modal system

**Props:**
```typescript
interface TaskAssignmentCalendarProps {
  poolTasks: Task[];
  scheduledTasks: Map<string, Task[]>;
  onAssignTask: (task: Task, date: Date, startHour?: number) => void;
  onUnassignTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDate: Date) => void;
  openEditModal: (task: Task, options?: any) => void;
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
- Allows clearing all overdue pinned tasks
- Allows syncing pinned tasks with the timeline

### EditTaskModal

`EditTaskModal` is a dialog component used for creating new tasks or editing existing tasks (from the timeline, task pool, or pinned tasks).

**Features:**
- Form for task name, duration, color, notes, etc.
- Handles both new task creation and updates to existing tasks.
- Integrates with color picker.
- Provides actions like Pin, Copy to Pool, Delete.

### ViewTaskNotesModal

`ViewTaskNotesModal` is a dialog component used for displaying the full notes of a task.

**Features:**
- Read-only view of task notes.
- Option to quickly open the `EditTaskModal` for the viewed task. 