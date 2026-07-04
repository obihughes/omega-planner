# Component Documentation

## Todo

### TodoView (`components/todo/TodoView.tsx`)
**Page:** `app/todo/page.tsx`

Minimal standalone checklist: add tasks, toggle done, remove items, clear completed. Active items appear before completed. State persists via `utils/todoStorage.ts` (`omega-planner-todo-v1`). Uses `hooks/useTodo.ts`.

## Month board

### MonthBoard (`components/month-board/MonthBoard.tsx`)
**Page:** `app/month-board/page.tsx` (hidden from main sidebar — Settings → Beta features)

Single-week month planning with three panels: **month picker** (12 months of current year), **week selector** (4–5 weeks per month + Prev/Next), and **main content** (week goal column ~330px + Mon–Sun day rows). One week shown at a time. Week goal notes use `AutosizeTextarea`. Uses `@dnd-kit` with custom collision handling; note bodies use `onPointerDownCapture` stopPropagation. State persists via `MonthBoardStorage` (schema v2.0, weeks keyed by Monday date). Date helpers in `utils/monthBoardDates.ts`.

## Visualizer Components

### FiveYearVisualizer (`components/visualizer/FiveYearVisualizer.tsx`)
**Location**: `components/visualizer/FiveYearVisualizer.tsx`
**Page**: `app/visualizer/page.tsx` (main sidebar nav — last item, after Text Documents)

A 5-year high-level visualizer for long-term planning.
- **5-Year Grid**: Displays 5 years vertically, with months horizontally.
- **Lanes**: 3 fixed-height lanes per year (216px total height, ~72px/lane) to stack overlapping periods.
- **Interaction**: 
  - Add/Edit/Delete periods via `PeriodModal`.
  - **Drag-to-Create**: Click and drag across months to define a date range for a new period.
  - Click any empty grid cell to add a new interval starting from that month.
- **Visuals**:
  - Items are rendered as **individual blocks** inside each month box (one block per month).
  - Multi-line text support (up to 3 lines) with `line-clamp-3`.
  - **No word splitting**: Words are kept whole (`break-normal`).
  - **Horizontal year labels** for better readability.
  - **Rounded edges**: `rounded-xl` for softer look.
  - **Theming**: Uses app design-system tokens (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `primary`, `muted`) so the visualizer matches Calendar and Navigation in both light and dark modes.
  - **Styles**: Foreground text for headers; current month highlighted with `primary`; period blocks use user-selected colors with white text.
  - **Current date line**: A vertical `primary` line marks today’s position within the year row for the current calendar year (day-accurate across month columns, not fixed at month center). A top dot, soft glow, and date tooltip identify the line. The current month header and cells use `ring-2 ring-inset ring-primary` plus a light `bg-primary/10` tint; the header includes a day-aligned tick. Period blocks render above the line so titles stay readable.
- **Navigation**: Navigate previous/next 5-year blocks.

### PeriodModal (`components/calendar/PeriodModal.tsx`)
Modal for creating and editing calendar periods. Supports pre-filling both start and end dates.

### EventModal (`components/calendar/EventModal.tsx`)
Modal for creating and editing calendar events.

### YearCalendar (`components/calendar/YearCalendar.tsx`)
Full year calendar view.

### MonthlyCalendar (`components/calendar/MonthlyCalendar.tsx`)
Monthly calendar view.

### WeeklyGoalsCalendarView (`components/calendar/WeeklyGoalsCalendarView.tsx`)
Weekly goals management interface. Accessible from `/calendar?view=weekly-goals` alongside an inline switch to Study Tracker for quick comparison.
- **Inline view switch**: Toggle between Weekly Overview (goals) and Study Tracker within the same page.
- **Weekly Notes**: Hidden by default; click "Open Notes" in the header to reveal the notes panel. Notes are fully absent when compressed.
- **Styling**: Matches Study Tracker header spacing, border treatment, and grid layout for visual consistency.
- **Shared data**: Uses `hooks/useWeeklyGoals.ts` and `components/weekly-goals/*`; day goals sync with Goal Hierarchy (`/goal-hierarchy`).

### Shared Weekly Goals (`components/weekly-goals/`)
Reusable weekly goal UI and colors used by Calendar weekly overview and Goal Hierarchy day columns.
- **`goalColors.ts`** — Color palette for goal cards.
- **`GoalItem.tsx`** — Draggable goal card with checkbox, edit modal trigger, notes display.
- **`GoalEditModal.tsx`** — Edit title, type (primary/supporting), color, notes; create task or delete.
- **`WeeklyGoalsAddForm.tsx`** — Inline add form with color picker and goal type toggle.
- **Storage**: `utils/goalsStorage.ts` (`omega-planner-weekly-goals-v1`), via `hooks/useWeeklyGoals.ts`.

### Goal Hierarchy (`components/goal-hierarchy/GoalHierarchyView.tsx`)
**Page:** `app/goal-hierarchy/page.tsx`

Multi-level planning: month summary + sub-goals, week tabs with weekly summary + sub-goals, and a two-row day grid (Mon–Fri primary, Sat–Wed muted preview). Daily goals use the same weekly goal cards and storage as Calendar weekly overview (`WeeklyGoalsListForDay`, `DayColumn`).

### ChecklistSidebar (`components/calendar/ChecklistSidebar.tsx`)
Weekly notes checklist panel. Rendered only when opened via "Open Notes" in Weekly Overview.
- **Props**: `onClose?: () => void` – optional callback to hide the panel.
- **Storage**: LocalStorage key `omega-planner-weekly-sidebar`.

## Study Tracker Components

### StudyTracker (`components/study-tracker/StudyTracker.tsx`)
**Pages**: `app/study-tracker/page.tsx`, embedded in `/calendar?view=weekly-goals` via inline switch.

Study planner with weekly view only: 2-week grid of day cards with tasks. Header matches Weekly Overview for consistent spacing when switching views.
- **View toggle**: Switch between Weekly and Monthly views.
- **Subject management**: Add subjects from header; edit/remove via task edit modal.
- **Storage**: LocalStorage via `utils/studyStorage.ts` (`omega-planner-study-v1`).

### StudyWeeklyView (`components/study-tracker/StudyWeeklyView.tsx`)
2-week grid of day cards (Mon–Sun × 2 rows). Each card: weekday, date, add button, study tasks with subject color, checkbox, edit. Supports drag-and-drop between days.

### StudyTaskItem (`components/study-tracker/StudyTaskItem.tsx`)
Reusable task card: subject-colored block, title, checkbox, edit modal, delete.

### StudySubjectRow (`components/study-tracker/StudySubjectRow.tsx`)
Legacy: one subject row with editable name and 7 day cells. Retired from main layout.

### StudyCell (`components/study-tracker/StudyCell.tsx`)
Legacy: inline-editable cell for topics. Retired from main layout.
