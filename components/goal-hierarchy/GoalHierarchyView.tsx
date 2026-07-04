'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getTodayDateKey } from '@/utils/dateUtils';
import { formatMonthLabel, getWeekIndexContainingDate } from '@/utils/goalHierarchyDates';
import { useGoalHierarchy } from '@/hooks/useGoalHierarchy';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';
import { GoalLevelBlock } from './GoalLevelBlock';
import { DayColumn } from './DayColumn';

export function GoalHierarchyView() {
  const {
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
    setSummary,
  } = useGoalHierarchy();

  const visibleDateKeys = useMemo(() => {
    const keys = new Set<string>();
    primaryRowDays.forEach((slot) => keys.add(slot.day.dateKey));
    secondaryRowDays.forEach((slot) => keys.add(slot.day.dateKey));
    return Array.from(keys);
  }, [primaryRowDays, secondaryRowDays]);

  const {
    hydrated: goalsHydrated,
    getGoalsForDate,
    canAddMore,
    addGoal,
    toggleGoal,
    removeGoal,
    updateGoal,
    moveGoal,
    createTaskFromGoal,
  } = useWeeklyGoals(visibleDateKeys);

  const todayKey = getTodayDateKey();
  const todayMonthKey = todayKey.slice(0, 7);
  const todayWeekIndex =
    selectedMonthKey === todayMonthKey
      ? getWeekIndexContainingDate(selectedMonthKey, todayKey)
      : -1;

  if (!hydrated || !goalsHydrated) {
    return (
      <div className="h-full w-full px-6 py-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-6 py-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Goal Hierarchy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly, weekly, and daily goals. Daily goals sync with Calendar weekly overview.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {monthTabs.map((monthKey) => (
            <button
              key={monthKey}
              type="button"
              onClick={() => selectMonth(monthKey)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                selectedMonthKey === monthKey
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {formatMonthLabel(monthKey)}
            </button>
          ))}
        </div>

        <section className="space-y-2">
          <GoalLevelBlock
            label={`${formatMonthLabel(selectedMonthKey)} goal`}
            summary={currentMonth.summary}
            onSummaryChange={(s) => setSummary('month', s)}
          />
        </section>

        <div className="flex flex-wrap gap-2">
          {weeksInMonth.map(({ weekIndex }) => {
            const isCurrentWeek = weekIndex === todayWeekIndex;

            return (
              <button
                key={weekIndex}
                type="button"
                onClick={() => selectWeek(weekIndex)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  selectedWeekIndex === weekIndex
                    ? 'bg-secondary text-secondary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  isCurrentWeek && selectedWeekIndex !== weekIndex && 'ring-1 ring-primary/30'
                )}
              >
                Week {weekIndex + 1}
              </button>
            );
          })}
        </div>

        <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
          <div className="max-w-xl">
            <GoalLevelBlock
              label={`Week ${selectedWeekIndex + 1} goal`}
              summary={currentWeek.summary}
              onSummaryChange={(s) => setSummary('week', s)}
            />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {primaryRowDays.map((slot) => (
                <DayColumn
                  key={slot.day.dateKey}
                  dateKey={slot.day.dateKey}
                  goals={getGoalsForDate(slot.day.dateKey)}
                  canAddMore={canAddMore(slot.day.dateKey)}
                  onAddGoal={(title, color, goalType) =>
                    addGoal(slot.day.dateKey, title, color, goalType)
                  }
                  onToggleGoal={(id) => toggleGoal(slot.day.dateKey, id)}
                  onRemoveGoal={(id) => removeGoal(slot.day.dateKey, id)}
                  onUpdateGoal={(id, updates) => updateGoal(slot.day.dateKey, id, updates)}
                  onMoveGoal={moveGoal}
                  onCreateTask={(goal) => createTaskFromGoal(goal, slot.day.dateKey)}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {secondaryRowDays.map((slot) => (
                <DayColumn
                  key={slot.day.dateKey}
                  dateKey={slot.day.dateKey}
                  goals={getGoalsForDate(slot.day.dateKey)}
                  canAddMore={canAddMore(slot.day.dateKey)}
                  isNextWeekPreview
                  onAddGoal={(title, color, goalType) =>
                    addGoal(slot.day.dateKey, title, color, goalType)
                  }
                  onToggleGoal={(id) => toggleGoal(slot.day.dateKey, id)}
                  onRemoveGoal={(id) => removeGoal(slot.day.dateKey, id)}
                  onUpdateGoal={(id, updates) => updateGoal(slot.day.dateKey, id, updates)}
                  onMoveGoal={moveGoal}
                  onCreateTask={(goal) => createTaskFromGoal(goal, slot.day.dateKey)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
