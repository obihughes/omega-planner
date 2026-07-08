import { DailyLogStorage } from './dailyLogStorage';

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

describe('DailyLogStorage', () => {
  beforeEach(() => {
    mockLocalStorage.store = {};
    jest.clearAllMocks();
  });

  it('returns empty data when nothing is stored', () => {
    const data = DailyLogStorage.load();
    expect(data.entries).toEqual({});
    expect(data.version).toBe('1.0');
  });

  it('persists and restores entries by date', () => {
    DailyLogStorage.save({
      version: '1.0',
      entries: {
        '2026-07-08': {
          date: '2026-07-08',
          dayOfWeek: 3,
          content: 'Productive Wednesday',
          createdAt: 1,
          updatedAt: 2,
        },
      },
      lastUpdated: '',
    });

    const loaded = DailyLogStorage.load();
    expect(loaded.entries['2026-07-08']?.content).toBe('Productive Wednesday');
    expect(loaded.entries['2026-07-08']?.dayOfWeek).toBe(3);
  });

  it('filters invalid entries and derives dayOfWeek from date', () => {
    mockLocalStorage.store['omega-planner-daily-log-v1'] = JSON.stringify({
      version: '1.0',
      entries: {
        '2026-07-09': { date: '2026-07-09', content: 'Valid entry' },
        bad: { date: 'not-a-date', content: 'skip me' },
      },
    });

    const loaded = DailyLogStorage.load();
    expect(Object.keys(loaded.entries)).toEqual(['2026-07-09']);
    expect(loaded.entries['2026-07-09']?.dayOfWeek).toBe(4);
  });
});
