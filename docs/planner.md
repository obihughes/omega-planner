# Daily Planner Component

The Daily Planner is the core component for task scheduling and timeline management.

## Features

### Drag and Drop
- **Task Movement**: Drag tasks between time slots and days
- **Collision Detection**: Automatically resolves overlaps when dropping tasks
- **Smart Positioning**: Tasks are positioned to avoid conflicts with existing tasks
- **Cross-Day Support**: Move tasks between different days while maintaining proper date tracking

### Recent Bug Fixes
- **Fixed Copy/Paste Rendering Issue**: Resolved bug where copied tasks wouldn't render until page reload by ensuring consistent YYYY-MM-DD date format in the `handleDropCopy` function
- **Fixed Date Tracking Issue**: Resolved bug where dragged tasks would be reverted to incorrect dates due to improper original date tracking in conflict resolution
- **Improved Collision Resolution**: Enhanced the drag and drop system to properly handle conflicts and date consistency

### Task Resize
- **Edge Resizing**: Resize tasks by dragging the start or end edges
- **Boundary Constraints**: Tasks are constrained within timeline boundaries
- **Collision Avoidance**: Resizing respects existing task positions

### Timeline Navigation
- **Multi-Day View**: View multiple days simultaneously
- **Time Periods**: Timeline is divided into night, morning, afternoon, and evening sections
- **Current Time Marker**: Visual indicator showing the current time on today's timeline

## Technical Implementation

### State Management
- Uses `useDailyPlannerState` hook for comprehensive state management
- Maintains separate states for dragging, resizing, and task data
- Implements proper date key tracking for cross-day operations

### Collision Resolution
- `resolveCollisionsForDrag`: Handles task positioning during drag operations
- Automatically finds available spaces when conflicts occur
- Maintains task spacing and timeline constraints

### Date Handling
- Uses YYYY-MM-DD format for consistent date representation
- Proper timezone-safe date calculations
- Tracks original task dates for accurate conflict resolution

## Components

### DailyPlanner
Main component that orchestrates all planner functionality.

### TimelineColumn
Renders individual timeline sections with tasks and time markers.

### WeeklyView
Displays a 7-day view of scheduled tasks in a horizontal timeline format. Features include:

- **Enhanced Visual Design**: Modern gradient backgrounds, improved spacing, and better color hierarchy
- **Smart Time Management**: Focused timeline from 6 AM to 10 PM for optimal productivity planning
- **Day Highlighting**: Weekend days with orange accents, today with primary color accent bar
- **Progress Visualization**: Completion dots in day headers and progress bars in stats
- **Current Time Indicator**: Live red line with floating time badge for real-time context
- **Task Collision Handling**: Automatic lane assignment for overlapping tasks
- **Inbox Integration**: Separate section for unscheduled tasks with clear visual distinction
- **Interactive Elements**: Hover effects, smooth animations, and click-to-add functionality

### TaskCard
Individual task representation with drag/resize handles.

### TaskInboxSidebar
Displays tasks from the "task pool" that are not yet scheduled.

### PinnedTasksSidebar
Shows tasks that the user has pinned for quick access.

### FocusView
A dedicated view for focusing on a single task.

### WeeklyView
Displays a 7-day view of scheduled tasks.

### TaskAssignmentCalendar
A small calendar for assigning dates to tasks.

### EditTaskModal
Modal for editing the details of a task.

### ViewTaskNotesModal
Modal for viewing the notes of a task.

## Usage

```typescript
import { DailyPlanner } from '@/components/planner';

export default function PlannerPage() {
  return <DailyPlanner />;
}
```

## Performance

- Memoized components for efficient re-rendering
- Optimized drag and drop with minimal state updates
- Efficient collision detection algorithms

## Daily Planner Documentation

## Overview
The Daily Planner is a core feature that allows users to manage and visualize their daily schedule across different time periods.

## Key Components

### DailyPlanner (`components/planner/DailyPlanner.tsx`)
Main component that handles the planner interface and logic.

#### Features
- Task management (create, edit, delete, copy)
- Drag-and-drop task positioning
- Task resizing
- Dark mode support
- Multi-day view (today and tomorrow)
- Time period sections (morning, afternoon, evening)

#### Task Properties
```typescript
interface Task {
  id: string;
  name: string;
  startHour: number;
  duration: number;
  dayOffset: number;
  color?: string;
}
```

#### Time Periods
- Morning: 4:00 AM - 11:00 AM
- Afternoon: 11:00 AM - 6:00 PM
- Evening: 6:00 PM - 1:00 AM

### TaskCard Component
Subcomponent that renders individual task cards with the following features:
- Task name display
- Duration display
- Color customization
- Edit/copy/delete actions
- Resize handles

## State Management
- Tasks are persisted using local storage
- Task positions and times are managed through internal state
- Dark mode preference is persisted across sessions

## Key Constants
```typescript
const TASK_HEIGHT = 56;
const TIMELINE_START_HOUR = 4;
const TIMELINE_END_HOUR = 25;
const MIN_TASK_DURATION = 0.25;
const PIXELS_PER_HOUR = 142;
```

## User Interactions
1. **Adding Tasks**
   - Double-click on timeline
   - Use "Add New Task" button
   
2. **Editing Tasks**
   - Click edit button on task
   - Modify name, color, or time
   
3. **Moving Tasks**
   - Drag and drop within timeline
   - Copy tasks between days
   
4. **Resizing Tasks**
   - Use left/right handles
   - Minimum duration: 15 minutes

5. **Scheduling Inbox/Unscheduled Tasks**
   - Drag tasks from the "Inbox" section (in monthly view) or "Unscheduled" tasks (in daily view) directly onto the calendar to assign them a specific time.

## Best Practices
1. Always check for task conflicts before placement
2. Use the provided color palette for consistency
3. Maintain task durations between 15 minutes and 7 hours
4. Keep task names concise for better display

## Troubleshooting
Common issues and solutions:
1. Task conflict: Ensure no overlapping times in same period
2. Drag issues: Check if task is properly released
3. Resize limits: Verify minimum/maximum duration constraints 

## Key Hooks

-   `useDailyPlannerState`: Manages the state for the daily planner, including tasks, pinned tasks, and UI state. It loads and saves data from `localStorage` using the `TaskStorage` utility.
-   `useModalManager`: Handles the state for all modals in the application.

## Key Utilities

-   `TaskStorage`: A class that handles all interactions with `localStorage` for tasks, settings, and other planner-related data. It uses specific keys to avoid conflicts (e.g., `TASKS_KEY`, `PINS_KEY`).
-   `dateUtils`: A set of functions for handling dates, such as getting date keys (`YYYY-MM-DD`) and formatting dates for display. All date calculations are done in UTC to avoid timezone issues.
-   `taskUtils`: Functions for task-specific logic, such as checking for overlapping tasks.
-   `colorUtils`: Utility for handling color conversions and manipulations.
-   `formatters`: Functions for formatting text, such as time and duration.