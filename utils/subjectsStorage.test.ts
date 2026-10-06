let mockIdCounter = 0;
jest.mock('nanoid', () => ({ nanoid: () => `id-${++mockIdCounter}` }));

import { SubjectsStorage, SUBJECTS_STORAGE_KEY } from './subjectsStorage';

const mockLocalStorage: {
  store: Record<string, string>;
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
} = {
  store: {},
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('SubjectsStorage', () => {
  beforeEach(() => {
    mockLocalStorage.store = {};
    mockIdCounter = 0;
    jest.clearAllMocks();
  });

  it('returns empty data when nothing is stored', () => {
    expect(SubjectsStorage.loadAll()).toEqual({ subjects: [], topics: [] });
  });

  it('adds subjects with increasing order', () => {
    const a = SubjectsStorage.addSubject({ name: '  Math ', color: 'blue' });
    const b = SubjectsStorage.addSubject({ name: 'Physics', color: 'red' });
    expect(a).toMatchObject({ name: 'Math', order: 0 });
    expect(b.order).toBe(1);
    expect(SubjectsStorage.loadAll().subjects).toHaveLength(2);
  });

  it('adds, updates, and removes topics', () => {
    const subject = SubjectsStorage.addSubject({ name: 'Math', color: 'blue' });
    const topic = SubjectsStorage.addTopic({ subjectId: subject.id, title: 'Limits' });
    expect(topic).toMatchObject({ title: 'Limits', status: 'not-started', notes: '', order: 0 });

    SubjectsStorage.updateTopic(topic!.id, { status: 'completed', notes: 'Done' });
    expect(SubjectsStorage.loadAll().topics[0]).toMatchObject({ status: 'completed', notes: 'Done' });

    SubjectsStorage.removeTopic(topic!.id);
    expect(SubjectsStorage.loadAll().topics).toHaveLength(0);
  });

  it('rejects topics for unknown subjects', () => {
    expect(SubjectsStorage.addTopic({ subjectId: 'missing', title: 'X' })).toBeNull();
  });

  it('removing a subject removes its topics only', () => {
    const math = SubjectsStorage.addSubject({ name: 'Math', color: 'blue' });
    const bio = SubjectsStorage.addSubject({ name: 'Bio', color: 'green' });
    SubjectsStorage.addTopic({ subjectId: math.id, title: 'Limits' });
    SubjectsStorage.addTopic({ subjectId: bio.id, title: 'Cells' });

    SubjectsStorage.removeSubject(math.id);
    const data = SubjectsStorage.loadAll();
    expect(data.subjects.map((s) => s.id)).toEqual([bio.id]);
    expect(data.topics.map((t) => t.title)).toEqual(['Cells']);
  });

  it('cleans invalid records and orphaned topics on load', () => {
    mockLocalStorage.store[SUBJECTS_STORAGE_KEY] = JSON.stringify({
      subjects: [{ id: 's1', name: 'Math', color: 'blue', order: 0 }, null],
      topics: [
        { id: 't1', subjectId: 's1', title: 'Limits', status: 'bogus' },
        { id: 't2', subjectId: 'gone', title: 'Orphan' },
      ],
    });
    const data = SubjectsStorage.loadAll();
    expect(data.subjects).toHaveLength(1);
    expect(data.topics).toHaveLength(1);
    expect(data.topics[0].status).toBe('not-started');
  });

  it('returns empty data for corrupt JSON', () => {
    mockLocalStorage.store[SUBJECTS_STORAGE_KEY] = '{not json';
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(SubjectsStorage.loadAll()).toEqual({ subjects: [], topics: [] });
  });
});
