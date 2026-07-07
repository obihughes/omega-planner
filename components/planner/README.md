# Daily Planner Components

This directory contains all components related to the daily planning functionality.

## Core Components

### DailyPlanner
**File**: `DailyPlanner.tsx`
**Purpose**: Main orchestrating component with page-level view mode navigation

**Features:**
- **Page-Level View Modes**: Default scheduling layout (sidebar + timeline) and optional weekly overview
  - **Daily View** (default, `viewMode === 'monthly'`): `MergedDailyView` with scheduling sidebar + full timeline panels
  - **Weekly View** (`viewMode === 'weekly'`): Weekly overview of scheduled and inbox tasks (beta / `/?view=weekly`)
- Timeline visualization across 4 periods (night, morning, afternoon, evening)
- Dual-day view with independent navigation
- Task management (create, edit, delete, move, resize)
- Drag and drop functionality between time slots and days
- Copy/paste tasks across different days
- **Per-panel view toggle**: Each day panel (top and bottom) has a Tasks | Class toggle to switch between scheduled tasks for that date and the recurring class schedule for that weekday. Class schedule view is read-only (view notes only; edit via Class Schedule page).
- **Import Classes**: Quick action on each day panel copies that weekday's recurring class schedule into the planner timeline for the viewed date, with conflict resolution when times overlap.

### MergedDailyView
**File**: `MergedDailyView.tsx`
**Purpose**: Default daily planner layout combining sidebar + full daily timeline panels

**Features:**
- Left: `SchedulingSidebar` (mini calendar, inbox, bulk-actions popover)
- Right: Full daily view content (events, pool/pinned bar, dual day panels)
- **Viewport fill**: Uses `flex-1 min-h-0` to expand to available height from the page shell
- **Edge scrollbar**: Right panel uses `overflow-y-scroll` with `.scrollbar-overlay` and no right padding so the scrollbar sits flush with the screen edge
- Calendar selection drives `topDayOffset` for the top day panel
- **Responsive timeline scale**: `ResizeObserver` on the content panel computes `pixelsPerHour` and `columnHeightPx` from available width (6 hours per period) and passes them to `DailyPlanner` via render props so drag/resize stay aligned; scale updates are paused during active drag/resize

### SchedulingSidebar
**File**: `SchedulingSidebar.tsx`
**Purpose**: Left sidebar for the default daily planner view

**Features:**
- Mini month calendar with task indicators
- Inbox for unscheduled pool tasks (drag to calendar or timeline)
- Bulk-actions popover: Delete Mode, Clear Day, Apply/Replace Saved Day
- Fixed width `w-72` (288px, 10% narrower than prior 320px layout)

### WeeklyView
**File**: `WeeklyView.tsx`
**Purpose**: Optional weekly timeline overview (`/?view=weekly`)

**Features:**
- Weekly overview showing scheduled and inbox tasks
- Separate sections for scheduled tasks and inbox tasks per day
- Dual timeline headers (top and bottom) for easy time tracking
- Space-efficient row layout

### TaskAssignmentCalendar
**File**: `TaskAssignmentCalendar.tsx`
**Purpose**: Legacy calendar view for assigning pool tasks (not mounted in current DailyPlanner)

**Features:**
- Projects-calendar visual styling (month grid, 130px cells)
- Inbox tasks display section at top with "Add Task" button
- Drag & drop from pool to calendar dates
- Click-to-assign workflow (click task then click date)
- Task rescheduling between dates
- Monthly navigation and summary statistics
- Direct inbox task creation functionality

### Timeline Components

#### TaskCard
**File**: `TaskCard.tsx`
**Purpose**: Individual task representation in timeline

**Features:**
- Visual task display with color coding
- Past tasks on today are visually muted (`opacity-50`) but remain fully copyable, editable, and draggable
- Drag handles for repositioning (action buttons and resize handles do not initiate drag)
- Resize handles for duration adjustment
- Click actions for editing, copy, and notes
- Action buttons scale with timeline row height (compact horizontal row on short rows)
- `overflow-visible` on card root so hover action buttons are not clipped at the right edge
- Time conflict indicators

#### TimelineColumn
**File**: `TimelineColumn.tsx`
**Purpose**: Single timeline period container. **Shared** by daily timeline and class schedule views.

**Features:**
- Hour-by-hour grid layout (hierarchical lines: major hours `border-border/30`, minor `border-border/10`; matches Class Schedule styling)
- Drop zone for task placement (double-click to create, drop from pool when onDropFromPool provided)
- Time markers and labels
- Period-specific styling (night, morning, afternoon, evening)
- Optional: readOnly (class schedule), drag/resize/copy handlers, onDoubleClickAdd
- **`data-timeline-drop`** on the period container (includes sticky hour headers in drop hit-testing)
- Drag preview renders with `pointer-events-none` so live pointer tracking hits the timeline beneath
- Task wrapper uses `onPointerDown` + pointer capture (via `handleDragStart`); skips drag when pointer targets action buttons or resize handles
- Timeline task area uses `overflow-visible` so TaskCard buttons are not clipped by parent containers

### Sidebar Components

#### TaskPoolSidebar
**File**: `TaskPoolSidebar.tsx`
**Purpose**: Inbox tasks management

**Features:**
- List of inbox tasks
- Add new pool tasks
- Drag to timeline or calendar
- Bulk operations (clear pool)

#### PinnedTasksSidebar
**File**: `PinnedTasksSidebar.tsx`
**Purpose**: Important tasks tracking

**Features:**
- Due date countdown
- Priority task management
- Overdue task highlighting
- Sync with timeline functionality

### Modal Components

#### EditTaskModal
**File**: `EditTaskModal.tsx`
**Purpose**: Comprehensive task editing interface

#### ViewTaskNotesModal
**File**: `ViewTaskNotesModal.tsx`
**Purpose**: Read-only task notes display

## State Management

All components use the `useDailyPlannerState` hook for:
- Task CRUD operations
- Timeline state management
- Sidebar state coordination
- Calendar integration
- View mode management

## Navigation Flow

```
DailyPlanner
├── Default: MergedDailyView (SchedulingSidebar + timeline panels)
└── Weekly View (?view=weekly)
    └── WeeklyView
```

## Usage Patterns

1. **Daily Planning**: Home (`/`) opens the scheduling sidebar + timeline for time-based task scheduling
2. **Weekly Overview**: Use `/?view=weekly` to see scheduled and inbox tasks across the week
3. **Task Assignment**: Use the sidebar mini calendar and inbox to assign pool tasks to dates
4. **Inbox Management**: Add unscheduled tasks in the sidebar inbox; drag to calendar or timeline
5. **Task Management**: Edit tasks through modals accessible from all views

## Class Schedule (Recurring)

**File**: `ClassSchedule.tsx`  
**Route**: `/class-schedule`

**View:**
- 7 vertically stacked day cards (Monday-first ordering), each rendering morning/afternoon/evening timeline segments at the same scale used by Daily Planner daily mode.
- Supports vertical scrolling through all seven day cards.
- Auto-scrolls to today's day card when the view opens.
- Preserves class CRUD flows (double-click add, card click edit, modal delete) and keeps recurring storage keyed by day-of-week.
- **Task card actions**: View Notes, Edit, Copy to daily planner pool, drag (same weekday), and resize (edge handles) work on class cards. Uses pointer capture and `timelineDragUtils` for hour snapping; commits via `updateClassTaskTime` in `useClassScheduleState`.
- **Daily Tasks overlay**: Header toggle **Classes | Daily Tasks** overlays read-only daily planner tasks on the timeline for layout testing; preference persists in `omega-planner-class-schedule-show-daily-tasks`. Overlay cards render underneath class cards (`z-index` 40 vs 50) so drag, resize, and action buttons stay interactive when the overlay is enabled.
