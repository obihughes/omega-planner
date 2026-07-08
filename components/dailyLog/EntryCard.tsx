'use client';

import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DailyLogEntry, DAILY_LOG_DAY_SHORT } from '@/types/dailyLog';
import { dateFromDateKey } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface EntryCardProps {
  entry: DailyLogEntry;
  onEdit: (entry: DailyLogEntry) => void;
  onDelete: (date: string) => void;
  compact?: boolean;
}

export function EntryCard({ entry, onEdit, onDelete, compact = false }: EntryCardProps) {
  const dateLabel = format(dateFromDateKey(entry.date), 'MMM d, yyyy');
  const dayLabel = DAILY_LOG_DAY_SHORT[entry.dayOfWeek] ?? '';
  const updatedLabel = format(new Date(entry.updatedAt), 'MMM d, h:mm a');

  return (
    <Card className={cn('border bg-card', compact && 'shadow-none')}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">{dateLabel}</span>
              <span className="text-xs text-muted-foreground">({dayLabel})</span>
            </div>
            <p
              className={cn(
                'text-sm text-foreground whitespace-pre-wrap break-words',
                compact && 'line-clamp-4'
              )}
            >
              {entry.content}
            </p>
            <p className="text-xs text-muted-foreground">Last edited {updatedLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entry)}
              className="h-8 w-8 p-0"
              aria-label="Edit entry"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entry.date)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
