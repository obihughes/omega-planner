'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useShoppingContext } from '@/app/context/ShoppingContext';

export const ShoppingListSidebar: React.FC = () => {
  const { items, add, remove, toggle, clearChecked } = useShoppingContext();
  const [inputValue, setInputValue] = useState('');

  return (
    <Card className="border bg-card">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-sm font-medium">Shopping List</div>
      </div>
      <CardContent className="p-3 space-y-3">
        <div>
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


