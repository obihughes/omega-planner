'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DailyLogEntry } from '@/types/dailyLog';
import {
  DAILY_LOG_STORAGE_KEY,
  DailyLogStorage,
} from '@/utils/dailyLogStorage';
import {
  addDaysToDateKey,
  dateFromDateKey,
  getTodayDateKey,
} from '@/utils/dateUtils';

const DEBOUNCE_MS = 500;

function sortByDateDesc(a: DailyLogEntry, b: DailyLogEntry): number {
  return b.date.localeCompare(a.date);
}

function sortByDateAsc(a: DailyLogEntry, b: DailyLogEntry): number {
  return a.date.localeCompare(b.date);
}

export function useDailyLog() {
  const [entries, setEntries] = useState<Record<string, DailyLogEntry>>({});
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipInitialSave = useRef(true);

  useEffect(() => {
    const data = DailyLogStorage.load();
    setEntries(data.entries);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      DailyLogStorage.save({ version: '1.0', entries, lastUpdated: '' });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [entries, hydrated]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== DAILY_LOG_STORAGE_KEY) return;
      const data = DailyLogStorage.load();
      setEntries(data.entries);
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const allEntries = useMemo(
    () => Object.values(entries).sort(sortByDateDesc),
    [entries]
  );

  const getEntry = useCallback(
    (date: string): DailyLogEntry | undefined => entries[date],
    [entries]
  );

  const upsertEntry = useCallback((date: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return null;

    const now = Date.now();
    let nextEntry: DailyLogEntry | null = null;

    setEntries((prev) => {
      const existing = prev[date];
      nextEntry = {
        date,
        dayOfWeek: dateFromDateKey(date).getDay(),
        content: trimmed,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      return { ...prev, [date]: nextEntry };
    });

    return nextEntry;
  }, []);

  const deleteEntry = useCallback((date: string) => {
    setEntries((prev) => {
      if (!prev[date]) return prev;
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }, []);

  const getEntriesForWeek = useCallback(
    (weekStartKey: string): DailyLogEntry[] => {
      const result: DailyLogEntry[] = [];
      for (let i = 0; i < 7; i += 1) {
        const date = addDaysToDateKey(weekStartKey, i);
        const entry = entries[date];
        if (entry) result.push(entry);
      }
      return result.sort(sortByDateAsc);
    },
    [entries]
  );

  const getEntriesByDayOfWeek = useCallback(
    (dayOfWeek: number): DailyLogEntry[] =>
      Object.values(entries)
        .filter((entry) => entry.dayOfWeek === dayOfWeek)
        .sort(sortByDateDesc),
    [entries]
  );

  return {
    entries,
    allEntries,
    hydrated,
    getEntry,
    upsertEntry,
    deleteEntry,
    getEntriesForWeek,
    getEntriesByDayOfWeek,
    todayDateKey: getTodayDateKey(),
  };
}
