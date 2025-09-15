'use client';

import { ReactNode, useReducer, useEffect } from 'react';
import { PlannerContext } from './PlannerContext';
import { plannerReducer, initialState } from './plannerReducer';
import TaskStorage from '@/utils/storage';

interface PlannerProviderProps {
  children: ReactNode;
}

/**
 * The provider component that makes the planner's state and dispatch function
 * available to all of its children. It also handles loading initial data.
 */
export function PlannerProvider({ children }: PlannerProviderProps) {
  const [state, dispatch] = useReducer(plannerReducer, initialState);

  // Load initial state from localStorage on component mount
  useEffect(() => {
    const loadedTasks = TaskStorage.load();
    const loadedBacklogTasks = TaskStorage.loadPoolTasks();
    const loadedBacklogTasksByDate = TaskStorage.loadPoolTasksByDate();
    const loadedPinnedTasks = TaskStorage.loadPinnedTasks();

    dispatch({
      type: 'SET_INITIAL_STATE',
      payload: {
        tasks: loadedTasks || [],
        backlogTasks: loadedBacklogTasks || [],
        datedBacklogTasks: loadedBacklogTasksByDate || new Map(),
        pinnedTasks: loadedPinnedTasks || [],
      },
    });
  }, []);

  // Here we can add other effects, for example, to save state to localStorage
  // whenever it changes.

  return (
    <PlannerContext.Provider value={{ state, dispatch }}>
      {children}
    </PlannerContext.Provider>
  );
} 