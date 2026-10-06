/**
 * Subjects page types (separate from Study Tracker)
 */

export type TopicStatus = 'not-started' | 'in-progress' | 'completed';

export const TOPIC_STATUSES: TopicStatus[] = ['not-started', 'in-progress', 'completed'];

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
};

export interface TopicSubject {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  status: TopicStatus;
  notes: string;
  order: number;
  createdAt: string;
}

export interface SubjectsStorageData {
  subjects: TopicSubject[];
  topics: Topic[];
}
