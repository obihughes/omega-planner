'use client';

import { Textarea } from '@/components/ui/textarea';
import { useMealsNotes } from '@/hooks/useMealsNotes';
import { cn } from '@/lib/utils';

export function MealsNotesPanel() {
  const { text, setNotes, hydrated } = useMealsNotes();

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 min-h-0',
        'border-b border-border lg:border-b-0 lg:border-r',
        'bg-muted/20',
        'w-full lg:w-72',
        'px-4 py-4 lg:py-6 lg:pl-4 lg:pr-3'
      )}
    >
      <h2 className="text-sm font-medium text-foreground mb-2 shrink-0">Notes</h2>
      {!hydrated ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <Textarea
          value={text}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Shopping ideas, substitutions, reminders…"
          className={cn(
            'flex-1 min-h-[120px] lg:min-h-0 resize-none',
            'text-sm leading-relaxed'
          )}
          aria-label="Meals notes"
        />
      )}
    </aside>
  );
}
