import { Subject, StudyEntry, StudyStorageData, StudyTask } from '@/types/study';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'omega-planner-study-v1';

function cleanTask(t: any): StudyTask | null {
  if (!t || typeof t !== 'object') return null;
  const id = String(t?.id ?? nanoid()).trim();
  const subjectId = String(t?.subjectId ?? '').trim();
  const dateKey = String(t?.dateKey ?? '').trim();
  const title = String(t?.title ?? '').trim();
  if (!id || !subjectId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  return {
    id,
    subjectId,
    dateKey,
    title,
    done: Boolean(t?.done),
    createdAt: String(t?.createdAt ?? new Date().toISOString()),
  };
}

function migrateEntriesToTasks(entries: StudyEntry[]): StudyTask[] {
  const tasks: StudyTask[] = [];
  const now = new Date().toISOString();
  for (const entry of entries) {
    const parts = entry.topics
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0 && entry.topics.trim()) {
      parts.push(entry.topics.trim());
    }
    for (const title of parts) {
      tasks.push({
        id: nanoid(),
        subjectId: entry.subjectId,
        dateKey: entry.dateKey,
        title,
        done: false,
        createdAt: now,
      });
    }
  }
  return tasks;
}

function loadRaw(): StudyStorageData {
  if (typeof window === 'undefined') {
    return { subjects: [], entries: [], studyTasks: [] };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { subjects: [], entries: [], studyTasks: [] };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid');
    const subjects = Array.isArray(parsed.subjects)
      ? (parsed.subjects as any[]).map(cleanSubject).filter(Boolean)
      : [];
    const entries = Array.isArray(parsed.entries)
      ? (parsed.entries as any[]).map(cleanEntry).filter(Boolean)
      : [];
    let studyTasks = Array.isArray(parsed.studyTasks)
      ? (parsed.studyTasks as any[]).map(cleanTask).filter(Boolean)
      : [];

    if (entries.length > 0 && studyTasks.length === 0) {
      studyTasks = migrateEntriesToTasks(entries);
      const migrated: StudyStorageData = { subjects, entries: [], studyTasks };
      save(migrated);
      return migrated;
    }

    return { subjects, entries, studyTasks };
  } catch (e) {
    console.error('Failed to load study storage', e);
    return { subjects: [], entries: [], studyTasks: [] };
  }
}

function save(data: StudyStorageData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save study storage', e);
  }
}

function cleanSubject(s: any): Subject | null {
  if (!s || typeof s !== 'object') return null;
  const id = String(s?.id ?? nanoid()).trim();
  const name = String(s?.name ?? '').trim();
  const color = typeof s?.color === 'string' ? s.color : 'gray';
  const order = typeof s?.order === 'number' ? s.order : 0;
  if (!id) return null;
  return { id, name, color, order };
}

function cleanEntry(e: any): StudyEntry | null {
  if (!e || typeof e !== 'object') return null;
  const id = String(e?.id ?? nanoid()).trim();
  const subjectId = String(e?.subjectId ?? '').trim();
  const dateKey = String(e?.dateKey ?? '').trim();
  if (!id || !subjectId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  return {
    id,
    subjectId,
    dateKey,
    topics: String(e?.topics ?? ''),
    updatedAt: String(e?.updatedAt ?? new Date().toISOString()),
  };
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const StudyStorage = {
  loadAll(): StudyStorageData {
    return loadRaw();
  },

  saveAll(data: StudyStorageData): void {
    save(data);
  },

  // Subjects
  addSubject(subject: Omit<Subject, 'id' | 'order'>): Subject {
    const data = loadRaw();
    const maxOrder = data.subjects.reduce((m, s) => Math.max(m, s.order), -1);
    const newSubject: Subject = {
      ...subject,
      id: nanoid(),
      order: maxOrder + 1,
    };
    data.subjects.push(newSubject);
    save(data);
    return newSubject;
  },

  updateSubject(id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>): Subject | null {
    const data = loadRaw();
    const idx = data.subjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = { ...data.subjects[idx], ...updates };
    if (updates.name !== undefined) updated.name = String(updates.name).trim();
    if (updates.color !== undefined) updated.color = String(updates.color);
    data.subjects[idx] = updated;
    save(data);
    return updated;
  },

  removeSubject(id: string): void {
    const data = loadRaw();
    data.subjects = data.subjects.filter((s) => s.id !== id);
    data.entries = data.entries.filter((e) => e.subjectId !== id);
    data.studyTasks = data.studyTasks.filter((t) => t.subjectId !== id);
    save(data);
  },

  reorderSubjects(orderedIds: string[]): void {
    const data = loadRaw();
    const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
    data.subjects = data.subjects
      .filter((s) => orderMap.has(s.id))
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      .map((s, i) => ({ ...s, order: i }));
    save(data);
  },

  // Entries
  getEntry(subjectId: string, dateKey: string): StudyEntry | null {
    const data = loadRaw();
    return data.entries.find((e) => e.subjectId === subjectId && e.dateKey === dateKey) ?? null;
  },

  upsertEntry(subjectId: string, dateKey: string, topics: string): StudyEntry {
    const data = loadRaw();
    const existing = data.entries.find((e) => e.subjectId === subjectId && e.dateKey === dateKey);
    const now = new Date().toISOString();
    if (existing) {
      existing.topics = topics;
      existing.updatedAt = now;
      save(data);
      return existing;
    }
    const newEntry: StudyEntry = {
      id: nanoid(),
      subjectId,
      dateKey,
      topics,
      updatedAt: now,
    };
    data.entries.push(newEntry);
    save(data);
    return newEntry;
  },

  removeEntry(subjectId: string, dateKey: string): void {
    const data = loadRaw();
    data.entries = data.entries.filter(
      (e) => !(e.subjectId === subjectId && e.dateKey === dateKey)
    );
    save(data);
  },

  // Study Tasks
  addTask(task: Omit<StudyTask, 'id' | 'createdAt'>): StudyTask {
    const data = loadRaw();
    const now = new Date().toISOString();
    const newTask: StudyTask = {
      ...task,
      id: nanoid(),
      createdAt: now,
    };
    data.studyTasks.push(newTask);
    save(data);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Pick<StudyTask, 'title' | 'done' | 'dateKey' | 'subjectId'>>): StudyTask | null {
    const data = loadRaw();
    const idx = data.studyTasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated = { ...data.studyTasks[idx], ...updates };
    data.studyTasks[idx] = updated;
    save(data);
    return updated;
  },

  removeTask(id: string): void {
    const data = loadRaw();
    data.studyTasks = data.studyTasks.filter((t) => t.id !== id);
    save(data);
  },

  toggleTask(id: string): StudyTask | null {
    const data = loadRaw();
    const idx = data.studyTasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    data.studyTasks[idx] = { ...data.studyTasks[idx], done: !data.studyTasks[idx].done };
    save(data);
    return data.studyTasks[idx];
  },

  getTasksForDate(dateKey: string): StudyTask[] {
    const data = loadRaw();
    return data.studyTasks.filter((t) => t.dateKey === dateKey);
  },

  getTasksForDateRange(startKey: string, endKey: string): StudyTask[] {
    const data = loadRaw();
    return data.studyTasks.filter((t) => t.dateKey >= startKey && t.dateKey <= endKey);
  },

  moveTask(taskId: string, toDateKey: string): StudyTask | null {
    return this.updateTask(taskId, { dateKey: toDateKey });
  },

  toDateKey,
};
