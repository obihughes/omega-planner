# Component Documentation

## Projects Timeline (Preview)

Location: `components/projects/ProjectsTimeline.tsx`

- Purpose: Visual, read-only month view of all projects in swimlanes (Gantt-like).
- Access: Route `app/projects/timeline/page.tsx` → `/projects/timeline`. A "Timeline" link is also added under Workspace in the main navigation.
- Rendering: SVG-based. Each project is a row; tasks render as:
  - Bars for tasks with both `startDate` and `dueDate`.
  - Dots for tasks with only one of `startDate` or `dueDate`.
  - Color coding by task `status` (todo/in-progress/completed/blocked).
  - View range culling: tasks render only if their date (or date span) overlaps the current visible range to prevent duplicate appearances across months.
- Layout & Responsiveness:
  - Day width is now responsive to the available container width, with sensible min/max bounds. This uses all empty space on the right and adapts to different screen sizes.
  - Today indicator and week separators scale with the computed layout.
- Dark Mode:
  - All SVG labels and helper lines use theme CSS variables (e.g. `hsl(var(--foreground))`, `hsl(var(--muted-foreground) / 0.35)`) for proper contrast in dark mode.
- Compact defaults:
  - Week separators only (labels on Mondays), ultra-subtle weekend shading.
  - Bar labels show when width allows; hover tooltips remain available.
  - Lighter visuals, more spacing per lane, minimal legend.

Interactions
- Clicking a project name now toggles a collapsed state that hides its tasks but keeps the label visible so you can click again to expand.
- Interactions: Month navigation (prev/next). Read-only prototype.

This document provides detailed information about the components used in the Daily Planner application.

Projects Calendar compact sizing
- Reduced header font and padding to align with monthly calendar compact style
- Reduced day cell min-height to 80px, tighter paddings, smaller text for entries and badges

## Table of Contents

1. [Planner Components](#planner-components)
2. [Projects Components](#projects-components)
3. [UI Components](#ui-components)
4. [Calendar Components](#calendar-components)
5. [Documents Components](#documents-components)
6. [Meals Components](#meals-components)
7. [Primitives Components](#primitives-components)
8. [Recent Updates](#recent-updates)

## Planner Components

### **DailyPlanner**
**Location**: `components/planner/DailyPlanner.tsx`

The main daily planning interface with timeline views and task management.

**Key Features:**
- **Page-Level View Modes**: Toggle between Daily View, Weekly View, and Scheduling View
  - **Daily View**: Traditional timeline-based planning with Pool/Pinned sidebar
  - **Weekly View**: Weekly overview showing scheduled and inbox tasks across all days
  - **Scheduling View**: Full-page calendar for task assignment and scheduling
- **Timeline System**: 4 time periods (night, morning, afternoon, evening) across two days
- **Task Inbox Integration**: Unscheduled tasks in collapsible sidebar
- **Pinned Tasks**: Important tasks with due date tracking
- **Drag & Drop**: Move tasks between timeline slots and dates
- **Task Editing**: Inline editing, resizing, and detailed modal editing
- **Copy/Paste**: Clone tasks across days and time slots

**View Mode Navigation:**
- Located above the sidebar area
- Three active buttons: "Daily" (default), "Weekly", and "Scheduling"
- Completely switches the page layout and functionality
- Daily: Timeline + sidebar for detailed time-based planning
- Weekly: Weekly overview of scheduled and inbox tasks across all seven days
- Scheduling: Full calendar for task assignment and scheduling

### **MiniDailyTimeline**
**Location**: `components/planner/MiniDailyTimeline.tsx`

Compact clone of the Daily view timeline used on the right side of the Scheduling View. It reuses the `TimelineColumn` logic and supports responsive scaling via `pixelsPerHour` and `columnHeightPx` so the hours grid, current-time marker, and task widths remain proportional in smaller layouts.

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

Recent visual refinements:
- Cleaner header with subtle borders and compact labels
- Softer hour dividers with clearer 6-hour marks
- Gentle primary tint for today; muted tint for weekends
- Slim red “Now” line with glow and small badge
- Task cards show a compact time label, tighter padding, clearer hover actions
- Events column has consistent styling and a "+N more" overflow indicator

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
### **Project Detail Inline Editing**
**Location**: `app/projects/[id]/page.tsx` with `components/projects/TaskItem.tsx`

Project detail view now supports the same inline editing UX as the unified Tasks view:
- **Title**: Click task title to edit inline. Press Enter to save, Escape to cancel, or blur to save.
- **Description**: Click description (or the placeholder) to edit inline. Press Ctrl+Enter to save, Escape to cancel, or blur to save.
- **Due Date**: Click the due date chip to edit with a native date input. Press Enter or blur to save; Escape cancels. Clear with the × button.
- **Status**: Click the checkbox to toggle completion with celebratory feedback.

Dates are normalized to YYYY-MM-DD and formatted using the centralized `formatDueDate` utility.

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
- Calendar Monthly and Yearly views available under `Daily Planner` subviews

**Order Update (2025-09-12):**
- Main order is now: `Daily Planner`, `Workspace`, `Text Canvas`, then `Focus` and `Meals` at the bottom per UX preference.

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
Full year calendar view with event management. Accessible under Daily Planner → Yearly Calendar.

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
### Workspace Tasks Enhancements (Inline Due Date, Done-by-day, Calendar Tooltip)
### Monthly Scheduling View and Unlimited Dots
- `components/projects/MonthlyTaskScheduler.tsx`: monthly grid for scheduling tasks via drag-and-drop; shows unlimited project-colored dots per day with wrapping and a selected-day task list.
- `app/projects/tasks/page.tsx`: added Schedule/List toggle in header. When in Schedule, the right mini calendar sidebar is hidden and the monthly grid is shown.
- `components/calendar/MiniSchedulerCalendar.tsx`: replaced single badge with unlimited wrapping dots at bottom of cells, colored by project.

- Inline due date editing in `components/projects/CompactTaskCard.tsx` using a native date input. Saves on blur/Enter, cancels on Escape. Dates normalized to YYYY-MM-DD.
- New grouping in `app/projects/tasks/page.tsx`: select "Done by day" to group tasks by `completedAt` date.
- `components/projects/ProjectsCalendar.tsx`: completed-count badge now shows a tooltip with the titles of tasks completed on that day, and the day cell lists up to 2 completed task titles with an overflow indicator like "+N completed". Overdue/remaining time uses normalized date keys.

**Comprehensive enhancement of task and project management capabilities**

**TaskListView Enhancements:**
- **Multi-Criteria Sorting**: Implemented simultaneous sorting by multiple fields (e.g., completion status + title)
- **Custom Order with Drag & Drop**: Added visual task reordering with persistence
- **Project-Specific Task Creation**: "Add Task" buttons within project groups that pre-select the project
- **Project Editing from Tasks View**: When grouped by project, an edit button in each group header opens the Project editor. You can edit details or archive (soft-delete). Archived projects are hidden from Tasks and filters auto-reset if a deleted project was selected.
- **Enhanced Sort Controls**: UI for configuring up to 4 simultaneous sort criteria
- **Drag Mode Indicators**: Visual feedback when in custom order mode

**Projects Page Enhancements:**
- **Sortable Projects Interface**: Added comprehensive sorting controls (Name, Progress, Updated, Custom Order)
- **Custom Order Mode**: Visual indicators and drag-to-reorder functionality for projects
- **Sort Direction Controls**: Ascending/descending toggle with icon indicators
- **Enhanced View Controls**: Improved popover interface for sorting and filtering options
- **Archived View Actions**: In the Archived tab, each project card now shows explicit actions:
  - Restore: returns the project to Active (uses `restoreProject()`)
  - Delete: permanently removes the project (uses `permanentlyDeleteProject()`)
- **Project Card Quick Actions (Active view)**:
  - Quick Add Task: opens the full task form modal to enter details before creating
  - Quick Status: change project status from the card
  - Quick Color: change project color from a compact palette
  - Quick Due Date: set/clear project due date with a date input

**Technical Improvements:**
- **SortableTaskItem Component**: New reusable component for drag-and-drop task items
- **Multiple Sort Logic**: Advanced sorting algorithm supporting multiple criteria with fallbacks
- **Drag & Drop Integration**: @dnd-kit integration for smooth reordering experience
- **Preferences Persistence**: LocalStorage persistence for multi-sort configurations

**Files Added/Modified:**
- `components/projects/TaskListView.tsx` - Complete rewrite with advanced features
- `app/projects/tasks/page.tsx` - Project filter dropdown and project edit modal integration
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

## Meals Components

### MealPlanner (`components/meals/MealPlanner.tsx`)
Location: `components/meals/MealPlanner.tsx`

- Purpose: Weekly meal planning grid with Breakfast/Lunch/Dinner slots for each day.
- Access: Route `app/meals/page.tsx` → `/meals`. A "Meals" link is added in the main navigation.
- Layout: 7-column grid (Mon–Sun), compact headers, sharp cards following the design system.
- Navigation: Prev week, Today, Next week controls using timezone-safe date utilities.

UI compactness:
- Inputs are hidden by default; click "+ Add" to toggle inline add.
- Empty-state text is removed to reduce visual noise.
- Remove buttons appear on hover only.
- Per-meal Ingredients: inline editor to add comma-separated ingredients; cookable badge when pantry has all items; otherwise shows missing items.

Layout:
- 3-day sliding view: shows 3 days at a time with "Prev 3 days" / "Next 3 days" controls to slide through the week.
- 3-column grid layout for displayed days with full-width usage.
- Second row shows Pantry, Shopping List, and Recipes in a 3-column layout (1 column on mobile, 2 on tablet, 3 on desktop).
### PantrySidebar (`components/meals/PantrySidebar.tsx`)
Location: `components/meals/PantrySidebar.tsx`

- Purpose: Manage available ingredients and see cookable suggestions for today's meals.
- Features: quick-add ingredient input, removable list items, and a suggestions list derived from meals that list ingredients and are fully covered by the pantry.
- Integrated on `/meals` as a right sidebar.

### ShoppingListSidebar (`components/meals/ShoppingListSidebar.tsx`)
Location: `components/meals/ShoppingListSidebar.tsx`

- Purpose: Centralized shopping list with checkboxes and quick-add of missing ingredients for today.
- Features: de-duplicated missing ingredients chips to add to the list, check/uncheck items, clear checked.

Props: none (MVP). Future: persistence, recipes integration.

### RecipesSidebar (`components/meals/RecipesSidebar.tsx`)
Location: `components/meals/RecipesSidebar.tsx`

- Purpose: Manage recipes and get meal suggestions based on available pantry ingredients.
- Features: 
  - Recipe creation form with name, description, ingredients, cook time, servings, and category
  - "Can Make Now" section showing recipes that can be fully prepared with current pantry items
  - "Suggested" section showing recipes with 60%+ ingredient matches from pantry
  - Quick-add buttons (B/L/D) to add recipes directly to breakfast, lunch, or dinner slots
  - All recipes list with remove functionality
- Default recipes: Includes starter recipes (Scrambled Eggs, Pasta with Garlic Oil, Chicken Stir Fry) for new users
- Integration: Uses pantry data to calculate cookable and suggested recipes in real-time

#### Data & State
- Uses `useMeals` hook for localStorage-backed persistence.
- Quick-add input per slot; items render beneath with Remove action.

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
**Issue**: Tasks scheduled for today were incorrectly showing as "Overdue" instead of "Today"; overdue items hid the actual due date.

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
- Overdue tasks now display their actual due date (via `formatDueDate`), while non-overdue dates keep friendly text (Today/Tomorrow/3 days)
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

## Calendar Updates (2025-09-07)

- Hover-based summaries disabled across `YearCalendar` and `MonthlyCalendar` date cells.
- Clicking a date now opens a summary modal listing events/periods for that day.
- Day summaries show Details (prefer `notes`, fallback to `description`) and include a Delete button for each item.
- `EventModal` and `PeriodModal` simplified to a single Notes field; `description` is no longer edited separately.
- Summaries and tooltips prefer `notes` when present, otherwise display `description`.
- Daily view "Back to Calendar" now routes to monthly calendar (`/calendar?view=monthly`) and preserves last date when available via `lastCalendarDate`.
- Yearly view: clicking any date opens a Day Details modal (shows events/intervals or an empty message), even for past dates.

Affected files:
- `components/calendar/YearCalendar.tsx`
- `components/calendar/MonthlyCalendar.tsx`
- `components/calendar/EventModal.tsx`
- `components/calendar/PeriodModal.tsx` 