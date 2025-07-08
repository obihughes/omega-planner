'use client';

import { createContext, useContext, Dispatch } from 'react';
import { PlannerState, PlannerAction } from './plannerReducer';

/**
 * Defines the shape of the context that will be provided to components.
 * It includes the current state and the dispatch function to send actions.
 */
export interface PlannerContextType {
  state: PlannerState;
  dispatch: Dispatch<PlannerAction>;
}

/**
 * The React Context object for the planner.
 * We provide a default value that throws an error to ensure it's only used
 * within a component wrapped by the PlannerProvider.
 */
export const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

/**
 * A custom hook to easily consume the PlannerContext.
 * This abstracts away the useContext call and provides better type safety
 * and a clear error message if used outside of the provider.
 * @returns The planner context value (state and dispatch).
 */
export function usePlannerContext() {
  const context = useContext(PlannerContext);
  if (context === undefined) {
    throw new Error('usePlannerContext must be used within a PlannerProvider');
  }
  return context;
} 