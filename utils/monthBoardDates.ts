import { addWeeks, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { addDaysToDateKey, getDateKey, getTodayDateKey } from '@/utils/dateUtils';
import { DAYS_PER_WEEK } from '@/types/monthBoard';

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getCurrentMonthKey(): string {
  return getTodayDateKey().slice(0, 7);
}

/** All YYYY-MM keys for Jan–Dec of the given year */
export function getYearMonthKeys(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
}

export function monthKeyToDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1, 12, 0, 0, 0);
}

export function formatMonthLabel(monthKey: string): string {
  const date = monthKeyToDate(monthKey);
  return date.toLocaleDateString(undefined, { month: 'long' });
}

export function formatMonthShortLabel(monthKey: string): string {
  const date = monthKeyToDate(monthKey);
  return date.toLocaleDateString(undefined, { month: 'short' });
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

/** Mon–Sun date keys for a week starting on Monday. */
export function getWeekDates(weekStartKey: string): string[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, i) => addDaysToDateKey(weekStartKey, i));
}

export function getWeekIndexContainingDate(monthKey: string, dateKey: string): number {
  const weeks = getWeeksInMonth(monthKey);
  const idx = weeks.findIndex((w) => {
    const weekEnd = addDaysToDateKey(w.weekStartKey, DAYS_PER_WEEK - 1);
    return dateKey >= w.weekStartKey && dateKey <= weekEnd;
  });
  return idx >= 0 ? idx : 0;
}

/** Default week start for a month: week containing today, or first week of month. */
export function getDefaultWeekStartKeyForMonth(monthKey: string): string {
  const weeks = getWeeksInMonth(monthKey);
  if (weeks.length === 0) {
    const monday = startOfWeek(monthKeyToDate(monthKey), { weekStartsOn: 1 });
    return getDateKey(monday);
  }
  const todayKey = getTodayDateKey();
  const todayMonth = todayKey.slice(0, 7);
  if (todayMonth === monthKey) {
    const idx = getWeekIndexContainingDate(monthKey, todayKey);
    return weeks[idx]?.weekStartKey ?? weeks[0].weekStartKey;
  }
  return weeks[0].weekStartKey;
}

export function getAdjacentMonthKey(monthKey: string, delta: -1 | 1): string {
  const date = monthKeyToDate(monthKey);
  date.setMonth(date.getMonth() + delta);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export interface WeekNavigationResult {
  monthKey: string;
  weekStartKey: string;
}

/** Navigate to previous week; may cross into prior month. */
export function getPreviousWeek(monthKey: string, weekStartKey: string): WeekNavigationResult {
  const weeks = getWeeksInMonth(monthKey);
  const idx = weeks.findIndex((w) => w.weekStartKey === weekStartKey);
  if (idx > 0) {
    return { monthKey, weekStartKey: weeks[idx - 1].weekStartKey };
  }
  const prevMonth = getAdjacentMonthKey(monthKey, -1);
  const prevWeeks = getWeeksInMonth(prevMonth);
  if (prevWeeks.length === 0) {
    return { monthKey, weekStartKey };
  }
  return {
    monthKey: prevMonth,
    weekStartKey: prevWeeks[prevWeeks.length - 1].weekStartKey,
  };
}

/** Navigate to next week; may cross into next month. */
export function getNextWeek(monthKey: string, weekStartKey: string): WeekNavigationResult {
  const weeks = getWeeksInMonth(monthKey);
  const idx = weeks.findIndex((w) => w.weekStartKey === weekStartKey);
  if (idx >= 0 && idx < weeks.length - 1) {
    return { monthKey, weekStartKey: weeks[idx + 1].weekStartKey };
  }
  const nextMonth = getAdjacentMonthKey(monthKey, 1);
  const nextWeeks = getWeeksInMonth(nextMonth);
  if (nextWeeks.length === 0) {
    return { monthKey, weekStartKey };
  }
  return {
    monthKey: nextMonth,
    weekStartKey: nextWeeks[0].weekStartKey,
  };
}
