'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  getDateKey,
  getTodayDateKey,
  dateFromDateKey,
  getWeekStartKeyFromDateKey,
  getWeekOffsetFromWeekStarts,
  getWeekOffsetLabel,
} from '@/utils/dateUtils';
import {
  formatMonthLabel,
  getNextWeekStartKey,
  getWeekIndexContainingDate,
  getWeekdayDates,
} from '@/utils/goalHierarchyDates';
import { useGoalHierarchy } from '@/hooks/useGoalHierarchy';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';
import { useCalendarData } from '@/hooks/useCalendarData';
import { GoalLevelBlock } from './GoalLevelBlock';
import { WeeklyGoalsDayColumn } from '@/components/weekly-goals';
import { ChecklistSidebar } from '@/components/calendar/ChecklistSidebar';
import { StudyTracker } from '@/components/study-tracker';
import { StudyTrackerProvider } from '@/app/context/StudyTrackerContext';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  StickyNote,
  Target,
  BookOpen,
} from 'lucide-react';

type WeeklyPageMode = 'weekly-overview' | 'study-tracker';

function navigateToDaily(date: Date) {
  try {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    window.location.href = `/?date=${year}-${month}-${day}`;
  } catch {
    window.location.href = '/';
  }
}

export function GoalHierarchyView() {
  const [weeklyPageMode, setWeeklyPageMode] = useState<WeeklyPageMode>('weekly-overview');
  const [isNotesOpen, setIsNotesOpen] = useState(false);

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
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setSummary,
  } = useGoalHierarchy();

  const { data: calendarData, isLoading: calendarLoading } = useCalendarData();

  const gridDays = useMemo(() => {
    const weekStartKey = currentWeek.weekStartKey;
    const nextWeekStartKey = getNextWeekStartKey(weekStartKey);
    const dateKeys = [...getWeekdayDates(weekStartKey), ...getWeekdayDates(nextWeekStartKey)];
    return dateKeys.map((dateKey) => ({
      dateKey,
      date: dateFromDateKey(dateKey),
      isNextWeekPreview: dateKey >= nextWeekStartKey,
    }));
  }, [currentWeek.weekStartKey]);

  const visibleDateKeys = useMemo(() => gridDays.map((d) => d.dateKey), [gridDays]);

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
  const todayWeekStartKey = getWeekStartKeyFromDateKey(todayKey);
  const weekOffset = getWeekOffsetFromWeekStarts(currentWeek.weekStartKey, todayWeekStartKey);
  const weekLabel = getWeekOffsetLabel(weekOffset);
  const todayMonthKey = todayKey.slice(0, 7);
  const todayWeekIndex =
    selectedMonthKey === todayMonthKey
      ? getWeekIndexContainingDate(selectedMonthKey, todayKey)
      : -1;
  const isCurrentWeekSelected = weekOffset === 0;

  const handleWeekTabClick = useCallback(
    (weekIndex: number) => {
      selectWeek(weekIndex);
      setWeeklyPageMode('weekly-overview');
    },
    [selectWeek]
  );

  if (!hydrated || !goalsHydrated || calendarLoading) {
    return (
      <div className="h-full w-full px-6 py-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Goal Hierarchy</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly, weekly, and daily goals. Daily goals sync with Weekly Overview.
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

          <div className="rounded-lg border border-border bg-background">
            <div className="flex flex-wrap items-end justify-between gap-2 px-4 pt-2">
              <div className="flex flex-wrap items-end gap-0.5">
                {weeksInMonth.map(({ weekIndex }) => {
                  const isCurrentWeek = weekIndex === todayWeekIndex;
                  const isSelected = selectedWeekIndex === weekIndex;

                  return (
                    <button
                      key={weekIndex}
                      type="button"
                      onClick={() => handleWeekTabClick(weekIndex)}
                      className={cn(
                        'relative px-3 py-2 text-sm rounded-t-md border transition-colors',
                        isSelected
                          ? 'bg-background border-border border-b-background -mb-px z-10 font-medium text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30',
                        isCurrentWeek && !isSelected && 'ring-1 ring-primary/30'
                      )}
                    >
                      Week {weekIndex + 1}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 ml-auto pb-1">
                <Button
                  variant={weeklyPageMode === 'weekly-overview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWeeklyPageMode('weekly-overview')}
                  className="h-8 px-3 gap-1.5 text-xs"
                >
                  <Target className="w-3.5 h-3.5" />
                  Weekly Overview
                </Button>
                <Button
                  variant={weeklyPageMode === 'study-tracker' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWeeklyPageMode('study-tracker')}
                  className="h-8 px-3 gap-1.5 text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Study Tracker
                </Button>
                {weeklyPageMode === 'weekly-overview' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousWeek}
                      className="h-8 w-8 p-0"
                      title="Previous week"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={isCurrentWeekSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={goToCurrentWeek}
                      className="h-8 px-3 text-xs"
                      title="Go to current week"
                    >
                      {weekLabel}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextWeek}
                      className="h-8 w-8 p-0"
                      title="Next week"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNotesOpen(!isNotesOpen)}
                      className="h-8 px-3 gap-2"
                      title={isNotesOpen ? 'Hide notes' : 'Open notes'}
                    >
                      {isNotesOpen ? (
                        <PanelLeftClose className="w-4 h-4" />
                      ) : (
                        <StickyNote className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">{isNotesOpen ? 'Close' : 'Open Notes'}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-border p-4">
              {weeklyPageMode === 'weekly-overview' ? (
                <div className="flex min-h-0 gap-0 -mx-1">
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {gridDays.slice(0, 7).map(({ date, dateKey }) => {
                        const isToday = dateKey === todayKey;
                        const dayEvents = calendarData.events.filter((event) => {
                          const eventDateKey = event.dateKey || getDateKey(event.date);
                          return eventDateKey === dateKey;
                        });

                        return (
                          <WeeklyGoalsDayColumn
                            key={dateKey}
                            date={date}
                            dateKey={dateKey}
                            goals={getGoalsForDate(dateKey)}
                            events={dayEvents}
                            isToday={isToday}
                            onAddGoal={(title, color, goalType) =>
                              addGoal(dateKey, title, color, goalType)
                            }
                            onToggleGoal={(id) => toggleGoal(dateKey, id)}
                            onRemoveGoal={(id) => removeGoal(dateKey, id)}
                            onUpdateGoal={(id, updates) => updateGoal(dateKey, id, updates)}
                            onMoveGoal={moveGoal}
                            onCreateTask={(goal) => createTaskFromGoal(goal, dateKey)}
                            onNavigateToDaily={navigateToDaily}
                            canAddMore={canAddMore(dateKey)}
                          />
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {gridDays.slice(7, 14).map(({ date, dateKey, isNextWeekPreview }) => {
                        const isToday = dateKey === todayKey;
                        const dayEvents = calendarData.events.filter((event) => {
                          const eventDateKey = event.dateKey || getDateKey(event.date);
                          return eventDateKey === dateKey;
                        });

                        return (
                          <WeeklyGoalsDayColumn
                            key={dateKey}
                            date={date}
                            dateKey={dateKey}
                            goals={getGoalsForDate(dateKey)}
                            events={dayEvents}
                            isToday={isToday}
                            isNextWeekPreview={isNextWeekPreview}
                            onAddGoal={(title, color, goalType) =>
                              addGoal(dateKey, title, color, goalType)
                            }
                            onToggleGoal={(id) => toggleGoal(dateKey, id)}
                            onRemoveGoal={(id) => removeGoal(dateKey, id)}
                            onUpdateGoal={(id, updates) => updateGoal(dateKey, id, updates)}
                            onMoveGoal={moveGoal}
                            onCreateTask={(goal) => createTaskFromGoal(goal, dateKey)}
                            onNavigateToDaily={navigateToDaily}
                            canAddMore={canAddMore(dateKey)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {isNotesOpen && (
                    <div className="w-80 border-l border-border bg-card flex-shrink-0 ml-4 hidden lg:block">
                      <ChecklistSidebar onClose={() => setIsNotesOpen(false)} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[480px] rounded-lg border border-border/50 overflow-hidden">
                  <StudyTrackerProvider>
                    <StudyTracker />
                  </StudyTrackerProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isNotesOpen && weeklyPageMode === 'weekly-overview' && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 max-h-[50vh] border-t border-border bg-card shadow-lg">
          <ChecklistSidebar onClose={() => setIsNotesOpen(false)} />
        </div>
      )}
    </div>
  );
}
