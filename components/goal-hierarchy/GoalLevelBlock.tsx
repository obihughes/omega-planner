'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { HierarchyGoalItem } from '@/types/goalHierarchy';
import type { GoalHierarchyLevel } from '@/hooks/useGoalHierarchy';

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
  level: GoalHierarchyLevel;
  label: string;
  summary: string;
  items: HierarchyGoalItem[];
  compact?: boolean;
  onSummaryChange: (summary: string) => void;
  onAddItem: (title: string) => void;
  onToggleItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export function GoalLevelBlock({
  label,
  summary,
  items,
  compact = false,
  onSummaryChange,
  onAddItem,
  onToggleItem,
  onRemoveItem,
}: GoalLevelBlockProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = inputValue.trim();
    if (!t) return;
    onAddItem(t);
    setInputValue('');
  };

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
      <form className="flex gap-1.5" onSubmit={handleSubmit}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={cn(
            'flex-1 border border-border rounded-md px-2 py-1 bg-background text-foreground',
            compact ? 'text-xs' : 'text-sm'
          )}
          placeholder="Add sub-goal…"
          autoComplete="off"
        />
        <Button type="submit" variant="secondary" size="sm" className={compact ? 'h-7 text-xs px-2' : undefined}>
          Add
        </Button>
      </form>
      {items.length > 0 && (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-muted/50 group',
                item.done && 'opacity-60',
                compact && 'text-xs'
              )}
            >
              <label className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggleItem(item.id)}
                  className="shrink-0"
                />
                <span
                  className={cn(
                    'truncate',
                    item.done && 'line-through text-muted-foreground'
                  )}
                >
                  {item.title}
                </span>
              </label>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5"
                aria-label="Remove sub-goal"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
