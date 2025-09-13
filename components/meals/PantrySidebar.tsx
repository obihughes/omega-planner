'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePantry } from '@/hooks/usePantry';
import { useShopping } from '@/hooks/useShopping';
import { useMeals } from '@/hooks/useMeals';
import { MealSlot } from '@/types/meals';

export const PantrySidebar: React.FC<{ dateKey: string }> = ({ dateKey }) => {
  const { items, addItem, removeItem, canCook, missingFor } = usePantry();
  const { add: addToShopping } = useShopping();
  const { getMeals } = useMeals();
  const [inputValue, setInputValue] = useState('');

  const todayMeals = useMemo(() => {
    const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
    return slots.flatMap(slot => getMeals(dateKey, slot));
  }, [dateKey, getMeals]);

  const cookableMeals = todayMeals.filter(m => canCook(m));
  const missingMeals = todayMeals
    .filter(m => (m.ingredients || []).length > 0 && !canCook(m))
    .map(m => ({ meal: m, missing: missingFor(m) }));

  return (
    <Card className="border bg-card">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-sm font-medium">Pantry</div>
      </div>
      <CardContent className="p-3 space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-2">Available Ingredients</div>
          <form className="flex gap-1 mb-2" onSubmit={(e) => {
            e.preventDefault();
            const val = inputValue.trim();
            if (!val) return;
            addItem(val);
            setInputValue('');
          }}>
            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="flex-1 border px-2 py-1 bg-background" placeholder="e.g., eggs" autoComplete="off" />
            <Button type="submit" variant="ghost" size="sm">Add</Button>
          </form>
          <ul className="space-y-1">
            {items.map(i => (
              <li key={i.id} className="group flex items-center justify-between text-sm">
                <span className="truncate pr-2">{i.name}</span>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => removeItem(i.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Cookable now (today)</div>
          <ul className="space-y-1">
            {cookableMeals.length === 0 && (
              <li className="text-sm text-muted-foreground">No meals are fully covered yet</li>
            )}
            {cookableMeals.map(m => (
              <li key={m.id} className="text-sm truncate">{m.name}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Almost there (missing items)</div>
          <ul className="space-y-2">
            {missingMeals.length === 0 && (
              <li className="text-sm text-muted-foreground">Nothing missing for today's planned meals</li>
            )}
            {missingMeals.map(({ meal, missing }) => (
              <li key={meal.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{meal.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => missing.forEach(n => addToShopping(n))}>Add missing</Button>
                </div>
                <div className="text-xs text-muted-foreground truncate">Missing: {missing.join(', ')}</div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PantrySidebar;


