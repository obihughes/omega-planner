# Component Documentation

This document provides detailed information about the components used in the Daily Planner application.

## Table of Contents

1. [Planner Components](#planner-components)
2. [UI Components](#ui-components)
3. [Calendar Components](#calendar-components)
4. [Documents Components](#documents-components)
5. [Primitives Components](#primitives-components)
6. [Recent Updates](#recent-updates)

## Planner Components

### DailyPlanner (`components/planner/DailyPlanner.tsx`)
The main orchestrating component for the daily planner interface.

**Key Features:**
- Timeline visualization with hour-by-hour layout
- Task management (create, edit, delete, move)
- Drag and drop functionality
- Pinned tasks sidebar integration
- Task pool sidebar integration
- **NEW: Task assignment calendar integration**

**Props:**
- Uses custom hooks for state management

### TaskAssignmentCalendar (`components/planner/TaskAssignmentCalendar.tsx`)
**NEW COMPONENT:** Calendar view for assigning pool tasks to specific dates.

**Key Features:**
- Projects-calendar-style month grid layout
- Visual task assignment interface
- Drag & drop from pool tasks to calendar dates
- Click-to-assign workflow for pool tasks
- Task rescheduling between dates
- Monthly navigation and statistics
- Integration with existing task pool system

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

**Usage:**
- Available as third tab in daily planner (Pool | Pinned | Calendar)
- Shows unscheduled tasks at top for assignment
- Month grid displays scheduled tasks as colored cards
- Drag tasks from pool to calendar dates or click task then click date
- Tasks can be rescheduled by dragging between dates
- Visual feedback during assignment mode

### TaskCard (`components/planner/TaskCard.tsx`)
Individual task representation component with interaction capabilities.

**Key Features:**
- Drag and resize functionality
- Inline editing capabilities
- Context menu for task actions
- Visual feedback for different states
- Timezone-safe date handling

### PinnedTasksSidebar (`components/planner/PinnedTasksSidebar.tsx`)
Horizontal scrollable sidebar for pinned tasks.

**Key Features:**
- Compact time remaining display with smart formatting
- Timezone-safe date and time calculations
- Action buttons (view, edit, unpin)
- Horizontal scroll navigation with arrow controls
- Smart time unit conversion (days, hours, minutes)

**Recent Fixes:**
- Fixed timezone interpretation issues for accurate time display
- Improved time formatting to show proper units instead of all minutes
- Enhanced date parsing to prevent serialization/deserialization bugs

### TaskPoolSidebar (`components/planner/TaskPoolSidebar.tsx`)
Sidebar component for managing reusable task templates.

**Key Features:**
- Task template management
- Drag and drop to timeline
- Quick task creation from templates

### TimelineColumn (`components/planner/TimelineColumn.tsx`)
Individual timeline column representing a specific time period.

**Key Features:**
- Hour-based time slots
- Drop zones for task placement
- Grid lines for visual guidance
- Current time indicator

## UI Components

### AppLayout (`components/ui/AppLayout.tsx`)
Main application layout wrapper.

**Key Features:**
- Fixed left sidebar navigation (256px width)
- Main content area with proper spacing
- Responsive design considerations

### Navigation (`components/ui/Navigation.tsx`)
Left sidebar navigation component.

**Key Features:**
- App-wide navigation between modes
- Theme toggle functionality
- Active state indicators
- Branded header section

### Button, Input, Card, etc. (`components/ui/`)
Reusable UI primitives built with consistent styling.

**Key Features:**
- Consistent design system
- Dark mode support
- Accessibility features

### Navigation Collapse Persistence
Navigation collapsed/expanded state is now persisted in `localStorage` and respected across route changes.

File Updated:
- `components/ui/AppLayout.tsx`

## Calendar Components

### YearCalendar (`components/calendar/YearCalendar.tsx`)
Full year calendar view with event management.

**Key Features:**
- Month-by-month navigation
- Event and period creation
- Date selection and highlighting

### EventModal (`components/calendar/EventModal.tsx`)
Modal for creating and editing calendar events.

### PeriodModal (`components/calendar/PeriodModal.tsx`)
Modal for creating and editing calendar periods.

## Documents Components

### CanvasTextEditor (`components/documents/CanvasTextEditor.tsx`)
High-performance text editor component.

**Key Features:**
- Performance optimizations for large documents
- Rich text editing capabilities
- Auto-save functionality

### DocumentEditor (`components/documents/DocumentEditor.tsx`)
Document management interface.

### TextBlock (`components/documents/TextBlock.tsx`)
Individual text block component for the canvas editor.

## Primitives Components

### CustomTimePicker (`components/primitives/CustomTimePicker.tsx`)
Custom time selection component.

**Key Features:**
- User-friendly time input
- 24-hour format support
- Keyboard and mouse interaction

## Recent Updates

### Pinned Tasks Time Display Fix (Latest)
**Issue**: Pinned tasks were displaying incorrect times and showing everything as minutes instead of converting to hours/days.

**Resolution**:
1. **Timezone Handling**: Fixed timezone interpretation issues in pinned task creation and loading
2. **Display Formatting**: Improved `formatCompactTimeRemaining` function to properly handle time unit conversion
3. **Data Serialization**: Enhanced storage loading to reconstruct dates safely from baseDate + startHour
4. **Defensive Programming**: Added type checking for Date objects vs strings throughout the codebase

**Files Modified**:
- `hooks/useDailyPlannerState.ts` - Fixed dueDate calculation and operations
- `utils/storage.ts` - Enhanced pinned task loading with timezone-safe reconstruction  
- `components/planner/PinnedTasksSidebar.tsx` - Fixed display logic and time formatting
- `components/planner/DailyPlanner.tsx` - Fixed overdue detection

**Timeline Density Adjustment**:
- Reduced `PIXELS_PER_HOUR` from 210 to 205 for more compact timeline view
- Automatic recalculation of `PIXELS_PER_MINUTE` for consistent spacing

### Date Handling Architecture
All components now use consistent timezone-safe date handling:
- `dateFromDateKey()` for YYYY-MM-DD string parsing
- Defensive Date object checking throughout
- Consistent local timezone operations
- Proper serialization/deserialization handling

### Branding Update - Symbol-Only Navigation Header
**Change**: Removed text ("Omega Planner") from the Navigation sidebar header so only the Ω symbol is displayed when the sidebar is expanded.

**Files Modified**:
- `components/ui/Navigation.tsx`

### Time Picker Modal Interaction Fix 
**Issue**: Clicking inside the CustomTimePicker popup within `EditTaskModal` caused the modal to submit & close because the popup control buttons defaulted to form submission.

**Resolution**:
1. Added `type="button"` to all internal control buttons in `CustomTimePicker` to prevent unintended form submission.

**Files Modified**:
- `components/primitives/CustomTimePicker.tsx`
- `components/planner/EditTaskModal.tsx`

### Projects Due Date Calculation Fix
Corrected off-by-one error where projects displayed "Due in 1 day" when due today.

Files Updated:
- `components/projects/ProjectCard.tsx`
- `app/projects/[id]/page.tsx`
- `components/projects/ProjectsCalendar.tsx`

These now use Math.floor for upcoming dates and Math.ceil for overdue. 