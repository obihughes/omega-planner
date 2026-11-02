'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  GoalHierarchyStorageData,
  HierarchyDaySlot,
  HierarchyGoalItem,
  HierarchyMonthSlot,
  HierarchyWeekSlot,
} from '@/types/goalHierarchy';
import {
  getCurrentMonthKey,
  getMonthTabs,
  getNextWeekStartKey,
  getWeekContextForDate,
  getWeekIndexContainingDate,
  getWeeksInMonth,
} from '@/utils/goalHierarchyDates';
import {
  GOAL_HIERARCHY_STORAGE_KEY,
  GoalHierarchyStorage,
} from '@/utils/goalHierarchyStorage';
import { addDaysToDateKey, getTodayDateKey, getWeekStartKeyFromDateKey } from '@/utils/dateUtils';
import {
  GOAL_HIERARCHY_PRIMARY_ROW_COUNT,
  GOAL_HIERARCHY_PREVIEW_ROW_COUNT,
} from '@/types/goalHierarchy';

const SAVE_DEBOUNCE_MS = 300;

/**
 * Month key + week index for the week starting on `weekStartKey`.
 * Prefers `preferredMonthKey` when that month's week grid contains the week,
 * so a week shared across a month boundary stays under the current month tab.
 */
function resolveWeekPosition(
  weekStartKey: string,
  preferredMonthKey: string
): { monthKey: string; weekIndex: number } {
  const match = getWeeksInMonth(preferredMonthKey).find((w) => w.weekStartKey === weekStartKey);
  if (match) return { monthKey: preferredMonthKey, weekIndex: match.weekIndex };
  return getWeekContextForDate(weekStartKey);
}

type Level = 'month' | 'week' | 'day';

/** Day column with the month/week storage slot it was read from. */
export type DayGridSlot = {
  day: HierarchyDaySlot;
  monthKey: string;
  weekIndex: number;
};

function patchMonth(
  data: GoalHierarchyStorageData,
  monthKey: string,
  patch: Partial<Pick<HierarchyMonthSlot, 'summary' | 'items' | 'weeks'>>
): GoalHierarchyStorageData {
  const month = GoalHierarchyStorage.ensureMonth(data, monthKey);
  return {
    ...data,
    months: {
      ...data.months,
      [monthKey]: { ...month, ...patch },
    },
  };
}

function patchWeek(
  data: GoalHierarchyStorageData,
  monthKey: string,
  weekIndex: number,
  patch: Partial<Pick<HierarchyWeekSlot, 'summary' | 'items' | 'days'>>
): GoalHierarchyStorageData {
  const month = GoalHierarchyStorage.ensureMonth(data, monthKey);
  const weeks = [...month.weeks];
  const idx = weeks.findIndex((w) => w.weekIndex === weekIndex);
  const week = GoalHierarchyStorage.ensureWeek(month, weekIndex);
  if (idx >= 0) {
    weeks[idx] = { ...week, ...patch };
  } else {
    weeks.push({ ...week, ...patch });
    weeks.sort((a, b) => a.weekIndex - b.weekIndex);
  }
  return patchMonth(data, monthKey, { weeks });
}

function patchDay(
  data: GoalHierarchyStorageData,
  monthKey: string,
  weekIndex: number,
  dateKey: string,
  patch: Partial<Pick<HierarchyDaySlot, 'summary' | 'items'>>
): GoalHierarchyStorageData {
  const month = GoalHierarchyStorage.ensureMonth(data, monthKey);
  const week = GoalHierarchyStorage.ensureWeek(month, weekIndex);
  const days = week.days.map((d) =>
    d.dateKey === dateKey ? { ...d, ...patch } : d
  );
  if (!days.some((d) => d.dateKey === dateKey)) {
    days.push({ ...GoalHierarchyStorage.ensureDay(week, dateKey), ...patch });
    days.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }
  return patchWeek(data, monthKey, weekIndex, { days });
}

function patchItems(
  items: HierarchyGoalItem[],
  itemId: string,
  action: 'toggle' | 'remove' | 'add',
  title?: string
): HierarchyGoalItem[] {
  if (action === 'add' && title) {
    return [...items, GoalHierarchyStorage.createItem(title)];
  }
  if (action === 'remove') {
    return items.filter((i) => i.id !== itemId);
  }
  return items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i));
}

export function useGoalHierarchy() {
  const [data, setData] = useState<GoalHierarchyStorageData>(() =>
    GoalHierarchyStorage.load()
  );
  const [hydrated, setHydrated] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const skipInitialSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setData(GoalHierarchyStorage.load());
    // Open on the previous week so it can be compared against the current week.
    const today = getTodayDateKey();
    const todayMonthKey = today.slice(0, 7);
    const previousWeekStartKey = addDaysToDateKey(getWeekStartKeyFromDateKey(today), -7);
    const { monthKey, weekIndex } = resolveWeekPosition(previousWeekStartKey, todayMonthKey);
    setSelectedMonthKey(monthKey);
    setSelectedWeekIndex(weekIndex);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      GoalHierarchyStorage.save(data);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key && e.key !== GOAL_HIERARCHY_STORAGE_KEY) return;
      setData(GoalHierarchyStorage.load());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const monthTabs = useMemo(
    () => getMonthTabs(getCurrentMonthKey(), 5),
    []
  );

  const currentMonth = useMemo(() => {
    return GoalHierarchyStorage.ensureMonth(data, selectedMonthKey);
  }, [data, selectedMonthKey]);

  const weeksInMonth = useMemo(
    () => getWeeksInMonth(selectedMonthKey),
    [selectedMonthKey]
  );

  const currentWeek = useMemo(() => {
    const weekIndex =
      weeksInMonth.some((w) => w.weekIndex === selectedWeekIndex)
        ? selectedWeekIndex
        : weeksInMonth[0]?.weekIndex ?? 0;
    return GoalHierarchyStorage.ensureWeek(currentMonth, weekIndex);
  }, [currentMonth, selectedWeekIndex, weeksInMonth]);

  const primaryRowDays = useMemo((): DayGridSlot[] => {
    const weekIndex = currentWeek.weekIndex;
    return currentWeek.days.slice(0, GOAL_HIERARCHY_PRIMARY_ROW_COUNT).map((day) => ({
      day,
      monthKey: selectedMonthKey,
      weekIndex,
    }));
  }, [currentWeek, selectedMonthKey]);

  const secondaryRowDays = useMemo((): DayGridSlot[] => {
    const weekIndex = currentWeek.weekIndex;
    const weekendDays: DayGridSlot[] = currentWeek.days
      .slice(GOAL_HIERARCHY_PRIMARY_ROW_COUNT)
      .map((day) => ({
        day,
        monthKey: selectedMonthKey,
        weekIndex,
      }));
    const nextWeekStartKey = getNextWeekStartKey(currentWeek.weekStartKey);
    const { monthKey: nextMonthKey, weekIndex: nextWeekIndex } =
      getWeekContextForDate(nextWeekStartKey);
    const nextMonth = GoalHierarchyStorage.ensureMonth(data, nextMonthKey);
    const nextWeek = GoalHierarchyStorage.ensureWeek(nextMonth, nextWeekIndex);
    const nextWeekPreviewDays: DayGridSlot[] = nextWeek.days
      .slice(0, GOAL_HIERARCHY_PREVIEW_ROW_COUNT - weekendDays.length)
      .map((day) => ({
        day,
        monthKey: nextMonthKey,
        weekIndex: nextWeekIndex,
      }));
    return [...weekendDays, ...nextWeekPreviewDays];
  }, [currentWeek, data, selectedMonthKey]);

  const selectMonth = useCallback((monthKey: string) => {
    setSelectedMonthKey(monthKey);
    const today = getTodayDateKey();
    if (monthKey === today.slice(0, 7)) {
      setSelectedWeekIndex(getWeekIndexContainingDate(monthKey, today));
    } else {
      setSelectedWeekIndex(0);
    }
  }, []);

  const selectWeek = useCallback((weekIndex: number) => {
    setSelectedWeekIndex(weekIndex);
  }, []);

  // Step by date rather than by index: weeks that straddle a month boundary
  // appear in both months' grids, so index arithmetic can land on the same week.
  const goToPreviousWeek = useCallback(() => {
    const target = resolveWeekPosition(
      addDaysToDateKey(currentWeek.weekStartKey, -7),
      selectedMonthKey
    );
    if (!monthTabs.includes(target.monthKey)) return;
    setSelectedMonthKey(target.monthKey);
    setSelectedWeekIndex(target.weekIndex);
  }, [currentWeek.weekStartKey, monthTabs, selectedMonthKey]);

  const goToNextWeek = useCallback(() => {
    const target = resolveWeekPosition(
      addDaysToDateKey(currentWeek.weekStartKey, 7),
      selectedMonthKey
    );
    if (!monthTabs.includes(target.monthKey)) return;
    setSelectedMonthKey(target.monthKey);
    setSelectedWeekIndex(target.weekIndex);
  }, [currentWeek.weekStartKey, monthTabs, selectedMonthKey]);

  const goToCurrentWeek = useCallback(() => {
    const today = getTodayDateKey();
    const monthKey = today.slice(0, 7);
    setSelectedMonthKey(monthKey);
    setSelectedWeekIndex(getWeekIndexContainingDate(monthKey, today));
  }, []);

  const setSummary = useCallback(
    (
      level: Level,
      summary: string,
      dateKey?: string,
      dayMonthKey?: string,
      dayWeekIndex?: number
    ) => {
      setData((prev) => {
        if (level === 'month') {
          return patchMonth(prev, selectedMonthKey, { summary });
        }
        if (level === 'week') {
          return patchWeek(prev, selectedMonthKey, selectedWeekIndex, { summary });
        }
        if (
          level === 'day' &&
          dateKey &&
          dayMonthKey !== undefined &&
          dayWeekIndex !== undefined
        ) {
          return patchDay(prev, dayMonthKey, dayWeekIndex, dateKey, {
            summary,
            items: [],
          });
        }
        return prev;
      });
    },
    [selectedMonthKey, selectedWeekIndex]
  );

  const addItem = useCallback(
    (level: Level, title: string, dateKey?: string) => {
      const t = title.trim();
      if (!t) return;
      setData((prev) => {
        if (level === 'month') {
          const month = GoalHierarchyStorage.ensureMonth(prev, selectedMonthKey);
          return patchMonth(prev, selectedMonthKey, {
            items: [...month.items, GoalHierarchyStorage.createItem(t)],
          });
        }
        if (level === 'week') {
          const month = GoalHierarchyStorage.ensureMonth(prev, selectedMonthKey);
          const week = GoalHierarchyStorage.ensureWeek(month, selectedWeekIndex);
          return patchWeek(prev, selectedMonthKey, selectedWeekIndex, {
            items: [...week.items, GoalHierarchyStorage.createItem(t)],
          });
        }
        if (level === 'day' && dateKey) {
          const { monthKey, weekIndex } = getWeekContextForDate(dateKey);
          const month = GoalHierarchyStorage.ensureMonth(prev, monthKey);
          const week = GoalHierarchyStorage.ensureWeek(month, weekIndex);
          const day = GoalHierarchyStorage.ensureDay(week, dateKey);
          return patchDay(prev, monthKey, weekIndex, dateKey, {
            items: [...day.items, GoalHierarchyStorage.createItem(t)],
          });
        }
        return prev;
      });
    },
    [selectedMonthKey, selectedWeekIndex]
  );

  const toggleItem = useCallback(
    (level: Level, itemId: string, dateKey?: string) => {
      setData((prev) => {
        if (level === 'month') {
          const month = GoalHierarchyStorage.ensureMonth(prev, selectedMonthKey);
          return patchMonth(prev, selectedMonthKey, {
            items: patchItems(month.items, itemId, 'toggle'),
          });
        }
        if (level === 'week') {
          const month = GoalHierarchyStorage.ensureMonth(prev, selectedMonthKey);
          const week = GoalHierarchyStorage.ensureWeek(month, selectedWeekIndex);
          return patchWeek(prev, selectedMonthKey, selectedWeekIndex, {
            items: patchItems(week.items, itemId, 'toggle'),
          });
        }
        if (level === 'day' && dateKey) {
          const { monthKey, weekIndex } = getWeekContextForDate(dateKey);
          const month = GoalHierarchyStorage.ensureMonth(prev, monthKey);
          const week = GoalHierarchyStorage.ensureWeek(month, weekIndex);
          const day = GoalHierarchyStorage.ensureDay(week, dateKey);
          return patchDay(prev, monthKey, weekIndex, dateKey, {
            items: patchItems(day.items, itemId, 'toggle'),
          });
        }
        return prev;
      });
    },
    [selectedMonthKey, selectedWeekIndex]
  );

  const removeItem = useCallback(
    (level: Level, itemId: string, dateKey?: string) => {
      setData((prev) => {
        if (level === 'month') {
          const month = GoalHierarchyStorage.ensureMonth(prev, selectedMonthKey);
          return patchMonth(prev, selectedMonthKey, {
            items: patchItems(month.items, itemId, 'remove'),
          });
        }
        if (level === 'week') {
          const month = GoalHierarchyStorage.ensureMonth(prev, selectedMonthKey);
          const week = GoalHierarchyStorage.ensureWeek(month, selectedWeekIndex);
          return patchWeek(prev, selectedMonthKey, selectedWeekIndex, {
            items: patchItems(week.items, itemId, 'remove'),
          });
        }
        if (level === 'day' && dateKey) {
          const { monthKey, weekIndex } = getWeekContextForDate(dateKey);
          const month = GoalHierarchyStorage.ensureMonth(prev, monthKey);
          const week = GoalHierarchyStorage.ensureWeek(month, weekIndex);
          const day = GoalHierarchyStorage.ensureDay(week, dateKey);
          return patchDay(prev, monthKey, weekIndex, dateKey, {
            items: patchItems(day.items, itemId, 'remove'),
          });
        }
        return prev;
      });
    },
    [selectedMonthKey, selectedWeekIndex]
  );

  return {
    hydrated,
    monthTabs,
    selectedMonthKey,
    selectedWeekIndex,
    currentMonth,
    currentWeek,
    primaryRowDays,
    secondaryRowDays,
    weeksInMonth,
    selectMonth,
    selectWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setSummary,
    addItem,
    toggleItem,
    removeItem,
  };
}

export type GoalHierarchyLevel = Level;
