'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dateFromDateKey, isToday } from '@/utils/dateUtils';
import type { WeeklyGoal } from '@/types/goals';
import { WeeklyGoalsListForDay } from './WeeklyGoalsListForDay';

export interface DayColumnProps {
  dateKey: string;
  goals: WeeklyGoal[];
  canAddMore: boolean;
  onAddGoal: (title: string, color?: string, goalType?: 'primary' | 'supporting') => void;
  onToggleGoal: (goalId: string) => void;
  onRemoveGoal: (goalId: string) => void;
  onUpdateGoal: (
    goalId: string,
    updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>
  ) => void;
  onMoveGoal: (goalId: string, fromDateKey: string, toDateKey: string) => void;
  onCreateTask: (goal: WeeklyGoal) => void;
  /** Muted styling for Sat–Wed preview row (includes next-week days). */
  isNextWeekPreview?: boolean;
}

export function DayColumn({
  dateKey,
  goals,
  canAddMore,
  onAddGoal,
  onToggleGoal,
  onRemoveGoal,
  onUpdateGoal,
  onMoveGoal,
  onCreateTask,
  isNextWeekPreview = false,
}: DayColumnProps) {
  const [showInput, setShowInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const date = dateFromDateKey(dateKey);
  const today = isToday(dateKey);

  return (
    <div
      className={cn(
        'flex flex-col min-w-0 min-h-[280px] border transition-colors',
        today
          ? 'border-green-500 bg-card'
          : isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card',
        isNextWeekPreview && 'bg-muted/40 border-border/60 shadow-inner opacity-90'
      )}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
    >
      <div className="p-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div>
          <p
            className={cn(
              'text-sm font-medium text-foreground',
              isNextWeekPreview && 'text-muted-foreground'
            )}
          >
            {format(date, 'EEE')}
          </p>
          <p
            className={cn(
              'text-xs text-muted-foreground',
              today && 'text-green-600 dark:text-green-400 font-medium',
              isNextWeekPreview && !today && 'text-muted-foreground/70'
            )}
          >
            {format(date, 'MMM d')}
          </p>
        </div>
        <button
          type="button"
          aria-label="Add goal"
          onClick={() => canAddMore && setShowInput(true)}
          disabled={!canAddMore || showInput}
          className={cn(
            'w-7 h-7 grid place-items-center border border-border transition-colors shrink-0',
            !canAddMore || showInput ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
          )}
          title={canAddMore ? 'Add goal' : 'Up to 6 goals per day'}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-3 min-h-0">
        <WeeklyGoalsListForDay
          dateKey={dateKey}
          goals={goals}
          canAddMore={canAddMore}
          showInput={showInput}
          onShowInput={setShowInput}
          onAddGoal={onAddGoal}
          onToggleGoal={onToggleGoal}
          onRemoveGoal={onRemoveGoal}
          onUpdateGoal={onUpdateGoal}
          onMoveGoal={onMoveGoal}
          onCreateTask={onCreateTask}
          compact
        />
      </div>
    </div>
  );
}
