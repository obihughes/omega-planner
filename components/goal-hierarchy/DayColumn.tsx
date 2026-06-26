'use client';

import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dateFromDateKey, isToday } from '@/utils/dateUtils';
import type { HierarchyDaySlot } from '@/types/goalHierarchy';
import { DayGoalTextarea } from './DayGoalTextarea';

export interface DayColumnProps {
  day: HierarchyDaySlot;
  onSummaryChange: (summary: string) => void;
  /** Muted styling for Sat–Wed preview row (includes next-week days). */
  isNextWeekPreview?: boolean;
}

export function DayColumn({ day, onSummaryChange, isNextWeekPreview = false }: DayColumnProps) {
  const date = dateFromDateKey(day.dateKey);
  const today = isToday(day.dateKey);
  return (
    <div
      className={cn(
        'flex flex-col min-w-0 rounded-lg border border-border bg-card p-3 space-y-2',
        today && 'ring-2 ring-primary/40 border-primary/30',
        isNextWeekPreview && 'bg-muted/40 border-border/60 shadow-inner'
      )}
    >
      <div className="shrink-0">
        <p
          className={cn(
            'text-xs font-semibold text-foreground',
            isNextWeekPreview && 'text-muted-foreground'
          )}
        >
          {format(date, 'EEEE')}
        </p>
        <p
          className={cn(
            'text-xs text-muted-foreground',
            today && 'text-primary font-medium',
            isNextWeekPreview && !today && 'text-muted-foreground/70'
          )}
        >
          {format(date, 'MMM d')}
        </p>
      </div>
      <DayGoalTextarea value={day.summary} onChange={onSummaryChange} />
    </div>
  );
}
