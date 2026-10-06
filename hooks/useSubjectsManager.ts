'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TopicSubject, Topic, TopicStatus } from '@/types/subjects';
import { SubjectsStorage } from '@/utils/subjectsStorage';

export const SUBJECT_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'gray', 'slate', 'stone', 'zinc',
];

export type TopicProgress = { total: number; completed: number };

export function useSubjectsManager() {
  const [subjects, setSubjects] = useState<TopicSubject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const loadData = useCallback(() => {
    const data = SubjectsStorage.loadAll();
    setSubjects([...data.subjects].sort((a, b) => a.order - b.order));
    setTopics(data.topics);
  }, []);

  useEffect(() => {
    loadData();
    setHydrated(true);
  }, [loadData]);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedSubjectId && subjects.some((s) => s.id === selectedSubjectId)) return;
    setSelectedSubjectId(subjects[0]?.id ?? null);
  }, [hydrated, subjects, selectedSubjectId]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId) ?? null,
    [subjects, selectedSubjectId]
  );

  const selectedTopics = useMemo(
    () =>
      topics
        .filter((t) => t.subjectId === selectedSubjectId)
        .sort((a, b) => a.order - b.order),
    [topics, selectedSubjectId]
  );

  const progressBySubject = useMemo(() => {
    const map: Record<string, TopicProgress> = {};
    for (const t of topics) {
      if (!map[t.subjectId]) map[t.subjectId] = { total: 0, completed: 0 };
      const entry = map[t.subjectId];
      entry.total += 1;
      if (t.status === 'completed') entry.completed += 1;
    }
    return map;
  }, [topics]);

  const addSubject = useCallback(
    (name: string, color?: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const colorValue = color ?? SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
      const created = SubjectsStorage.addSubject({ name: trimmed, color: colorValue });
      loadData();
      setSelectedSubjectId(created.id);
    },
    [subjects.length, loadData]
  );

  const updateSubject = useCallback(
    (id: string, updates: Partial<Pick<TopicSubject, 'name' | 'color'>>) => {
      SubjectsStorage.updateSubject(id, updates);
      loadData();
    },
    [loadData]
  );

  const removeSubject = useCallback(
    (id: string) => {
      SubjectsStorage.removeSubject(id);
      loadData();
    },
    [loadData]
  );

  const addTopic = useCallback(
    (subjectId: string, title: string, status: TopicStatus = 'not-started', notes = '') => {
      if (!title.trim()) return;
      SubjectsStorage.addTopic({ subjectId, title, status, notes });
      loadData();
    },
    [loadData]
  );

  const updateTopic = useCallback(
    (id: string, updates: Partial<Pick<Topic, 'title' | 'status' | 'notes'>>) => {
      SubjectsStorage.updateTopic(id, updates);
      loadData();
    },
    [loadData]
  );

  const removeTopic = useCallback(
    (id: string) => {
      SubjectsStorage.removeTopic(id);
      loadData();
    },
    [loadData]
  );

  return {
    hydrated,
    subjects,
    topics,
    selectedSubjectId,
    selectedSubject,
    selectedTopics,
    progressBySubject,
    selectSubject: setSelectedSubjectId,
    addSubject,
    updateSubject,
    removeSubject,
    addTopic,
    updateTopic,
    removeTopic,
  };
}
