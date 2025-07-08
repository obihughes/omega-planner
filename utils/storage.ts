// ===================================
// TASK STORAGE UTILITY
// ===================================

import { Task, PinnedTask } from '@/types/planner';

// Configuration
const STORAGE_KEY = 'daily-planner-tasks';
const POOL_STORAGE_KEY = 'daily-planner-pool-tasks'; // Legacy key name for backward compatibility
const POOL_TASKS_BY_DATE_KEY = 'daily-planner-pool-tasks-by-date'; // Legacy key name for backward compatibility
const PINNED_STORAGE_KEY = 'daily-planner-pinned-tasks';
const STORAGE_VERSION = '2.0'; // Bumped version for YYYY-MM-DD format
const DAY_VIEW_SETTINGS_KEY = 'daily-planner-day-view-settings';
const TASK_ID_COUNTER_KEY = 'daily-planner-task-id-counter';
const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

export interface DayViewSettings {
  topDayOffset: number;
  bottomDayOffset: number;
}

/**
 * Convert ISO date string to YYYY-MM-DD format for migration
 */
const migrateISOToDateKey = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    // If migration fails, default to today
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

// Task Storage utility
const TaskStorage = {
  /**
   * Saves the main tasks to localStorage.
   * Tasks are saved with baseDate in YYYY-MM-DD format.
   * Also handles de-duplication of tasks based on their IDs before saving.
   * @param {Task[]} tasks - The array of tasks to save.
   */
  save: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    
    // Log the tasks array being saved, especially looking for duplicate IDs

    const idCounts = tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.id] = (acc[task.id] || 0) + 1;
      return acc;
    }, {});
    const duplicates = Object.entries(idCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.warn('TaskStorage.save: Duplicate IDs found in tasks array about to be saved:', Object.fromEntries(duplicates));
      
      // Remove duplicates - keep the first occurrence of each ID
      const uniqueTasksMap = new Map<string, Task>();
      tasks.forEach(task => {
        if (!uniqueTasksMap.has(task.id)) {
          uniqueTasksMap.set(task.id, task);
        }
      });
      
      // Convert map back to array
      tasks = Array.from(uniqueTasksMap.values());

    }
    
    try {
      // Ensure every task has a baseDate in YYYY-MM-DD format
      const validatedTasks = tasks.map(task => {
        if (!task.baseDate) {
          // If task doesn't have baseDate, set to today
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return {
            ...task,
            baseDate: `${year}-${month}-${day}`
          };
        }
        
        // If it's an old ISO format, migrate it
        if (task.baseDate.includes('T')) {
          return {
            ...task,
            baseDate: migrateISOToDateKey(task.baseDate)
          };
        }
        
        return task;
      });
      
      const data = {
        version: STORAGE_VERSION,
        tasks: validatedTasks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    } catch (err) {
      console.error('Failed to save tasks to localStorage', err);
    }
  },
  
  /**
   * Loads the main tasks from localStorage.
   * Migrates old ISO date format to YYYY-MM-DD format if needed.
   * @returns {Task[] | null} The array of loaded tasks, or null if no data is found.
   */
  load: (): Task[] | null => {
    if (typeof window === 'undefined') return [];
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return null;

    try {
      const data = JSON.parse(savedData);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        console.error('Loaded data is invalid (tasks array missing or not an array): ', data);
        return [];
      }
      
      // Migrate tasks to new format if needed
      return data.tasks.map((task: any) => {
        // If task doesn't have baseDate, create one
        if (!task.baseDate) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return {
            ...task,
            baseDate: `${year}-${month}-${day}`
          };
        }
        
        // If it's an old ISO format, migrate it
        if (task.baseDate.includes('T')) {
          return {
            ...task,
            baseDate: migrateISOToDateKey(task.baseDate)
          };
        }
        
        // Already in correct format
        return task;
      });
    } catch (err) {
      console.error('Failed to parse tasks from localStorage. Data was: ', savedData, err);
      return [];
    }
  },
  
  /**
   * Saves the inbox tasks to localStorage.
   * Inbox tasks use YYYY-MM-DD format for baseDate.
   * @param {Task[]} poolTasks - The array of inbox tasks to save.
   */
  savePoolTasks: (poolTasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Ensure inbox tasks have correct date format
      const validatedTasks = poolTasks.map(task => {
        if (!task.baseDate) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return {
            ...task,
            baseDate: `${year}-${month}-${day}`
          };
        }
        
        // If it's an old ISO format, migrate it
        if (task.baseDate.includes('T')) {
          return {
            ...task,
            baseDate: migrateISOToDateKey(task.baseDate)
          };
        }
        
        return task;
      });
      
      const data = {
        version: STORAGE_VERSION,
        tasks: validatedTasks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(data));
      
    } catch (err) {
      console.error('Failed to save inbox tasks to localStorage', err);
    }
  },
  
  /**
   * Loads the pool tasks from localStorage.
   * Migrates old ISO date format to YYYY-MM-DD format if needed.
   * @returns {Task[] | null} The array of loaded pool tasks, or null if no data is found.
   */
  loadPoolTasks: (): Task[] | null => {
    if (typeof window === 'undefined') return [];
    const savedData = localStorage.getItem(POOL_STORAGE_KEY);
    if (!savedData) return null;

    try {
      const data = JSON.parse(savedData);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        console.error('Loaded inbox data is invalid (tasks array missing or not an array): ', data);
        return [];
      }
      
      // Migrate inbox tasks to new format if needed
      return data.tasks.map((task: any) => {
        if (!task.baseDate) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          return {
            ...task,
            baseDate: `${year}-${month}-${day}`
          };
        }
        
        // If it's an old ISO format, migrate it
        if (task.baseDate.includes('T')) {
          return {
            ...task,
            baseDate: migrateISOToDateKey(task.baseDate)
          };
        }
        
        return task;
      });
    } catch (err) {
      console.error('Failed to parse inbox tasks from localStorage. Data was: ', savedData, err);
      return [];
    }
  },

  // Save pinned tasks to localStorage
  savePinnedTasks: (pinnedTasks: PinnedTask[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        version: STORAGE_VERSION,
        tasks: pinnedTasks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(data));
      
    } catch (err) {
      console.error('Failed to save pinned tasks to localStorage', err);
    }
  },
  
  // Load pinned tasks from localStorage
  loadPinnedTasks: (): PinnedTask[] | null => {
    if (typeof window === 'undefined') return [];
    const savedData = localStorage.getItem(PINNED_STORAGE_KEY);
    if (!savedData) return null;

    try {
      const data = JSON.parse(savedData);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        console.error('Loaded pinned data is invalid (tasks array missing or not an array): ', data);
        return [];
      }
      // Convert dueDate strings back to Date objects with proper timezone handling
      return data.tasks.map((task: any) => {
        // Migrate old ISO format baseDate if needed
        let baseDate = task.baseDate;
        if (baseDate && baseDate.includes('T')) {
          baseDate = migrateISOToDateKey(baseDate);
        }
        
        // Reconstruct dueDate from baseDate and startHour to avoid timezone issues
        let dueDate: Date;
        if (baseDate && typeof task.startHour === 'number') {
          // Use dateFromDateKey for timezone-safe parsing
          const dateParts = baseDate.split('-').map(Number);
          const reconstructedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0);
          const hours = Math.floor(task.startHour);
          const minutes = Math.round((task.startHour - hours) * 60);
          reconstructedDate.setHours(hours, minutes, 0, 0);
          dueDate = reconstructedDate;
        } else {
          // Fallback: try to parse the stored dueDate (might have timezone issues)
          dueDate = new Date(task.dueDate);
        }
        
        return {
          ...task,
          baseDate,
          dueDate
        };
      });
    } catch (err) {
      console.error('Failed to parse pinned tasks from localStorage. Data was: ', savedData, err);
      return [];
    }
  },

  // Save day view settings to localStorage
  saveDayViewSettings: (settings: DayViewSettings): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DAY_VIEW_SETTINGS_KEY, JSON.stringify(settings));
      
    } catch (err) {
      console.error('Failed to save day view settings to localStorage', err);
    }
  },

  // Load day view settings from localStorage
  loadDayViewSettings: (): DayViewSettings | null => {
    if (typeof window === 'undefined') return null;
    const settings = localStorage.getItem(DAY_VIEW_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : null;
  },

  // Load next ID from localStorage
  loadNextId: (): number => {
    if (typeof window === 'undefined') return 0; // Default to 0 for SSR or if no storage
    const savedId = localStorage.getItem(TASK_ID_COUNTER_KEY);
    if (savedId) {
      const id = parseInt(savedId, 10);
      // If parsing fails or id is not a non-negative number, treat as not found, return 0
      return !isNaN(id) && id >= 0 ? id : 0; 
    }
    return 0; // Default to 0 if the key is not found at all
  },

  // Save next ID to localStorage
  saveNextId: (id: number): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TASK_ID_COUNTER_KEY, String(id));
    } catch (err) {
      console.error('Failed to save next ID to localStorage', err);
    }
  },

  /**
   * Saves inbox tasks by date to localStorage.
   * @param {Map<string, Task[]>} poolTasksByDate - Map of date strings to task arrays.
   */
  savePoolTasksByDate: (poolTasksByDate: Map<string, Task[]>): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Convert Map to object for JSON serialization
      const dataObject: { [key: string]: Task[] } = {};
      poolTasksByDate.forEach((tasks, dateKey) => {
        dataObject[dateKey] = tasks;
      });
      
      const data = {
        version: STORAGE_VERSION,
        poolTasksByDate: dataObject,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(POOL_TASKS_BY_DATE_KEY, JSON.stringify(data));
      
    } catch (err) {
      console.error('Failed to save inbox tasks by date to localStorage', err);
    }
  },

  /**
   * Loads pool tasks by date from localStorage.
   * @returns {Map<string, Task[]>} Map of date strings to task arrays.
   */
  loadPoolTasksByDate: (): Map<string, Task[]> => {
    if (typeof window === 'undefined') return new Map();
    const savedData = localStorage.getItem(POOL_TASKS_BY_DATE_KEY);
    if (!savedData) return new Map();

    try {
      const data = JSON.parse(savedData);
      if (!data.poolTasksByDate || typeof data.poolTasksByDate !== 'object') {
        console.error('Loaded inbox tasks by date is invalid: ', data);
        return new Map();
      }
      
      // Convert object back to Map
      const map = new Map<string, Task[]>();
      Object.entries(data.poolTasksByDate).forEach(([dateKey, tasks]) => {
        if (Array.isArray(tasks)) {
          map.set(dateKey, tasks as Task[]);
        }
      });
      
      return map;
    } catch (err) {
      console.error('Failed to parse inbox tasks by date from localStorage. Data was: ', savedData, err);
      return new Map();
    }
  },

  // Sidebar Collapsed State
  saveSidebarCollapsed: (isCollapsed: boolean): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(isCollapsed));
  },
  loadSidebarCollapsed: (): boolean | null => {
    if (typeof window === 'undefined') return null;
    const collapsedState = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return collapsedState ? JSON.parse(collapsedState) : null;
  }
};

export default TaskStorage; 