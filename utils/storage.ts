// ===================================
// TASK STORAGE UTILITY
// ===================================

import { Task, PinnedTask } from '@/types/planner';

// Configuration
const STORAGE_KEY = 'daily-planner-tasks';
const POOL_STORAGE_KEY = 'daily-planner-pool-tasks';
const PINNED_STORAGE_KEY = 'daily-planner-pinned-tasks';
const STORAGE_VERSION = '1.0';
const DAY_VIEW_SETTINGS_KEY = 'daily-planner-day-view-settings';
const TASK_ID_COUNTER_KEY = 'daily-planner-task-id-counter';

export interface DayViewSettings {
  topDayOffset: number;
  bottomDayOffset: number;
}

// Task Storage utility
const TaskStorage = {
  /**
   * Saves the main tasks to localStorage.
   * Ensures that all tasks have a 'baseDate' property, normalized to midnight UTC of that date.
   * This normalization is crucial for consistent date-based filtering and display.
   * Also handles de-duplication of tasks based on their IDs before saving.
   * @param {Task[]} tasks - The array of tasks to save.
   */
  save: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    
    // Log the tasks array being saved, especially looking for duplicate IDs
    console.log('TaskStorage.save: Attempting to save tasks:', JSON.stringify(tasks));
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
      console.log('TaskStorage.save: Filtered out duplicates. Saving unique tasks:', tasks.length);
    }
    
    try {
      // Ensure every task has a normalized baseDate (midnight of the day)
      const normalizedTasks = tasks.map(task => {
        if (!task.baseDate) {
          // If task doesn't have baseDate, set to midnight today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return {
            ...task,
            baseDate: today.toISOString()
          };
        }
        
        // If it has a baseDate, make sure it's normalized to midnight
        const baseDate = new Date(task.baseDate);
        baseDate.setHours(0, 0, 0, 0);
        return {
          ...task,
          baseDate: baseDate.toISOString()
        };
      });
      
      const data = {
        version: STORAGE_VERSION,
        tasks: normalizedTasks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Tasks saved successfully');
    } catch (err) {
      console.error('Failed to save tasks to localStorage', err);
    }
  },
  
  /**
   * Loads the main tasks from localStorage.
   * Ensures that all loaded tasks have a 'baseDate' property, normalized to midnight UTC.
   * If a task lacks a 'baseDate' or it's not normalized, it's adjusted.
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
      
      // Ensure all tasks have a normalized baseDate
      return data.tasks.map((task: any) => {
        // If task doesn't have baseDate, create one
        if (!task.baseDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return {
            ...task,
            baseDate: today.toISOString()
          };
        }
        
        // Normalize the existing baseDate to midnight
        const baseDate = new Date(task.baseDate);
        baseDate.setHours(0, 0, 0, 0);
        
        return {
          ...task,
          baseDate: baseDate.toISOString()
        };
      });
    } catch (err) {
      console.error('Failed to parse tasks from localStorage. Data was: ', savedData, err);
      return [];
    }
  },
  
  /**
   * Saves the pool tasks to localStorage.
   * Pool tasks are saved as-is without 'baseDate' normalization,
   * as their 'baseDate' is not typically used for scheduling while they are in the pool.
   * A 'baseDate' is still ensured for type consistency if one is missing upon load.
   * @param {Task[]} poolTasks - The array of pool tasks to save.
   */
  savePoolTasks: (poolTasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Pool tasks do not need baseDate normalization
      const data = {
        version: STORAGE_VERSION,
        tasks: poolTasks, // Save poolTasks as they are
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(data));
      console.log('Pool tasks saved successfully');
    } catch (err) {
      console.error('Failed to save pool tasks to localStorage', err);
    }
  },
  
  /**
   * Loads the pool tasks from localStorage.
   * Pool tasks are loaded as-is. While a 'baseDate' is ensured for type consistency
   * (defaulting to the current date at midnight if missing), it is not strictly normalized
   * here as its primary scheduling relevance comes when moved to the main timeline.
   * @returns {Task[] | null} The array of loaded pool tasks, or null if no data is found.
   */
  loadPoolTasks: (): Task[] | null => {
    if (typeof window === 'undefined') return [];
    const savedData = localStorage.getItem(POOL_STORAGE_KEY);
    if (!savedData) return null;

    try {
      const data = JSON.parse(savedData);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        console.error('Loaded pool data is invalid (tasks array missing or not an array): ', data);
        return [];
      }
      
      // Pool tasks are loaded as they are, without baseDate normalization
      return data.tasks.map((task: any) => ({
        ...task,
        // Ensure baseDate exists, if not, provide a default. This is for type safety.
        // It won't be used for scheduling if dayOffset indicates it's a pool task.
        baseDate: task.baseDate || new Date().toISOString() 
      }));
    } catch (err) {
      console.error('Failed to parse pool tasks from localStorage. Data was: ', savedData, err);
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
      console.log('Pinned tasks saved successfully');
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
      // Convert dueDate strings back to Date objects
      return data.tasks.map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate) 
      }));
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
      console.log('Day view settings saved successfully');
    } catch (err) {
      console.error('Failed to save day view settings to localStorage', err);
    }
  },

  // Load day view settings from localStorage
  loadDayViewSettings: (): DayViewSettings | null => {
    if (typeof window === 'undefined') return null;
    const savedData = localStorage.getItem(DAY_VIEW_SETTINGS_KEY);
    if (!savedData) return null;

    try {
      const settings = JSON.parse(savedData);
      // Basic validation
      if (typeof settings.topDayOffset !== 'number' || typeof settings.bottomDayOffset !== 'number') {
        console.error('Loaded day view settings are invalid: ', settings);
        return null;
      }
      return settings;
    } catch (err) {
      console.error('Failed to parse day view settings from localStorage. Data was: ', savedData, err);
      return null;
    }
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
  }
};

export default TaskStorage; 