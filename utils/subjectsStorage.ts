import { TopicSubject, Topic, TopicStatus, SubjectsStorageData, TOPIC_STATUSES } from '@/types/subjects';
import { nanoid } from 'nanoid';

export const SUBJECTS_STORAGE_KEY = 'omega-planner-subjects-v1';

function emptyData(): SubjectsStorageData {
  return { subjects: [], topics: [] };
}

function cleanSubject(s: any): TopicSubject | null {
  if (!s || typeof s !== 'object') return null;
  const id = String(s?.id ?? '').trim();
  if (!id) return null;
  return {
    id,
    name: String(s?.name ?? '').trim(),
    color: typeof s?.color === 'string' ? s.color : 'gray',
    order: typeof s?.order === 'number' ? s.order : 0,
  };
}

function cleanTopic(t: any): Topic | null {
  if (!t || typeof t !== 'object') return null;
  const id = String(t?.id ?? '').trim();
  const subjectId = String(t?.subjectId ?? '').trim();
  if (!id || !subjectId) return null;
  const status: TopicStatus = TOPIC_STATUSES.includes(t?.status) ? t.status : 'not-started';
  return {
    id,
    subjectId,
    title: String(t?.title ?? '').trim(),
    status,
    notes: String(t?.notes ?? ''),
    order: typeof t?.order === 'number' ? t.order : 0,
    createdAt: String(t?.createdAt ?? new Date().toISOString()),
  };
}

function loadRaw(): SubjectsStorageData {
  if (typeof window === 'undefined') return emptyData();
  const raw = localStorage.getItem(SUBJECTS_STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid');
    const subjects = Array.isArray(parsed.subjects)
      ? (parsed.subjects as any[]).map(cleanSubject).filter((s): s is TopicSubject => s !== null)
      : [];
    const subjectIds = new Set(subjects.map((s) => s.id));
    const topics = Array.isArray(parsed.topics)
      ? (parsed.topics as any[])
          .map(cleanTopic)
          .filter((t): t is Topic => t !== null && subjectIds.has(t.subjectId))
      : [];
    return { subjects, topics };
  } catch (e) {
    console.error('Failed to load subjects storage', e);
    return emptyData();
  }
}

function save(data: SubjectsStorageData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save subjects storage', e);
  }
}

export const SubjectsStorage = {
  loadAll(): SubjectsStorageData {
    return loadRaw();
  },

  // Subjects
  addSubject(subject: Pick<TopicSubject, 'name' | 'color'>): TopicSubject {
    const data = loadRaw();
    const maxOrder = data.subjects.reduce((m, s) => Math.max(m, s.order), -1);
    const newSubject: TopicSubject = {
      id: nanoid(),
      name: subject.name.trim(),
      color: subject.color,
      order: maxOrder + 1,
    };
    data.subjects.push(newSubject);
    save(data);
    return newSubject;
  },

  updateSubject(id: string, updates: Partial<Pick<TopicSubject, 'name' | 'color'>>): TopicSubject | null {
    const data = loadRaw();
    const idx = data.subjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = { ...data.subjects[idx], ...updates };
    if (updates.name !== undefined) updated.name = String(updates.name).trim();
    data.subjects[idx] = updated;
    save(data);
    return updated;
  },

  removeSubject(id: string): void {
    const data = loadRaw();
    data.subjects = data.subjects.filter((s) => s.id !== id);
    data.topics = data.topics.filter((t) => t.subjectId !== id);
    save(data);
  },

  // Topics
  addTopic(topic: Pick<Topic, 'subjectId' | 'title'> & Partial<Pick<Topic, 'status' | 'notes'>>): Topic | null {
    const data = loadRaw();
    if (!data.subjects.some((s) => s.id === topic.subjectId)) return null;
    const maxOrder = data.topics
      .filter((t) => t.subjectId === topic.subjectId)
      .reduce((m, t) => Math.max(m, t.order), -1);
    const newTopic: Topic = {
      id: nanoid(),
      subjectId: topic.subjectId,
      title: topic.title.trim(),
      status: topic.status ?? 'not-started',
      notes: topic.notes ?? '',
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    data.topics.push(newTopic);
    save(data);
    return newTopic;
  },

  updateTopic(id: string, updates: Partial<Pick<Topic, 'title' | 'status' | 'notes'>>): Topic | null {
    const data = loadRaw();
    const idx = data.topics.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated = { ...data.topics[idx], ...updates };
    if (updates.title !== undefined) updated.title = String(updates.title).trim();
    data.topics[idx] = updated;
    save(data);
    return updated;
  },

  removeTopic(id: string): void {
    const data = loadRaw();
    data.topics = data.topics.filter((t) => t.id !== id);
    save(data);
  },
};
