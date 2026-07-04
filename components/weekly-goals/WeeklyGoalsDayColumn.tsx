'use client';

import React, { useState } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { WeeklyGoal } from '@/types';
import { Calendar, Plus } from 'lucide-react';
import { GoalItem } from './GoalItem';
import { WeeklyGoalsAddForm } from './WeeklyGoalsAddForm';

export interface WeeklyGoalsDayColumnProps {
  date: Date;
  dateKey: string;
  goals: WeeklyGoal[];
  events?: CalendarEvent[];
  isToday: boolean;
  isWeekend?: boolean;
  isNextWeekPreview?: boolean;
  onAddGoal: (title: string, color: string, goalType: 'primary' | 'supporting') => void;
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onUpdateGoal: (id: string, updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>) => void;
  onCreateTask: (goal: WeeklyGoal) => void;
  onMoveGoal: (goalId: string, fromDateKey: string, toDateKey: string) => void;
  onNavigateToDaily?: (date: Date) => void;
  canAddMore: boolean;
}

export function WeeklyGoalsDayColumn({
  date,
  dateKey,
  goals,
  events = [],
  isToday,
  isNextWeekPreview = false,
  onAddGoal,
  onToggleGoal,
  onRemoveGoal,
  onUpdateGoal,
  onCreateTask,
  onMoveGoal,
  onNavigateToDaily,
  canAddMore,
}: WeeklyGoalsDayColumnProps) {
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
        isToday
          ? 'border-green-500'
          : isDragOver
            ? 'border-primary bg-primary/5'
            : isNextWeekPreview
              ? 'bg-muted/10 opacity-90'
              : 'bg-muted/20'
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
