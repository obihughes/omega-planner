'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { CalendarData, CalendarEvent } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { getDateKey, getMondayStart, getTodayDateKey } from '@/utils/dateUtils';
import { WeeklyGoal } from '@/types';
import { ChevronLeft, ChevronRight, Calendar, PanelLeftClose, StickyNote, Plus } from 'lucide-react';
import { ChecklistSidebar } from './ChecklistSidebar';
import { GoalItem, WeeklyGoalsAddForm } from '@/components/weekly-goals';
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

  const currentWeekRange = useMemo(() => {
    if (days.length === 0) return '';
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const startMonth = startDate.toLocaleDateString(undefined, { month: 'short' });
    const endMonth = endDate.toLocaleDateString(undefined, { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }, [days]);

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium">Weekly Goals</h1>
          <div className="flex items-center gap-1.5">
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {currentWeekRange} · Up to 6 goals per day
          </div>
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
        </div>
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
                <CalendarDayColumn
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

interface CalendarDayColumnProps {
  date: Date;
  dateKey: string;
  goals: WeeklyGoal[];
  events: CalendarEvent[];
  isToday: boolean;
  isWeekend: boolean;
  onAddGoal: (title: string, color: string, goalType: 'primary' | 'supporting') => void;
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onUpdateGoal: (id: string, updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>) => void;
  onCreateTask: (goal: WeeklyGoal) => void;
  onMoveGoal: (goalId: string, fromDateKey: string, toDateKey: string) => void;
  onNavigateToDaily?: (date: Date) => void;
  canAddMore: boolean;
}

function CalendarDayColumn({
  date,
  dateKey,
  goals,
  events,
  isToday,
  onAddGoal,
  onToggleGoal,
  onRemoveGoal,
  onUpdateGoal,
  onCreateTask,
  onMoveGoal,
  onNavigateToDaily,
  canAddMore,
}: CalendarDayColumnProps) {
  const [showInput, setShowInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const payload = JSON.parse(raw) as { goalId: string; fromDateKey: string };
      if (payload.fromDateKey !== dateKey) {
        onMoveGoal(payload.goalId, payload.fromDateKey, dateKey);
      }
    } catch {
      // Ignore invalid drag payloads.
    }
  };

  return (
    <div
      className={`border flex flex-col min-h-[320px] transition-colors ${
        isToday ? 'border-green-500' : isDragOver ? 'border-primary bg-primary/5' : 'bg-muted/20'
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <button
          type="button"
          aria-label="Add goal"
          onClick={() => canAddMore && setShowInput(true)}
          disabled={!canAddMore || showInput}
          className={`w-7 h-7 grid place-items-center border transition-colors ${
            !canAddMore || showInput ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
          }`}
          title="Add goal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-visible">
        {events.length > 0 && (
          <div className="space-y-1 mb-2">
            {events.slice(0, 2).map((event) => (
              <div
                key={event.id}
                onClick={() => onNavigateToDaily?.(date)}
                className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/30"
              >
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="font-medium text-blue-900 dark:text-blue-100 truncate">{event.title}</span>
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-muted-foreground px-2">+{events.length - 2} more events</div>
            )}
          </div>
        )}

        {goals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            dateKey={dateKey}
            onToggle={() => onToggleGoal(goal.id)}
            onRemove={() => onRemoveGoal(goal.id)}
            onUpdate={(updates) => onUpdateGoal(goal.id, updates)}
            onCreateTask={() => onCreateTask(goal)}
          />
        ))}

        <WeeklyGoalsAddForm
          canAddMore={canAddMore}
          showInput={showInput}
          onShowInput={setShowInput}
          onAddGoal={onAddGoal}
        />
      </div>
    </div>
  );
}
