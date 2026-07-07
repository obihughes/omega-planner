import { ClassScheduleStorage } from './classScheduleStorage';

const mockLocalStorage: {
  store: Record<string, string>;
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
  removeItem: jest.Mock<void, [string]>;
} = {
  store: {},
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('ClassScheduleStorage showDailyTasks preference', () => {
  beforeEach(() => {
    mockLocalStorage.store = {};
    jest.clearAllMocks();
  });

  it('defaults to false when no preference is stored', () => {
    expect(ClassScheduleStorage.getShowDailyTasks()).toBe(false);
  });

  it('persists and restores the daily tasks overlay toggle', () => {
    ClassScheduleStorage.setShowDailyTasks(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'omega-planner-class-schedule-show-daily-tasks',
      'true'
    );
    expect(ClassScheduleStorage.getShowDailyTasks()).toBe(true);

    ClassScheduleStorage.setShowDailyTasks(false);
    expect(ClassScheduleStorage.getShowDailyTasks()).toBe(false);
  });

  it('returns false for invalid stored values', () => {
    mockLocalStorage.store['omega-planner-class-schedule-show-daily-tasks'] = 'not-json';
    expect(ClassScheduleStorage.getShowDailyTasks()).toBe(false);
  });
});
