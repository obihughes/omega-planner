'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useShopping } from '@/hooks/useShopping';
import { useMeals } from '@/hooks/useMeals';
import { usePantry } from '@/hooks/usePantry';
import { MealSlot } from '@/types/meals';

export const ShoppingListSidebar: React.FC<{ dateKey: string }> = ({ dateKey }) => {
  const { items, add, remove, toggle, clearChecked } = useShopping();
  const { getMeals } = useMeals();
  const { missingFor } = usePantry();
  const [inputValue, setInputValue] = useState('');

  const missingToday = useMemo(() => {
    const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
    const meals = slots.flatMap(slot => getMeals(dateKey, slot));
    const all = meals.flatMap(m => missingFor(m));
    const seen = new Set<string>();
    const out: string[] = [];
    for (const name of all) {
      const key = name.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(name); }
    }
    return out;
  }, [dateKey, getMeals, missingFor]);

  return (
    <Card className="border bg-card">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-sm font-medium">Shopping List</div>
      </div>
      <CardContent className="p-3 space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-2">Add missing ingredients</div>
          <div className="flex flex-wrap gap-2">
            {missingToday.length === 0 && (
              <div className="text-sm text-muted-foreground">You're covered for today</div>
            )}
            {missingToday.map(n => (
              <Button key={n} variant="outline" size="sm" onClick={() => add(n)}>
                + {n}
              </Button>
            ))}
            {missingToday.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => missingToday.forEach(n => add(n))}>Add all</Button>
            )}
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">List</div>
            <Button variant="ghost" size="sm" onClick={clearChecked}>Clear checked</Button>
          </div>
          <form className="flex gap-1 mb-2" onSubmit={(e) => { e.preventDefault(); const v = inputValue.trim(); if (!v) return; add(v); setInputValue(''); }}>
            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="flex-1 border px-2 py-1 bg-background" placeholder="Add item..." autoComplete="off" />
            <Button type="submit" variant="ghost" size="sm">Add</Button>
          </form>
          <ul className="space-y-1">
            {items.map(i => (
              <li key={i.id} className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={!!i.checked} onChange={() => toggle(i.id)} />
                  <span className="truncate">{i.name}{i.quantity ? ` (${i.quantity})` : ''}</span>
                </label>
                <Button variant="ghost" size="sm" onClick={() => remove(i.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShoppingListSidebar;


