import { useState, useCallback } from 'react';
import { Task } from '@/types/planner';
import { TASK_COLORS } from '@/lib/constants';

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
  period?: 'morning' | 'afternoon' | 'evening';
}

/**
 * Props that the useModalManager hook expects from the parent hook
 * Contains callbacks for various task operations
 */
export interface UseModalManagerProps {
  /** Callback to add a new task */
  onAddTask: (targetDate: Date, startHour: number, taskData: { name: string; duration: number; color: string }, dayOffset?: number) => void;

  /** Callback to update a timeline task */
  onUpdateTask: (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;
  
  /** Callback to update a pool task */
  onUpdatePoolTask: (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;
  
  /** Callback to clear the task pool */
  onClearPool: () => void;
  
  /** Callback to clone tasks from one calendar date to another */
  onCloneTasks: (sourceDate: Date, destinationDate: Date) => void;
  
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

  /** Data for the active task edit/create modal, or null if not visible */
  activeEditModalTask: ActiveModalTask | null;
  initialDayOffsetForModal?: number;
  initialStartHourForModal?: number;
  
  // Color Picker Functions
  /** Toggles the color picker for a task */
  toggleColorPicker: (taskId: string, e: React.MouseEvent) => void;
  
  /** Applies a new color to a task being edited or a task selected via color picker.
   * If `activeEditModalTask` has `isFromPool` true, it updates the pool task.
   * Otherwise, it updates the timeline task.
   * @param {string} taskId - The ID of the task to update.
   * @param {string} newColor - The new color to apply.
   */
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
  
  // Task Edit Modal Functions
  /** Opens the task edit/create modal.
   * If `task` is provided, it populates the modal for editing that task.
   * If `task` is not provided, it prepares the modal for creating a new task, 
   * potentially using `options.initialDayOffset` and `options.initialStartHour` as defaults.
   * The new task's `baseDate` is provisionally set based on `initialDayOffset` from today, 
   * and `dayOffset` to 0. This may be refined by TaskFormModal if a more specific target is known.
   * @param {Task} [task] - The task to edit. If undefined, prepares for new task creation.
   * @param {object} [options] - Options for opening the modal.
   * @param {boolean} [options.isFromPool] - Indicates if the task is from/for the task pool.
   * @param {number} [options.initialDayOffset] - Suggested day offset for a new task (e.g., from view).
   * @param {number} [options.initialStartHour] - Suggested start hour for a new task.
   */
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number }) => void;
  /** Closes the task edit/create modal */
  closeEditModal: () => void;
  /** Saves task data from the edit/create modal.
   * If `isNewTaskFlag` is true, it calls `onAddTask` with the task details.
   * The `taskDataFromForm` for a new task must include `baseDate` (as specific target date) and `name`.
   * `dayOffset` for `onAddTask` will be 0 as `baseDate` is specific.
   * If `isNewTaskFlag` is false, it calls `onUpdateTask` or `onUpdatePoolTask` based on `activeEditModalTask` context.
   * @param {Partial<Task>} taskDataFromForm - The task data from the form.
   * @param {boolean} isNewTaskFlag - True if saving a new task, false if updating an existing one.
   */
  saveTaskFromModal: (taskDataFromForm: Partial<Task>, isNewTaskFlag: boolean) => void;
  
  // State Setters (if direct access is needed)
  setShowClearPoolConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCloneConfirmation: React.Dispatch<React.SetStateAction<CloneConfirmationData | null>>;
  setColorPickerState: React.Dispatch<React.SetStateAction<{ taskId: string; x: number; y: number } | null>>;
  setActiveEditModalTask: React.Dispatch<React.SetStateAction<ActiveModalTask | null>>;
  setInitialDayOffsetForModal: React.Dispatch<React.SetStateAction<number | undefined>>;
  setInitialStartHourForModal: React.Dispatch<React.SetStateAction<number | undefined>>;
}

/**
 * Custom hook for managing all modal-related state and functionality
 * Centralizes modal management to keep the main planner hook cleaner
 * 
 * @param props - Configuration options and callbacks
 * @returns All modal states and functions
 */
export function useModalManager({
  onAddTask,
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
  const [activeEditModalTask, setActiveEditModalTask] = useState<ActiveModalTask | null>(null);
  const [initialDayOffsetForModal, setInitialDayOffsetForModal] = useState<number | undefined>(undefined);
  const [initialStartHourForModal, setInitialStartHourForModal] = useState<number | undefined>(undefined);

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
   * Applies a new color to a task being edited or a task selected via color picker.
   * If `activeEditModalTask` has `isFromPool` true, it updates the pool task.
   * Otherwise, it updates the timeline task.
   * @param {string} taskId - The ID of the task to update.
   * @param {string} newColor - The new color to apply.
   */
  const handleTaskColorChange = useCallback((taskId: string, newColor: string) => {
    // Determine if it's a pool task or timeline task based on activeEditModalTask or another source if needed
    // For now, assumes onUpdateTask can handle either, or this needs more context.
    // If activeEditModalTask is the source of truth for the modal:
    if (activeEditModalTask && activeEditModalTask.isFromPool) {
      onUpdatePoolTask(taskId, { color: newColor });
    } else {
      onUpdateTask(taskId, { color: newColor });
    }
    setColorPickerState(null); // Close picker after selection
  }, [onUpdateTask, onUpdatePoolTask, activeEditModalTask]);

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
      const sourceDate = showCloneConfirmation.date; // Source date from modal data

      // Calculate destinationDate based on topDayOffset, normalized to midnight
      const destinationDate = new Date(); // Start with today's date
      destinationDate.setHours(0, 0, 0, 0); // Normalize to midnight
      destinationDate.setDate(destinationDate.getDate() + topDayOffset); // Apply the offset

      onCloneTasks(sourceDate, destinationDate);
      setShowCloneConfirmation(null);
    }
  }, [showCloneConfirmation, onCloneTasks, topDayOffset]);

  /**
   * Cancels cloning a day
   */
  const cancelCloneDay = useCallback(() => {
    setShowCloneConfirmation(null);
  }, []);

  // --- Task Edit Modal Functions ---
  /**
   * Opens the task edit/create modal.
   * If `task` is provided, it populates the modal for editing that task.
   * If `task` is not provided, it prepares the modal for creating a new task, 
   * potentially using `options.initialDayOffset` and `options.initialStartHour` as defaults.
   * The new task's `baseDate` is provisionally set based on `initialDayOffset` from today, 
   * and `dayOffset` to 0. This may be refined by TaskFormModal if a more specific target is known.
   * @param {Task} [task] - The task to edit. If undefined, prepares for new task creation.
   * @param {object} [options] - Options for opening the modal.
   * @param {boolean} [options.isFromPool] - Indicates if the task is from/for the task pool.
   * @param {number} [options.initialDayOffset] - Suggested day offset for a new task (e.g., from view).
   * @param {number} [options.initialStartHour] - Suggested start hour for a new task.
   */
  const openEditModal = useCallback((task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number }) => {
    if (task) {
      setActiveEditModalTask({ 
        ...task,
        isFromPool: options?.isFromPool ?? false 
      });
    } else {
      // For a new task, create a default structure
      // The ID will be generated by the actual addTask function later
      // BaseDate needs to be the specific target date, dayOffset 0 relative to it.
      // This requires the caller of openEditModal to provide context for date.
      // For now, let's use initialDayOffset and initialStartHour with a placeholder baseDate (today).
      // This will need refinement based on how TaskFormModal provides the targetDate.
      const newBase = new Date();
      newBase.setHours(0,0,0,0);
      if (options?.initialDayOffset) {
        newBase.setDate(newBase.getDate() + options.initialDayOffset);
      }

      setActiveEditModalTask({
        id: '__NEW_TASK__', // Temporary ID for new task
        name: 'New Task',
        startHour: options?.initialStartHour ?? 9,
        duration: 1,
        dayOffset: 0, // Will be 0 because baseDate will be specific
        baseDate: newBase.toISOString(),
        color: TASK_COLORS[0], // Ensure TASK_COLORS is available or passed in
        isFromPool: options?.isFromPool ?? false,
      });
    }
    setInitialDayOffsetForModal(options?.initialDayOffset);
    setInitialStartHourForModal(options?.initialStartHour);
  }, [setActiveEditModalTask, setInitialDayOffsetForModal, setInitialStartHourForModal /*, TASK_COLORS (if used directly) */]);

  const closeEditModal = useCallback(() => {
    setActiveEditModalTask(null);
    setInitialDayOffsetForModal(undefined);
    setInitialStartHourForModal(undefined);
  }, [setActiveEditModalTask, setInitialDayOffsetForModal, setInitialStartHourForModal]);

  /**
   * Saves task data from the edit/create modal.
   * If `isNewTaskFlag` is true, it calls `onAddTask` with the task details.
   * The `taskDataFromForm` for a new task must include `baseDate` (as specific target date) and `name`.
   * `dayOffset` for `onAddTask` will be 0 as `baseDate` is specific.
   * If `isNewTaskFlag` is false, it calls `onUpdateTask` or `onUpdatePoolTask` based on `activeEditModalTask` context.
   * @param {Partial<Task>} taskDataFromForm - The task data from the form.
   * @param {boolean} isNewTaskFlag - True if saving a new task, false if updating an existing one.
   */
  const saveTaskFromModal = useCallback((taskDataFromForm: Partial<Task>, isNewTaskFlag: boolean) => {
    if (isNewTaskFlag) {
      if (!taskDataFromForm.name || !taskDataFromForm.baseDate) {
        console.error("Save new task error: name and baseDate are required from form.");
        return;
      }
      const targetDate = new Date(taskDataFromForm.baseDate);
      const startHour = taskDataFromForm.startHour ?? 9;
      // Explicitly type taskDetails to allow optional properties
      const taskDetails: { name: string; duration: number; color: string; notes?: string; completed?: boolean } = {
        name: taskDataFromForm.name,
        duration: taskDataFromForm.duration ?? 1,
        color: taskDataFromForm.color ?? TASK_COLORS[0],
      };
      if (taskDataFromForm.notes) taskDetails.notes = taskDataFromForm.notes;
      if (typeof taskDataFromForm.completed === 'boolean') taskDetails.completed = taskDataFromForm.completed;

      // Assuming isFromPool was handled by openEditModal and stored in activeEditModalTask
      // If saving a new task that was marked as fromPool, it should go to pool tasks (not implemented yet via onAddPoolTask)
      // For now, all new tasks from modal go to onAddTask (timeline)
      onAddTask(targetDate, startHour, taskDetails, 0); // dayOffset is 0 because targetDate is specific

    } else if (activeEditModalTask) {
      // This is an update to an existing task
      const updatePayload = { ...taskDataFromForm };
      delete updatePayload.id; // Don't allow ID to be changed
      delete updatePayload.baseDate; // Usually baseDate is changed via drag-drop, not form, unless explicitly allowed
      delete updatePayload.dayOffset; // Usually dayOffset is changed via drag-drop

      if (activeEditModalTask.isFromPool) {
        onUpdatePoolTask(activeEditModalTask.id, updatePayload);
      } else {
        onUpdateTask(activeEditModalTask.id, updatePayload);
      }
    }
    closeEditModal();
  }, [activeEditModalTask, onAddTask, onUpdateTask, onUpdatePoolTask, closeEditModal /*, TASK_COLORS (if used directly) */]);

  return {
    // States
    showClearPoolConfirmation,
    showCloneConfirmation,
    colorPickerState,
    activeEditModalTask,
    initialDayOffsetForModal,
    initialStartHourForModal,

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

    // Task Edit Modal Functions
    openEditModal,
    closeEditModal,
    saveTaskFromModal,

    // State Setters (if direct access is needed)
    setShowClearPoolConfirmation,
    setShowCloneConfirmation,
    setColorPickerState,
    setActiveEditModalTask,
    setInitialDayOffsetForModal,
    setInitialStartHourForModal,
  };
} 