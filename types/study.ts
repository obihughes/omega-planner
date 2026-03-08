/**
 * Study Tracker types
 */

export interface Subject {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface StudyTask {
  id: string;
  subjectId: string;
  dateKey: string;
  title: string;
  done: boolean;
  createdAt: string;
}

/** @deprecated Used only for migration from entries to studyTasks */
export interface StudyEntry {
  id: string;
  subjectId: string;
  dateKey: string;
  topics: string;
  updatedAt: string;
}

export interface StudyStorageData {
  subjects: Subject[];
  /** @deprecated Migrated to studyTasks on first load */
  entries: StudyEntry[];
  studyTasks: StudyTask[];
}
