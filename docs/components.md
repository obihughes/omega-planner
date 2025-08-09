# Component Documentation

This document provides detailed information about the components used in the Daily Planner application.

## Table of Contents

1. [Planner Components](#planner-components)
2. [Projects Components](#projects-components)
3. [UI Components](#ui-components)
4. [Calendar Components](#calendar-components)
5. [Documents Components](#documents-components)
6. [Primitives Components](#primitives-components)
7. [Recent Updates](#recent-updates)

## Planner Components

### **DailyPlanner**
**Location**: `components/planner/DailyPlanner.tsx`

The main daily planning interface with timeline views and task management.

**Key Features:**
- **Page-Level View Modes**: Toggle between Daily View, Weekly View, and Monthly View
  - **Daily View**: Traditional timeline-based planning with Pool/Pinned sidebar
  - **Weekly View**: Weekly overview showing scheduled and inbox tasks across all days
  - **Monthly View**: Full-page calendar for task assignment and scheduling
- **Timeline System**: 4 time periods (night, morning, afternoon, evening) across two days
- **Task Inbox Integration**: Unscheduled tasks in collapsible sidebar
- **Pinned Tasks**: Important tasks with due date tracking
- **Drag & Drop**: Move tasks between timeline slots and dates
- **Task Editing**: Inline editing, resizing, and detailed modal editing
- **Copy/Paste**: Clone tasks across days and time slots

**View Mode Navigation:**
- Located above the sidebar area
- Three active buttons: "Daily" (default), "Weekly", and "Monthly" (Focus is temporarily hidden)
- Completely switches the page layout and functionality
- Daily: Timeline + sidebar for detailed time-based planning
- Weekly: Weekly overview of scheduled and inbox tasks across all seven days
- Monthly: Full calendar for task assignment and scheduling

**Daily View Components:**
- Inbox/Pinned task sidebar with tabs
- Dual-day timeline view with navigation
- Task cards with drag/drop and resize functionality
- Time-based task scheduling and collision detection

**Weekly View Components:**
- Compact weekly timeline showing all seven days
- Individual day headers with task statistics
- Scheduled tasks displayed on timelines with visual time blocks
- Inbox tasks shown in left sidebar for each day
- Current time marker for today
- Week navigation controls with relative labels

**Monthly View Components:**
- Full TaskAssignmentCalendar component
- Inbox tasks display for assignment
- Month grid with visual task cards
- Drag & drop from inbox to calendar dates

**State Management:**
- Uses `useDailyPlanner` hook for all task operations
- Manages view mode state locally (`daily` | `monthly`)
- Handles task assignment, scheduling, and inbox management

### **TaskInboxPage** **(Phase 2)**
**Location**: `app/inbox/page.tsx`

A dedicated full-page view for comprehensive inbox task management.

**Key Features:**
- **Full-Page Layout**: Masonry/board-style task grid for better visibility
- **Advanced Search & Filtering**: Real-time search with multiple sort options
- **Bulk Operations**: Multi-select tasks for batch operations (delete, etc.)
- **Task Statistics**: Overview cards showing total tasks, hours, and averages
- **Three Task Views**:
  - **All Tasks**: Combined view of general pool + date-specific tasks
  - **General Inbox**: Universal unscheduled tasks
  - **Today's Tasks**: Date-specific tasks for current date

**Enhanced Features:**
- **Task Creation**: Quick task creation with immediate editing
- **Visual Task Cards**: Color-coded cards with duration and metadata
- **Responsive Grid**: Adaptive layout (1-4 columns based on screen size)
- **Selection System**: Click to select, bulk operations toolbar
- **Sort Options**: By name, duration, color, or creation date
- **Empty States**: Contextual prompts for task creation

**Integration:**
- Shares task data with Daily Planner via `useDailyPlanner` hook
- Tasks created here appear in Daily View pool
- Seamless workflow: Inbox → Monthly Assignment → Daily Scheduling

**Navigation:**
- Added to main navigation as "Task Inbox" with Clock icon
- Independent page accessible via `/inbox` route

### TaskAssignmentCalendar (`components/planner/TaskAssignmentCalendar.tsx`)
**NEW COMPONENT:** Calendar view for assigning inbox tasks to specific dates.

**Key Features:**
- Projects-calendar-style month grid layout
- Visual task assignment interface
- Drag & drop from inbox tasks to calendar dates
- Click-to-assign workflow for inbox tasks
- Task rescheduling between dates
- Monthly navigation and statistics
- Integration with existing task inbox system

**Props:**
```typescript
interface TaskAssignmentCalendarProps {
  inboxTasks: Task[];
  scheduledTasks: Map<string, Task[]>;
  onAssignTask: (task: Task, date: Date, startHour?: number) => void;
  onUnassignTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDate: Date) => void;
  openEditModal: (task: Task, options?: any) => void;
}
```

**Usage:**
- Available as third tab in daily planner (Inbox | Pinned | Calendar)
- Shows inbox tasks at top for assignment
- Month grid displays scheduled tasks as colored cards
- Drag tasks from inbox to calendar dates or click task then click date
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

### TaskInboxSidebar (`components/planner/TaskInboxSidebar.tsx`)
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

## Projects Components

### **TaskListView**
**Location**: `components/projects/TaskListView.tsx`

Advanced task management interface with powerful sorting, filtering, and organization features.

**Key Features:**
- **Multi-Criteria Sorting**: Sort tasks by multiple fields simultaneously (e.g., completion status + title)
- **Custom Order Sorting**: Drag-and-drop reordering with custom order persistence 
- **Advanced Filtering**: Filter by due date, status, and search across task content
- **Flexible Grouping**: Group tasks by project, status, due date, or date created
- **Inline Task Creation**: Add tasks directly within project groups using "Add Task" buttons
- **Quick Task Entry**: Fast task creation with project selection
- **Real-time Editing**: Inline editing of task titles, descriptions, and due dates
- **Drag & Drop Reordering**: Visual reordering of tasks when in custom order mode
- **Task Status Management**: Toggle completion status with visual celebrations
- **Multi-Sort Interface**: Configure multiple sorting criteria with drag-to-reorder priority

**Sorting Options:**
- **Single Sort**: Traditional single-field sorting (title, due date, status, created date, custom order)
- **Multi Sort**: Configure up to 4 simultaneous sort criteria with independent ascending/descending order
- **Custom Order**: Drag-and-drop visual reordering with persistence across sessions

**Filtering Options:**
- **Due Date**: All, Today, Tomorrow, This Week, Future, No Due Date
- **Status**: All, To Do, In Progress, Blocked, Completed
- **Search**: Full-text search across task titles, descriptions, and project names

**Task Creation:**
- **Quick Add**: Inline task creation with project selection
- **Project-Specific**: "Add Task" buttons in project group headers that pre-select the project
- **Full Modal**: Detailed task creation with all fields (title, description, project, due date, estimated hours)

### **ProjectCard** 
**Location**: `components/projects/ProjectCard.tsx`

Individual project display component with drag-and-drop support.

**Key Features:**
- **Custom Order Support**: Sortable interface for project reordering
- **Progress Visualization**: Visual progress indicators
- **Action Menus**: Edit, delete, archive, and folder management options
- **Drag Handles**: Visual drag indicators in custom order mode

### **Projects Page**
**Location**: `app/projects/page.tsx`

Main projects management interface with enhanced sorting capabilities.

**Key Features:**
- **Custom Order Sorting**: Drag-and-drop project reordering
- **Multiple Sort Options**: Name, Progress, Last Updated, Custom Order
- **Visual Sorting Indicators**: Clear indication when in custom order mode with drag instructions
- **Folder Management**: Organize projects into folders with custom ordering within folders
- **Sort Direction Controls**: Ascending/descending order toggle with visual indicators

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

### Documents (`components/documents/Documents.tsx`)
Main document management interface with tab system and controls.

**Key Features:**
- **Tab-Based Document Management**: Open multiple documents as tabs with close functionality
- **Archive System**: Move documents to archive instead of permanent deletion
- **Clean UI Layout**: Reorganized button layout with logical grouping
- **Responsive Design**: Buttons stay in place regardless of content width
- **Smart Controls**: Context-sensitive editing tools (Text, Move, Star, Archive)

**Recent Improvements:**
- Fixed tab close functionality - tabs can now be properly closed
- Renamed "Trash" to "Archive" for clearer terminology
- Reorganized button layout to prevent horizontal scrolling
- Added visual separators between button groups
- Implemented proper tab state management with `openDocuments` tracking

**Button Layout:**
```
[Doc Tabs...] | [Text] [Move] | [★] [Archive] | [🔍] [+] [Archive View]
```

### CanvasTextEditor (`components/documents/CanvasTextEditor.tsx`)
Advanced free-form text canvas with absolute positioning.

**Key Features:**
- **Free-Form Text Positioning**: Click anywhere to place text blocks
- **Simple Two-Step Workflow**: Click "Text" button → Click location → Type
- **Drag Mode**: Move text blocks with visual grid feedback
- **Horizontal Width Constraints**: Prevents page expansion while typing
- **Text Wrapping**: Long text wraps properly within viewport bounds
- **Grid Snapping**: Text positions snap to grid for consistent alignment

**Interaction Model:**
1. **Add Text**: Click "Text" button (in header), then click canvas location
2. **Edit Text**: Single-click existing text blocks to activate editing
3. **Move Text**: Enable "Move" mode, then drag text blocks to new positions
4. **Keyboard Navigation**: Tab/Enter work normally, Escape cancels/deselects

**Technical Improvements:**
- Fixed horizontal page expansion issue during typing
- Added proper text wrapping with `word-wrap: break-word`
- Constrained text blocks to viewport width: `maxWidth: 'calc(100vw - 100px)'`
- Maintained vertical scrolling while preventing horizontal overflow
- Optimized canvas sizing to use container width instead of content-based expansion

### DocumentEditor (`components/documents/DocumentEditor.tsx`)
Individual document editing container with auto-save.

**Key Features:**
- Wraps CanvasTextEditor with document-specific functionality
- Auto-save with 2-second debounce after changes
- Clean minimal footer with last saved timestamp
- Proper container constraints to prevent layout issues

### Document Storage System (`hooks/useDocuments.ts`)
Persistent document management with localStorage.

**Key Features:**
- Full CRUD operations for documents
- Archive/restore functionality instead of permanent deletion
- Auto-selection of last opened document
- Star/favorite system for important documents
- Automatic timestamps for created/updated dates

## Primitives Components

### CustomTimePicker (`components/primitives/CustomTimePicker.tsx`)
Custom time selection component.

**Key Features:**
- User-friendly time input
- 24-hour format support
- Keyboard and mouse interaction

## Recent Updates

### Advanced Task Management Features (Latest Update)
**Comprehensive enhancement of task and project management capabilities**

**TaskListView Enhancements:**
- **Multi-Criteria Sorting**: Implemented simultaneous sorting by multiple fields (e.g., completion status + title)
- **Custom Order with Drag & Drop**: Added visual task reordering with persistence
- **Project-Specific Task Creation**: "Add Task" buttons within project groups that pre-select the project
- **Enhanced Sort Controls**: UI for configuring up to 4 simultaneous sort criteria
- **Drag Mode Indicators**: Visual feedback when in custom order mode

**Projects Page Enhancements:**
- **Sortable Projects Interface**: Added comprehensive sorting controls (Name, Progress, Updated, Custom Order)
- **Custom Order Mode**: Visual indicators and drag-to-reorder functionality for projects
- **Sort Direction Controls**: Ascending/descending toggle with icon indicators
- **Enhanced View Controls**: Improved popover interface for sorting and filtering options

**Technical Improvements:**
- **SortableTaskItem Component**: New reusable component for drag-and-drop task items
- **Multiple Sort Logic**: Advanced sorting algorithm supporting multiple criteria with fallbacks
- **Drag & Drop Integration**: @dnd-kit integration for smooth reordering experience
- **Preferences Persistence**: LocalStorage persistence for multi-sort configurations

**Files Added/Modified:**
- `components/projects/TaskListView.tsx` - Complete rewrite with advanced features
- `app/projects/page.tsx` - Added sorting controls and custom order indicators
- New drag-and-drop task management system
- Enhanced user experience with visual feedback and intuitive controls

### Text Canvas UI Overhaul (Latest)
**Issue**: Multiple UX problems with the text canvas:
- Horizontal page expansion while typing
- Confusing button layout and terminology  
- Non-functional tab close buttons
- Multiple "trash" icons causing confusion

**Resolution**:
1. **Fixed Horizontal Width Expansion**: 
   - Modified canvas sizing to use container width instead of content-based expansion
   - Added text wrapping constraints: `maxWidth: 'calc(100vw - 100px)'` and `word-wrap: break-word`
   - Applied `min-w-0` flexbox constraints to prevent layout breaking

2. **Reorganized Button Layout**:
   - Grouped buttons logically: Text tools | Document actions | Global tools
   - Added visual separators between groups
   - Shortened button labels for space efficiency
   - Made controls section `flex-shrink-0` to prevent squashing

3. **Fixed Tab Management**:
   - Implemented proper `openDocuments` state tracking
   - Tab close buttons now actually remove documents from tabs
   - Auto-open new documents when created or selected
   - Smart tab switching when closing active document

4. **Improved Terminology**:
   - Renamed "Trash" to "Archive" throughout interface
   - Changed "Move to trash" to "Archive document" 
   - Updated titles and messaging for clarity

**Files Modified**:
- `components/documents/CanvasTextEditor.tsx` - Fixed width expansion, added text wrapping
- `components/documents/DocumentEditor.tsx` - Added container constraints
- `components/documents/Documents.tsx` - Complete UI reorganization, tab management
- `components/documents/README.md` - Updated documentation
- `docs/components.md` - Enhanced component documentation

**Result**: Clean, professional text editing interface with predictable behavior and no layout issues.

### Pinned Tasks Time Display Fix
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

### Phase 1 Implementation (Task Assignment System)
- **TaskAssignmentCalendar**: Added date-specific task display in calendar cells
- **TaskInboxSidebar**: Fixed styling issues for light/dark mode compatibility
- **Combined Inbox Logic**: Implemented merging of general and date-specific inbox tasks
- **Data Persistence**: Added full localStorage support for date-specific tasks
- **UI/UX Improvements**: Enhanced visual styling and user interaction patterns

### Hydration Error Fix (TaskListView)
**Issue**: React hydration mismatch error causing "Expected server HTML to contain a matching <div> in <button>" in TaskListView component.

**Root Cause**: TaskListView component was loading preferences from localStorage during initial render, causing differences between server-side (default preferences) and client-side (localStorage preferences) rendering, particularly affecting conditional rendering of filter indicator dots in Popover components.

**Resolution**:
1. **Consistent Initial State**: Changed initial state from `loadPreferences()` to `defaultPreferences` to ensure server and client render identically
2. **Client-Side Hydration**: Added `isClient` state to track when component is mounted on client
3. **Safe Conditional Rendering**: Added `isClient &&` checks to localStorage-dependent conditional renders
4. **Post-Mount Loading**: Load actual preferences in `useEffect` after component mounts

**Files Modified**:
- `components/projects/TaskListView.tsx`

**Technical Details**:
- Prevents hydration mismatches by ensuring server and client initial renders are identical
- Uses `useEffect` to load localStorage preferences after hydration is complete
- Guards conditional renders that depend on localStorage data with `isClient` flag

### Date Logic Fix (Projects Today/Tasks)
**Issue**: Tasks scheduled for today were incorrectly showing as "Overdue" instead of "Today".

**Root Cause**: Date comparison logic in `formatDueDate` functions was comparing exact timestamps instead of calendar dates. Tasks due "today" but created earlier in the day would show as overdue because the current time had passed the task's creation timestamp.

**Resolution**:
1. **Centralized Date Utility**: Created `formatDueDate` function in `utils/dateUtils.ts` using proper date key comparison
2. **Consistent Date Keys**: Use YYYY-MM-DD string format for all date comparisons (avoids time component issues)
3. **Updated Components**: Replaced custom date logic in TaskListView, DraggableTaskCard, and Today page components
4. **Fixed Filtering**: Updated task filtering logic in Today and Tasks pages to use proper date key comparisons

**Files Modified**:
- `utils/dateUtils.ts` (added centralized `formatDueDate` function)
- `app/projects/today/page.tsx`
- `app/projects/tasks/page.tsx`
- `components/projects/TaskListView.tsx`
- `components/projects/DraggableTaskCard.tsx`

**Technical Details**:
- Uses `getDateKey()` and `getTodayDateKey()` for timezone-safe date comparison
- String comparison of YYYY-MM-DD format ensures accurate calendar date matching
- Eliminates time-based calculation errors that caused today's tasks to appear overdue

### Styling Fixes
- **Task Cards**: Proper borders, background colors, and theme compatibility
- **Action Buttons**: Theme-aware styling with hover effects
- **Calendar Cells**: Clean task display with colored borders and backgrounds
- **Add Buttons**: Consistent styling across components

## Future Enhancements

### Phase 2: Weekly View
- Task visualization in weekly format
- Enhanced drag & drop between days
- Weekly planning workflow

### Phase 3: Advanced Features
- Task dependencies
- Recurring tasks
- Advanced filtering and search
- Performance optimizations

## Styling Guidelines

### Sharp Design System
The Omega Planner uses a **sharp, clean design system** with minimal rounded edges to maintain a professional, modern aesthetic.

**Key Principles:**
- **No rounded edges**: Use sharp corners for all UI elements (cards, buttons, modals, inputs)
- **Clean borders**: Prefer crisp, rectangular shapes over rounded alternatives
- **Minimal styling**: Focus on functionality with clean, uncluttered layouts

**Specific Guidelines:**

#### Avoid These Classes:
- `rounded-*` (rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-2xl)
- `rounded-full` for decorative elements
- Border radius in custom CSS

#### Use Instead:
- Plain `border` without radius modifiers
- Sharp rectangular cards and containers
- Clean geometric shapes

#### Global CSS:
- The `--radius` CSS variable is set to `0` in `globals.css`
- Scrollbar thumbs use sharp edges
- All UI components should follow this pattern

#### Calendar Components:
- Monthly calendar uses sharp day cells and event cards
- Year calendar maintains clean rectangular layouts
- Mini calendar components avoid rounded elements

**Example:**
```tsx
// ❌ Avoid
<div className="bg-card rounded-lg border p-4">

// ✅ Use instead  
<div className="bg-card border p-4">
```

This ensures consistency across the application and maintains the sharp, professional appearance that defines the Omega Planner design language. 