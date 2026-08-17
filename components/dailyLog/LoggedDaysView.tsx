'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DailyLogEntry } from '@/types/dailyLog';
import { dateFromDateKey } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface LoggedDaysViewProps {
  hydrated: boolean;
  allEntries: DailyLogEntry[];
  todayDateKey: string;
  onSave: (date: string, content: string) => void;
  onDelete: (date: string) => void;
}

interface MonthGroup {
  key: string;
  label: string;
  entries: DailyLogEntry[];
}

function groupEntriesByMonth(entries: DailyLogEntry[]): MonthGroup[] {
  const groups = new Map<string, DailyLogEntry[]>();

  for (const entry of entries) {
    const monthKey = entry.date.slice(0, 7); // YYYY-MM
    const bucket = groups.get(monthKey);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(monthKey, [entry]);
    }
  }

  return Array.from(groups.entries()).map(([key, monthEntries]) => {
    const [year, month] = key.split('-').map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    return { key, label, entries: monthEntries };
  });
}

interface LoggedDayRowProps {
  entry: DailyLogEntry;
  isToday: boolean;
  onSave: (content: string) => void;
  onDelete: () => void;
}

function LoggedDayRow({ entry, isToday, onSave, onDelete }: LoggedDayRowProps) {
  const [content, setContent] = useState(entry.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dateObj = dateFromDateKey(entry.date);

  useEffect(() => {
    setContent(entry.content);
  }, [entry.content, entry.date]);

  const persist = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onDelete();
    }
  };

  const handleBlur = () => {
    if (content.trim() !== entry.content.trim()) {
      persist(content);
    }
  };

  return (
    <div
      className={cn(
        'border rounded-md p-3 bg-muted/20 transition-colors',
        isToday && 'border-green-500'
      )}
    >
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-sm font-medium text-foreground">
          {dateObj.toLocaleDateString(undefined, { weekday: 'long' })}
        </p>
        <p className="text-xs text-muted-foreground">
          {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onBlur={handleBlur}
        className={cn(
          'w-full min-h-[60px] resize-y bg-transparent text-sm text-foreground',
          'placeholder:text-muted-foreground focus:outline-none'
        )}
      />
    </div>
  );
}

export function LoggedDaysView({
  hydrated,
  allEntries,
  todayDateKey,
  onSave,
  onDelete,
}: LoggedDaysViewProps) {
  const monthGroups = useMemo(() => groupEntriesByMonth(allEntries), [allEntries]);

  if (!hydrated) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (allEntries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">No days logged yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-6">
      {monthGroups.map((group) => (
        <div key={group.key} className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
          <div className="space-y-2">
            {group.entries.map((entry) => (
              <LoggedDayRow
                key={entry.date}
                entry={entry}
                isToday={entry.date === todayDateKey}
                onSave={(content) => onSave(entry.date, content)}
                onDelete={() => onDelete(entry.date)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
