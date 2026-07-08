'use client';

import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { dateFromDateKey } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface EntryFormProps {
  date: string;
  initialContent?: string;
  onSave: (date: string, content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}

export function EntryForm({
  date,
  initialContent = '',
  onSave,
  onCancel,
  autoFocus = true,
  compact = false,
}: EntryFormProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, date]);

  useEffect(() => {
    if (!autoFocus) return;
    textareaRef.current?.focus();
  }, [autoFocus, date]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSave(date, trimmed);
  };

  const formattedDate = compact
    ? format(dateFromDateKey(date), 'MMM d')
    : format(dateFromDateKey(date), 'EEEE, MMM d, yyyy');

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', compact && 'space-y-1.5')}>
      {!compact && <p className="text-xs text-muted-foreground">{formattedDate}</p>}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className={cn('resize-y', compact ? 'min-h-[72px] text-xs' : 'min-h-[120px]')}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!content.trim()}>
          Save
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
