'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PantryItem } from '@/types/pantry';
import { PantryStorage } from '@/utils/pantryStorage';
import { normalizeIngredientName } from '@/utils/ingredientUtils';

function generateId() {
  return `pantry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const initialLoadComplete = useRef(false);
  const lastSavedData = useRef<string>('');

  useEffect(() => {
    const loaded = PantryStorage.load();
    setItems(loaded);
    lastSavedData.current = JSON.stringify(loaded);
    initialLoadComplete.current = true;
  }, []);

  // Sync across tabs/windows when localStorage changes
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key && e.key !== 'omega-planner-pantry') return;
      const next = PantryStorage.load();
      setItems(next);
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!initialLoadComplete.current) return;
    const currentData = JSON.stringify(items);
    if (lastSavedData.current === currentData) return;
    PantryStorage.save(items);
    lastSavedData.current = currentData;
  }, [items]);

  const addItem = useCallback((name: string, quantity?: string, category?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
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
      setItems(prev => [item, ...prev]);
      return item;
    }
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<Omit<PantryItem, 'id'>>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
  }, []);

  const itemNames = useMemo(() => new Set(items.map(i => i.name.toLowerCase())), [items]);

  return {
    items,
    addItem,
    removeItem,
    updateItem
  };
}


