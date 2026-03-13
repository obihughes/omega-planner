'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Subject, StudyTask } from '@/types/study';
import { StudyStorage } from '@/utils/studyStorage';
import { getTodayDateKey } from '@/utils/dateUtils';

function getMondayStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const SUBJECT_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'gray', 'slate', 'stone', 'zinc',
];

export function useStudyTracker() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const loadData = useCallback(() => {
    const data = StudyStorage.loadAll();
    setSubjects(data.subjects.sort((a, b) => a.order - b.order));
    setStudyTasks(data.studyTasks);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const targetMonday = new Date(today);
    targetMonday.setDate(today.getDate() + weekOffset * 7);
    const mondayStart = getMondayStart(targetMonday);
    const days: { date: Date; dateKey: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayStart);
      d.setDate(mondayStart.getDate() + i);
      d.setHours(12, 0, 0, 0);
      days.push({ date: d, dateKey: toDateKey(d) });
    }
    return days;
  }, [weekOffset]);

  const twoWeekDays = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const targetMonday = new Date(today);
    targetMonday.setDate(today.getDate() + weekOffset * 7);
    const mondayStart = getMondayStart(targetMonday);
    const days: { date: Date; dateKey: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(mondayStart);
      d.setDate(mondayStart.getDate() + i);
      d.setHours(12, 0, 0, 0);
      days.push({ date: d, dateKey: toDateKey(d) });
    }
    return days;
  }, [weekOffset]);

  const todayKey = getTodayDateKey();

  const getTasksForDate = useCallback(
    (dateKey: string): StudyTask[] => {
      return studyTasks.filter((t) => t.dateKey === dateKey);
    },
    [studyTasks]
  );

  const addTask = useCallback(
    (subjectId: string, dateKey: string, title: string) => {
      StudyStorage.addTask({ subjectId, dateKey, title, done: false });
      loadData();
    },
    [loadData]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Pick<StudyTask, 'title' | 'done' | 'dateKey' | 'subjectId'>>) => {
      StudyStorage.updateTask(id, updates);
      loadData();
    },
    [loadData]
  );

  const removeTask = useCallback(
    (id: string) => {
      StudyStorage.removeTask(id);
      loadData();
    },
    [loadData]
  );

  const toggleTask = useCallback(
    (id: string) => {
      StudyStorage.toggleTask(id);
      loadData();
    },
    [loadData]
  );

  const moveTask = useCallback(
    (taskId: string, toDateKey: string) => {
      StudyStorage.moveTask(taskId, toDateKey);
      loadData();
    },
    [loadData]
  );

  const addSubject = useCallback((name: string, color?: string) => {
    const colorValue = color ?? SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    StudyStorage.addSubject({ name: name.trim(), color: colorValue });
    loadData();
  }, [subjects.length, loadData]);

  const updateSubject = useCallback((id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>) => {
    StudyStorage.updateSubject(id, updates);
    loadData();
  }, [loadData]);

  const removeSubject = useCallback((id: string) => {
    StudyStorage.removeSubject(id);
    loadData();
  }, [loadData]);

  const goToPreviousWeek = useCallback(() => setWeekOffset((p) => p - 1), []);
  const goToNextWeek = useCallback(() => setWeekOffset((p) => p + 1), []);
  const goToCurrentWeek = useCallback(() => setWeekOffset(0), []);

  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = weekDays[0].date;
    const end = weekDays[6].date;
    const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (start.getMonth() === end.getMonth()) {
      return `${startStr}–${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${startStr} – ${endStr}`;
  }, [weekDays]);

  const twoWeekRangeLabel = useMemo(() => {
    if (twoWeekDays.length === 0) return '';
    const start = twoWeekDays[0].date;
    const end = twoWeekDays[13].date;
    const startMonth = start.toLocaleDateString(undefined, { month: 'short' });
    const endMonth = end.toLocaleDateString(undefined, { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    const year = end.getFullYear();
    if (start.getMonth() === end.getMonth()) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }, [twoWeekDays]);

  return {
    subjects,
    studyTasks,
    weekDays,
    twoWeekDays,
    todayKey,
    weekOffset,
    getTasksForDate,
    addTask,
    updateTask,
    removeTask,
    toggleTask,
    moveTask,
    addSubject,
    updateSubject,
    removeSubject,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    weekRangeLabel,
    twoWeekRangeLabel,
    loadData,
    SUBJECT_COLORS,
  };
}
