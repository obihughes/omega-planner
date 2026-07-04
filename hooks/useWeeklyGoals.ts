'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WeekGoals, WeeklyGoal } from '@/types/goals';
import { GoalsStorage } from '@/utils/goalsStorage';
import { getWeekStartKeyFromDateKey } from '@/utils/dateUtils';

const WEEKLY_GOALS_STORAGE_KEY = 'omega-planner-weekly-goals-v1';
const MAX_GOALS_PER_DAY = 6;

export function useWeeklyGoals(dateKeys: string[]) {
  const [goalsData, setGoalsData] = useState<Record<string, WeekGoals>>({});
  const [hydrated, setHydrated] = useState(false);

  const weekKeys = useMemo(() => {
    const keys = new Set<string>();
    dateKeys.forEach((dateKey) => {
      keys.add(getWeekStartKeyFromDateKey(dateKey));
    });
    return Array.from(keys);
  }, [dateKeys]);

  const reload = useCallback(() => {
    const cache: Record<string, WeekGoals> = {};
    weekKeys.forEach((weekKey) => {
      cache[weekKey] = GoalsStorage.loadWeek(weekKey);
    });
    setGoalsData(cache);
    setHydrated(true);
  }, [weekKeys]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== WEEKLY_GOALS_STORAGE_KEY) return;
      reload();
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [reload]);

  const getGoalsForDate = useCallback(
    (dateKey: string): WeeklyGoal[] => {
      const weekKey = getWeekStartKeyFromDateKey(dateKey);
      return (goalsData[weekKey]?.goalsByDate?.[dateKey] || []).slice(0, MAX_GOALS_PER_DAY);
    },
    [goalsData]
  );

  const canAddMore = useCallback(
    (dateKey: string) => getGoalsForDate(dateKey).length < MAX_GOALS_PER_DAY,
    [getGoalsForDate]
  );

  const addGoal = useCallback(
    (dateKey: string, title: string, color?: string, goalType?: 'primary' | 'supporting') => {
      if (!title.trim()) return;
      const goal: WeeklyGoal = {
        id: Math.random().toString(36).slice(2),
        title: title.trim(),
        done: false,
        createdAt: new Date().toISOString(),
        color: color || 'gray',
        goalType: goalType || 'supporting',
      };
      const weekKey = getWeekStartKeyFromDateKey(dateKey);
      const next = GoalsStorage.addGoal(weekKey, dateKey, goal);
      setGoalsData((prev) => ({ ...prev, [weekKey]: next }));
    },
    []
  );

  const toggleGoal = useCallback((dateKey: string, goalId: string) => {
    const weekKey = getWeekStartKeyFromDateKey(dateKey);
    const next = GoalsStorage.toggleGoal(weekKey, dateKey, goalId);
    setGoalsData((prev) => ({ ...prev, [weekKey]: next }));
  }, []);

  const removeGoal = useCallback((dateKey: string, goalId: string) => {
    const weekKey = getWeekStartKeyFromDateKey(dateKey);
    const next = GoalsStorage.removeGoal(weekKey, dateKey, goalId);
    setGoalsData((prev) => ({ ...prev, [weekKey]: next }));
  }, []);

  const updateGoalColor = useCallback((dateKey: string, goalId: string, color: string) => {
    const weekKey = getWeekStartKeyFromDateKey(dateKey);
    const next = GoalsStorage.updateGoalColor(weekKey, dateKey, goalId, color);
    setGoalsData((prev) => ({ ...prev, [weekKey]: next }));
  }, []);

  const updateGoal = useCallback(
    (
      dateKey: string,
      goalId: string,
      updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>
    ) => {
      const weekKey = getWeekStartKeyFromDateKey(dateKey);
      const next = GoalsStorage.updateGoal(weekKey, dateKey, goalId, updates);
      setGoalsData((prev) => ({ ...prev, [weekKey]: next }));
    },
    []
  );

  const moveGoal = useCallback(
    (goalId: string, fromDateKey: string, toDateKey: string) => {
      if (fromDateKey === toDateKey) return;
      const fromWeekKey = getWeekStartKeyFromDateKey(fromDateKey);
      const toWeekKey = getWeekStartKeyFromDateKey(toDateKey);
      const fromWeekData = goalsData[fromWeekKey];
      if (!fromWeekData?.goalsByDate?.[fromDateKey]) return;

      const goal = fromWeekData.goalsByDate[fromDateKey].find((item) => item.id === goalId);
      if (!goal) return;

      const updatedFromWeek = GoalsStorage.removeGoal(fromWeekKey, fromDateKey, goalId);
      const updatedToWeek = GoalsStorage.addGoal(toWeekKey, toDateKey, goal);

      setGoalsData((prev) => ({
        ...prev,
        [fromWeekKey]: updatedFromWeek,
        [toWeekKey]: updatedToWeek,
      }));
    },
    [goalsData]
  );

  const createTaskFromGoal = useCallback((goal: WeeklyGoal, dateKey: string) => {
    const params = new URLSearchParams({
      action: 'create',
      title: goal.title,
      dueDate: dateKey,
      notes: `From weekly goal: ${goal.title}`,
    });
    window.location.href = `/projects?${params.toString()}`;
  }, []);

  return {
    hydrated,
    getGoalsForDate,
    canAddMore,
    addGoal,
    toggleGoal,
    removeGoal,
    updateGoalColor,
    updateGoal,
    moveGoal,
    createTaskFromGoal,
  };
}
