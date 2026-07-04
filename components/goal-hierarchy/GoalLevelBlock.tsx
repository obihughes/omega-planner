'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function AutosizeTextarea({
  className,
  value,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const v = typeof value === 'string' ? value : '';

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [v]);

  return (
    <Textarea
      ref={ref}
      value={value}
      rows={2}
      className={cn('resize-none overflow-hidden min-h-[3rem]', className)}
      {...props}
    />
  );
}

export interface GoalLevelBlockProps {
  label: string;
  summary: string;
  compact?: boolean;
  onSummaryChange: (summary: string) => void;
}

export function GoalLevelBlock({
  label,
  summary,
  compact = false,
  onSummaryChange,
}: GoalLevelBlockProps) {
  return (
    <div className={cn('space-y-2', compact && 'space-y-1.5')}>
      {!compact && (
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
      )}
      <AutosizeTextarea
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        placeholder={`${label} goal…`}
        className={cn(
          'text-sm bg-background border-border',
          compact && 'text-xs min-h-[2.5rem]'
        )}
      />
    </div>
  );
}
