'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getTodayDateKey } from '@/utils/dateUtils';
import { formatMonthLabel, getWeekIndexContainingDate } from '@/utils/goalHierarchyDates';
import { useGoalHierarchy } from '@/hooks/useGoalHierarchy';
import { GoalLevelBlock } from './GoalLevelBlock';
import { DayColumn } from './DayColumn';
import { DayGoalShortcutsHelp } from './DayGoalShortcutsHelp';

export function GoalHierarchyView() {
  const {
    hydrated,
    monthTabs,
    selectedMonthKey,
    selectedWeekIndex,
    currentMonth,
    currentWeek,
    weeksInMonth,
    selectMonth,
    selectWeek,
    setSummary,
    addItem,
    toggleItem,
    removeItem,
  } = useGoalHierarchy();

  const todayKey = getTodayDateKey();
  const todayMonthKey = todayKey.slice(0, 7);
  const todayWeekIndex =
    selectedMonthKey === todayMonthKey
      ? getWeekIndexContainingDate(selectedMonthKey, todayKey)
      : -1;

  if (!hydrated) {
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
            Monthly, weekly, and daily goals.
          </p>
        </div>

        {/* Month tabs */}
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

        {/* Month level */}
        <section className="space-y-2">
          <GoalLevelBlock
            level="month"
            label={`${formatMonthLabel(selectedMonthKey)} goal`}
            summary={currentMonth.summary}
            items={currentMonth.items}
            onSummaryChange={(s) => setSummary('month', s)}
            onAddItem={(t) => addItem('month', t)}
            onToggleItem={(id) => toggleItem('month', id)}
            onRemoveItem={(id) => removeItem('month', id)}
          />
        </section>

        {/* Week tabs */}
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

        {/* Week panel + day grid */}
        <section className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
          <div className="max-w-xl">
            <GoalLevelBlock
              level="week"
              label={`Week ${selectedWeekIndex + 1} goal`}
              summary={currentWeek.summary}
              items={currentWeek.items}
              onSummaryChange={(s) => setSummary('week', s)}
              onAddItem={(t) => addItem('week', t)}
              onToggleItem={(id) => toggleItem('week', id)}
              onRemoveItem={(id) => removeItem('week', id)}
            />
          </div>

          <div className="flex items-center justify-end">
            <DayGoalShortcutsHelp />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {currentWeek.days.map((day, dayIndex) => (
              <DayColumn
                key={day.dateKey}
                dayIndex={dayIndex}
                day={day}
                onSummaryChange={(s) => setSummary('day', s, day.dateKey)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
