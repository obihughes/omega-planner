'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { addDaysToDateKey, dateFromDateKey, getDateKeyFromOffset, getTodayDateKey } from '@/utils/dateUtils';
import { useMeals } from '@/hooks/useMeals';
import type { MealSlot } from '@/types/meals';

type DayPlan = {
  dateKey: string;
  label: string;
};

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner'] as const;

function getWeekStart(dateKey: string): string {
  const date = dateFromDateKey(dateKey);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ...
  // Use Monday as the first day of week
  const distanceToMonday = (day + 6) % 7; // Mon->0, Tue->1, ... Sun->6
  const monday = new Date(date);
  monday.setDate(date.getDate() - distanceToMonday);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

function formatDayHeader(dateKey: string): string {
  const d = dateFromDateKey(dateKey);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export const MealPlanner: React.FC = () => {
  const [anchorDateKey, setAnchorDateKey] = useState<string>(getTodayDateKey());
  const { getMeals, addMeal, removeMeal } = useMeals();
  const [openEditorKey, setOpenEditorKey] = useState<string | null>(null);

  const week = useMemo<DayPlan[]>(() => {
    const mondayKey = getWeekStart(anchorDateKey);
    return Array.from({ length: 7 }).map((_, idx) => {
      const dateKey = addDaysToDateKey(mondayKey, idx);
      return {
        dateKey,
        label: formatDayHeader(dateKey)
      };
    });
  }, [anchorDateKey]);

  const handleQuickAdd = (
    dateKey: string,
    slotLabel: typeof MEAL_SLOTS[number],
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('item') as HTMLInputElement | null;
    if (!input) return;
    const value = input.value.trim();
    if (!value) return;
    const slot: MealSlot = slotLabel.toLowerCase() as MealSlot;
    addMeal(dateKey, slot, value);
    input.value = '';
    setOpenEditorKey(null);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 pt-6 pb-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Meal Planner</h1>
            <p className="text-sm text-muted-foreground mt-1">Plan your meals for the week at a glance.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAnchorDateKey(addDaysToDateKey(anchorDateKey, -7))}>Prev week</Button>
            <Button variant="outline" onClick={() => setAnchorDateKey(getDateKeyFromOffset(0))}>Today</Button>
            <Button variant="outline" onClick={() => setAnchorDateKey(addDaysToDateKey(anchorDateKey, 7))}>Next week</Button>
          </div>
        </div>
      </header>

      <div className="px-6 pb-6 pt-4 flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-7 gap-2">
            {week.map(({ dateKey, label }) => (
              <Card key={dateKey} className={cn('border bg-card min-h-[360px] flex flex-col')}>
                <div className={cn('px-3 py-2 border-b flex items-center justify-between')}>
                  <div className="text-sm font-medium truncate">{label}</div>
                </div>
                <CardContent className="p-0 divide-y">
                  {MEAL_SLOTS.map((slotLabel) => {
                    const slot = slotLabel.toLowerCase() as MealSlot;
                    const items = getMeals(dateKey, slot);
                    const key = `${dateKey}:${slot}`;
                    return (
                      <div key={slotLabel} className="p-2">
                        <div className="text-xs text-muted-foreground mb-1">{slotLabel}</div>
                        {openEditorKey === key ? (
                          <form className="flex gap-1 mb-2" onSubmit={(e) => handleQuickAdd(dateKey, slotLabel, e)}>
                            <input
                              name="item"
                              placeholder={`Add to ${slotLabel.toLowerCase()}...`}
                              className="flex-1 border px-2 py-1 bg-background"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                            />
                            <Button type="submit" variant="ghost" size="sm">Save</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setOpenEditorKey(null)}>Cancel</Button>
                          </form>
                        ) : (
                          <div className="mb-2">
                            <Button variant="ghost" size="sm" onClick={() => setOpenEditorKey(key)}>+ Add</Button>
                          </div>
                        )}
                        <ul className="space-y-1">
                          {items.map(item => (
                            <li key={item.id} className="group flex items-center justify-between text-sm">
                              <span className="truncate pr-2">{item.name}</span>
                              <Button
                                variant="ghost"
                                onClick={() => removeMeal(dateKey, slot, item.id)}
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove"
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;


