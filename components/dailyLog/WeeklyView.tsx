'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyLogEntry } from '@/types/dailyLog';
import {
  addDaysToDateKey,
  getWeekOffsetFromWeekStarts,
  getWeekOffsetLabel,
  getWeekStartKeyFromDateKey,
} from '@/utils/dateUtils';
import { GridDay } from './GridDay';

interface WeeklyViewProps {
  hydrated: boolean;
  todayDateKey: string;
  getEntry: (date: string) => DailyLogEntry | undefined;
  onSave: (date: string, content: string) => void;
  onDelete: (date: string) => void;
}

export function WeeklyView({
  hydrated,
  todayDateKey,
  getEntry,
  onSave,
  onDelete,
}: WeeklyViewProps) {
  const todayWeekStart = getWeekStartKeyFromDateKey(todayDateKey);
  const [centerWeekStartKey, setCenterWeekStartKey] = useState(todayWeekStart);

  const weekRows = useMemo(() => {
    const offsets = [-7, 0, 7];
    return offsets.map((offset, rowIndex) => {
      const weekStart = addDaysToDateKey(centerWeekStartKey, offset);
      const dates = Array.from({ length: 7 }, (_, index) =>
        addDaysToDateKey(weekStart, index)
      );
      return { weekStart, dates, isMutedWeek: rowIndex !== 1 };
    });
  }, [centerWeekStartKey]);

  const weekOffset = getWeekOffsetFromWeekStarts(centerWeekStartKey, todayWeekStart);
  const weekLabel = getWeekOffsetLabel(weekOffset);
  const isCurrentWeekSelected = weekOffset === 0;

  const goToPreviousWeek = () => {
    setCenterWeekStartKey((current) => addDaysToDateKey(current, -7));
  };

  const goToNextWeek = () => {
    setCenterWeekStartKey((current) => addDaysToDateKey(current, 7));
  };

  const goToToday = () => {
    setCenterWeekStartKey(todayWeekStart);
  };

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center justify-end gap-1.5 px-4 py-3 border-b border-border">
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
          onClick={goToToday}
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
      </div>

      <div className="p-4 space-y-4">
        {weekRows.map((row) => (
          <div
            key={row.weekStart}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3"
          >
            {row.dates.map((date) => (
              <GridDay
                key={date}
                date={date}
                entry={getEntry(date)}
                isToday={date === todayDateKey}
                isMutedWeek={row.isMutedWeek}
                onSave={(content) => onSave(date, content)}
                onDelete={() => onDelete(date)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
