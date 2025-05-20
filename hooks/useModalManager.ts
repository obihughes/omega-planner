import { useState, useCallback } from 'react';
import { Task } from '../types/planner';

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
  period: 'morning' | 'afternoon' | 'evening';
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
  onCloneTasks: (sourceDayOffset: number, targetDayOffset: number) => void;
  
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
  
  /** The task currently being edited in the modal, or null if not visible */
  activeEditModalTask: ActiveModalTask | null;
  
  /** State for the color picker, or null if not visible */
  colorPickerState: { taskId: string; x: number; y: number } | null;
  
  // Edit Modal Functions
  /** Opens the edit modal for a task */
  openEditModal: (taskToEdit: Task, isFromPool?: boolean) => void;
  
  /** Closes the edit modal */
  closeEditModal: () => void;
  
  /** Saves changes made in the edit modal */
  saveTaskFromModal: (updatedTaskData: Partial<Task> & { id: string }) => void;
  
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
  setActiveEditModalTask: React.Dispatch<React.SetStateAction<ActiveModalTask | null>>;
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
  const [activeEditModalTask, setActiveEditModalTask] = useState<ActiveModalTask | null>(null);
  const [colorPickerState, setColorPickerState] = useState<{ taskId: string; x: number; y: number } | null>(null);

  /**
   * Opens the edit modal for a task
   * @param taskToEdit - The task to edit
   * @param isFromPool - Whether the task is from the pool
   */
  const openEditModal = useCallback((taskToEdit: Task, isFromPool: boolean = false) => {
    setActiveEditModalTask({ ...taskToEdit, isFromPool });
  }, []);

  /**
   * Closes the edit modal
   */
  const closeEditModal = useCallback(() => {
    setActiveEditModalTask(null);
  }, []);

  /**
   * Saves changes made in the edit modal
   * @param updatedTaskData - The updated task data
   */
  const saveTaskFromModal = useCallback((updatedTaskData: Partial<Task> & { id: string }) => {
    const { id, name, startHour, duration, color, dayOffset } = updatedTaskData;
    const taskToSave: Partial<Task> = {};
    if (name !== undefined) taskToSave.name = name;
    if (startHour !== undefined) taskToSave.startHour = startHour;
    if (duration !== undefined) taskToSave.duration = duration;
    if (color !== undefined) taskToSave.color = color;
    if (dayOffset !== undefined) taskToSave.dayOffset = dayOffset;

    if (activeEditModalTask?.isFromPool) {
      onUpdatePoolTask(id, taskToSave);
    } else {
      onUpdateTask(id, taskToSave);
    }
    closeEditModal();
  }, [activeEditModalTask, onUpdateTask, onUpdatePoolTask, closeEditModal]);

  /**
   * Toggles the color picker for a task
   * @param taskId - The ID of the task
   * @param e - The mouse event
   */
  const toggleColorPicker = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setColorPickerState(prevState => {
      if (prevState && prevState.taskId === taskId) {
        return null; // Close if already open for this task
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        return { taskId, x: rect.left, y: rect.bottom + 5 };
      }
    });
  }, []);

  /**
   * Applies a new color to a task
   * @param taskId - The ID of the task
   * @param newColor - The new color to apply
   */
  const handleTaskColorChange = useCallback((taskId: string, newColor: string) => {
    if (activeEditModalTask?.isFromPool && activeEditModalTask?.id === taskId) {
      onUpdatePoolTask(taskId, { color: newColor });
    } else {
      onUpdateTask(taskId, { color: newColor });
    }
    setColorPickerState(null); // Close color picker after selection
  }, [activeEditModalTask, onUpdateTask, onUpdatePoolTask]);

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
   * @param data - Data about which day and period to clone
   */
  const showCloneModal = useCallback((data: CloneConfirmationData) => {
    setShowCloneConfirmation(data);
  }, []);

  /**
   * Confirms cloning a day
   */
  const confirmCloneDay = useCallback(() => {
    if (showCloneConfirmation) {
      // Clone from the dayOffset in the confirmation to the top day
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
    activeEditModalTask,
    colorPickerState,

    // Edit Modal Functions
    openEditModal,
    closeEditModal,
    saveTaskFromModal,

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
    setActiveEditModalTask,
    setColorPickerState,
  };
} 