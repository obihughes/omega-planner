## 2026-07-04

- **Daily Planner: scale scheduling view timeline to sidebar layout** (2026-07-04)
  - Scheduling view timeline now measures the right-hand content area and scales `pixelsPerHour` / column height to fit beside the 320px sidebar instead of using full-screen density (211px/hour).
  - Drag and resize in scheduling view use the same scaled density via `activePixelsPerHourRef`.
  - **Files affected**: `components/planner/MergedDailyView.tsx`, `components/planner/DailyPlanner.tsx`, `components/planner/index.ts`, `docs/planner.md`, `components/planner/README.md`, `docs/changelog.md`

- **Daily Planner: merged scheduling + daily view** (2026-07-04)
  - Scheduling view (`?view=monthly`) now combines the left sidebar (mini calendar + inbox) with the full daily timeline panels on the right.
  - Bulk actions (Delete Mode, Clear Day, Apply Saved Day) moved to an expandable popover in the sidebar header.
  - Mini calendar date selection syncs with the top day panel via `topDayOffset`.
  - New components: `MergedDailyView.tsx`, `SchedulingSidebar.tsx`.
  - **Files affected**: `components/planner/DailyPlanner.tsx`, `components/planner/MergedDailyView.tsx`, `components/planner/SchedulingSidebar.tsx`, `components/planner/index.ts`, `docs/planner.md`, `components/planner/README.md`, `docs/changelog.md`

- **Daily Planner: import class schedule to timeline** (2026-07-04)
  - Added **Import Classes** quick action on top and bottom day panels to copy recurring class schedule entries into the planner timeline for the currently viewed date.
  - Conflict detection warns when imported classes overlap existing scheduled tasks; users can skip conflicting classes, replace existing tasks, or cancel.
  - New utilities: `utils/classScheduleUtils.ts`; new modal: `components/planner/ConflictResolutionModal.tsx`.
  - **Files affected**: `types/planner.ts`, `utils/classScheduleUtils.ts`, `utils/classScheduleUtils.test.ts`, `utils/index.ts`, `hooks/useDailyPlannerState.ts`, `components/planner/DailyPlanner.tsx`, `components/planner/ConflictResolutionModal.tsx`, `components/planner/index.ts`, `types/index.ts`, `docs/planner.md`, `components/planner/README.md`, `docs/utils.md`, `docs/changelog.md`

- **Goal Hierarchy: highlight today in day grid** (2026-07-04)
  - Today's day column uses the same green border highlight as Calendar weekly overview.
  - Preview-row styling no longer overrides today's border when today falls on Sat–Wed.
  - **Files affected**: `components/goal-hierarchy/DayColumn.tsx`, `docs/changelog.md`

## 2026-07-03

- **Goal Hierarchy: simplify month/week UI** (2026-07-03)
  - Removed sub-goal inputs and checklists from month and week levels; `GoalLevelBlock` now shows only the goal summary textarea.
  - Existing sub-goal data remains in localStorage but is no longer rendered.
  - **Files affected**: `components/goal-hierarchy/GoalLevelBlock.tsx`, `components/goal-hierarchy/GoalHierarchyView.tsx`, `docs/changelog.md`, `docs/structure.md`, `docs/components.md`, `docs/README.md`, `README.md`

- **Goal Hierarchy: daily goals sync with Weekly Overview** (2026-07-03)
  - Replaced plain-text day goal inputs (`DayGoalTextarea`) with the same styled weekly goal cards used in Calendar weekly overview.
  - Day goals now read/write `omega-planner-weekly-goals-v1` via `useWeeklyGoals`; edits in Goal Hierarchy appear in `/calendar?view=weekly-goals` and vice versa.
  - Shared UI extracted to `components/weekly-goals/` (`GoalItem`, `GoalEditModal`, `WeeklyGoalsAddForm`, `goalColors`).
  - **Files affected**: `components/goal-hierarchy/DayColumn.tsx`, `components/goal-hierarchy/GoalHierarchyView.tsx`, `components/goal-hierarchy/WeeklyGoalsListForDay.tsx`, `components/weekly-goals/*`, `components/calendar/WeeklyGoalsCalendarView.tsx`, `hooks/useWeeklyGoals.ts`, `hooks/index.ts`, `utils/dateUtils.ts`, `lib/appHierarchy.ts`, `docs/changelog.md`, `docs/structure.md`, `docs/components.md`, `docs/README.md`

- **Navigation: Week moved to beta features** (2026-07-03)
  - Removed **Week** from Daily Planner sidebar subviews; open via Settings → Beta features or `/?view=weekly`.
  - **Files affected**: `lib/hiddenNavItems.ts`, `components/ui/Navigation.tsx`, `lib/appHierarchy.ts`, `docs/planner.md`, `docs/structure.md`, `docs/changelog.md`

- **Navigation: 5-Year Visualizer moved to bottom of main nav** (2026-07-03)
  - Removed **5-Year Visualizer** from Calendar subviews; added as a top-level sidebar item after **Text Documents**.
  - **Files affected**: `components/ui/Navigation.tsx`, `lib/appHierarchy.ts`, `docs/planner.md`, `docs/structure.md`, `docs/components.md`, `docs/changelog.md`

## 2026-06-30

- **Goal Hierarchy: fix typing on cross-month day columns** (2026-06-30)
  - Day saves now use the same month/week storage slot the grid read from, instead of routing by the date’s calendar month (`getWeekContextForDate(dateKey)`).
  - Fixes Wed–Fri and Sat–Sun columns when the viewed week spans two months (keystrokes no longer reset on July dates while on the June tab).
  - **Files affected**: `hooks/useGoalHierarchy.ts`, `components/goal-hierarchy/GoalHierarchyView.tsx`, `hooks/index.ts`, `utils/goalHierarchyDates.test.ts`, `docs/changelog.md`, `docs/structure.md`, `lib/appHierarchy.ts`

## 2026-06-26

- **Goal Hierarchy: weekend + next-week preview rows** (2026-06-26)
  - Day grid split into two 5-column rows: Mon–Fri (primary) and Sat–Wed (muted preview row).
  - Preview row includes current-week Sat–Sun plus Mon–Wed from the following week; all remain fully editable.
  - Weeks now store seven day slots (Mon–Sun); legacy five-day weeks migrate by `dateKey` on load.
  - Day edits resolve month/week from `dateKey`, so next-week preview days save to the correct week.
  - **Files affected**: `types/goalHierarchy.ts`, `utils/goalHierarchyDates.ts`, `utils/goalHierarchyStorage.ts`, `hooks/useGoalHierarchy.ts`, `components/goal-hierarchy/DayColumn.tsx`, `components/goal-hierarchy/GoalHierarchyView.tsx`, `types/index.ts`, `utils/index.ts`, `docs/changelog.md`, `docs/structure.md`

## 2026-06-24

- **Goal Hierarchy: fix Enter splitting day goal lines** (2026-06-24)
  - Enter now splits the current line at the cursor and moves text after the cursor to the new line (plain text and bullet/checkbox lines).
  - **Files affected**: `components/goal-hierarchy/DayGoalTextarea.tsx`, `docs/changelog.md`

- **Goal Hierarchy: simplify day goal storage to text-only** (2026-06-24)
  - Day goals now read and write `summary` directly; removed `dayGoalDisplayText()` conversion layer.
  - Legacy day `items` migrate into `summary` as `[ ]` / `[x]` lines on load when `summary` is empty; `items` cleared on save.
  - Month and week levels unchanged (`GoalLevelBlock` with summary + checklist).
  - **Files affected**: `types/goalHierarchy.ts`, `components/goal-hierarchy/DayColumn.tsx`, `components/goal-hierarchy/dayGoalTextUtils.ts`, `hooks/useGoalHierarchy.ts`, `utils/goalHierarchyStorage.ts`, `docs/changelog.md`, `docs/structure.md`, `docs/README.md`

- **Goal Hierarchy: plain-text day goals with bullet shortcuts** (2026-06-24)
  - Day columns simplified to a single textarea stored in `summary` as plain text.
  - Shortcuts: `--` at line start creates a bullet (empty line or before existing text); Tab then `--` for indented bullets; Enter continues the same bullet with wrapped lines aligned after the marker; Ctrl+Enter toggles `[ ]` / `[x]` checkboxes.
  - Shortcut help moved to a small info button above the day grid (`DayGoalShortcutsHelp`).
  - Legacy day `items` are shown as `[ ]` / `[x]` lines when `summary` is empty until the user edits.
  - Removed `BulletGoalBlock`; month and week levels unchanged (`GoalLevelBlock`).
  - **Files affected**: `components/goal-hierarchy/DayGoalTextarea.tsx`, `components/goal-hierarchy/dayGoalTextUtils.ts`, `components/goal-hierarchy/DayColumn.tsx`, `components/goal-hierarchy/GoalHierarchyView.tsx`, `components/goal-hierarchy/index.ts`, `hooks/useGoalHierarchy.ts`, `lib/appHierarchy.ts`, `docs/structure.md`, `docs/changelog.md`, `docs/README.md`

## 2026-06-23

- **Navigation: Month Board → beta, Goal Hierarchy → main nav** (2026-06-23)
  - Moved **Month Board** from Daily Planner sidebar subview to Settings → Beta features (`lib/hiddenNavItems.ts`).
  - Moved **Goal Hierarchy** from beta/hidden nav to a top-level main sidebar item (after Calendar).
  - **Files affected**: `lib/hiddenNavItems.ts`, `components/ui/Navigation.tsx`, `lib/appHierarchy.ts`, `docs/structure.md`, `docs/planner.md`, `docs/components.md`, `docs/changelog.md`, `README.md`

- **Month board: single-week view with month/week pickers** (2026-06-23)
  - Replaced 12-week vertical scroll with one week at a time. Three-panel layout: month picker (Jan–Dec of current year), week selector (4–5 weeks per month + Prev/Next), main content (week goal column + Mon–Sun day rows).
  - Storage schema v2.0: weeks keyed by Monday `weekStartKey`; persists `selectedMonthKey` and `selectedWeekStartKey`. Legacy 12-week horizon format migrates on load.
  - **Files affected**: `types/monthBoard.ts`, `utils/monthBoardStorage.ts`, `utils/monthBoardDates.ts`, `components/month-board/MonthBoard.tsx`, `types/index.ts`, `utils/index.ts`, `lib/appHierarchy.ts`, docs, READMEs

- **Month board: vertical hybrid layout** (2026-06-23)
  - Redesigned layout: twelve weeks stack vertically; each week has **week goal** on the left and **Mon–Fri** day columns on the right (horizontal grid, styled like Goal Hierarchy day columns).
  - Removed backlog sidebar and "week focus" label (renamed to week goal). Weekend day slots removed (Mon–Fri only).
  - Storage schema v1.1: backlog dropped on load; legacy 7-day weeks migrate to first five weekdays.
  - **Files affected**: `types/monthBoard.ts`, `utils/monthBoardStorage.ts`, `components/month-board/MonthBoard.tsx`, `lib/appHierarchy.ts`, `types/README.md`, `utils/README.md`, `docs/planner.md`, `docs/components.md`, `docs/structure.md`, `docs/changelog.md`

- **Goal Hierarchy (beta)** (2026-06-23)
  - New experimental section at `/goal-hierarchy` (Settings → Beta features): monthly summary + sub-goals, week tabs within the month, weekly summary + Mon–Fri day columns with hybrid text + checklist goals.
  - Persists to `omega-planner-goal-hierarchy-v1` in localStorage; isolated from existing Weekly Goals and Month Board.
  - **Files affected**: `types/goalHierarchy.ts`, `utils/goalHierarchyStorage.ts`, `utils/goalHierarchyDates.ts`, `hooks/useGoalHierarchy.ts`, `components/goal-hierarchy/*`, `app/goal-hierarchy/page.tsx`, `lib/hiddenNavItems.ts`, `components/ui/Navigation.tsx`, barrel indexes, `lib/appHierarchy.ts`, `docs/structure.md`, `docs/changelog.md`, `README.md`

- **Task color palette: ROYGBIV expansion** (2026-06-23)
  - Expanded daily planner task colors from 23 to 30 swatches (7 new lighter accents: rose, red/orange/yellow/green/blue/violet 400).
  - Reordered the edit-modal color picker ROYGBIV (spectrum first, slate/gray neutrals last).
  - Added `DEFAULT_TASK_COLOR` and `POOL_TASK_COLOR` named constants; replaced magic index references in `useModalManager`.
  - **Files affected**: `lib/constants.ts`, `hooks/useModalManager.ts`, `docs/planner.md`, `docs/changelog.md`

- **Calendar: sticky Month / Year toggle** (2026-06-23)
  - Month and Year view switch buttons stay fixed at the top while scrolling through long monthly or yearly calendar layouts.
  - **Files affected**: `app/calendar/page.tsx`, `docs/planner.md`, `docs/changelog.md`

## 2026-06-18

- **Month board: fixed backlog column** (2026-06-18)
  - Only the week grid scrolls; the backlog stays visible on the right on large screens (and below the grid on small screens). Long backlog lists scroll inside the panel.
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/planner.md`, `docs/components.md`, `docs/changelog.md`

- **Sunset and Ocean themes + semantic color refactor** (2026-06-18)
  - Refactored status, priority, task-status, and calendar event colors to semantic CSS variables in [`app/theme-tokens.css`](../app/theme-tokens.css). Shared utility classes in `app/globals.css` now read from variables instead of per-theme duplicate rules.
  - Added **Sunset** (warm cream, burnt orange) and **Ocean** (cool white, deep blue) accent themes alongside Forest.
  - Registered `sunset` and `ocean` in `next-themes`; Settings → Theme picker shows Light / Dark / Forest / Sunset / Ocean / System.
  - `useTheme` exports `isSunset`, `isOcean`; `toggleTheme` cycles light → dark → forest → sunset → ocean.
  - **Files affected**: `app/globals.css`, `app/theme-tokens.css`, `app/providers.tsx`, `hooks/useTheme.ts`, `components/ui/Navigation.tsx`, `docs/styling-guide.md`, `hooks/README.md`, `lib/appHierarchy.ts`, `docs/changelog.md`, `README.md`

- **Forest theme** (2026-06-18)
  - Added a third distinct theme option alongside light and dark: **Forest** — cream backgrounds, forest-green primary accents, and sage secondary tones.
  - Registered `forest` in `next-themes` (`themes` prop in `app/providers.tsx`); CSS variables and semantic color overrides live under `.forest` in `app/globals.css`.
  - Settings → Theme segmented control now includes Light / Dark / Forest / System. `useTheme` exports `THEME_OPTIONS`, `THEME_LABELS`, and `isForest`; `toggleTheme` cycles light → dark → forest.
  - **Files affected**: `app/globals.css`, `app/providers.tsx`, `hooks/useTheme.ts`, `hooks/index.ts`, `components/ui/Navigation.tsx`, `docs/styling-guide.md`, `hooks/README.md`, `lib/appHierarchy.ts`, `docs/changelog.md`

## 2026-06-01

- **Month board: fix focus loss when typing first character** (2026-06-01)
  - Empty day/week slots no longer swap `EmptySlotTextarea` for `NoteCard` on the first keystroke; `SlotNoteEditor` keeps one textarea and assigns a stable note id before persisting.
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/changelog.md`

- **Month board: column layout** (2026-06-01)
  - Backlog panel moved to the right on large screens; each week row shows day rows on the left and week focus on the right. Removed backlog drag-help paragraph.
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/planner.md`, `docs/components.md`, `docs/changelog.md`

- **Month board: current week in focus on open** (2026-06-01)
  - On load, `rollHorizonToCurrentWeek` advances the 12-week horizon so the current calendar week is week index 0 (backlog preserved; notes in dropped past weeks are discarded; 12+ weeks stale or future horizon re-anchors with empty weeks).
  - Auto-scrolls the shared planner body to center the current week once per visit (`behavior: 'auto'`).
  - **Files affected**: `utils/monthBoardStorage.ts`, `utils/index.ts`, `components/month-board/MonthBoard.tsx`, `docs/planner.md`, `docs/components.md`, `docs/changelog.md`

## 2026-05-27

- **5-Year Visualizer: Day-accurate current-date line** (2026-05-27)
  - The vertical “now” line is positioned by day within the month column (not always at month center). Added a top dot marker, soft glow, and date tooltip; current month uses `ring-2 ring-inset ring-primary` on header and cells plus a day-aligned tick.
  - **Files affected**: `components/visualizer/FiveYearVisualizer.tsx`, `docs/components.md`, `docs/changelog.md`

- **Meals page remake** (2026-05-27)
  - Replaced the 3-column recipes page (pantry, shopping, match tiers) with a simple `/meals` page: add meals, list ingredients, edit/delete.
  - New `types/meals.ts`, `utils/mealsStorage.ts`, `hooks/useMeals.ts`, `components/meals/MealsView.tsx`, `components/modals/MealFormModal.tsx`.
  - Migrates saved data from legacy `omega-planner-recipes` localStorage on first load.
  - `/recipes` redirects to `/meals`. Removed pantry, shopping, recipes hooks/storage/contexts and duplicate UI.
  - **Files affected**: `app/meals/page.tsx`, `app/recipes/page.tsx`, `components/meals/`, `components/modals/MealFormModal.tsx`, `hooks/useMeals.ts`, `types/meals.ts`, `utils/mealsStorage.ts`, `lib/hiddenNavItems.ts`, `lib/appHierarchy.ts`, `hooks/index.ts`, `types/index.ts`, `components/index.ts`, `components/modals/index.ts`, `utils/index.ts`, `components/ui/Navigation.tsx`, `docs/structure.md`, `docs/changelog.md`, `README.md`

- **Settings: Beta features dialog** (2026-05-27)
  - Added Settings → Beta features → Open to reach sidebar-hidden pages (Meals, Study Tracker) via a nested dialog. Config in `lib/hiddenNavItems.ts`.
  - **Files affected**: `lib/hiddenNavItems.ts`, `components/ui/Navigation.tsx`, `docs/changelog.md`, `lib/appHierarchy.ts`, `docs/structure.md`, `README.md`

- **Settings modal: slimmer layout** (2026-05-27)
  - Replaced large theme preview cards with a compact segmented control (Light / Dark / System).
  - Removed cosmetic auto-save, sidebar width reset, and About sections; App Map link unchanged. Sidebar drag-resize and document auto-save behavior unchanged.
  - **Files affected**: `components/ui/Navigation.tsx`, `docs/changelog.md`, `lib/appHierarchy.ts`, `docs/styling-guide.md`

## 2025-05-25

- **Projects: faster list ↔ detail navigation** (2025-05-25)
  - Added global `ProjectsProvider` so project data loads once per session instead of on every route change.
  - Added `app/projects/layout.tsx` with shared `AppLayout` so the sidebar stays mounted between list and detail.
  - Removed blocking "Loading project…" screen on detail after hydrate; lazy-loaded `ProjectsCalendar` on the Calendar tab only.
  - **Files affected**: `app/context/ProjectsContext.tsx`, `app/context/ProjectsProvider.tsx`, `app/providers.tsx`, `app/projects/layout.tsx`, `app/projects/page.tsx`, `app/projects/[id]/page.tsx`, `hooks/useProjects.ts`, `lib/appHierarchy.ts`, `components/projects/README.md`, `hooks/README.md`, `PERFORMANCE.md`, `docs/changelog.md`

- **Navigation: balanced icon refresh** (2025-05-25)
  - Daily Planner → `NotebookPen`; Daily → `Sun`; Class Schedule → `GraduationCap`; 5-Year Visualizer → `GanttChart`; Text Documents → `FileText`.
  - Fixes duplicate icons (`CalendarCheck` on parent and child; `CalendarRange` on calendar view and visualizer).
  - **Files affected**: `components/ui/Navigation.tsx`, `docs/changelog.md`

- **Minimal Todo page** (2025-05-25)
  - New `/todo` route with add, complete, remove, and clear completed; localStorage via `omega-planner-todo-v1`.
  - Sidebar nav entry (ListTodo icon) between Projects and Text Documents.
  - **Files affected**: `types/todo.ts`, `utils/todoStorage.ts`, `hooks/useTodo.ts`, `components/todo/`, `app/todo/page.tsx`, `components/ui/Navigation.tsx`, `types/index.ts`, `docs/structure.md`, `docs/components.md`, `docs/changelog.md`

- **App Map — code hierarchy reference** (2025-05-25)
  - New `/app-map` page with searchable, collapsible tree of routes, pages, components, hooks, and storage.
  - Curated data in `lib/appHierarchy.ts`; reachable from Settings → Developer → App Map (not in main sidebar).
  - **Files affected**: `lib/appHierarchy.ts`, `components/app-map/AppMapView.tsx`, `app/app-map/page.tsx`, `components/ui/Navigation.tsx`, `docs/structure.md`, `docs/README.md`, `docs/changelog.md`

- **Navigation: hide Recipes** (2025-05-25)
  - Removed Recipes from the main sidebar; `/recipes` remains available via direct URL.
  - **Files affected**: `components/ui/Navigation.tsx`, `docs/changelog.md`, `README.md`, `docs/structure.md`

- **Calendar: combined monthly and yearly views** (2025-05-25)
  - Monthly is the default events calendar (`/calendar?view=monthly`); bare `/calendar` syncs to that URL.
  - In-page Month / Year toggle on the calendar page; sidebar uses a single **Calendar** link instead of separate Monthly and Yearly entries.
  - **Files affected**: `app/context/CalendarViewContext.tsx`, `app/calendar/page.tsx`, `components/ui/Navigation.tsx`, `docs/planner.md`, `docs/changelog.md`

- **Sidebar nav: flat planner and calendar links** (2025-05-25)
  - Removed visible **Daily Planner** and **Calendar** group headings; their sub-items (Daily, Week, Class Schedule, etc.) render as top-level links with the same styling as Projects.
  - **Files affected**: `components/ui/Navigation.tsx`, `docs/changelog.md`

- **Month board: week focus layout** (2025-05-25)
  - Week focus column width increased ~50% (`220px` → `330px` on `md+`); backlog column narrowed (`480px` → `320px`, `max-w-xl` → `max-w-sm`) to balance horizontal space.
  - Week focus drop zone and empty/note textareas are taller (`min-h` 180px zone, 140px empty field, `autosizeText` on week notes).
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/planner.md`, `docs/components.md`, `docs/changelog.md`

- **Theme preference persistence** (2025-05-25)
  - Light, dark, and system theme choices now persist across sessions via `next-themes` and localStorage key `omega-planner-theme`. Settings buttons call `setTheme` explicitly instead of toggling.
  - **Files affected**: `app/providers.tsx`, `hooks/useTheme.ts`, `components/ui/Navigation.tsx`, `docs/changelog.md`, `docs/styling-guide.md`

## 2025-03-22

- **Month board: backlog panel scroll** (2025-03-22)
  - Removed the backlog-only `overflow-y-auto` / `flex-1` notes region so the backlog column no longer shows its own scrollbar; the shared main row scrolls (`overflow-y-auto`, `items-start`) with backlog height following content. Week column no longer uses a separate vertical scroll—one scrollbar for the planner body below the title.
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/planner.md`, `docs/changelog.md`

- **Month board: placeholders, backlog move, drag overflow** (2025-03-22)
  - Removed placeholder text from backlog add field, empty week/day textareas, and related copy.
  - Dragging from the backlog to a week or day **moves** the note (removes it from the backlog) instead of copying.
  - Reduced horizontal scrollbar during drag: `overflow-x-hidden` on the main row and week scroll column, `min-w-0` / `max-w-full` on note cards, `overflow-x-hidden` on week sections.
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/planner.md`, `docs/changelog.md`

- **Month board: backlog width + inline typing** (2025-03-22)
  - Backlog column width on large screens increased by ~50% (`320px` → `480px` max width, `max-w-sm` → `max-w-xl`).
  - Empty week-focus and day rows show a real textarea so text can be entered directly; first content is stored as a normal note (with `upsertWeekInlineNote` / `upsertDayInlineNote` handling the empty → single-note transition). Note textareas use pointer capture stopPropagation for reliable focus with `@dnd-kit`.
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/planner.md`, `docs/components.md`, `docs/changelog.md`

- **Month board: backlog textareas auto-height** (2025-03-22)
  - Backlog “add” field and backlog note cards use `AutosizeTextarea` (`scrollHeight` + `useLayoutEffect`) so height grows with line count; `resize-none` / `overflow-hidden` avoids inner scrollbars inside those fields.
  - **Files affected**: `components/month-board/MonthBoard.tsx`, `docs/changelog.md`, `docs/components.md`

- **Month board** (2025-03-22)
  - New page `/month-board`: backlog plus twelve calendar-anchored weeks with a week-focus column and Mon–Sun rows (weekday + date). Drag grip to copy from backlog or move notes between slots; persists to `omega-planner-month-board-v1`.
  - **Files affected**: `app/month-board/page.tsx`, `components/month-board/`, `types/monthBoard.ts`, `utils/monthBoardStorage.ts`, `components/ui/Navigation.tsx`, `types/index.ts`, `utils/index.ts`, `docs/README.md`, `docs/planner.md`, `docs/components.md`, `docs/changelog.md`, `types/README.md`, `utils/README.md`

## 2025-03-21

- **5-Year Visualizer: Current-month line scoped to current year row** (2025-03-21)
  - The vertical “now” line no longer spans the full five-year grid; it appears only in the year row matching the current calendar year. Period labels render above the line to avoid a strike-through effect.
  - **Files affected**: `components/visualizer/FiveYearVisualizer.tsx`, `docs/components.md`, `docs/changelog.md`

- **5-Year Visualizer: Design-system consistency** (2025-03-21)
  - Replaced hardcoded slate/blue/green hex palette with semantic tokens (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `primary`, `muted`, etc.) so the visualizer aligns with the rest of Omega Planner in light and dark modes.
  - **Files affected**: `components/visualizer/FiveYearVisualizer.tsx`, `docs/components.md`, `docs/changelog.md`

## 2025-03-17

- **Weekly Overview: Raise goals-per-day limit to 6** (2025-03-17)
  - Fixed bug where only 3 goals per day could be saved in Weekly Overview; storage was truncating goals 4+.
  - Raised limit from 3 to 6 in `GoalsStorage` (`addGoal`, `cleanWeekGoals`) to match Study Tracker and the UI.
  - **Files affected**: `utils/goalsStorage.ts`, `docs/changelog.md`

## 2025-03-12

- **Study Tracker: Remove Weekly/Monthly Toggle** (2025-03-12)
  - Removed Weekly and Monthly view toggle from Study Tracker to align header layout with Weekly Overview and fix top spacing mismatch.
  - Deleted `StudyMonthlyView` and `StudyFilters` components and related dead code (`getTasksForDateRange`, `goToWeekContaining`, `subjectFilter`, `toggleSubjectFilter`, `filteredSubjects` from `useStudyTracker`).
  - Study Tracker now shows only the weekly 2-week grid view.
  - **Files affected**: `components/study-tracker/StudyTracker.tsx`, `hooks/useStudyTracker.ts`, `components/study-tracker/index.ts`, `docs/components.md`, `docs/changelog.md`; deleted: `StudyMonthlyView.tsx`, `StudyFilters.tsx`

- **Weekly Overview + Study Tracker Convergence** (2025-03-12)
  - **Inline view switch**: Added toggle on `/calendar?view=weekly-goals` to switch between Weekly Overview and Study Tracker without leaving the page, enabling quick comparison.
  - **Study Tracker embedding**: Study Tracker is now rendered in-place when selected, wrapped with `StudyTrackerProvider`; data remains isolated (goals vs study storage).
  - **Visual alignment**: Weekly Overview header and layout updated to match Study Tracker styling (border-border/50, gap-1.5, consistent spacing).
  - **Weekly Notes rework**: Notes panel is fully hidden when compressed. "Open Notes" button in header reveals the panel on demand; close icon hides it. No persistent narrow strip when closed.
  - **Files affected**: `app/calendar/page.tsx`, `components/calendar/WeeklyGoalsCalendarView.tsx`, `components/calendar/ChecklistSidebar.tsx`, `docs/components.md`, `docs/planner.md`, `docs/changelog.md`

## 2025-02-21

- **Daily View Timeline: Cleaner Grid Styling** (2025-02-21)
  - Aligned Daily View timeline grid with Class Schedule for a cleaner look.
  - Replaced hardcoded `border-gray-200 dark:border-gray-700` (which could appear blue-ish in dark themes) with theme-aware `border-border/20`, `border-border/30`, `border-border/10`.
  - Hierarchical grid lines: major hour boundaries (every 6th) use `border-border/30`, minor hours use `border-border/10`.
  - Header and column borders now use `border-border/*` for consistent theming.
  - Removed unused `GRID_LINE_STYLE` from `lib/constants.ts`.
  - **Files affected**: `components/planner/TimelineColumn.tsx`, `lib/constants.ts`, `docs/changelog.md`

## 2025-02-14

- **Daily Planner: Tasks vs Class Schedule View Toggle** (2025-02-14)
  - Added per-panel toggle on both top and bottom day views to switch between scheduled tasks and class schedule for the displayed day.
  - "Tasks" shows the scheduled tasks for that specific date; "Class" shows the recurring class schedule for that weekday.
  - Class schedule view is read-only (view notes allowed; edit via Class Schedule page).
  - **Files affected**: `components/planner/DailyPlanner.tsx`, `components/planner/README.md`, `docs/changelog.md`

- **Class Schedule: Remove Night Row** (2025-02-14)
  - Removed the night (12am–6am) row from Class Schedule; each day now shows morning, afternoon, and evening only.
  - **Files affected**: `components/planner/ClassSchedule.tsx`, `docs/planner.md`, `components/planner/README.md`

- **Class Schedule Single View** (2025-02-14)
  - Removed Weekly and Agenda views from Class Schedule; kept only the 7-day stacked Daily view.
  - Removed view mode toggle UI.
  - Removed `AGENDA_PIXELS_PER_HOUR` from `lib/constants.ts`.
  - **Files affected**: `components/planner/ClassSchedule.tsx`, `lib/constants.ts`, `docs/planner.md`, `components/planner/README.md`

- **Phase 7: Final Nav and Documentation** (2025-02-14)
  - Deleted `app/meals/page.tsx` (replaced by `/recipes`).
  - Updated default `expandedNavItems`: removed `'workspace'`.
  - Removed `export * from './meals'` from `components/index.ts`.
  - Updated `docs/structure.md`: removed habits, activities, workspace, tasks, focus, meals; added recipes.
  - Updated `docs/utils.md`: removed HabitsStorage, Meals Storage, ActivitiesStorage sections.
  - Updated `README.md`: replaced Workspace Today and Meals with Recipes.
  - Updated `hooks/README.md`: removed useMeals; simplified usePantry.

- **Phase 6: Link Updates** (2025-02-14)
  - WeeklyGoalsCalendarView `createTaskFromGoal`: redirect to `/projects` instead of `/projects/tasks` (tasks page removed).

- **Phase 5: Recipes Extraction** (2025-02-14)
  - Created standalone `/recipes` page with PantryProvider, ShoppingProvider, PantrySidebar, ShoppingListSidebar, RecipesView.
  - Created `components/recipes/RecipesView.tsx` (from RecipesSidebar, no meal logic).
  - Created `components/recipes/index.ts`.
  - Updated Navigation: replaced Meals with Recipes (href: /recipes, icon: ChefHat).
  - Added recipes export to `components/index.ts`.

- **Phase 4: Hidden Pages Removal** (2025-02-14)
  - Deleted pages: `/habits`, `/projects/workspace`, `/projects/tasks`, `/projects/tasks/weekly`, `/activities`, `/focus/mini`.
  - Deleted supporting code: `utils/habitsStorage.ts`, `types/habits.ts`, `utils/activitiesStorage.ts`.
  - Updated `types/index.ts` (removed habits), `utils/index.ts` (removed habitsStorage, activitiesStorage).
  - Removed obsolete comment from Navigation.tsx.

- **Phase 3: Beta Verification** (2025-02-14)
  - Verified: Beta already removed. No `app/beta/` directory; no beta references in Navigation or code. No changes needed.

- **Phase 2: Nav Filtering** (2025-02-14)
  - Removed `SHOW_MEALS_IN_NAV` constant from `lib/constants.ts`.
  - Removed `filteredNavItems`; Navigation now uses `navItems` directly.
  - **Files affected**: `lib/constants.ts`, `components/ui/Navigation.tsx`

- **Phase 1: Dead Code Removal – Meals** (2025-02-14)
  - Removed meal planning: MealPlanner, MealsContext, mealsStorage, types/meals, useMeals.
  - PantrySidebar: Removed useMealsContext, "Cookable now (today)", "Almost there (missing items)" sections; kept pantry items list.
  - RecipesSidebar: Removed useMealsContext, B/L/D "add to meal" buttons; kept recipe list, cookable, suggestions, add-to-shopping.
  - ShoppingListSidebar: Removed useMealsContext, "Add missing ingredients" (meal-derived); kept manual shopping list.
  - usePantry: Removed canCook, missingFor, MealItem dependency.
  - app/meals/page: Removed MealsProvider, MealPlanner; now shows Pantry, Shopping, Recipes sidebars only.
  - **Files deleted**: `components/meals/MealPlanner.tsx`, `app/context/MealsContext.tsx`, `utils/mealsStorage.ts`, `types/meals.ts`, `hooks/useMeals.ts`
  - **Files affected**: `components/meals/PantrySidebar.tsx`, `components/meals/RecipesSidebar.tsx`, `components/meals/ShoppingListSidebar.tsx`, `app/meals/page.tsx`, `hooks/usePantry.ts`, `app/context/index.ts`, `components/meals/index.ts`, `hooks/index.ts`, `types/index.ts`

- **Meals Code Cleanup** (2025-02-14)
  - Removed all `console.log` debug statements from meals-related code (PantrySidebar, RecipesSidebar, usePantry, useRecipes).
  - Consolidated pantry state: MealPlanner, ShoppingListSidebar, and useRecipes now use `usePantryContext` instead of separate `usePantry` instances, ensuring a single shared pantry across the meals page.
  - MealPlanner now uses `MEAL_SLOTS` and `MEAL_SLOT_LABELS` from `types/meals` instead of local constants.
  - Fixed meals page provider nesting and indentation; extracted `dateKey` to avoid repeated `getTodayDateKey()` calls.
  - Removed unused `suggestedLegacy` from useRecipes return.
  - **Files affected**: `components/meals/MealPlanner.tsx`, `components/meals/PantrySidebar.tsx`, `components/meals/RecipesSidebar.tsx`, `components/meals/ShoppingListSidebar.tsx`, `app/meals/page.tsx`, `hooks/usePantry.ts`, `hooks/useRecipes.ts`, `docs/changelog.md`

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
  - Plan up to 6 goals per day with visual color-coding system (6 colors) for quick goal identification.
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


