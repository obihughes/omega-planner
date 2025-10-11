/**
 * Export all utility functions from a single entry point for cleaner imports
 */

// Storage utilities
export { default as TaskStorage } from './storage';
export type { DayViewSettings } from './storage';

// Goals storage
export { GoalsStorage } from './goalsStorage';

// Formatting utilities
export { formatTime, formatDuration } from './formatters';

// Date utilities
export * from './dateUtils';

// Task utilities
export * from './taskUtils'; 

// Ingredient utilities
export * from './ingredientUtils';

// Habits utilities
export { HabitsStorage } from './habitsStorage';

// Activities utilities
export { ActivitiesStorage, ActivitiesListStorage } from './activitiesStorage';
export type { ActivitiesByDate, ActivityItem } from './activitiesStorage';