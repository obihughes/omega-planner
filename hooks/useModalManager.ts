import { useState, useCallback } from 'react';
import { Task } from '@/types/planner';

/**
 * Interface for modal-related task data
 * Extends the base Task type with additional properties needed for modals
 */
export interface ActiveModalTask extends Task {
  isFromPool?: boolean;
}

/**
 * Interface for clone confirmation modal data
 * Contains information about which day and period is being cloned
 */
export interface CloneConfirmationData {
  dayOffset: number;
  date: Date;
}

/**
 * Props that the useModalManager hook expects from the parent hook
 * Contains callbacks for various task operations
 */
export interface UseModalManagerProps {
  /** Callback to update a timeline task */
  onUpdateTask: (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;
  
  /** Callback to update a pool task */
  onUpdatePoolTask: (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;
  
  /** Callback to clear the task pool */
  onClearPool: () => void;
  
  /** Callback to clone tasks from one day to another */
  onCloneTasks: (fromDayOffset: number, toDayOffset: number) => void;
  
  /** The current top day offset to use as the target for cloning */
  topDayOffset: number;
}

/**
 * The return type of the useModalManager hook
 * Contains all modal states and functions for managing modals
 */
export interface ModalManagerState {
  // Modal visibility states
  /** Whether the clear pool confirmation modal is visible */
  showClearPoolConfirmation: boolean;
  
  /** Data for the clone confirmation modal, or null if not visible */
  showCloneConfirmation: CloneConfirmationData | null;
  
  /** State for the color picker, or null if not visible */
  colorPickerState: { taskId: string; x: number; y: number } | null;
  
  // Color Picker Functions
  /** Toggles the color picker for a task */
  toggleColorPicker: (taskId: string, e: React.MouseEvent) => void;
  
  /** Applies a new color to a task */
  handleTaskColorChange: (taskId: string, newColor: string) => void;
  
  // Clear Pool Modal Functions
  /** Shows the clear pool confirmation modal */
  showClearPoolModal: () => void;
  
  /** Confirms clearing the pool */
  confirmClearPool: () => void;
  
  /** Cancels clearing the pool */
  cancelClearPool: () => void;
  
  // Clone Day Modal Functions
  /** Shows the clone day confirmation modal */
  showCloneModal: (data: CloneConfirmationData) => void;
  
  /** Confirms cloning a day */
  confirmCloneDay: () => void;
  
  /** Cancels cloning a day */
  cancelCloneDay: () => void;
  
  // State Setters (if direct access is needed)
  setShowClearPoolConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCloneConfirmation: React.Dispatch<React.SetStateAction<CloneConfirmationData | null>>;
  setColorPickerState: React.Dispatch<React.SetStateAction<{ taskId: string; x: number; y: number } | null>>;
}

/**
 * Custom hook for managing all modal-related state and functionality
 * Centralizes modal management to keep the main planner hook cleaner
 * 
 * @param props - Configuration options and callbacks
 * @returns All modal states and functions
 */
export function useModalManager({
  onUpdateTask,
  onUpdatePoolTask,
  onClearPool,
  onCloneTasks,
  topDayOffset
}: UseModalManagerProps): ModalManagerState {
  // Modal visibility states
  const [showClearPoolConfirmation, setShowClearPoolConfirmation] = useState<boolean>(false);
  const [showCloneConfirmation, setShowCloneConfirmation] = useState<CloneConfirmationData | null>(null);
  const [colorPickerState, setColorPickerState] = useState<{ taskId: string; x: number; y: number } | null>(null);

  /**
   * Toggles the color picker for a task
   */
  const toggleColorPicker = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setColorPickerState(prevState => {
      if (prevState && prevState.taskId === taskId) {
        return null;
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        return { taskId, x: rect.left, y: rect.bottom + 5 };
      }
    });
  }, []);

  /**
   * Applies a new color to a task
   */
  const handleTaskColorChange = useCallback((taskId: string, newColor: string) => {
    onUpdateTask(taskId, { color: newColor });
    setColorPickerState(null);
  }, [onUpdateTask]);

  /**
   * Shows the clear pool confirmation modal
   */
  const showClearPoolModal = useCallback(() => {
    setShowClearPoolConfirmation(true);
  }, []);

  /**
   * Confirms clearing the pool
   */
  const confirmClearPool = useCallback(() => {
    onClearPool();
    setShowClearPoolConfirmation(false);
  }, [onClearPool]);

  /**
   * Cancels clearing the pool
   */
  const cancelClearPool = useCallback(() => {
    setShowClearPoolConfirmation(false);
  }, []);

  /**
   * Shows the clone day confirmation modal
   */
  const showCloneModal = useCallback((data: CloneConfirmationData) => {
    setShowCloneConfirmation(data);
  }, []);

  /**
   * Confirms cloning a day
   */
  const confirmCloneDay = useCallback(() => {
    if (showCloneConfirmation) {
      onCloneTasks(showCloneConfirmation.dayOffset, topDayOffset);
      setShowCloneConfirmation(null);
    }
  }, [showCloneConfirmation, onCloneTasks, topDayOffset]);

  /**
   * Cancels cloning a day
   */
  const cancelCloneDay = useCallback(() => {
    setShowCloneConfirmation(null);
  }, []);

  return {
    // States
    showClearPoolConfirmation,
    showCloneConfirmation,
    colorPickerState,

    // Color Picker Functions
    toggleColorPicker,
    handleTaskColorChange,

    // Clear Pool Modal Functions
    showClearPoolModal,
    confirmClearPool,
    cancelClearPool,

    // Clone Day Modal Functions
    showCloneModal,
    confirmCloneDay,
    cancelCloneDay,

    // State Setters (if direct access is needed)
    setShowClearPoolConfirmation,
    setShowCloneConfirmation,
    setColorPickerState,
  };
} 