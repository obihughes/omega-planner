'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingItem } from '@/types/shopping';
import { ShoppingStorage } from '@/utils/shoppingStorage';

function nid() { return `shop_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

export function useShopping() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const loaded = useRef(false);

  useEffect(() => { setItems(ShoppingStorage.load()); loaded.current = true; }, []);
  useEffect(() => { if (loaded.current) ShoppingStorage.save(items); }, [items]);

  const add = useCallback((name: string, quantity?: string) => {
    const n = name.trim(); if (!n) return null;
    const now = new Date().toISOString();
    const item: ShoppingItem = { id: nid(), name: n, quantity: quantity?.trim() || undefined, checked: false, createdAt: now, updatedAt: now };
    setItems(prev => [item, ...prev]);
    return item;
  }, []);

  const remove = useCallback((id: string) => setItems(prev => prev.filter(i => i.id !== id)), []);
  const toggle = useCallback((id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked, updatedAt: new Date().toISOString() } : i)), []);
  const update = useCallback((id: string, updates: Partial<Omit<ShoppingItem, 'id'>>) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i)), []);
  const clearChecked = useCallback(() => setItems(prev => prev.filter(i => !i.checked)), []);

  return { items, add, remove, toggle, update, clearChecked };
}


