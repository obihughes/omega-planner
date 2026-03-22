# Component Documentation

## Month board

### MonthBoard (`components/month-board/MonthBoard.tsx`)
**Page:** `app/month-board/page.tsx`

Multi-scale month planning: backlog column (wide on `lg+` breakpoints) plus twelve week blocks. Each block has a **week focus** drop zone and **Mon–Sun** rows with real dates; empty slots use an inline `Textarea` so users can type before any drag. Backlog draft and backlog note cards use `AutosizeTextarea` (`scrollHeight` sync) so fields grow with content instead of scrolling internally. Uses `@dnd-kit` with custom collision handling so drop targets take precedence over nested note draggables; note bodies use `onPointerDownCapture` stopPropagation so typing is not captured as drag. State persists via `MonthBoardStorage`.

## Visualizer Components

### FiveYearVisualizer (`components/visualizer/FiveYearVisualizer.tsx`)
**Location**: `components/visualizer/FiveYearVisualizer.tsx`
**Page**: `app/visualizer/page.tsx`

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
  - **Current month line**: A vertical `primary` line marks the current month only within the **row for the current calendar year** (not across all five year rows). Period blocks render above the line so titles stay readable.
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
