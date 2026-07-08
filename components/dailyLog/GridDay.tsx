'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { DailyLogEntry } from '@/types/dailyLog';
import { dateFromDateKey } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface GridDayProps {
  date: string;
  entry?: DailyLogEntry;
  isToday: boolean;
  isMutedWeek?: boolean;
  onSave: (content: string) => void;
  onDelete: () => void;
}

export function GridDay({
  date,
  entry,
  isToday,
  isMutedWeek = false,
  onSave,
  onDelete,
}: GridDayProps) {
  const [content, setContent] = useState(entry?.content ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dateObj = dateFromDateKey(date);

  useEffect(() => {
    setContent(entry?.content ?? '');
  }, [entry?.content, date]);

  const persist = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      onSave(trimmed);
    } else if (entry) {
      onDelete();
    }
  };

  const handleBlur = () => {
    if (content.trim() !== (entry?.content ?? '').trim()) {
      persist(content);
    }
  };

  return (
    <div
      className={cn(
        'border flex flex-col min-h-[280px] transition-colors',
        isToday
          ? 'border-green-500'
          : isMutedWeek
            ? 'bg-muted/10 opacity-90'
            : 'bg-muted/20'
      )}
    >
      <div className="p-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div>
          <p
            className={cn(
              'text-sm font-medium text-foreground',
              isMutedWeek && 'text-muted-foreground'
            )}
          >
            {dateObj.toLocaleDateString(undefined, { weekday: 'short' })}
          </p>
          <p
            className={cn(
              'text-xs text-muted-foreground',
              isMutedWeek && 'text-muted-foreground/70'
            )}
          >
            {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          aria-label="Focus log"
          onClick={() => textareaRef.current?.focus()}
          className="w-7 h-7 grid place-items-center border border-border transition-colors shrink-0 hover:bg-muted"
          title="Add or edit log"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-3 min-h-0">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onBlur={handleBlur}
          className={cn(
            'w-full min-h-[180px] resize-none bg-transparent text-sm text-foreground',
            'placeholder:text-muted-foreground focus:outline-none',
            isMutedWeek && 'text-muted-foreground'
          )}
        />
      </div>
    </div>
  );
}
