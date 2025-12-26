# Component Documentation

## Visualizer Components

### FiveYearVisualizer (`components/visualizer/FiveYearVisualizer.tsx`)
**Location**: `components/visualizer/FiveYearVisualizer.tsx`
**Page**: `app/visualizer/page.tsx`

A 5-year high-level visualizer for long-term planning.
- **5-Year Grid**: Displays 5 years vertically, with months horizontally.
- **Lanes**: 3 fixed-height lanes per year (216px total height, ~72px/lane) to stack overlapping periods.
- **Interaction**: 
  - Add/Edit/Delete periods via `PeriodModal`.
  - Click any empty grid cell to add a new interval starting from that month.
- **Visuals**:
  - Items are rendered as **discrete blocks per month** (not continuous bars), separated by gaps.
  - Multi-line text support (up to 3 lines) with `line-clamp-3`.
  - **No word splitting**: Words are kept whole (`break-normal`).
  - **Horizontal year labels** for better readability.
  - **Rounded edges**: `rounded-xl` for softer look.
  - **Styles**: White month headers, bold text for items.
- **Navigation**: Navigate previous/next 5-year blocks.

### PeriodModal (`components/calendar/PeriodModal.tsx`)
Modal for creating and editing calendar periods.

### EventModal (`components/calendar/EventModal.tsx`)
Modal for creating and editing calendar events.

### YearCalendar (`components/calendar/YearCalendar.tsx`)
Full year calendar view.

### MonthlyCalendar (`components/calendar/MonthlyCalendar.tsx`)
Monthly calendar view.

### WeeklyGoalsCalendarView (`components/calendar/WeeklyGoalsCalendarView.tsx`)
Weekly goals management interface.
