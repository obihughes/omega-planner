'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MEALS_NOTES_STORAGE_KEY,
  MealsNotesStorage,
} from '@/utils/mealsNotesStorage';

const DEBOUNCE_MS = 400;

export function useMealsNotes() {
  const [text, setText] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(MealsNotesStorage.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      MealsNotesStorage.save(text);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, hydrated]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key && e.key !== MEALS_NOTES_STORAGE_KEY) return;
      setText(MealsNotesStorage.load());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setNotes = useCallback((value: string) => {
    setText(value);
  }, []);

  return {
    text,
    setNotes,
    hydrated,
  };
}
