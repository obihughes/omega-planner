# Projects Components

This directory contains components for project management functionality.

## Components

### ProjectCard
Displays individual project cards with progress indicators, status, and management actions.

Notes:
- The click target is limited to the visible card surface to avoid accidental opens when clicking empty grid space.
- Archived view: action buttons (Restore/Delete) are rendered below the header so the project name has full width and never gets truncated by actions. On small screens the actions show icons-only; labels appear from `lg` breakpoint and up.

### TaskItem  
Shows individual project tasks within project detail views, with drag-and-drop support.

### TaskListView
**NEW**: A Google Tasks-like interface for managing all project tasks in one unified view.

#### Features
- **Unified Task View**: Shows all tasks from all active projects in one place
- **Flexible Grouping**: Group by project, status, or show ungrouped flat list
- **Compact Design**: Efficient space usage with inline search and controls
- **Square Checkboxes**: Strong visual feedback with square checkboxes and bold check marks
- **Prominent Task Names**: Task titles displayed prominently with larger, bold text
- **Quick Add**: Fast task creation with compact project selection
- **Inline Editing**: Click task titles, descriptions, or due dates to edit in-place
- **Advanced Filtering**: Filter by priority, due date ranges, and status with visual indicators
- **Flexible Sorting**: Sort by title, due date, priority, status, or creation date (asc/desc)
- **Smart Due Dates**: Only shows due dates when set, with clear overdue indicators
- **Priority Indicators**: Visual indicators for urgent and high priority tasks
- **Project Context**: When grouped by status, shows which project each task belongs to
- **Completion Tracking**: Compact completion count in header

#### Usage
```tsx
import { TaskListView } from '@/components/projects/TaskListView';

function ProjectsPage() {
  return (
    <div>
      <TaskListView />
    </div>
  );
}
```

#### Integration
- Uses `useProjects` hook for all data operations
- Automatically syncs with existing project tasks
- Maintains consistency with project detail views
- No new data models - extends existing `ProjectTask` interface

#### Google Tasks-Like UX
- Clean, minimal interface focused on task completion
- Keyboard support (Enter to add tasks, Escape to cancel edits)
- Collapsible sections to reduce visual clutter
- Clear completion states with strikethrough text
- Quick visual scanning with consistent layout
- Inline editing with hover indicators for discoverability
- Smart filtering with visual active filter indicators
- Intuitive sorting controls with clear current state

## Hook Integration

### useProjects
Extended with new functions:
- `getAllProjectTasks()`: Returns all tasks with project metadata
- `getTaskStats()`: Provides task statistics (total, completed, overdue, etc.)

## Navigation

The TaskListView is accessible via the main navigation under Projects → Tasks, which navigates to `/projects/tasks`. This provides:
- Dedicated route for task management
- Direct access from main navigation
- Integration with the sidebar navigation structure
- Consistent with other feature routing patterns

Main navigation structure under Task Manager:
- Projects (`/projects`)
- Tasks (`/projects/tasks`) 
- Calendar View (`/projects` with calendar view)

## Projects Page

- A "New Folder" button is available in the header to create folders using the folder modal.
- Folders and projects can be shown together in a grid; folder cards use a square aspect to align heights with project cards.

This provides a dedicated space for task-focused workflows while maintaining easy access to project management features. 