# Daily Planner Components

This directory contains all components related to the daily planning functionality.

## Core Components

### DailyPlanner
**File**: `DailyPlanner.tsx`
**Purpose**: Main orchestrating component with page-level view mode navigation

**Features:**
- **Page-Level View Modes**: Toggle between Daily, Weekly, and Scheduling views
  - Daily View: Timeline-based planning with Pool/Pinned sidebar
  - Weekly View: Weekly overview of scheduled and inbox tasks
  - Scheduling View: Full-page calendar for task assignment and inbox management
- Timeline visualization across 4 periods (night, morning, afternoon, evening)
- Dual-day view with independent navigation
- Task management (create, edit, delete, move, resize)
- Drag and drop functionality between time slots and days
- Copy/paste tasks across different days

**View Modes:**
1. **Daily View** (default):
   - Pool/Pinned task sidebar with tabs
   - Timeline sections via shared `TimelineColumn` for detailed time-based planning
   - Task collision detection and resolution
   - **Per-panel view toggle**: Each day panel (top and bottom) has a Tasks | Class toggle to switch between scheduled tasks for that date and the recurring class schedule for that weekday. Class schedule view is read-only (view notes only; edit via Class Schedule page).
   
2. **Weekly View**:
   - Weekly overview showing scheduled and inbox tasks
   - Separate sections for scheduled tasks and inbox tasks per day
   - Dual timeline headers (top and bottom) for easy time tracking
   - Space-efficient row layout
   
3. **Scheduling View** (Monthly):
   - MonthlyTimelineView with mini calendar, inbox, and daily timeline
   - Inbox: Add unscheduled tasks; drag to calendar date (assigns to pool) or to timeline (schedules with time)
   - Task pool row: Draggable tasks for selected date; drag to timeline or click Schedule (9 AM)
   - Mini Daily Timeline: Shows scheduled + unscheduled; accepts drops from inbox/pool; **supports drag/resize/copy** (when used from Daily Planner page)

### TaskAssignmentCalendar
**File**: `TaskAssignmentCalendar.tsx`
**Purpose**: Calendar view for assigning pool tasks to specific dates and managing inbox tasks

**Features:**
- Projects-calendar visual styling (month grid, 130px cells)
- Inbox tasks display section at top with "Add Task" button
- Drag & drop from pool to calendar dates
- Click-to-assign workflow (click task then click date)
- Task rescheduling between dates
- Monthly navigation and summary statistics
- Direct inbox task creation functionality

**Integration:**
- Used within DailyPlanner's Monthly View mode
- Shares task data and operations with daily timeline
- Maintains consistent styling with projects calendar
- Provides primary interface for inbox task management

### Timeline Components

#### TaskCard
**File**: `TaskCard.tsx`
**Purpose**: Individual task representation in timeline

**Features:**
- Visual task display with color coding
- Drag handles for repositioning
- Resize handles for duration adjustment
- Click actions for editing and notes
- Time conflict indicators

#### TimelineColumn
**File**: `TimelineColumn.tsx`
**Purpose**: Single timeline period container. **Shared** by Daily view and Scheduling view (via MiniDailyTimeline).

**Features:**
- Hour-by-hour grid layout (hierarchical lines: major hours `border-border/30`, minor `border-border/10`; matches Class Schedule styling)
- Drop zone for task placement (double-click to create, drop from pool when onDropFromPool provided)
- Time markers and labels
- Period-specific styling (night, morning, afternoon, evening)
- Optional: readOnly (class schedule), drag/resize/copy handlers, onDoubleClickAdd

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
├── View Mode Navigation (Daily | Weekly | Monthly)
├── Daily View
│   ├── Pool/Pinned Sidebar Tabs
│   └── Timeline Sections (Top Day + Bottom Day)
├── Weekly View
│   └── Weekly Overview with Scheduled & Inbox Tasks
└── Monthly View (Scheduling)
    └── MonthlyTimelineView (Calendar + Inbox + Task Pool + Mini Daily Timeline)
```

## Usage Patterns

1. **Daily Planning**: Use Daily View for detailed time-based task scheduling
2. **Weekly Overview**: Use Weekly View to see scheduled and inbox tasks across the week
3. **Task Assignment**: Use Monthly View to assign pool tasks to specific dates
4. **Inbox Management**: Use Monthly View to create and manage inbox tasks
5. **Task Management**: Edit tasks through modals accessible from all views
6. **Workflow**: Create tasks in Inbox (Monthly) → Drag to calendar date (pool) or timeline (schedule) → Or use Schedule button for 9 AM 

## Class Schedule (Recurring)

**File**: `ClassSchedule.tsx`  
**Route**: `/class-schedule`

**View:**
- 7 vertically stacked day cards (Monday-first ordering), each rendering morning/afternoon/evening timeline segments at the same scale used by Daily Planner daily mode.
- Supports vertical scrolling through all seven day cards.
- Auto-scrolls to today's day card when the view opens.
- Preserves class CRUD flows (double-click add, card click edit, modal delete) and keeps recurring storage keyed by day-of-week.