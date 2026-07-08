'use client';

import React, { useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface WeeklyDayNotesPanelProps {
  dateKey: string;
  value: string;
  onChange: (text: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

export function WeeklyDayNotesPanel({
  dateKey,
  value,
  onChange,
  onBlur,
  className,
  placeholder = '',
}: WeeklyDayNotesPanelProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <div
      className={cn(
        'absolute inset-0 z-[45] flex flex-col bg-background/85 backdrop-blur-[1px] border border-primary/20 shadow-inner',
        className
      )}
      onMouseDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <Textarea
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 min-h-0 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 rounded-none text-base leading-relaxed px-2 py-2"
        aria-label={`Notes for ${dateKey}`}
      />
    </div>
  );
}
