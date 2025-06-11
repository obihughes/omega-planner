import { useState, useRef, useCallback } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistory = <T>(initialState: T): UseHistoryReturn<T> => {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const state = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const setState = useCallback((newState: T) => {
    if (newState === history.present) {
      return;
    }

    setHistory({
      past: [...history.past, history.present],
      present: newState,
      future: [], // Clear future on new state
    });
  }, [history.present, history.past]);

  const undo = useCallback(() => {
    if (!canUndo) {
      return;
    }

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    });
  }, [canUndo, history]);

  const redo = useCallback(() => {
    if (!canRedo) {
      return;
    }

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    });
  }, [canRedo, history]);

  const clear = useCallback(() => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, [initialState]);

  return { state, setState, undo, redo, clear, canUndo, canRedo };
}; 