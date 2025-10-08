## Unreleased

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

- **Projects Timeline Simplification & Compression** (2025-10-08)
  - Simplified timeline view to focus on essential information: projects, tasks, and dates
  - Removed task names from bars - now shown only on hover via HoverCard for cleaner visual
  - Enhanced day divisions with clear vertical separators between every day
  - Removed clutter: priority/status filter buttons, stats panel, and legend
  - Removed group mode toggle - always shows projects view
  - Cleaner header with only navigation and view mode controls (Week/Month/Quarter)
  - Improved day separators: subtle lines for days, stronger for weeks, strongest for months
  - **Compressed vertical spacing**:
    - Reduced task height from 18px to 16px
    - Reduced lane spacing from 4px to 3px
    - Reduced project label area from 32px to 18px (now aligned with first task)
    - Reduced task area height from 80px to 50px
    - Reduced row gap from 16px to 12px
  - **Aligned project labels with task cards**:
    - Project name label now sits on the same horizontal line as the first task
    - Project label card has same height (16px) and styling as task cards
    - More compact and visually cohesive layout
  - **Square task card styling** (matching daily planner):
    - Single-day tasks now use compact square cards instead of circles
    - Reduced border radius to 2px (from 6px) for more square appearance
    - Compact card width centered in day columns
    - Consistent styling across all task types (spans and single-day)
  - Files affected: `components/projects/ProjectsTimeline.tsx`, `docs/components.md`, `docs/changelog.md`

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
  - Monthly view: Event chips show Edit and Delete buttons on hover; Delete prompts for confirmation.

- Projects / Tasks
  - Project task rows now always show the due date/time-until-due inline next to the task name. Hover is no longer required to see due information. Editing the due date remains a click on the chip; action buttons (clear date, expand subtasks, add subtask, edit, delete) still appear on hover to keep the layout minimal.
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


