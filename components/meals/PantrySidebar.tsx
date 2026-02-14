'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePantryContext } from '@/app/context/PantryContext';
import { Input } from '@/components/ui/input';

export const PantrySidebar: React.FC = () => {
  const { items, addItem, removeItem, updateItem } = usePantryContext();
  const [inputName, setInputName] = useState('');
  const [inputQty, setInputQty] = useState('');
  const [inputCat, setInputCat] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editCat, setEditCat] = useState('');

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
            if (!name) return;
            addItem(name, qty, cat);
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
                        setEditingId(i.id); 
                        setEditName(i.name); 
                        setEditQty(i.quantity || ''); 
                        setEditCat(i.category || ''); 
                      }}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(i.id)}>Remove</Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PantrySidebar;


