'use client';

import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dateFromDateKey, isToday } from '@/utils/dateUtils';
import type { HierarchyDaySlot } from '@/types/goalHierarchy';
import { GoalLevelBlock } from './GoalLevelBlock';

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export interface DayColumnProps {
  dayIndex: number;
  day: HierarchyDaySlot;
  onSummaryChange: (summary: string) => void;
  onAddItem: (title: string) => void;
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export function DayColumn({
  dayIndex,
  day,
  onSummaryChange,
  onAddItem,
  onToggleItem,
  onRemoveItem,
}: DayColumnProps) {
  const date = dateFromDateKey(day.dateKey);
  const today = isToday(day.dateKey);

  return (
    <div
      className={cn(
        'flex flex-col min-w-0 rounded-lg border border-border bg-card p-3 space-y-2',
        today && 'ring-2 ring-primary/40 border-primary/30'
      )}
    >
      <div className="shrink-0">
        <p className="text-xs font-semibold text-foreground">{WEEKDAY_NAMES[dayIndex]}</p>
        <p className={cn('text-xs text-muted-foreground', today && 'text-primary font-medium')}>
          {format(date, 'MMM d')}
        </p>
      </div>
      <GoalLevelBlock
        level="day"
        label={WEEKDAY_NAMES[dayIndex]}
        summary={day.summary}
        items={day.items}
        compact
        onSummaryChange={onSummaryChange}
        onAddItem={onAddItem}
        onToggleItem={onToggleItem}
        onRemoveItem={onRemoveItem}
      />
    </div>
  );
}
