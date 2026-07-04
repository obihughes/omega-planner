'use client';

import React, { useState } from 'react';
import type { WeeklyGoal } from '@/types/goals';
import { GoalItem, WeeklyGoalsAddForm } from '@/components/weekly-goals';
import { cn } from '@/lib/utils';

export interface WeeklyGoalsListForDayProps {
  dateKey: string;
  goals: WeeklyGoal[];
  canAddMore: boolean;
  showInput: boolean;
  onShowInput: (show: boolean) => void;
  onAddGoal: (title: string, color?: string, goalType?: 'primary' | 'supporting') => void;
  onToggleGoal: (goalId: string) => void;
  onRemoveGoal: (goalId: string) => void;
  onUpdateGoal: (
    goalId: string,
    updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>
  ) => void;
  onMoveGoal: (goalId: string, fromDateKey: string, toDateKey: string) => void;
  onCreateTask: (goal: WeeklyGoal) => void;
  compact?: boolean;
}

export function WeeklyGoalsListForDay({
  dateKey,
  goals,
  canAddMore,
  showInput,
  onShowInput,
  onAddGoal,
  onToggleGoal,
  onRemoveGoal,
  onUpdateGoal,
  onMoveGoal,
  onCreateTask,
  compact = false,
}: WeeklyGoalsListForDayProps) {
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
      className={cn(
        'flex-1 min-h-0 flex flex-col transition-colors',
        compact ? 'space-y-2' : 'space-y-3',
        isDragOver && 'bg-primary/5'
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn('flex-1 overflow-y-auto min-h-[120px]', compact ? 'space-y-2' : 'space-y-3')}>
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
      </div>

      <WeeklyGoalsAddForm
        canAddMore={canAddMore}
        showInput={showInput}
        onShowInput={onShowInput}
        onAddGoal={(title, color, goalType) => onAddGoal(title, color, goalType)}
      />
    </div>
  );
}
