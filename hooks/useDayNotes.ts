'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DAY_NOTES_STORAGE_KEY,
  DayNotesMap,
  DayNotesStorage,
} from '@/utils/dayNotesStorage';

const DEBOUNCE_MS = 400;

export function useDayNotes() {
  const [notesByDate, setNotesByDate] = useState<DayNotesMap>({});
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotesByDate(DayNotesStorage.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      DayNotesStorage.save(notesByDate);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [notesByDate, hydrated]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== DAY_NOTES_STORAGE_KEY) return;
      setNotesByDate(DayNotesStorage.load());
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getNotes = useCallback(
    (dateKey: string) => notesByDate[dateKey] ?? '',
    [notesByDate]
  );

  const setNotes = useCallback((dateKey: string, text: string) => {
    setNotesByDate((prev) => {
      const next = { ...prev };
      if (!text.trim()) {
        delete next[dateKey];
      } else {
        next[dateKey] = text;
      }
      return next;
    });
  }, []);

  const deleteNotes = useCallback(
    (dateKey: string) => {
      setNotes(dateKey, '');
    },
    [setNotes]
  );

  const hasNotes = useCallback(
    (dateKey: string) => Boolean(notesByDate[dateKey]?.trim()),
    [notesByDate]
  );

  const flushNotes = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    DayNotesStorage.save(notesByDate);
  }, [notesByDate]);

  return {
    getNotes,
    setNotes,
    deleteNotes,
    hasNotes,
    flushNotes,
    hydrated,
    notesByDate,
  };
}
