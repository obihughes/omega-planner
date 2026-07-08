'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DAILY_LOG_DAY_LABELS,
  DAILY_LOG_DAY_SHORT,
  DAILY_LOG_WEEKDAY_ORDER,
  DailyLogEntry,
} from '@/types/dailyLog';
import {
  addDaysToDateKey,
  dateFromDateKey,
  getWeekStartKeyFromDateKey,
} from '@/utils/dateUtils';
import { GridDay } from './GridDay';

interface DayOfWeekFilterProps {
  hydrated: boolean;
  todayDateKey: string;
  getEntry: (date: string) => DailyLogEntry | undefined;
  getEntriesByDayOfWeek: (dayOfWeek: number) => DailyLogEntry[];
  onSave: (date: string, content: string) => void;
  onDelete: (date: string) => void;
}

const ROWS = 3;
const COLS = 7;
const TOTAL_WEEKS = ROWS * COLS;
const CENTER_INDEX = Math.floor(TOTAL_WEEKS / 2);

const WEEK_ROW_LABELS = ['Older', 'Recent', 'Upcoming'] as const;

/** Map Date.getDay() to offset from Monday week start. */
function weekdayOffsetFromMonday(dayOfWeek: number): number {
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

function getWeekdayInWeek(weekStartKey: string, dayOfWeek: number): string {
  return addDaysToDateKey(weekStartKey, weekdayOffsetFromMonday(dayOfWeek));
}

/** Selected weekday in the calendar week containing today. */
function getTodayWeekdayInstance(dayOfWeek: number, todayDateKey: string): string {
  const weekStart = getWeekStartKeyFromDateKey(todayDateKey);
  return getWeekdayInWeek(weekStart, dayOfWeek);
}

function buildWeekdayRows(centerDateKey: string): string[][] {
  const dates: string[] = [];
  for (let offset = CENTER_INDEX; offset > 0; offset -= 1) {
    dates.push(addDaysToDateKey(centerDateKey, -7 * offset));
  }
  dates.push(centerDateKey);
  for (let offset = 1; offset <= CENTER_INDEX; offset += 1) {
    dates.push(addDaysToDateKey(centerDateKey, 7 * offset));
  }

  return Array.from({ length: ROWS }, (_, rowIndex) =>
    dates.slice(rowIndex * COLS, rowIndex * COLS + COLS)
  );
}

function getWeekOffsetFromDates(dateKey: string, referenceDateKey: string): number {
  const diff = dateFromDateKey(dateKey).getTime() - dateFromDateKey(referenceDateKey).getTime();
  return Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

function getWeekdayOffsetLabel(weekOffset: number, dayLabel: string): string {
  if (weekOffset === 0) return `This ${dayLabel}`;
  if (weekOffset === -1) return `Last ${dayLabel}`;
  if (weekOffset === 1) return `Next ${dayLabel}`;
  if (weekOffset < -1) return `${Math.abs(weekOffset)} ${dayLabel}s ago`;
  return `${dayLabel} in ${weekOffset} weeks`;
}

export function DayOfWeekFilter({
  hydrated,
  todayDateKey,
  getEntry,
  getEntriesByDayOfWeek,
  onSave,
  onDelete,
}: DayOfWeekFilterProps) {
  const defaultDay = dateFromDateKey(todayDateKey).getDay();
  const [selectedDay, setSelectedDay] = useState<number>(defaultDay);
  const [centerDateKey, setCenterDateKey] = useState(() =>
    getTodayWeekdayInstance(defaultDay, todayDateKey)
  );

  const todayInstance = useMemo(
    () => getTodayWeekdayInstance(selectedDay, todayDateKey),
    [selectedDay, todayDateKey]
  );

  const weekRows = useMemo(
    () => buildWeekdayRows(centerDateKey),
    [centerDateKey]
  );

  const entries = useMemo(
    () => getEntriesByDayOfWeek(selectedDay),
    [getEntriesByDayOfWeek, selectedDay]
  );

  const selectedLabel = DAILY_LOG_DAY_LABELS[selectedDay] ?? 'Day';
  const weekOffset = getWeekOffsetFromDates(centerDateKey, todayInstance);
  const navLabel = getWeekdayOffsetLabel(weekOffset, selectedLabel);
  const isCenteredOnToday = centerDateKey === todayInstance;

  const handleSelectDay = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek);
    setCenterDateKey(getTodayWeekdayInstance(dayOfWeek, todayDateKey));
  };

  const goToPrevious = () => {
    setCenterDateKey((current) => addDaysToDateKey(current, -7 * COLS));
  };

  const goToNext = () => {
    setCenterDateKey((current) => addDaysToDateKey(current, 7 * COLS));
  };

  const goToToday = () => {
    setCenterDateKey(todayInstance);
  };

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 pt-3 border-b border-border">
        <div className="flex flex-wrap items-end gap-0.5">
          {DAILY_LOG_WEEKDAY_ORDER.map((dayOfWeek) => {
            const isSelected = selectedDay === dayOfWeek;
            const isToday = dayOfWeek === dateFromDateKey(todayDateKey).getDay();

            return (
              <button
                key={dayOfWeek}
                type="button"
                onClick={() => handleSelectDay(dayOfWeek)}
                className={cn(
                  'relative px-3 py-2 text-sm rounded-t-md border transition-colors',
                  isSelected
                    ? 'bg-background border-border border-b-background -mb-px z-10 font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30',
                  isToday && !isSelected && 'ring-1 ring-primary/30'
                )}
              >
                {DAILY_LOG_DAY_SHORT[dayOfWeek]}
              </button>
            );
          })}
        </div>
        <p className="pb-2 text-xs text-muted-foreground shrink-0">
          {entries.length > 0 ? `${entries.length} logged` : 'No entries yet'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 px-4 py-3 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          className="h-8 w-8 p-0"
          title="Previous 7 weeks"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant={isCenteredOnToday ? 'default' : 'outline'}
          size="sm"
          onClick={goToToday}
          className="h-8 px-3 text-xs"
          title={`Go to this ${selectedLabel}`}
        >
          {navLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          className="h-8 w-8 p-0"
          title="Next 7 weeks"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {weekRows.map((rowDates, rowIndex) => (
          <div key={rowIndex} className="space-y-1">
            <p className="px-1 text-xs font-medium text-muted-foreground">
              {WEEK_ROW_LABELS[rowIndex]}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {rowDates.map((date) => (
                <GridDay
                  key={date}
                  date={date}
                  entry={getEntry(date)}
                  isToday={date === todayDateKey}
                  isMutedWeek={rowIndex !== 1}
                  onSave={(content) => onSave(date, content)}
                  onDelete={() => onDelete(date)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
