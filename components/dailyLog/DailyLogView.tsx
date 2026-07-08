'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useDailyLog } from '@/hooks/useDailyLog';
import { DayOfWeekFilter } from './DayOfWeekFilter';
import { WeeklyView } from './WeeklyView';

type DailyLogTab = 'grid' | 'day-of-week';

export function DailyLogView() {
  const [activeTab, setActiveTab] = useState<DailyLogTab>('grid');
  const {
    hydrated,
    todayDateKey,
    getEntry,
    upsertEntry,
    deleteEntry,
    getEntriesByDayOfWeek,
    allEntries,
  } = useDailyLog();

  if (!hydrated) {
    return (
      <div className="h-full w-full px-6 py-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 border-b border-border pb-3 flex-1">
              <button
                type="button"
                onClick={() => setActiveTab('grid')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                3-Week Grid
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('day-of-week')}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'day-of-week'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                By Day of Week
              </button>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {allEntries.length} {allEntries.length === 1 ? 'day' : 'days'} logged
            </span>
          </div>

          {activeTab === 'grid' ? (
            <WeeklyView
              hydrated={hydrated}
              todayDateKey={todayDateKey}
              getEntry={getEntry}
              onSave={upsertEntry}
              onDelete={deleteEntry}
            />
          ) : (
            <DayOfWeekFilter
              hydrated={hydrated}
              todayDateKey={todayDateKey}
              getEntry={getEntry}
              getEntriesByDayOfWeek={getEntriesByDayOfWeek}
              onSave={upsertEntry}
              onDelete={deleteEntry}
            />
          )}
        </div>
      </div>
    </div>
  );
}
