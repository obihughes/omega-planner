'use client';

import React, { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { TodoItem } from '@/types/todo';
import { useTodo } from '@/hooks/useTodo';
import { cn } from '@/lib/utils';

interface TodoRowProps {
  item: TodoItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

function TodoRow({ item, onToggle, onRemove, onUpdateNotes }: TodoRowProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes);

  const handleToggleNotes = () => {
    if (!notesOpen) setNotesValue(item.notes);
    setNotesOpen((prev) => !prev);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotesValue(e.target.value);
    onUpdateNotes(item.id, e.target.value);
  };

  return (
    <li
      className={cn(
        'rounded-md px-2 py-1.5 hover:bg-muted/50',
        item.done && 'opacity-60'
      )}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => onToggle(item.id)}
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
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleNotes}
            aria-expanded={notesOpen}
            aria-label="Notes"
            title="Notes"
            className={cn(
              'text-muted-foreground hover:text-foreground',
              item.notes && 'text-foreground'
            )}
          >
            <StickyNote className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            Remove
          </Button>
        </div>
      </div>

      {notesOpen && (
        <div className="mt-1.5 pl-6">
          <Textarea
            value={notesValue}
            onChange={handleNotesChange}
            placeholder="Add notes..."
            className="text-sm min-h-[60px]"
          />
        </div>
      )}
    </li>
  );
}

export function TodoView() {
  const { items, hydrated, add, remove, toggle, clearCompleted, updateNotes, hasCompleted } = useTodo();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;
    add(value);
    setInputValue('');
  };

  return (
    <div className="h-full w-full px-6 py-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Todo</h1>

        <Card className="border bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {items.length === 0
                  ? 'No items yet'
                  : `${items.filter((i) => !i.done).length} active`}
              </span>
              {hasCompleted && (
                <Button variant="ghost" size="sm" onClick={clearCompleted}>
                  Clear completed
                </Button>
              )}
            </div>

            <form className="flex gap-2" onSubmit={handleSubmit}>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm"
                placeholder="Add a task..."
                autoComplete="off"
              />
              <Button type="submit" variant="secondary" size="sm">
                Add
              </Button>
            </form>

            {!hydrated ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Your list is empty. Add something above.
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => (
                  <TodoRow
                    key={item.id}
                    item={item}
                    onToggle={toggle}
                    onRemove={remove}
                    onUpdateNotes={updateNotes}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
