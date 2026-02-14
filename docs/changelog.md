## 2025-02-14

- **Remove Beta Section** (2025-02-14)
  - Removed all beta-related code to simplify the codebase.
  - Deleted `app/beta/` directory and all subroutes (workspace, habits, tasks, weekly tasks, recipes, boards, search).
  - Removed Beta navigation item and subviews from sidebar (`components/ui/Navigation.tsx`).
  - Recipes functionality remains available via the Meals page; Workspace Today, Habits, and Tasks remain at `/projects/workspace`, `/habits`, and `/projects/tasks` respectively.
  - **Files affected**: `components/ui/Navigation.tsx`, `app/beta/**` (deleted), `docs/structure.md`, `docs/changelog.md`

## 2025-12-26

- **Bug Fix: PeriodModal ReferenceError** (2025-12-26)
  - Fixed a `ReferenceError: initialEndDate is not defined` in `PeriodModal.tsx` by correctly destructuring the prop from the component signature.
  - **Files affected**: `components/calendar/PeriodModal.tsx`, `docs/changelog.md`

## 2025-12-25

- **5-Year Visualizer Improvements** (2025-12-25)
  - **Drag-to-Create**: Implemented drag interaction on the grid to create periods spanning multiple months instantly.
  - **Continuous Period Rendering**: Refactored period visualization to render as single continuous bars instead of fragmented monthly blocks, improving readability of long-term items.
  - **Enhanced Period Modal**: Updated `PeriodModal` to accept pre-filled end dates, supporting the new drag selection flow.
  - **Files affected**: `components/visualizer/FiveYearVisualizer.tsx`, `components/calendar/PeriodModal.tsx`, `docs/components.md`, `docs/changelog.md`

## 2025-12-21

- **Weekly View UI Refinements** (2025-12-21)
  - **Optimized Layout**: Reduced row height (60px -> 40px) for better space efficiency while maintaining task visibility.
  - **Improved Timeline**: Added a sticky timeline header to the bottom of the view for easier time reference.
  - **Enhanced Task Cards**: Modified task card layout to allow text to utilize full width; edit buttons now overlay on hover without shifting content.
  - **Refined Scrolling**:
    - Removed custom horizontal scroll interception on mouse wheel, restoring standard vertical scrolling behavior.
    - Improved "Auto-scroll to Today" reliability with layout-aware timing.
  - **Files affected**: `components/planner/WeeklyView.tsx`, `components/planner/WeeklyTaskCard.tsx`, `docs/planner.md`, `docs/changelog.md`

## 2025-12-18

- **Weekly Goals Overview - Goal Movement** (2025-12-18)
  - Enhanced weekly goals overview with drag-and-drop functionality
  - Goals can now be dragged between different days to easily reschedule them
  - Added visual feedback during drag operations (highlighted drop zones, cursor changes)
  - Goals in day columns are now draggable with grab cursor for better UX
  - **Files affected**: `components/calendar/WeeklyGoalsCalendarView.tsx`, `docs/changelog.md`

## 2025-12-16

- **Daily Planner Day View Fix** (2025-12-16)
  - Fixed bottom day view to correctly default to tomorrow instead of today
  - Removed persistence of day view offsets (they are relative to "today" and should not be saved)
  - Bottom view now always shows tomorrow (offset 1) on app load
  - Top view continues to show today (offset 0) on app load
  - Users can still navigate to other dates during a session
  - **Files affected**: `hooks/useDailyPlannerState.ts`, `docs/changelog.md`

- **Weekly View Scrolling Improvements** (2025-12-16)
  - Enhanced scrollbar size (16px) for easier dragging and better visibility
  - Increased mouse wheel scroll sensitivity (8x) for faster timeline navigation
  - Theme-matching scrollbar colors with hover effects
  - **Files affected**: `components/planner/WeeklyView.tsx`, `tailwind.config.js`, `docs/planner.md`, `docs/changelog.md`

## 2025-11-26

- **Class Schedule Enhanced Features** (2025-11-26)
  - **Redesigned Weekly View**: Completely rewritten to match daily planner's WeeklyView design
    - AM/PM row-based layout (12-hour periods per row)
    - Sticky day label columns showing day name, date, and month
    - Timeline headers with hourly markers for each row
    - Current time marker on today's row
    - Horizontal scrollable layout for comfortable viewing
    - 90px per hour, 60px row height, 95px day column width
  - **View Mode Toggle**: Switch between Daily and Weekly views with intuitive toggle button
  - **Enhanced Add Functionality**: 
    - New "+ Add Class" button in header for easy class creation
    - Double-click on timeline (both views) to quick-add classes at specific times
  - **Improved UI/UX**:
    - Day selector tabs now only show in Daily view for cleaner interface
    - Current time marker works in both views
    - Consistent task card rendering across both views
    - Weekend days have distinct background styling
    - Enhanced scrollbar in Weekly View for easier timeline navigation
    - Improved mouse wheel sensitivity for faster horizontal timeline scrolling
  - **Bug Fixes**:
    - Fixed persistence bug in `useClassScheduleState` hook (missing `date` variable declaration)
    - Fixed runtime error where `referenceDate` property was incorrectly referenced (changed to `dateKey`)
  - **Files affected**: `components/planner/ClassSchedule.tsx`, `hooks/useClassScheduleState.ts`, `docs/planner.md`, `docs/changelog.md`

## 2025-10-30

- **Removed Old Weekly Goals Page** (2025-10-30)
  - Removed the standalone weekly goals page at `/goals/weekly` (formerly "Daily Goals")
  - Weekly goals functionality remains available through the Calendar view (`/calendar?view=weekly-goals`)
  - Removed navigation link to the standalone page while keeping calendar integration
  - Updated documentation to reflect the change
  - Files affected: `app/goals/weekly/page.tsx`, `components/ui/Navigation.tsx`, `docs/components.md`, `docs/changelog.md`

- **Weekly Goals Edit Modal UI Rework** (2025-10-30)
  - **Complete UI redesign** of the weekly goals edit experience
  - **Replaced inline editing** with a proper modal dialog pattern
  - **Improved UX**:
    - Clean, focused modal with backdrop overlay
    - All editing controls in one organized interface
    - Goal type selection prominently displayed as primary/supporting toggle
    - Color picker with visual selection indicator (✓ checkmark)
    - Notes field always visible with proper labeling
    - Save/Cancel actions with validation
    - Additional action buttons (Create Task, Delete) in footer section
  - **Removed problematic patterns**:
    - No more menu that disappears on mouse leave
    - No cramped inline color picker
    - No awkward notes toggle
    - Simplified view-only display with single edit button
  - **Better interaction model**:
    - Click title or edit button to open modal
    - Modal stays open until user saves or cancels
    - Keyboard shortcuts: Escape to close, Ctrl+Enter to save
    - Proper focus management with title field auto-selected
  - **Files affected**: `components/calendar/WeeklyGoalsCalendarView.tsx`, `utils/goalsStorage.ts`

## 2025-10-20

- **Mini Timer Window** (2025-10-20)
  - Added floating mini timer window feature for focus mode
  - **New route**: `/focus/mini` displays a clean, minimalist timer view
  - **Popup functionality**: Click external link icon in Workspace Today timer controls to open mini window
  - **Real-time sync**: Uses BroadcastChannel API to sync timer state between main window and mini window
  - **Features**:
    - Large, readable countdown/elapsed time display
    - Animated status indicator (running/paused)
    - Progress bar when target duration is set
    - Beautiful gradient background (slate-900 to slate-800)
    - Independent positioning - can be placed anywhere on screen
  - **Technical details**:
    - Works on localhost and production environments
    - No external dependencies required
    - Lightweight implementation (~50 lines of code)
    - Window size: 350x280px, resizable
  - Files affected: `app/focus/mini/page.tsx`, `app/projects/workspace/page.tsx`, `docs/components.md`, `docs/changelog.md`

## 2025-10-08

- **Weekly Goals UI Improvements** (2025-10-08)
  - **Fixed z-index layering**: Menus and color picker now properly overlay other elements (z-50)
  - **Completed task interaction**: Can now interact with completed goals - uncheck, edit, or delete via context menu
  - **Drag-and-drop functionality**: Goals can be dragged between days with visual feedback (ring highlight on drop target)
  - **Enhanced primary goal styling**:
    - Dynamic text sizing: Large text for short titles, automatically reduces for longer titles while maintaining bold
    - Star icon indicator in top-right corner (moved from left to prevent text wrapping)
    - Right padding added to primary goals to accommodate star icon
    - Thicker left border (border-l-4) for additional visual hierarchy
  - **Improved edit experience**:
    - Double-click any goal (completed or active) to edit
    - Edit button always accessible via context menu
    - Drag handle (grip icon) appears on hover for non-completed items
  - **Move to day feature**: Context menu includes "Move to day..." submenu showing all 14 visible days
  - **Better visual feedback**: 
    - Drag-over state shows ring and background highlight
    - Clear cursor indicators (grab/grabbing for dragging)
    - Improved menu organization with separate layouts for active vs completed goals
  - **Compact layout**: Reduced day box height by 30% (from 280px to 196px) for more efficient space usage
  - Files affected: `app/goals/weekly/page.tsx`, `docs/changelog.md`, `docs/components.md`

- **Navigation Restructure with Collapsible Sections** (2025-10-08)
  - Created new main "Calendar" navigation item as second item (after Daily Planner)
  - Moved Monthly and Yearly calendar views under new Calendar section
  - Removed "Scheduling" from Daily Planner navigation
  - Daily Planner now contains only: Daily and Week Overview
  - Added collapsible/expandable functionality to all navigation sections with subviews
  - Added chevron up/down icons to indicate expand/collapse state
  - **Persistent collapse state**: Navigation expand/collapse state now saves to localStorage (`omega-planner-nav-expanded`)
  - Collapse state persists across page navigation and browser sessions
  - All sections with subviews (Daily Planner, Calendar, Workspace) now have toggle buttons
  - Removed "Weekly Projects", "Projects Calendar", and "Projects Timeline" from Workspace navigation
  - Workspace navigation now shows only core items: Workspace Today, Tasks, and Projects
  - **Renamed "Text Canvas" to "Text Documents"** with Files icon (removed subviews)
  - Navigation sections default to expanded state on initial load
  - Updated documentation to reflect navigation changes
  - Files affected: `components/ui/Navigation.tsx`, `ARCHITECTURE.md`, `docs/components.md`, `docs/changelog.md`

- **Workspace Today UI Cleanup** (2025-10-08)
  - Removed task count display from "Project Tasks Due Today" section for cleaner UI
  - Implemented hover-based action buttons: only completion/tick button is visible by default, other action buttons (delete, move to backlog, etc.) appear on hover
  - Added collapsible timer controls: Start/End/Pause buttons and time targets (25m/45m/60m) can be collapsed via toggle button
  - Added collapsible projects sidebar: entire right sidebar can be collapsed to maximize space for task lists
  - When projects sidebar is collapsed, task list expands to full width
  - Removed empty state messages ("No project tasks due today", "No backlog items yet") to reduce visual noise
  - Added visual separator with horizontal divider line between active tasks (Planned/Project Tasks) and completed/backlog sections for better focus
  - Maintained quick-add task input fields as requested
  - Files affected: `app/projects/workspace/page.tsx`, `docs/components.md`, `docs/changelog.md`

- Daily Planner timeline add/edit fixes:
  - Double-click to add now uses context-aware `createTimelineTask`, ensuring correct `baseDate` and `startHour` handling.
  - Drag/resize commit now delegates to the hook's `handleMouseUpGlobal` for reliable state updates and conflict checks.
  - No behavioral change in Monthly view; only Daily timeline interactions affected.

- Scheduling (Monthly) enhancements:
  - Added Scheduling subview to main navigation under Daily Planner.
  - Added bulk actions toolbar in Scheduling: Delete Mode (quick X on tasks), Clear Day, and a Clone Saved Day entry point (navigates to Daily view for template actions).

## 2025-10-11

- Move hidden/experimental pages under Beta
  - New Beta subroutes:
    - `/beta/workspace` (moved from `/projects/workspace`)
    - `/beta/habits` (moved from `/habits`)
    - `/beta/tasks` and `/beta/tasks/weekly` (mirrors of Projects Tasks views)
  - Sidebar navigation:
    - Replaced top-level `Habits` with `Beta` section containing Workspace Today, Habits, Tasks, Weekly Tasks, Recipes
    - Changed "Workspace" nav to "Projects" (points to `/projects` instead of workspace)
    - Removed Tasks from Workspace/Projects navigation (Tasks now only accessible via Beta section)
    - Moved Weekly Goals and Activities to top navigation (before Daily Planner)
    - `Beta` item is active for any `/beta` route and collapsible
  - Documentation updated: `docs/structure.md`
  - Files affected: `components/ui/Navigation.tsx`, `app/beta/**`, `docs/structure.md`, `docs/changelog.md`
  - Added Projects Calendar and Timeline links to Beta landing page for easier access

- Weekly View default focuses on Today
  - Weekly overview now auto-scrolls to today's row when opening the view for the current week.
  - Does not auto-scroll when navigating to past/future weeks.
  - Files affected: `components/planner/WeeklyView.tsx`, `docs/planner.md`, `docs/changelog.md`.

- Activities View
  - New top-level page at `/activities` that shows a monthly grid with rows for custom activities (not tied to Workspace Projects) and per-day text inputs (notes/journaling).
  - Fixed left column shows activity names; right area scrolls horizontally showing all days of the month with synchronized header/day labels. Vertical scrolling is handled by the page.
  - Data persisted in localStorage via `ActivitiesStorage` (entries: `omega-planner-activities-v1`) and `ActivitiesListStorage` (list: `omega-planner-activities-list-v1`).
  - Manage Activities inline: add, rename, delete, and color pick.
  - Added as standalone navigation item after Habits.
  - Files affected: `app/activities/page.tsx`, `components/ui/Navigation.tsx`, `utils/activitiesStorage.ts`, `utils/index.ts`, `docs/components.md`, `docs/changelog.md`.
  - Persistence reliability fix (2025-10-10):
    - Guarded initial save of the activities list until after first load to prevent overwriting existing data with an empty array.
    - Added backward-compatible loaders that migrate legacy storage shapes (direct objects/arrays) to the current schema.
    - Files affected: `app/activities/page.tsx`, `utils/activitiesStorage.ts`.

  - Enhancements (2025-10-11):
    - Horizontal wheel scrolling: using mouse wheel now scrolls days horizontally in the right pane (textareas are exempt so you can scroll within them).
    - Default to Today: on open (if viewing the current month) the view auto-centers today’s column; the Today button also recenters after month jump.
    - Drag-to-reorder activities: left column now supports reordering activities via a grip handle; order persists.
    - Notes UX: disabled autocorrect/spellcheck/capitalize underlines in per-day notes and removed placeholder label.
    - Visual at-a-glance coloring: day cells get a soft tint based on the activity color when there’s content.
    - Files affected: `app/activities/page.tsx`, `docs/changelog.md`, `docs/components.md`.
    - Single vertical scrollbar: left names column and right grid now share one vertical scroll (left scrollbar hidden, scroll positions synchronized). Horizontal scroll remains independent in the right grid.
    - Notes area wheel-to-horizontal: when the cursor is inside a note textarea, the mouse wheel scrolls days horizontally in the right grid for rapid lateral navigation.

- **Enhanced Weekly Goals Edit Options** (2025-10-08)
  - Added comprehensive inline editing for goal titles and notes
  - Double-click any goal or click "Edit goal" from menu to enter edit mode
  - Added optional notes field for goals (toggle via "Add notes" button when editing)
  - Notes display below goal title with a note icon when present
  - Added ability to toggle goal type between Primary and Supporting after creation
  - Keyboard shortcuts: Enter to save, Escape to cancel editing
  - New `updateGoal()` function in `GoalsStorage` for updating title, notes, and goalType
  - Improved menu UI with icons and better organization
  - Menu button now hidden by default, shown on hover for cleaner appearance
  - Files affected: `app/goals/weekly/page.tsx`, `utils/goalsStorage.ts`, `docs/changelog.md`


- **Workspace Today Enhancement** (2025-10-07)
  - Merged focus mode functionality into Workspace Today page (`/projects/workspace`)
  - Added session timer with target durations (25/45/60 min) and sound notifications
  - Added simple task creation for non-structured quick planning
  - Integrated backlog management with drag-and-drop between planned and backlog
  - Added completed tasks tracking with celebration feedback (confetti and sound)
  - Screen Wake Lock support while timer is running
  - Session history and persistence via new localStorage keys:
    - `omega-planner-workspace-today-v1` (session state)
    - `omega-planner-workspace-sessions-v1` (session history)
    - `omega-planner-workspace-target-v1` (target duration)
    - `omega-planner-workspace-sound-v1` (sound settings)
  - Files affected: `app/projects/workspace/page.tsx`
  - Deleted standalone focus mode page (`app/focus/page.tsx`)
  - Updated Tasks page button to link to Workspace Today instead of Focus
  - Files affected: `app/projects/tasks/page.tsx`, `docs/components.md`, `README.md`

- Daily Goals (formerly Weekly Goals)
  - Redesigned page at `/goals/weekly` with 7-column grid layout showing 2 weeks (14 days total: 7 past, today, 6 future).
  - Grid layout eliminates horizontal scroll in favor of multiple rows for efficient space utilization.
  - Plan up to 3 goals per day with visual color-coding system (6 colors) for quick goal identification.
  - **New Goal Types**: Support for Primary goals (exams, important events) vs Supporting tasks with visual hierarchy:
    - Primary goals: Larger text (text-base), bold font, larger checkbox (20px), thicker border (border-2), more padding
    - Supporting tasks: Smaller text (text-sm), normal font, standard checkbox (16px), standard border, less padding
    - Toggle type when adding goals via "Primary" / "Task" buttons
  - **Improved Add UI**: Persistent "+ Add Goal" button instead of hover-based input (non-disruptive)
    - Click button to open input form with goal type selector, color picker, and Add/Cancel buttons
    - Press Enter to submit, Escape to cancel
  - **Fixed Overflow**: Long goal names now wrap properly with `break-words` and `min-w-0` constraints
  - Goal actions (remove, color picker, create task) appear on hover only
  - Create tasks from goals: click ExternalLink icon to navigate to Tasks page with pre-filled data.
  - Today highlighted with primary tint, weekends with muted background.
  - Date headers show both weekday and month/day for better orientation across date ranges.
- **Monday Add Fix**: Date parsing now uses timezone-safe `dateFromDateKey()` when computing week keys; adding to Mondays works reliably across locales/timezones.
  - LocalStorage persistence via `GoalsStorage` (`omega-planner-weekly-goals-v1`). Dynamically loads goals across multiple weeks.
  - Added sidebar navigation link: Weekly Goals.

- Workspace
  - `/projects/workspace` is now project-only: Left is a vertical list of project tasks due Today; Right lists Projects/Tasks with “+ Today” to set dueDate. No planner integration.
  - Drag a project task to the Today pane to set its `dueDate` to today; remove from Today to clear `dueDate`.

- Tasks / Navigation
  - Projects views have been added directly under Workspace in the main sidebar: Projects, Projects Calendar, Projects Timeline, Weekly Projects.
  - Tasks page header keeps a redundant "Projects Views" menu for quick access.
  - Projects page respects `?view=` query param to switch tabs (active | archived | calendar).
  - Added inline Status and Due filters to Tasks controls and Expand/Collapse All when grouped by Project.

- Added Habits & Medication feature:
  - New page at `/habits` with tabs for Habits and Medication.
  - LocalStorage-backed utilities `HabitsStorage` and `MedicationsStorage`.
  - New types in `types/habits.ts` exported via `types/index.ts`.
  - Sidebar navigation link added.
  - UI uses existing layout and tabs components.

## Unreleased

- Weekly view now starts on Monday consistently (fixed moving week start)
- Monthly calendar grid shows a delete button on event chips; events can be removed without opening timeline. Deletions now prompt for confirmation.

## Unreleased

- Calendar (Yearly view)
  - Disabled hover tooltips and summaries in `YearCalendar` in favor of explicit click interactions.
  - Single-click on any date opens a Day Details modal listing events and intervals.
  - Event/Interval chips open a compact Details modal on click (Edit/Delete available).
  - Cleaned up hover state and removed `title` attributes from indicators to prevent native browser tooltips.
  - Files affected: `components/calendar/YearCalendar.tsx`, `docs/components.md`.

- Branding
  - Added browser tab icon using Next.js file-based icon support.
  - File added: `app/icon.svg`. Replace this file to customize the favicon.

- Focus
  - Timer rewritten to use wall-clock elapsed time with `lastResumedAt`, preventing freezes when the tab is backgrounded or the user navigates away. Files affected: `app/focus/page.tsx`.
  - Added Focus-only Screen Wake Lock while the timer is running and page is visible; releases on pause, visibility change, or unmount. Other pages remain static (no wake lock). Files affected: `app/focus/page.tsx`.
  - Past Sessions list is hidden during an active session to reduce distraction. Files affected: `app/focus/page.tsx`.
  - Added collapsible Show/Hide for Past Sessions when no session is active; preference is persisted. Files affected: `app/focus/page.tsx`, `docs/components.md`, `README.md`.
  - Added session target length with quick-picks and custom minutes, plus progress bar, remaining time, and percentage. Persistence via `omega-planner-focus-target-seconds-v1`. Files affected: `app/focus/page.tsx`, `docs/components.md`, `README.md`.
  - Added optional sound notifications (5 minutes remaining, time up) with toggle and persistence via `omega-planner-focus-sound-enabled-v1`. Files affected: `app/focus/page.tsx`, `docs/components.md`, `README.md`.
  - Removed stray `secondsRemaining` reference from the Focus page.
  - Layout refactor: Planned is now central; Completed and Backlog moved to a compact right sidebar. Files affected: `app/focus/page.tsx`, `docs/components.md`.
  - Timer behavior update: main timer displays countdown when a target is set, and elapsed when no target is set. Progress and remaining time remain visible below. Files affected: `app/focus/page.tsx`, `docs/components.md`.
  - Planned task completion feedback: added lightweight confetti burst and success chime (respects sound toggle). Files affected: `app/focus/page.tsx`, `docs/components.md`.

- Navigation
  - Hide `Meals` in the main sidebar by default. Toggle visibility via `SHOW_MEALS_IN_NAV` in `lib/constants.ts` (default: false). Code and route remain intact (`/meals`).

- Calendar
  - Year view: Clicking a month name navigates to the Monthly view for that month (`/calendar?view=monthly&date=YYYY-MM-01`).
  - Monthly view (Simplified):
    - Removed periods/intervals from monthly display (kept in Year view only)
    - Removed bottom legends/lists for a cleaner layout
    - Event chips have larger text and high contrast for readability
    - Switched to a vertically scrollable 12-month layout; defaults to current month on open
    - Simplified header; navigation is by scrolling, with a quick Add Event button
    - Daily navigation button remains on each date (opens Daily planner)

- Projects / Tasks
  - Project task rows now always show the due date/time-until-due inline next to the task name. Hover is no longer required to see due information. Editing the due date remains a click on the chip; action buttons (clear date, expand subtasks, add subtask series, edit, delete) still appear on hover to keep the layout minimal.
  - Completion celebration effect updated to match Focus: lightweight confetti burst at the clicked checkbox and a short success chime that respects the Focus sound toggle. Files affected: `components/projects/TaskListView.tsx`, `components/projects/CompactTaskCard.tsx`, `components/projects/DraggableTaskCard.tsx`, `app/projects/tasks/page.tsx`, `lib/celebration.ts`.
  - Files affected: `components/projects/TaskItem.tsx`, `utils/dateUtils.ts` (reuse only)
  - Due chip now shows the full formatted date on hover as `Weekday DD/MM/YYYY` (e.g., `Tuesday 15/05/2025`).

- Meals/Recipes
  - Added `RecipeFormModal` for creating/editing recipes with structured ingredient entry (name + quantity fields).
  - Integrated modal into `components/meals/RecipesSidebar.tsx` and enabled editing by clicking recipe names.
  - Fixed suggested recipes logic to compare against pantry items and list missing ingredients.
  - When adding a recipe to a meal slot, ingredients are now attached to the created meal so pantry matching works across Pantry/Shopping views.
  - Pantry/Recipes matching now normalizes ingredient names (trim, lowercase, simple plural strip) for robust matching.
  - Enhanced recipe suggestions with tiered matching: "Almost Ready" (75%+), "Good Match" (50-74%), "Partial Match" (25-49%).
  - Added visual match indicators throughout recipe lists with color-coded dots and ingredient counts.
  - Added pantry-based autocomplete for ingredient entry in recipe modal.
  
  Pantry
  - Structured input for pantry items (name, quantity, category) with inline editing in `PantrySidebar`.
  - Deduplicate and merge pantry items on add (normalize by name; update quantity/category if provided).
  - Deduplicate by normalized name on load (keep most recently updated) in `PantryStorage`.
  - Fixed infinite re-render loop causing storage to constantly save empty arrays.
  - Added deduplication guards to prevent saving identical data multiple times in rapid succession.
  - Improved storage reliability and performance for pantry and recipe persistence.
  - Added comprehensive debugging logs to all storage operations and UI interactions for troubleshooting.

## 2025-09-12

- Navigation order updated: moved `Focus` and `Meals` to the bottom of the main sidebar list. Files affected: `components/ui/Navigation.tsx`, `docs/components.md`.

## Unreleased

- Projects / Tasks – Weekly Scheduler
  - New page at `/projects/tasks/weekly` for week-based scheduling of project tasks.
  - Two-panel layout: left shows week days (drop targets); right shows projects and tasks (draggable).
  - Drop a task on a day to set `dueDate`.
  - Tasks include a checkbox to toggle completion; plays a brief celebration on complete.
  - Long task titles are truncated to avoid overflow in the days panel.

- Focus page: Past Sessions redesigned to emphasize duration and show tasks as chips; dates are deemphasized with a compact time range and small day label. Files affected: `app/focus/page.tsx`.


