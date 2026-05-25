'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTodo } from '@/hooks/useTodo';
import { cn } from '@/lib/utils';

export function TodoView() {
  const { items, add, remove, toggle, clearCompleted, hasCompleted } = useTodo();
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

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Your list is empty. Add something above.
              </p>
            ) : (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between gap-2 text-sm rounded-md px-2 py-1.5 hover:bg-muted/50',
                      item.done && 'opacity-60'
                    )}
                  >
                    <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggle(item.id)}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(item.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
