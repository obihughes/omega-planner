import { addWeeks, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { addDaysToDateKey, getDateKey, getTodayDateKey } from '@/utils/dateUtils';
import { GOAL_HIERARCHY_WEEKDAY_COUNT } from '@/types/goalHierarchy';

export function getCurrentMonthKey(): string {
  return getTodayDateKey().slice(0, 7);
}

/** Month keys centered on anchor (default: current ± 2). */
export function getMonthTabs(anchorMonthKey: string, count = 5): string[] {
  const [y, m] = anchorMonthKey.split('-').map(Number);
  const center = Math.floor(count / 2);
  const tabs: string[] = [];
  for (let i = -center; i <= center; i++) {
    const date = new Date(y, m - 1 + i, 1, 12, 0, 0, 0);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    tabs.push(monthKey);
  }
  return tabs;
}

export function monthKeyToDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1, 12, 0, 0, 0);
}

export function formatMonthLabel(monthKey: string): string {
  const date = monthKeyToDate(monthKey);
  return date.toLocaleDateString(undefined, { month: 'long' });
}

/** Monday-start weeks that overlap the calendar month. */
export function getWeeksInMonth(monthKey: string): { weekIndex: number; weekStartKey: string }[] {
  const monthStart = startOfMonth(monthKeyToDate(monthKey));
  monthStart.setHours(12, 0, 0, 0);
  const monthEnd = endOfMonth(monthStart);
  monthEnd.setHours(12, 0, 0, 0);

  let cursor = startOfWeek(monthStart, { weekStartsOn: 1 });
  cursor.setHours(12, 0, 0, 0);

  const weeks: { weekIndex: number; weekStartKey: string }[] = [];
  let weekIndex = 0;

  while (true) {
    const weekEnd = endOfWeek(cursor, { weekStartsOn: 1 });
    weekEnd.setHours(12, 0, 0, 0);

    if (weekEnd >= monthStart && cursor <= monthEnd) {
      weeks.push({ weekIndex, weekStartKey: getDateKey(cursor) });
      weekIndex++;
    }

    if (cursor > monthEnd) break;
    cursor = addWeeks(cursor, 1);
    cursor.setHours(12, 0, 0, 0);
  }

  return weeks;
}

/** Mon–Fri date keys for a week starting on Monday. */
export function getWeekdayDates(weekStartKey: string): string[] {
  return Array.from({ length: GOAL_HIERARCHY_WEEKDAY_COUNT }, (_, i) =>
    addDaysToDateKey(weekStartKey, i)
  );
}

export function getWeekIndexContainingDate(monthKey: string, dateKey: string): number {
  const weeks = getWeeksInMonth(monthKey);
  const idx = weeks.findIndex((w) => {
    const weekdays = getWeekdayDates(w.weekStartKey);
    return weekdays.includes(dateKey) || dateKey >= w.weekStartKey && dateKey <= addDaysToDateKey(w.weekStartKey, 6);
  });
  return idx >= 0 ? idx : 0;
}
