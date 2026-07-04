'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { CalendarData } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { getDateKey, getMondayStart, getTodayDateKey } from '@/utils/dateUtils';
import { ChevronLeft, ChevronRight, PanelLeftClose, StickyNote } from 'lucide-react';
import { ChecklistSidebar } from './ChecklistSidebar';
import { WeeklyGoalsDayColumn } from '@/components/weekly-goals';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';

interface WeeklyGoalsCalendarViewProps {
  calendarData: CalendarData;
  onNavigateToDaily?: (date: Date) => void;
}

export function WeeklyGoalsCalendarView({ calendarData, onNavigateToDaily }: WeeklyGoalsCalendarViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const targetMonday = new Date(today);
    targetMonday.setDate(targetMonday.getDate() + weekOffset * 7);
    const targetMondayStart = getMondayStart(targetMonday);

    const result: Date[] = [];
    for (let week = 0; week < 4; week++) {
      for (let i = 0; i < 7; i++) {
        const d = new Date(targetMondayStart);
        d.setDate(targetMondayStart.getDate() + week * 7 + i);
        result.push(d);
      }
    }

    return result;
  }, [weekOffset]);

  const dateKeys = useMemo(() => days.map((d) => getDateKey(d)), [days]);

  const {
    hydrated,
    getGoalsForDate,
    canAddMore,
    addGoal,
    toggleGoal,
    removeGoal,
    updateGoal,
    moveGoal,
    createTaskFromGoal,
  } = useWeeklyGoals(dateKeys);

  const todayKey = getTodayDateKey();

  const goToPreviousWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekOffset((prev) => prev + 1);
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex flex-wrap items-center justify-end gap-1.5 px-6 py-4 border-b border-border/50">
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
          variant={weekOffset === 0 ? 'default' : 'outline'}
          size="sm"
          onClick={goToCurrentWeek}
          className="h-8 px-3 text-xs"
          title="Go to current week"
        >
          Today
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
          {isNotesOpen ? <PanelLeftClose className="w-4 h-4" /> : <StickyNote className="w-4 h-4" />}
          <span className="text-xs font-medium">{isNotesOpen ? 'Close' : 'Open Notes'}</span>
        </Button>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          <div className="grid grid-cols-7 gap-4 auto-rows-fr">
            {days.map((d) => {
              const dateKey = getDateKey(d);
              const items = getGoalsForDate(dateKey);
              const isToday = dateKey === todayKey;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;

              const dayEvents = calendarData.events.filter((event) => {
                const eventDateKey = event.dateKey || getDateKey(event.date);
                return eventDateKey === dateKey;
              });

              return (
                <WeeklyGoalsDayColumn
                  key={dateKey}
                  date={d}
                  dateKey={dateKey}
                  goals={items}
                  events={dayEvents}
                  isToday={isToday}
                  isWeekend={isWeekend}
                  onAddGoal={(title, color, goalType) => addGoal(dateKey, title, color, goalType)}
                  onToggleGoal={(id) => toggleGoal(dateKey, id)}
                  onRemoveGoal={(id) => removeGoal(dateKey, id)}
                  onUpdateGoal={(id, updates) => updateGoal(dateKey, id, updates)}
                  onCreateTask={(goal) => createTaskFromGoal(goal, dateKey)}
                  onMoveGoal={moveGoal}
                  onNavigateToDaily={onNavigateToDaily}
                  canAddMore={canAddMore(dateKey)}
                />
              );
            })}
          </div>
        </div>

        {isNotesOpen && (
          <div className="w-80 border-l border-border bg-card flex-shrink-0">
            <ChecklistSidebar onClose={() => setIsNotesOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
