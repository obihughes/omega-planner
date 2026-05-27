/**
 * Export all hooks from a single entry point for cleaner imports
 */

// Export the main daily planner hook and its type
export { useDailyPlanner } from './useDailyPlannerState';

// Export the modal manager hook and its types
export { 
  useModalManager,
  type ActiveModalTask,
  type CloneConfirmationData,
  type UseModalManagerProps,
  type ModalManagerState 
} from './useModalManager';

export { useMeals } from './useMeals';
export { useProjects } from './useProjects';