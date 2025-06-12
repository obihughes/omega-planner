import { CalendarEvent, CalendarPeriod, DayInfo, PeriodPosition } from '@/types/calendar';

/**
 * Get all dates for a specific month
 */
export function getMonthDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];

  // Get the first day of the calendar grid (includes previous month dates)
  const startDate = new Date(firstDay);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  startDate.setDate(firstDay.getDate() - firstDayOfWeek);

  // Generate 42 days (6 weeks) for the calendar grid
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Check if a date falls within a period
 */
export function isDateInPeriod(date: Date, period: CalendarPeriod): boolean {
  const dateTime = date.getTime();
  const startTime = new Date(period.startDate).getTime();
  const endTime = new Date(period.endDate).getTime();
  
  return dateTime >= startTime && dateTime <= endTime;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(event => isSameDay(new Date(event.date), date));
}

/**
 * Get periods that include a specific date
 */
export function getPeriodsForDate(date: Date, periods: CalendarPeriod[]): CalendarPeriod[] {
  return periods.filter(period => isDateInPeriod(date, period));
}

/**
 * Calculate period positions for visual rendering
 */
export function calculatePeriodPositions(
  date: Date,
  periods: CalendarPeriod[],
  monthDates: Date[]
): PeriodPosition[] {
  const dateIndex = monthDates.findIndex(d => isSameDay(d, date));
  if (dateIndex === -1) return [];

  const relevantPeriods = getPeriodsForDate(date, periods);
  const positions: PeriodPosition[] = [];

  relevantPeriods.forEach((period, index) => {
    const isStart = isSameDay(new Date(period.startDate), date);
    const isEnd = isSameDay(new Date(period.endDate), date);
    const isMiddle = !isStart && !isEnd;

    positions.push({
      period,
      isStart,
      isEnd,
      isMiddle,
      row: index // Stack multiple periods vertically
    });
  });

  return positions;
}

/**
 * Get day information including events and periods
 */
export function getDayInfo(
  date: Date,
  currentMonth: number,
  events: CalendarEvent[],
  periods: CalendarPeriod[],
  monthDates: Date[]
): DayInfo {
  const today = new Date();
  
  return {
    date,
    isCurrentMonth: date.getMonth() === currentMonth,
    isToday: isSameDay(date, today),
    events: getEventsForDate(date, events),
    periods: getPeriodsForDate(date, periods),
    periodPositions: calculatePeriodPositions(date, periods, monthDates)
  };
}

/**
 * Get events grouped by month
 */
export function getEventsByMonth(events: CalendarEvent[], year: number) {
  const eventsByMonth: { [key: number]: CalendarEvent[] } = {};
  
  for (let month = 0; month < 12; month++) {
    eventsByMonth[month] = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }
  
  return eventsByMonth;
}

/**
 * Get period segments that appear in a specific month
 */
export function getPeriodSegmentsForMonth(periods: CalendarPeriod[], year: number, month: number): CalendarPeriod[] {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  
  return periods.filter(period => {
    const periodStart = new Date(period.startDate);
    const periodEnd = new Date(period.endDate);
    
    // Check if period overlaps with the month
    return (periodStart <= monthEnd) && (periodEnd >= monthStart);
  });
}

/**
 * Generate a unique ID for events/periods
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month];
}

/**
 * Get week days
 */
export function getWeekDays(): string[] {
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
} 