// ===================================
// TASK STORAGE UTILITY
// ===================================

import { Task } from '@/types/planner';

// Configuration
const STORAGE_KEY = 'daily-planner-tasks';
const POOL_STORAGE_KEY = 'daily-planner-pool-tasks';
const STORAGE_VERSION = '1.0';

// Task Storage utility
const TaskStorage = {
  // Save tasks to localStorage
  save: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        version: STORAGE_VERSION,
        tasks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Tasks saved successfully');
    } catch (err) {
      console.error('Failed to save tasks to localStorage', err);
    }
  },
  
  // Load tasks from localStorage
  load: (): Task[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return [];
      
      const data = JSON.parse(savedData);
      
      // Simple validation
      if (!data.tasks || !Array.isArray(data.tasks)) {
        return [];
      }
      
      return data.tasks;
    } catch (err) {
      console.error('Failed to load tasks from localStorage', err);
      return [];
    }
  },
  
  // Save pool tasks to localStorage
  savePoolTasks: (poolTasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        version: STORAGE_VERSION,
        tasks: poolTasks,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(data));
      console.log('Pool tasks saved successfully');
    } catch (err) {
      console.error('Failed to save pool tasks to localStorage', err);
    }
  },
  
  // Load pool tasks from localStorage
  loadPoolTasks: (): Task[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const savedData = localStorage.getItem(POOL_STORAGE_KEY);
      if (!savedData) return [];
      
      const data = JSON.parse(savedData);
      
      // Simple validation
      if (!data.tasks || !Array.isArray(data.tasks)) {
        return [];
      }
      
      return data.tasks;
    } catch (err) {
      console.error('Failed to load pool tasks from localStorage', err);
      return [];
    }
  }
};

// Add this utility function
const formatDuration = (duration: number): string => {
  const hours = Math.floor(duration);
  const minutes = Math.round((duration - hours) * 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Export it along with the storage class
export { formatDuration };

export default TaskStorage; 