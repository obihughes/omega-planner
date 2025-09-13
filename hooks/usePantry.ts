'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PantryItem } from '@/types/pantry';
import { PantryStorage } from '@/utils/pantryStorage';
import { MealsBySlot, MealItem, MealSlot } from '@/types/meals';

function generateId() {
  return `pantry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    const loaded = PantryStorage.load();
    setItems(loaded);
    initialLoadComplete.current = true;
  }, []);

  useEffect(() => {
    if (!initialLoadComplete.current) return;
    PantryStorage.save(items);
  }, [items]);

  const addItem = useCallback((name: string, quantity?: string, category?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const now = new Date().toISOString();
    const item: PantryItem = {
      id: generateId(),
      name: trimmed,
      quantity: quantity?.trim() || undefined,
      category: category?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };
    setItems(prev => [item, ...prev]);
    return item;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<PantryItem, 'id'>>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
  }, []);

  const itemNames = useMemo(() => new Set(items.map(i => i.name.toLowerCase())), [items]);

  function canCook(meal: MealItem): boolean {
    const req = (meal.ingredients || []).map(s => s.toLowerCase());
    if (req.length === 0) return false;
    return req.every(r => itemNames.has(r));
  }

  function missingFor(meal: MealItem): string[] {
    const req = (meal.ingredients || []).map(s => s.toLowerCase());
    return req.filter(r => !itemNames.has(r));
  }

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    canCook,
    missingFor
  };
}


