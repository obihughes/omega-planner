import { Task, PinnedTask } from '@/types/planner';

/**
 * Defines the shape of the planner's state.
 */
export interface PlannerState {
  tasks: Task[];
  backlogTasks: Task[];
  datedBacklogTasks: Map<string, Task[]>;
  pinnedTasks: PinnedTask[];
  // Add other state properties as we migrate them (e.g., UI state)
}

/**
 * Defines all possible actions that can be dispatched to modify the state.
 * We'll start with a simple one and expand this list.
 */
export type PlannerAction =
  | { type: 'SET_INITIAL_STATE'; payload: Partial<PlannerState> }
  | { type: 'ADD_TASK'; payload: { task: Task } };
  // More actions will be added here, like 'DELETE_TASK', 'UPDATE_TASK', etc.

/**
 * The initial state of the planner application.
 */
export const initialState: PlannerState = {
  tasks: [],
  backlogTasks: [],
  datedBacklogTasks: new Map(),
  pinnedTasks: [],
};

/**
 * The main reducer function for the planner. It takes the current state and an action,
 * and returns the new state. This function must be pure and have no side effects.
 * @param state - The current state.
 * @param action - The action to perform.
 * @returns The new state.
 */
export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return {
        ...state,
        ...action.payload,
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload.task],
      };

    // Other cases for different actions will go here

    default:
      return state;
  }
} 