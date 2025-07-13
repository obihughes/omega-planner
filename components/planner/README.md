# Daily Planner Components

This directory contains all components related to the daily planning functionality.

## Core Components

### DailyPlanner
**File**: `DailyPlanner.tsx`
**Purpose**: Main orchestrating component with page-level view mode navigation

**Features:**
- **Page-Level View Modes**: Toggle between Focus, Daily, Weekly, and Monthly views
  - Focus View: Minimal focus session interface for deep work
  - Daily View: Timeline-based planning with Pool/Pinned sidebar
  - Weekly View: Weekly overview of scheduled and inbox tasks
  - Monthly View: Full-page calendar for task assignment and inbox management
- Timeline visualization across 4 periods (night, morning, afternoon, evening)
- Dual-day view with independent navigation
- Task management (create, edit, delete, move, resize)
- Drag and drop functionality between time slots and days
- Copy/paste tasks across different days

**View Modes:**
1. **Focus View**:
   - Minimal interface for deep work sessions
   - Focus timer with customizable durations
   - Current and next task display
   - Focus session history tracking
   
2. **Daily View** (default):
   - Pool/Pinned task sidebar with tabs
   - Timeline sections for detailed time-based planning
   - Task collision detection and resolution
   
3. **Weekly View**:
   - Weekly overview showing scheduled and inbox tasks
   - Separate sections for scheduled tasks and inbox tasks per day
   
4. **Monthly View**:
   - Full TaskAssignmentCalendar component
   - Visual month grid for task assignment
   - Inbox tasks management with "Add Task" functionality
   - Pool tasks integration for scheduling

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
**Purpose**: Single timeline period container

**Features:**
- Hour-by-hour grid layout
- Drop zone for task placement
- Time markers and labels
- Period-specific styling (night, morning, afternoon, evening)

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
└── Monthly View
    └── TaskAssignmentCalendar (Full Page + Inbox Management)
```

## Usage Patterns

1. **Focus Sessions**: Use Focus View for deep work with timer and minimal distractions
2. **Daily Planning**: Use Daily View for detailed time-based task scheduling
3. **Weekly Overview**: Use Weekly View to see scheduled and inbox tasks across the week
4. **Task Assignment**: Use Monthly View to assign pool tasks to specific dates
5. **Inbox Management**: Use Monthly View to create and manage inbox tasks
6. **Task Management**: Edit tasks through modals accessible from all views
7. **Workflow**: Create tasks in Inbox (Monthly) → Assign to dates (Monthly) → Schedule times (Daily) → Focus on execution (Focus) 