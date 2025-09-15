'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePantry } from '@/hooks/usePantry';
import { useShopping } from '@/hooks/useShopping';
import { useMeals } from '@/hooks/useMeals';
import { MealSlot } from '@/types/meals';
import { Input } from '@/components/ui/input';

export const PantrySidebar: React.FC<{ dateKey: string }> = ({ dateKey }) => {
  const { items, addItem, removeItem, updateItem, canCook, missingFor } = usePantry();
  const { add: addToShopping } = useShopping();
  const { getMeals } = useMeals();
  const [inputName, setInputName] = useState('');
  const [inputQty, setInputQty] = useState('');
  const [inputCat, setInputCat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editCat, setEditCat] = useState('');

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
          <form className="grid grid-cols-5 gap-1 mb-2" onSubmit={(e) => {
            e.preventDefault();
            const name = inputName.trim();
            const qty = inputQty.trim();
            const cat = inputCat.trim();
            console.log('🥫 PantrySidebar: Form submitted with:', { name, qty, cat });
            if (!name) {
              console.log('🥫 PantrySidebar: Skipping - no name provided');
              return;
            }
            console.log('🥫 PantrySidebar: Calling addItem...');
            const result = addItem(name, qty, cat);
            console.log('🥫 PantrySidebar: addItem returned:', result);
            setInputName('');
            setInputQty('');
            setInputCat('');
          }}>
            <Input value={inputName} onChange={(e) => setInputName(e.target.value)} className="col-span-2" placeholder="Ingredient (e.g., eggs)" autoComplete="off" />
            <Input value={inputQty} onChange={(e) => setInputQty(e.target.value)} placeholder="Qty (e.g., 2 dozen)" autoComplete="off" />
            <Input value={inputCat} onChange={(e) => setInputCat(e.target.value)} placeholder="Category (e.g., Dairy)" autoComplete="off" />
            <Button type="submit" variant="ghost" size="sm">Add</Button>
          </form>
          <ul className="space-y-1">
            {items.map(i => (
              <li key={i.id} className="group text-sm">
                {editingId === i.id ? (
                  <form className="grid grid-cols-5 gap-1" onSubmit={(e) => { 
                    e.preventDefault(); 
                    const updates = { name: editName.trim() || i.name, quantity: editQty.trim() || undefined, category: editCat.trim() || undefined };
                    console.log('🥫 PantrySidebar: Updating item:', i.id, 'with:', updates);
                    updateItem(i.id, updates); 
                    setEditingId(null); 
                  }}>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-2" />
                    <Input value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                    <Input value={editCat} onChange={(e) => setEditCat(e.target.value)} />
                    <div className="flex gap-1">
                      <Button type="submit" variant="ghost" size="sm">Save</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2">
                      {i.name}{i.quantity ? ` (${i.quantity})` : ''}{i.category ? ` · ${i.category}` : ''}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button variant="ghost" size="sm" onClick={() => { 
                        console.log('🥫 PantrySidebar: Editing item:', i.id, i.name);
                        setEditingId(i.id); 
                        setEditName(i.name); 
                        setEditQty(i.quantity || ''); 
                        setEditCat(i.category || ''); 
                      }}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        console.log('🥫 PantrySidebar: Removing item:', i.id, i.name);
                        removeItem(i.id);
                      }}>Remove</Button>
                    </div>
                  </div>
                )}
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


