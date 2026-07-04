'use client';

import React, { useState } from 'react';
import type { WeeklyGoal } from '@/types/goals';
import { Edit2, StickyNote } from 'lucide-react';
import { getGoalColorScheme } from './goalColors';
import { GoalEditModal } from './GoalEditModal';

export interface GoalItemProps {
  goal: WeeklyGoal;
  dateKey: string;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>) => void;
  onCreateTask: () => void;
  draggable?: boolean;
}

export function GoalItem({
  goal,
  dateKey,
  onToggle,
  onRemove,
  onUpdate,
  onCreateTask,
  draggable = true,
}: GoalItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const colorScheme = getGoalColorScheme(goal.color);
  const isPrimary = goal.goalType === 'primary';

  const handleSaveEdit = (
    updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>
  ) => {
    onUpdate(updates);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div
        draggable={draggable}
        onDragStart={
          draggable
            ? (e) => {
                e.dataTransfer.setData(
                  'application/json',
                  JSON.stringify({ goalId: goal.id, fromDateKey: dateKey })
                );
              }
            : undefined
        }
        className={`border group transition-all ${colorScheme.bg} ${colorScheme.border} ${
          isPrimary ? 'p-3 border-2' : 'p-2'
        } rounded-lg ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} hover:shadow-md relative overflow-hidden`}
      >
        <div className="flex-1 min-w-0 flex-col flex">
          <span
            className={`block break-words ${
              isPrimary ? 'text-base font-semibold' : 'text-sm'
            } ${goal.done ? 'line-through opacity-50' : ''} ${colorScheme.text}`}
            title={goal.title}
            onClick={() => setIsEditModalOpen(true)}
          >
            {goal.title}
          </span>
          {goal.notes && !goal.done && (
            <div className="text-xs text-muted-foreground mt-1 opacity-70 flex items-start gap-1">
              <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="break-words">{goal.notes}</span>
            </div>
          )}
        </div>

        <input
          type="checkbox"
          checked={goal.done}
          onChange={onToggle}
          className={`${isPrimary ? 'w-5 h-5' : 'w-4 h-4'} cursor-pointer rounded absolute bottom-0.5 right-0.5 pointer-events-auto`}
          aria-label="toggle goal"
        />

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-0.5 right-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded"
          title="Edit goal"
          type="button"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>

      <GoalEditModal
        goal={isEditModalOpen ? goal : null}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        onDelete={onRemove}
        onCreateTask={onCreateTask}
      />
    </>
  );
}
