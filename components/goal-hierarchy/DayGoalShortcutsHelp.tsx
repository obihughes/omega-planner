'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const DAY_GOAL_SHORTCUTS = [
  { keys: '--', description: 'Create a bullet (empty line or before existing text)' },
  { keys: 'Tab, then --', description: 'Indented bullet' },
  { keys: 'Enter', description: 'Continue same bullet (wraps align after marker)' },
  { keys: 'Enter (empty line)', description: 'New bullet in block' },
  { keys: 'Backspace', description: 'At line start, outdent or merge' },
  { keys: 'Ctrl+Enter', description: 'Toggle [ ] / [x] checkbox' },
] as const;

export function DayGoalShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label="Day goal shortcuts"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 text-xs space-y-2">
        <p className="font-medium text-foreground">Day goal shortcuts</p>
        <ul className="space-y-1.5 text-muted-foreground">
          {DAY_GOAL_SHORTCUTS.map(({ keys, description }) => (
            <li key={keys} className="flex gap-2">
              <span className="shrink-0 font-mono text-foreground">{keys}</span>
              <span>{description}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
