import { useState, useCallback } from 'react';
import { Task } from '@/types/planner';
import { TASK_COLORS } from '@/lib/constants';

/**
 * Interface for modal-related task data
 * Extends the base Task type with additional properties needed for modals
 */
export interface ActiveModalTask extends Task {
  isFromPool?: boolean;
  isNew?: boolean;
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
  onAddTask: (targetDate: Date, startHour: number, taskData: { name: string; duration: number; color: string; notes?: string; completed?: boolean; }, dayOffset?: number) => void;

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
   * If `task` is not provided or options.isNew is true, it prepares the modal for creating a new task,
   * potentially using `options.initialDayOffset` and `options.initialStartHour` as defaults.
   * The new task's `baseDate` is provisionally set based on `initialDayOffset` from today, 
   * and `dayOffset` to 0. This may be refined by TaskFormModal if a more specific target is known.
   * @param {Task} [task] - The task to edit. If undefined, prepares for new task creation.
   * @param {object} [options] - Options for opening the modal.
   * @param {boolean} [options.isFromPool] - Indicates if the task is from/for the task pool.
   * @param {number} [options.initialDayOffset] - Suggested day offset for a new task (e.g., from view).
   * @param {number} [options.initialStartHour] - Suggested start hour for a new task.
   * @param {boolean} [options.isNew] - Explicitly states if this is for a new task.
   */
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean }) => void;
  /** Closes the task edit/create modal */
  closeEditModal: () => void;
  /** Saves task data from the edit/create modal.
   * If `activeEditModalTask.isNew` is true, it calls `onAddTask` with the task details.
   * The `taskDataFromForm` for a new task must include `baseDate` (as specific target date) and `name`.
   * `dayOffset` for `onAddTask` will be 0 as `baseDate` is specific.
   * If `activeEditModalTask.isNew` is false, it calls `onUpdateTask` or `onUpdatePoolTask` based on `activeEditModalTask` context.
   * @param {Task} taskDataFromForm - The complete task data from the form.
   * @param {object} [options] - Options indicating if the task is new or from the pool.
   * @param {boolean} [options.isNew] - Indicates if the task is new.
   * @param {boolean} [options.isFromPool] - Indicates if the task is from the pool.
   */
  saveTaskFromModal: (taskDataFromForm: Task, options?: { isNew?: boolean; isFromPool?: boolean; }) => void;
  
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
   * If `task` is not provided or options.isNew is true, it prepares the modal for creating a new task,
   * potentially using `options.initialDayOffset` and `options.initialStartHour` as defaults.
   * The new task's `baseDate` is provisionally set based on `initialDayOffset` from today, 
   * and `dayOffset` to 0. This may be refined by TaskFormModal if a more specific target is known.
   * @param {Task} [task] - The task to edit. If undefined, prepares for new task creation.
   * @param {object} [options] - Options for opening the modal.
   * @param {boolean} [options.isFromPool] - Indicates if the task is from/for the task pool.
   * @param {number} [options.initialDayOffset] - Suggested day offset for a new task (e.g., from view).
   * @param {number} [options.initialStartHour] - Suggested start hour for a new task.
   * @param {boolean} [options.isNew] - Explicitly states if this is for a new task.
   */
  const openEditModal = useCallback((task?: Task, options?: { 
    isFromPool?: boolean; 
    initialDayOffset?: number; 
    initialStartHour?: number; 
    isNew?: boolean; 
  }) => {
    if (task) {
      // Task is present. It could be an existing task to edit,
      // or a pre-filled new task object (if options.isNew is true).
      const taskObject: Task = task; // Assert task is not undefined here
      setActiveEditModalTask({
        ...taskObject, // Spread the asserted task object
        isFromPool: options?.isFromPool || false,
        isNew: options?.isNew || false, // This will be true if DailyPlanner sends a new task
      });
      setInitialDayOffsetForModal(undefined); 
      setInitialStartHourForModal(undefined); 
    } else if (options?.isNew) {
      // Task is not provided, but options.isNew is true. Create a default new task.
      const tempId = `temp-new-${Date.now()}`;
      const today = new Date();
      today.setHours(0,0,0,0);
      setActiveEditModalTask({
        id: tempId,
        name: "New Task", // Default name
        startHour: options?.initialStartHour ?? 9,
        duration: 1,
        baseDate: today.toISOString(), 
        dayOffset: 0,
        color: TASK_COLORS[0],
        isFromPool: options?.isFromPool || false,
        isNew: true,
      });
      setInitialDayOffsetForModal(options?.initialDayOffset);
      setInitialStartHourForModal(options?.initialStartHour);
    }
  }, [setActiveEditModalTask, setInitialDayOffsetForModal, setInitialStartHourForModal]);

  /** Closes the task edit/create modal */
  const closeEditModal = useCallback(() => {
    setActiveEditModalTask(null);
    setInitialDayOffsetForModal(undefined);
    setInitialStartHourForModal(undefined);
  }, [setActiveEditModalTask, setInitialDayOffsetForModal, setInitialStartHourForModal]);

  /** Saves task data from the edit/create modal.
   * If `activeEditModalTask.isNew` is true, it calls `onAddTask` with the task details.
   * The `taskDataFromForm` for a new task must include `baseDate` (as specific target date) and `name`.
   * `dayOffset` for `onAddTask` will be 0 as `baseDate` is specific.
   * If `activeEditModalTask.isNew` is false, it calls `onUpdateTask` or `onUpdatePoolTask` based on `activeEditModalTask` context.
   * @param {Task} taskDataFromForm - The complete task data from the form.
   * @param {object} [options] - Options indicating if the task is new or from the pool.
   * @param {boolean} [options.isNew] - Indicates if the task is new.
   * @param {boolean} [options.isFromPool] - Indicates if the task is from the pool.
   */
  const saveTaskFromModal = useCallback((taskDataFromForm: Task, options?: { isNew?: boolean; isFromPool?: boolean; }) => {
    const isNew = options?.isNew ?? activeEditModalTask?.isNew ?? false;
    const isFromPool = options?.isFromPool ?? activeEditModalTask?.isFromPool ?? false;

    console.log("[useModalManager] saveTaskFromModal called. isNew:", isNew, "isFromPool:", isFromPool, "Task ID:", taskDataFromForm.id);
    console.log("[useModalManager] Task data from form:", JSON.parse(JSON.stringify(taskDataFromForm)));

    if (isNew) {
      if (!taskDataFromForm.name || !taskDataFromForm.baseDate) {
        console.error("[useModalManager] New task is missing name or baseDate:", taskDataFromForm);
        // Optionally, show an error to the user
        alert("New task must have a name and a date.");
        return;
      }
      // Ensure baseDate is a Date object before passing to onAddTask
      const targetDate = new Date(taskDataFromForm.baseDate);
      // onAddTask expects dayOffset to be 0 if targetDate is the specific calendar date.
      // taskDataFromForm should have duration, color, notes, completed already set.
      onAddTask(
        targetDate,
        taskDataFromForm.startHour,
        {
          name: taskDataFromForm.name,
          duration: taskDataFromForm.duration,
          color: taskDataFromForm.color || TASK_COLORS[0],
          notes: taskDataFromForm.notes,
          completed: taskDataFromForm.completed
        },
        0 // dayOffset is 0 because targetDate is specific
      );
    } else {
      // Existing task: needs id and partial fields to update.
      if (!taskDataFromForm.id) {
        console.error("[useModalManager] Existing task is missing ID:", taskDataFromForm);
        alert("Cannot update task: ID is missing.");
        return;
      }
      const { id, ...updatedFields } = taskDataFromForm;
      if (isFromPool) {
        console.log("[useModalManager] Updating POOL task ID:", id, "with fields:", updatedFields);
        onUpdatePoolTask(id, updatedFields);
      } else {
        console.log("[useModalManager] Updating TIMELINE task ID:", id, "with fields:", updatedFields);
        onUpdateTask(id, updatedFields);
      }
    }
    closeEditModal();
  }, [activeEditModalTask, onAddTask, onUpdateTask, onUpdatePoolTask, closeEditModal]);

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