'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { TodoItem } from '@/types/todo';
import { TodoStorage } from '@/utils/todoStorage';

const STORAGE_KEY = 'omega-planner-todo-v1';

function sortItems(items: TodoItem[]): TodoItem[] {
  const active = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done);
  const byCreated = (a: TodoItem, b: TodoItem) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return [...active.sort(byCreated), ...completed.sort(byCreated)];
}

export function useTodo() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const skipInitialSave = useRef(true);

  useEffect(() => {
    setItems(TodoStorage.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    TodoStorage.save(items);
  }, [items]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key && e.key !== STORAGE_KEY) return;
      setItems(TodoStorage.load());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const sortedItems = useMemo(() => sortItems(items), [items]);

  const add = useCallback((title: string) => {
    const t = title.trim();
    if (!t) return null;
    const now = new Date().toISOString();
    const item: TodoItem = {
      id: nanoid(),
      title: t,
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [...prev, item]);
    return item;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, done: !i.done, updatedAt: new Date().toISOString() }
          : i
      )
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.done));
  }, []);

  const hasCompleted = useMemo(() => items.some((i) => i.done), [items]);

  return {
    items: sortedItems,
    hydrated,
    add,
    remove,
    toggle,
    clearCompleted,
    hasCompleted,
  };
}
