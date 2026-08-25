'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { arrayMove } from '@dnd-kit/sortable';
import { TodoItem } from '@/types/todo';
import { TodoStorage } from '@/utils/todoStorage';

const STORAGE_KEY = 'omega-planner-todo-v1';

function sortItems(items: TodoItem[]): TodoItem[] {
  const active = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done);
  const byUpdatedDesc = (a: TodoItem, b: TodoItem) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  return [...active, ...completed.sort(byUpdatedDesc)];
}

function reorderActiveItems(
  items: TodoItem[],
  activeId: string,
  overId: string
): TodoItem[] {
  const activeItems = items.filter((i) => !i.done);
  const oldIndex = activeItems.findIndex((i) => i.id === activeId);
  const newIndex = activeItems.findIndex((i) => i.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items;
  const reordered = arrayMove(activeItems, oldIndex, newIndex);
  let next = 0;
  return items.map((item) => (item.done ? item : reordered[next++]));
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
      notes: '',
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [item, ...prev]);
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

  const reorderActive = useCallback((activeId: string, overId: string) => {
    setItems((prev) => reorderActiveItems(prev, activeId, overId));
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.done));
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, notes: notes.trim(), updatedAt: new Date().toISOString() }
          : i
      )
    );
  }, []);

  const hasCompleted = useMemo(() => items.some((i) => i.done), [items]);

  return {
    items: sortedItems,
    hydrated,
    add,
    remove,
    toggle,
    reorderActive,
    clearCompleted,
    updateNotes,
    hasCompleted,
  };
}
