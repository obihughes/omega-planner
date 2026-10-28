'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from '@/components/ui/popover';
import { WeeklyGoalsDayColumn } from '@/components/weekly-goals';
import type { CalendarEvent } from '@/types/calendar';
import type { WeeklyGoal } from '@/types/goals';
import { cn } from '@/lib/utils';

export interface WeeklyDayGoalsPopoverProps {
  dateKey: string;
  date: Date;
  isToday: boolean;
  /** Calendar + primary-goal events already filtered to this day */
  dayEvents: CalendarEvent[];
  goals: WeeklyGoal[];
  canAddMore: boolean;
  onAddGoal: (title: string, color: string, goalType: 'primary' | 'supporting') => void;
  onToggleGoal: (goalId: string) => void;
  onRemoveGoal: (goalId: string) => void;
  onUpdateGoal: (
    goalId: string,
    updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>
  ) => void;
  onMoveGoal: (goalId: string, fromDateKey: string, toDateKey: string) => void;
  /** Trigger content: the day's events cell in the Weekly View */
  children: React.ReactNode;
  className?: string;
}

/**
 * Click-to-open popover for one day in the Weekly View.
 * Shows that day's Weekly Overview goals (editable in place) and the read-only calendar events.
 * Primary-goal events are omitted from the events list because the goal list already shows them.
 */
export function WeeklyDayGoalsPopover({
  dateKey,
  date,
  isToday,
  dayEvents,
  goals,
  canAddMore,
  onAddGoal,
  onToggleGoal,
  onRemoveGoal,
  onUpdateGoal,
  onMoveGoal,
  children,
  className,
}: WeeklyDayGoalsPopoverProps) {
  const calendarOnlyEvents = React.useMemo(
    () => dayEvents.filter((event) => event.source !== 'primary-goal'),
    [dayEvents]
  );

  const dayLabel = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          role="button"
          aria-label={`Open goals for ${dayLabel}`}
          className={cn(
            'group cursor-pointer rounded-md transition-colors hover:bg-muted/40',
            className
          )}
        >
          {children}
        </div>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="w-80 p-0 max-h-[70vh] overflow-y-auto"
        >
          <WeeklyGoalsDayColumn
            date={date}
            dateKey={dateKey}
            goals={goals}
            events={calendarOnlyEvents}
            isToday={isToday}
            canAddMore={canAddMore}
            onAddGoal={onAddGoal}
            onToggleGoal={onToggleGoal}
            onRemoveGoal={onRemoveGoal}
            onUpdateGoal={onUpdateGoal}
            onMoveGoal={onMoveGoal}
          />

          <div className="border-t px-3 py-2 text-xs">
            <Link
              href="/weekly-overview"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open in Weekly Overview
            </Link>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
