import TaskStorage from './storage';
import { Task } from '../components/planner/DailyPlanner';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('TaskStorage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save valid tasks to localStorage', () => {
      const tasks: Task[] = [
        {
          id: '1',
          name: 'Test Task',
          startHour: 9,
          duration: 1,
          dayOffset: 0,
          color: 'bg-blue-200'
        }
      ];

      TaskStorage.save(tasks);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'daily-planner-tasks',
        expect.stringContaining('Test Task')
      );
    });

    it('should filter out invalid tasks', () => {
      const tasks = [
        {
          id: '1',
          name: 'Valid Task',
          startHour: 9,
          duration: 1,
          dayOffset: 0
        },
        {
          id: '2',
          name: 'Invalid Task',
          startHour: 25, // Invalid hour
          duration: 1,
          dayOffset: 0
        }
      ];

      TaskStorage.save(tasks as Task[]);

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.tasks).toHaveLength(1);
      expect(savedData.tasks[0].name).toBe('Valid Task');
    });
  });

  describe('load', () => {
    it('should load valid tasks from localStorage', () => {
      const savedData = {
        version: '1.0',
        tasks: [
          {
            id: '1',
            name: 'Test Task',
            startHour: 9,
            duration: 1,
            dayOffset: 0,
            color: 'bg-blue-200'
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const loadedTasks = TaskStorage.load();
      expect(loadedTasks).toHaveLength(1);
      expect(loadedTasks[0].name).toBe('Test Task');
    });

    it('should return empty array if no data is found', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const loadedTasks = TaskStorage.load();
      expect(loadedTasks).toHaveLength(0);
    });

    it('should filter out invalid tasks when loading', () => {
      const savedData = {
        version: '1.0',
        tasks: [
          {
            id: '1',
            name: 'Valid Task',
            startHour: 9,
            duration: 1,
            dayOffset: 0
          },
          {
            id: '2',
            name: 'Invalid Task',
            startHour: 25, // Invalid hour
            duration: 1,
            dayOffset: 0
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const loadedTasks = TaskStorage.load();
      expect(loadedTasks).toHaveLength(1);
      expect(loadedTasks[0].name).toBe('Valid Task');
    });
  });

  describe('clear', () => {
    it('should clear localStorage', () => {
      TaskStorage.clear();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('daily-planner-tasks');
    });
  });

  describe('getLastUpdateTime', () => {
    it('should return last update time', () => {
      const testTime = new Date().toISOString();
      const savedData = {
        version: '1.0',
        tasks: [],
        lastUpdated: testTime
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      const lastUpdateTime = TaskStorage.getLastUpdateTime();
      expect(lastUpdateTime).toBe(testTime);
    });

    it('should return null if no data is found', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const lastUpdateTime = TaskStorage.getLastUpdateTime();
      expect(lastUpdateTime).toBeNull();
    });
  });
}); 