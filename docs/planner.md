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
- **Daily Timeline Add/Edit**: Double-click add now uses `createTimelineTask` to set proper creation context; drag/resize commits now use `handleMouseUpGlobal` for reliable saves.

### Scheduling (Monthly) Bulk Actions
- **Delete Mode**: Toggle a mode that shows an X on each scheduled task in the mini daily timeline; click to delete quickly.
- **Clear Day**: Remove all tasks for the selected date with one action.
- **Clone Saved Day**: Entry point provided; navigates to Daily view where Saved Days can be applied.
- **Drag/Resize/Copy**: The mini timeline supports the same drag, resize, and copy-paste as Daily view when accessed from the Daily Planner page.

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
Renders individual timeline sections with tasks and time markers. **Shared** by both Daily view and Scheduling (Monthly) view via `MiniDailyTimeline`, eliminating duplicated timeline logic. Supports read-only mode (e.g. class schedule), drag/resize/copy, and pool drops.

### WeeklyView
Displays a 7-day view of scheduled tasks in a horizontal timeline format. Weeks start on Monday and end on Sunday. When opening the weekly overview, the view now auto-scrolls to highlight today within the current week by default. Features include:

- **Enhanced Visual Design**: Modern gradient backgrounds, improved spacing, and better color hierarchy
- **Smart Time Management**: Focused timeline from 6 AM to 10 PM for optimal productivity planning
- **Space-Efficient Layout**: Optimized row heights (40px) with task cards that maximize available space
- **Day Highlighting**: Weekend days with orange accents, today with primary color accent bar
- **Progress Visualization**: Completion dots in day headers and progress bars in stats
- **Dual Timeline Headers**: Time markers available at both top and bottom of the view for easy reference
- **Current Time Indicator**: Live red line with floating time badge for real-time context
- **Task Collision Handling**: Automatic lane assignment for overlapping tasks
- **Inbox Integration**: Separate section for unscheduled tasks with clear visual distinction
- **Interactive Elements**: Hover effects, smooth animations, and click-to-add functionality
- **Enhanced Scrollbar**: Larger, more accessible scrollbar for easier timeline navigation
- **Standard Scrolling**: Uses native vertical scrolling with Shift+Wheel for horizontal navigation

### TaskCard
Individual task representation with drag/resize handles.

### TaskInboxSidebar
Displays tasks from the "task pool" that are not yet scheduled.

### PinnedTasksSidebar
Shows tasks that the user has pinned for quick access.



### WeeklyView
Displays a 7-day view of scheduled tasks.

### TaskAssignmentCalendar
A small calendar for assigning dates to tasks.

### EditTaskModal
Modal for editing the details of a task. Includes a "To Inbox" button for scheduled tasks that moves them to the inbox (unschedules) via `moveTaskToInbox` / `handleUnassignTask`.

### ViewTaskNotesModal
Modal for viewing the notes of a task.

### ClassSchedule Page
The Class Schedule view (`/class-schedule`) provides a recurring weekly timetable where entries are stored by day-of-week instead of a specific date. Implementation is in `components/planner/ClassSchedule.tsx` with state handled by `hooks/useClassScheduleState.ts` and storage handled by `utils/classScheduleStorage.ts`.

**Key Features:**
- **7-Day Stack**: Timeline showing all 7 days stacked vertically, each split into 3 time periods (morning, afternoon, evening)
  - Uses the same timeline scale as the Daily Planner daily view
  - Uses a centered fixed-size timeline container so zoom does not distort block proportions
  - Vertically scrollable when all days do not fit on screen
  - Auto-scrolls to center the current day when the view opens
- **Add Classes**: Click "+ Add Class" button or double-click timeline to create new recurring classes
- **Edit Classes**: Click any existing class card to edit name, time, duration, color, and notes
- **Delete Classes**: Delete classes via the edit modal
- **Persistence**: All class schedules are saved to localStorage and persist across sessions
- **Day Context**: Highlights today and shows per-day class counts in each stacked day card

**Technical Notes:**
- Classes are stored by day-of-week (0 = Sunday ... 6 = Saturday) rather than specific dates
- Each class repeats weekly on its assigned day
- Uses the same task card rendering as the daily planner for consistency
- Layout uses flex column with `flex-1 min-h-0` so the schedule grid fills the main content area

## Month board

**Route:** `/month-board` (sidebar: Daily Planner → **Month board**).

Multi-month outline for plans at **different precision**: a **week focus** column for coarse intent and **seven day rows** (weekday + calendar date) for finer notes. This is **not** the Daily Planner Week view (`/?view=weekly`) and **not** Calendar Weekly Overview / weekly goals—data is stored separately.

- **Layout:** On large screens, the twelve-week grid is on the left and the **backlog** column on the right (`lg:w-[min(100%,320px)]`, `lg:max-w-sm`). Each week block shows **day rows** on the left and **week focus** on the right (`md+`).
- **Backlog:** Add text notes; dragging a note by the grip into a week or day **moves** it out of the backlog (same as other moves).
- **Week focus:** Wider, taller column on `md+` (`md:w-[min(100%,330px)]`); empty and placed notes use larger textareas (week notes auto-height like backlog).
- **Placed notes:** Dragging between week column, day rows, or back to the backlog **moves** the note. Empty week and day slots are plain textareas (no placeholder copy); the first line becomes a normal note (same drag/edit behavior as other notes).
- **Horizon:** Twelve consecutive weeks anchored to a persisted **Monday** (`horizonStartKey`). On each open, `rollHorizonToCurrentWeek` advances the window so the current calendar week is week index 0 (backlog preserved; notes in dropped past weeks are discarded; if the horizon is 12+ weeks behind or in the future, weeks reset empty). Week headers show a compact date range (e.g. Mar 17–23, 2025); each day row shows a short weekday and the day-of-month with muted, tabular numerals.
- **Persistence:** `utils/monthBoardStorage.ts`, localStorage key `omega-planner-month-board-v1`.
- **Scrolling:** Only the week grid scrolls; the **backlog** column stays fixed on the right on large screens (on small screens it sits below the grid and remains visible while weeks scroll). A long backlog scrolls inside its own panel. On open, the view auto-scrolls once to center the current week in the week grid.
- **Implementation:** `components/month-board/MonthBoard.tsx` (`@dnd-kit/core`, grip-only drag activation).

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

### Saved Days (Templates)

The Saved Days feature allows you to save daily task configurations as reusable templates.

#### How to Use Saved Days

1. **Save a Day as Template:**
   - Navigate to a day with tasks you want to save
   - Click the "Saved Days" button in the day header
   - Enter a name for your template (e.g., "Morning Routine", "Work Day")
   - Click "Save"

2. **Apply a Saved Day:**
   - Click the "Saved Days" button on any day
   - Select a saved day from the list
   - Choose "Apply" to add tasks alongside existing ones
   - Choose "Replace" to replace all existing tasks with the template

3. **Manage Saved Days:**
   - **View/Edit:** Click the 📝 icon to navigate to the template's original date and edit tasks
   - **Rename:** Click the ✏️ icon to rename a saved day
   - **Delete:** Click the 🗑️ icon to delete a saved day

#### Technical Implementation

- Saved days are stored separately from tasks in localStorage
- When applied, templates use the existing `cloneDayTasks` functionality
- Each saved day references the original date where the template tasks are stored
- Templates preserve task names, times, durations, colors, and notes
- New task IDs are generated when applying templates to avoid conflicts

#### Use Cases

- **Daily Routines:** Save morning routines, workout schedules, or evening wind-down activities
- **Work Templates:** Create templates for different types of work days (meetings, focus work, etc.)
- **Event Planning:** Save template schedules for recurring events or meetings
- **Quick Setup:** Rapidly populate new days with common task patterns

### Weekly Overview Page (`/calendar?view=weekly-goals`)
The Weekly Overview page provides an inline switch between two views for quick comparison:
- **Weekly Overview**: 4-week grid of weekly goals with drag-and-drop, calendar events, and optional Weekly Notes panel.
- **Study Tracker**: Same Study Planner component as `/study-tracker`, embedded in-place with full subject/task management.
- **Weekly Notes**: Hidden by default. Click "Open Notes" to reveal the checklist panel; click the close icon to hide it again. When hidden, no sidebar column is shown.

### Calendar Views (under Daily Planner)
The Monthly and Yearly calendar views are accessible from the main navigation under `Daily Planner`:
- Scheduling View: the planner's own monthly mode
- Monthly Calendar View: the full calendar page's monthly mode; includes a compact grid and an Events/Periods list under the calendar for the selected month. In the grid, hover an event to reveal a delete icon for quick removal. Deletions prompt for confirmation.
- Yearly Calendar: the full calendar page's yearly mode

Note: Monthly and yearly event calendars share `/calendar`. The sidebar **Calendar** link opens monthly view; use the in-page **Month** / **Year** toggle to switch. Weekly Overview and the 5-Year Visualizer remain separate sidebar entries. Task timeline (`?view=timeline`) is URL-only.