import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClassScheduleTask, Task } from '@/types/planner';
import { ClassScheduleStorage } from '@/utils/classScheduleStorage';
import { dateFromDateKey, getDateKey } from '@/utils/dateUtils';

export interface ClassScheduleDayMeta {
  /** JavaScript day-of-week (0 = Sunday ... 6 = Saturday) */
  dayOfWeek: number;
  /** Full label, e.g. \"Monday\" */
  label: string;
  /** Short label, e.g. \"Mon\" */
  shortLabel: string;
  /** Actual date used as a reference for this weekday in the current cycle */
  date: Date;
  /** Date key (YYYY-MM-DD) for the reference date */
  dateKey: string;
  /** Offset in days from today: date = today + dayOffset */
  dayOffset: number;
}

export interface UseClassScheduleStateResult {
  /** Metadata for each weekday, including the reference date and offset */
  weekMeta: ClassScheduleDayMeta[];
  /** Map keyed by dateKey used by timeline components */
  tasksByDate: Map<string, Task[]>;
  /** Underlying recurring class tasks stored by day-of-week */
  classTasks: ClassScheduleTask[];
  /** Upsert handler for saving from EditTaskModal */
  upsertFromModal: (task: Task, isNew?: boolean) => void;
  /** Delete handler for removing a class by id */
  deleteTaskById: (taskId: string) => void;
}

/**
 * Hook for managing the recurring class schedule state.
 *
 * Internally, tasks are stored by day-of-week (0 = Sunday ... 6 = Saturday)
 * using ClassScheduleStorage. For rendering, tasks are projected into a
 * Map keyed by reference dates for the current cycle so that existing
 * timeline components can be reused without impacting the main planner.
 */
export function useClassScheduleState(): UseClassScheduleStateResult {
  const [classTasks, setClassTasks] = useState<ClassScheduleTask[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = ClassScheduleStorage.load();
    setClassTasks(loaded);
  }, []);

  // Persist whenever tasks change
  useEffect(() => {
    ClassScheduleStorage.save(classTasks);
  }, [classTasks]);

  // Compute a stable "week" mapping each JS day-of-week to a concrete date
  const weekMeta: ClassScheduleDayMeta[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDow = today.getDay(); // 0 = Sunday ... 6 = Saturday

    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return dayLabels.map((label, dayOfWeek) => {
      const offset = ((dayOfWeek - todayDow) + 7) % 7; // 0..6 days from today
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dateKey = getDateKey(date);
      return {
        dayOfWeek,
        label,
        shortLabel: label.slice(0, 3),
        date,
        dateKey,
        dayOffset: offset,
      };
    });
  }, []);

  // Project recurring class tasks into a Task[] map keyed by reference dateKey
  const tasksByDate: Map<string, Task[]> = useMemo(() => {
    const map = new Map<string, Task[]>();

    weekMeta.forEach((meta) => {
      const dayTasks = classTasks.filter((t) => t.dayOfWeek === meta.dayOfWeek);

      const asPlannerTasks: Task[] = dayTasks.map((t) => ({
        id: t.id,
        name: t.name,
        startHour: t.startHour,
        duration: t.duration,
        color: t.color,
        baseDate: meta.dateKey,
        notes: t.notes,
        completed: t.completed,
        createdAt: t.createdAt,
      }));

      map.set(meta.dateKey, asPlannerTasks);
    });

    return map;
  }, [classTasks, weekMeta]);

  const upsertFromModal = useCallback((taskFromModal: Task, isNew?: boolean) => {
    // Determine day-of-week from the task's baseDate
    const baseDateKey = taskFromModal.baseDate;
    const date = dateFromDateKey(baseDateKey);
    const dayOfWeek = date.getDay(); // 0 = Sunday ... 6 = Saturday
    const nowIso = new Date().toISOString();

    setClassTasks((prev) => {
      const index = prev.findIndex((t) => t.id === taskFromModal.id);

      const common: ClassScheduleTask = {
        id: taskFromModal.id,
        name: taskFromModal.name,
        startHour: taskFromModal.startHour ?? 9,
        duration: taskFromModal.duration,
        color: taskFromModal.color,
        notes: taskFromModal.notes,
        completed: taskFromModal.completed ?? false,
        dayOfWeek,
        createdAt: undefined,
        updatedAt: undefined,
      };

      if (index === -1 || isNew) {
        return [
          ...prev,
          {
            ...common,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }

      const next = [...prev];
      const previous = next[index];
      next[index] = {
        ...previous,
        ...common,
        createdAt: previous.createdAt ?? nowIso,
        updatedAt: nowIso,
      };
      return next;
    });
  }, []);

  const deleteTaskById = useCallback((taskId: string) => {
    setClassTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return {
    weekMeta,
    tasksByDate,
    classTasks,
    upsertFromModal,
    deleteTaskById,
  };
}


