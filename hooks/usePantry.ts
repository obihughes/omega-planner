'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PantryItem } from '@/types/pantry';
import { buildNormalizedNameSet, diffMissingNormalized } from '@/utils/ingredientUtils';
import { PantryStorage } from '@/utils/pantryStorage';
import { normalizeIngredientName } from '@/utils/ingredientUtils';
import { MealsBySlot, MealItem, MealSlot } from '@/types/meals';

function generateId() {
  return `pantry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const initialLoadComplete = useRef(false);
  const lastSavedData = useRef<string>('');

  useEffect(() => {
    console.log('🥫 usePantry: Loading initial data from storage...');
    const loaded = PantryStorage.load();
    console.log('🥫 usePantry: Loaded initial data:', loaded);
    setItems(loaded);
    // Seed lastSavedData so first save effect doesn't overwrite with []
    lastSavedData.current = JSON.stringify(loaded);
    initialLoadComplete.current = true;
    console.log('🥫 usePantry: Initial load completed');
  }, []);

  useEffect(() => {
    console.log('🥫 usePantry: Save effect triggered with items:', items);
    if (!initialLoadComplete.current) {
      console.log('🥫 usePantry: Skipping save - not loaded yet');
      return;
    }
    
    // Prevent saving the same data multiple times
    const currentData = JSON.stringify(items);
    if (lastSavedData.current === currentData) {
      console.log('🥫 usePantry: Skipping save - data unchanged');
      return;
    }
    
    console.log('🥫 usePantry: Saving items to storage:', items);
    PantryStorage.save(items);
    lastSavedData.current = currentData;
    console.log('🥫 usePantry: Save completed');
  }, [items]);

  const addItem = useCallback((name: string, quantity?: string, category?: string) => {
    console.log('🥫 usePantry.addItem called with:', { name, quantity, category });
    const trimmedName = name.trim();
    if (!trimmedName) {
      console.log('🥫 usePantry.addItem: No name provided, returning null');
      return null;
    }
    const newQuantity = quantity?.trim() || undefined;
    const newCategory = category?.trim() || undefined;
    const now = new Date().toISOString();

    const normalized = normalizeIngredientName(trimmedName);
    const existing = items.find(i => normalizeIngredientName(i.name) === normalized) || null;

    if (existing) {
      const updated: PantryItem = {
        ...existing,
        name: trimmedName || existing.name,
        quantity: newQuantity ?? existing.quantity,
        category: newCategory ?? existing.category,
        updatedAt: now
      };
      console.log('🥫 usePantry.addItem: Updating existing item:', updated);
      setItems(prev => prev.map(i => i.id === existing.id ? updated : i));
      return updated;
    } else {
      const item: PantryItem = {
        id: generateId(),
        name: trimmedName,
        quantity: newQuantity,
        category: newCategory,
        createdAt: now,
        updatedAt: now
      };
      console.log('🥫 usePantry.addItem: Creating new item:', item);
      setItems(prev => [item, ...prev]);
      return item;
    }
  }, [items]);

  const removeItem = useCallback((id: string) => {
    console.log('🥫 usePantry.removeItem called with id:', id);
    setItems(prev => {
      const before = prev.length;
      const filtered = prev.filter(i => i.id !== id);
      console.log('🥫 usePantry.removeItem: Items before:', before, 'after:', filtered.length);
      return filtered;
    });
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<PantryItem, 'id'>>) => {
    console.log('🥫 usePantry.updateItem called with:', { id, updates });
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i);
      console.log('🥫 usePantry.updateItem: Updated items:', updated);
      return updated;
    });
  }, []);

  const itemNames = useMemo(() => new Set(items.map(i => i.name.toLowerCase())), [items]);
  const normalizedItemNames = useMemo(() => buildNormalizedNameSet(items.map(i => i.name)), [items]);

  function canCook(meal: MealItem): boolean {
    const req = (meal.ingredients || []).map(s => s);
    if (req.length === 0) return false;
    // Use normalized comparison
    return diffMissingNormalized(req, items.map(i => i.name)).length === 0;
  }

  function missingFor(meal: MealItem): string[] {
    const req = (meal.ingredients || []).map(s => s);
    return diffMissingNormalized(req, items.map(i => i.name));
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


