import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ClassScheduleTask } from '@/types/planner';
import { ClassScheduleStorage } from '@/utils/classScheduleStorage';

export interface UseClassScheduleOverlayResult {
  /** Returns the recurring classes that fall on the weekday of the given date, sorted by start time */
  getClassesForDate: (date: Date) => ClassScheduleTask[];
  /** Whether the dulled class overlay is shown on the Weekly View (persisted) */
  showClasses: boolean;
  /** Toggle the class overlay visibility (persisted to localStorage) */
  setShowClasses: (value: boolean) => void;
  /** False until localStorage has been read on the client (SSR-safe) */
  hydrated: boolean;
}

/**
 * Read-only view of the recurring class schedule for the Weekly View.
 *
 * Unlike `useClassScheduleState`, this hook never writes classes back to storage
 * and does not carry the class-schedule page's "show daily tasks" toggle. Classes
 * are loaded once after mount; edits happen on the Class Schedule page.
 */
export function useClassScheduleOverlay(): UseClassScheduleOverlayResult {
  // Start empty so SSR and the first client paint match (localStorage is client-only)
  const [classTasks, setClassTasks] = useState<ClassScheduleTask[]>([]);
  const [showClasses, setShowClassesState] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setClassTasks(ClassScheduleStorage.load());
    setShowClassesState(ClassScheduleStorage.getShowWeeklyClasses());
    setHydrated(true);
  }, []);

  // Group by day-of-week (0 = Sunday ... 6 = Saturday), sorted by start time
  const classesByDayOfWeek = useMemo(() => {
    const map = new Map<number, ClassScheduleTask[]>();
    for (const task of classTasks) {
      const list = map.get(task.dayOfWeek);
      if (list) list.push(task);
      else map.set(task.dayOfWeek, [task]);
    }
    map.forEach((list) => list.sort((a, b) => a.startHour - b.startHour));
    return map;
  }, [classTasks]);

  const getClassesForDate = useCallback(
    (date: Date): ClassScheduleTask[] => classesByDayOfWeek.get(date.getDay()) ?? [],
    [classesByDayOfWeek]
  );

  const setShowClasses = useCallback((value: boolean) => {
    setShowClassesState(value);
    ClassScheduleStorage.setShowWeeklyClasses(value);
  }, []);

  return { getClassesForDate, showClasses, setShowClasses, hydrated };
}
