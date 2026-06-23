import { useState, useCallback } from 'react';
import { Task } from '@/types/planner';
import { TASK_COLORS, DEFAULT_TASK_COLOR, POOL_TASK_COLOR } from '@/lib/constants';
import { dateFromDateKey, getDateKey } from '@/utils/dateUtils';

/**
 * Interface for modal-related task data
 * Extends the base Task type with additional properties needed for modals
 */
export interface ActiveModalTask extends Task {
  isFromPool?: boolean;
  isNew?: boolean;
}

/**
 * Context for task creation to determine modal behavior
 */
interface TaskCreationContext {
  mode: 'timeline' | 'pool-general' | 'pool-date' | 'quick-add';
  targetDate?: Date;
  startHour?: number;
  sourceView: 'daily' | 'weekly' | 'monthly' | 'inbox';
  showSimplified?: boolean; // For quick-add mode
}

/**
 * Enhanced ActiveModalTask with creation context
 */
export interface EnhancedActiveModalTask extends ActiveModalTask {
  creationContext?: TaskCreationContext;
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

  /** Callback to update a date-specific pool task */
  onUpdatePoolTaskForDate: (dateKey: string, taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;

  /** Callback to add a new inbox task (general unscheduled) */
  onAddPoolTask: (task: Task) => void;

  /** Callback to add a new inbox task for a specific date */
  onAddPoolTaskForDate: (dateKey: string, task: Partial<Task>) => void;
  
  /** Callback to clear the task inbox */
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
  activeEditModalTask: EnhancedActiveModalTask | null;
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
  
  // Legacy Task Edit Modal Functions (for backward compatibility)
  /** Opens the task edit/create modal.
   * @deprecated Use specific creation functions instead: createTimelineTask, createPoolTask, createQuickTask, editTask
   */
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean; targetDate?: Date }) => void;
  
  /** Closes the task edit/create modal */
  closeEditModal: () => void;
  
  /** Saves a task from the modal */
  saveTaskFromModal: (taskData: Task, options?: { isNew?: boolean; isFromPool?: boolean }) => void;

  // New Context-Aware Task Creation Functions
  /** Creates a new task directly on the timeline (Daily view) */
  createTimelineTask: (date: Date, startHour?: number) => void;
  
  /** Creates a new task in the general pool (Unscheduled view - All tab) */
  createPoolTask: (date?: Date) => void;
  
  /** Creates a new task for a specific date's pool (Weekly view, Unscheduled - Today tab) */
  createPoolTaskForDate: (date: Date) => void;
  
  /** Creates a new task with simplified UI (Monthly view) */
  createQuickTask: (date: Date) => void;
  
  /** Opens modal to edit an existing task */
  editTask: (task: Task) => void;

  // State Setters (if direct access is needed)
  setShowClearPoolConfirmation: (value: boolean) => void;
  setShowCloneConfirmation: (value: CloneConfirmationData | null) => void;
  setColorPickerState: (value: { taskId: string; x: number; y: number } | null) => void;
  setActiveEditModalTask: (value: EnhancedActiveModalTask | null) => void;
  setInitialDayOffsetForModal: (value: number | undefined) => void;
  setInitialStartHourForModal: (value: number | undefined) => void;
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
  onUpdatePoolTaskForDate,
  onAddPoolTask,
  onAddPoolTaskForDate,
  onClearPool,
  onCloneTasks,
  topDayOffset
}: UseModalManagerProps): ModalManagerState {
  // Modal visibility states
  const [showClearPoolConfirmation, setShowClearPoolConfirmation] = useState<boolean>(false);
  const [showCloneConfirmation, setShowCloneConfirmation] = useState<CloneConfirmationData | null>(null);
  const [colorPickerState, setColorPickerState] = useState<{ taskId: string; x: number; y: number } | null>(null);
  const [activeEditModalTask, setActiveEditModalTask] = useState<EnhancedActiveModalTask | null>(null);
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
    targetDate?: Date;
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
    } else {
      // This is the new logic path for when no task is provided.
      // It implies creating a new task.
      console.log('🎯 MODAL DEBUG: openEditModal called with no task, options:', options);
      const tempId = `temp-new-${Date.now()}`;
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const isFromPool = options?.isFromPool ?? false;
      const hasTargetDate = !!options?.targetDate;
      
      // Determine the target date
      let targetDate: Date;
      if (hasTargetDate) {
        targetDate = new Date(options.targetDate!);
      } else {
        targetDate = new Date(today);
        const dayOffset = options?.initialDayOffset ?? topDayOffset;
        targetDate.setDate(targetDate.getDate() + dayOffset);
      }
      
      // Determine task mode and properties
      let mode: TaskCreationContext['mode'];
      let baseDate: string;
      let poolDate: string | undefined;
      
      if (isFromPool && hasTargetDate) {
        // Creating a date-specific pool task
        mode = 'pool-date';
        baseDate = ''; // Empty baseDate for pool tasks
        poolDate = getDateKey(targetDate); // Set poolDate for date-specific tasks
      } else if (isFromPool) {
        // Creating a general pool task
        mode = 'pool-general';
        baseDate = ''; // Empty baseDate for general pool tasks
        poolDate = undefined;
      } else {
        // Creating a timeline task
        mode = 'timeline';
        baseDate = getDateKey(targetDate);
        poolDate = undefined;
      }
      
      const newTask: EnhancedActiveModalTask = {
        id: tempId,
        name: "", // Start with an empty name
        startHour: options?.initialStartHour ?? (isFromPool ? undefined : 9), // No specific start time for pool tasks
        duration: 1, // Default duration
        baseDate: baseDate,
        color: isFromPool ? POOL_TASK_COLOR : DEFAULT_TASK_COLOR,
        notes: "",
        completed: false,
        isFromPool: isFromPool,
        isNew: true,
        creationContext: {
          mode: mode,
          targetDate: targetDate,
          sourceView: hasTargetDate ? 'monthly' : (isFromPool ? 'inbox' : 'daily')
        }
      };
      
      // Add poolDate if it's a date-specific pool task
      if (poolDate) {
        (newTask as any).poolDate = poolDate;
      }
      
      setActiveEditModalTask(newTask);
      
      console.log('🎯 MODAL DEBUG: Active modal task set:', {
        id: tempId,
        isFromPool,
        baseDate: baseDate,
        poolDate: poolDate,
        mode: mode,
        hasTargetDate: hasTargetDate,
        targetDate: getDateKey(targetDate)
      });
      
      setInitialDayOffsetForModal(options?.initialDayOffset);
      setInitialStartHourForModal(options?.initialStartHour);
    }
  }, [setActiveEditModalTask, setInitialDayOffsetForModal, setInitialStartHourForModal, topDayOffset]);

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
    if (!activeEditModalTask) {
      console.error("[useModalManager] No active modal task found.");
      return;
    }

    // Helper function for legacy creation logic
    const handleLegacyCreation = (taskData: Task, isFromPool: boolean) => {
      if (isFromPool) {
        // Handle pool task creation
        if (taskData.poolDate) {
          // Add to pool for specific date
          onAddPoolTaskForDate(taskData.poolDate, {
            ...taskData,
            color: taskData.color || DEFAULT_TASK_COLOR
          });
        } else {
          // Add to general pool (unscheduled)
          onAddPoolTask({
            ...taskData,
            color: taskData.color || DEFAULT_TASK_COLOR
          });
        }
      } else {
        // Handle timeline task creation
        if (!taskData.baseDate) {
          console.error("[useModalManager] Timeline task missing baseDate:", taskData);
          alert("Timeline task must have a date.");
          return;
        }
        const targetDate = dateFromDateKey(taskData.baseDate);
        onAddTask(
          targetDate,
          taskData.startHour ?? 9, // Default to 9 AM if undefined
          {
            name: taskData.name,
            duration: taskData.duration,
            color: taskData.color || DEFAULT_TASK_COLOR,
            notes: taskData.notes,
            completed: taskData.completed
          },
          0 // dayOffset is 0 because targetDate is specific
        );
      }
    };

    // Use creation context if available, otherwise fall back to options/flags
    const creationContext = activeEditModalTask.creationContext;
    const isNew = options?.isNew ?? activeEditModalTask.isNew ?? false;
    const isFromPool = options?.isFromPool ?? activeEditModalTask.isFromPool ?? false;

    if (isNew) {
      if (!taskDataFromForm.name) {
        console.error("[useModalManager] New task is missing name:", taskDataFromForm);
        alert("New task must have a name.");
        return;
      }

      // Handle creation based on context
      if (creationContext) {
        switch (creationContext.mode) {
          case 'timeline':
            // Timeline task creation
            if (!taskDataFromForm.baseDate) {
              console.error("[useModalManager] Timeline task missing baseDate:", taskDataFromForm);
              alert("Timeline task must have a date.");
              return;
            }
            const targetDate = dateFromDateKey(taskDataFromForm.baseDate);
                    onAddTask(
          targetDate,
          taskDataFromForm.startHour ?? 9, // Default to 9 AM if undefined
              {
                name: taskDataFromForm.name,
                duration: taskDataFromForm.duration,
                color: taskDataFromForm.color || DEFAULT_TASK_COLOR,
                notes: taskDataFromForm.notes,
                completed: taskDataFromForm.completed
              },
              0 // dayOffset is 0 because targetDate is specific
            );
            break;

          case 'pool-general':
            // General pool task creation
            onAddPoolTask({
              ...taskDataFromForm,
              baseDate: '', // Clear baseDate for general pool
              color: taskDataFromForm.color || DEFAULT_TASK_COLOR
            });
            break;

          case 'pool-date':
          case 'quick-add':
            // Date-specific pool task creation
            if (taskDataFromForm.poolDate) {
              onAddPoolTaskForDate(taskDataFromForm.poolDate, {
                ...taskDataFromForm,
                color: taskDataFromForm.color || DEFAULT_TASK_COLOR
              });
            } else if (taskDataFromForm.baseDate) {
              // Fallback: use baseDate as poolDate
              onAddPoolTaskForDate(taskDataFromForm.baseDate, {
                ...taskDataFromForm,
                poolDate: taskDataFromForm.baseDate,
                color: taskDataFromForm.color || DEFAULT_TASK_COLOR
              });
            } else {
              console.error("[useModalManager] Pool task missing date:", taskDataFromForm);
              alert("Pool task must have a date.");
              return;
            }
            break;

          default:
            console.warn("[useModalManager] Unknown creation context mode:", creationContext.mode);
            // Fall back to legacy logic
            handleLegacyCreation(taskDataFromForm, isFromPool);
        }
      } else {
        // Legacy creation logic (for backward compatibility)
        handleLegacyCreation(taskDataFromForm, isFromPool);
      }
    } else {
      // Existing task: needs id and partial fields to update.
      if (!taskDataFromForm.id) {
        console.error("[useModalManager] Existing task is missing ID:", taskDataFromForm);
        alert("Cannot update task: ID is missing.");
        return;
      }
      const { id, ...updatedFields } = taskDataFromForm;
      
      // Determine the correct update function based on task type:
      // 1. Date-specific pool tasks have poolDate property
      // 2. General pool tasks have isFromPool true but no poolDate
      // 3. Timeline tasks have isFromPool false
      if (taskDataFromForm.poolDate) {
        // Date-specific pool task
        onUpdatePoolTaskForDate(taskDataFromForm.poolDate, id, updatedFields);
      } else if (isFromPool) {
        // General pool task
        onUpdatePoolTask(id, updatedFields);
      } else {
        // Timeline task
        onUpdateTask(id, updatedFields);
      }
    }
    closeEditModal();
  }, [activeEditModalTask, onAddTask, onUpdateTask, onUpdatePoolTask, onUpdatePoolTaskForDate, onAddPoolTask, onAddPoolTaskForDate, closeEditModal]);

  // New Context-Aware Task Creation Functions
  /** Creates a new task directly on the timeline (Daily view) */
  const createTimelineTask = useCallback((date: Date, startHour?: number) => {
    const tempId = `temp-timeline-${Date.now()}`;
    const targetDateKey = getDateKey(date);
    const effectiveStartHour = startHour ?? 9; // Default to 9 if not provided
    
    setActiveEditModalTask({
      id: tempId,
      name: "New Task",
      startHour: effectiveStartHour,
      duration: 1,
      baseDate: targetDateKey,
      color: DEFAULT_TASK_COLOR,
      notes: "",
      completed: false,
      isFromPool: false,
      isNew: true,
      creationContext: {
        mode: 'timeline',
        targetDate: date,
        startHour: effectiveStartHour,
        sourceView: 'daily'
      }
    });
  }, []);
  
  /** Creates a new task in the general inbox (Inbox view - All tab) */
  const createPoolTask = useCallback((date?: Date) => {
    console.log('🎯 INBOX DEBUG: createPoolTask called with date:', date);
    const tempId = `temp-pool-${Date.now()}`;
    const today = new Date();
    const targetDate = date || today;
    
    const taskTemplate: EnhancedActiveModalTask = {
      id: tempId,
      name: "New Task",
      startHour: undefined, // No specific start time for pool tasks
      duration: 1,
      baseDate: date ? getDateKey(date) : '', // Empty baseDate for general pool
      color: POOL_TASK_COLOR,
      notes: "",
      completed: false,
      isFromPool: true,
      isNew: true,
      creationContext: {
        mode: date ? 'pool-date' : 'pool-general',
        targetDate: targetDate,
        sourceView: 'inbox'
      }
    };
    
    console.log('🎯 INBOX DEBUG: Task template created:', taskTemplate);
    setActiveEditModalTask(taskTemplate);
    console.log('🎯 INBOX DEBUG: Modal opened with task template');
  }, []);
  
  /** Creates a new task for a specific date's inbox (Weekly view, Inbox - Today tab) */
  const createPoolTaskForDate = useCallback((date: Date) => {
    const tempId = `temp-pool-date-${Date.now()}`;
    const targetDateKey = getDateKey(date);
    
    setActiveEditModalTask({
      id: tempId,
      name: "New Task",
      startHour: undefined, // Explicitly unscheduled
      duration: 1,
      baseDate: targetDateKey,
      color: POOL_TASK_COLOR,
      notes: "",
      completed: false,
      isFromPool: true,
      isNew: true,
      poolDate: targetDateKey, // Specifically for this date's pool
      creationContext: {
        mode: 'pool-date',
        targetDate: date,
        sourceView: 'weekly'
      }
    });
  }, []);
  
  /** Creates a new task with simplified UI (Monthly view) */
  const createQuickTask = useCallback((date: Date) => {
    const tempId = `temp-quick-${Date.now()}`;
    const targetDateKey = getDateKey(date);
    
    setActiveEditModalTask({
      id: tempId,
      name: "New Task",
      startHour: 0,
      duration: 1,
      baseDate: targetDateKey,
      color: POOL_TASK_COLOR,
      notes: "",
      completed: false,
      isFromPool: true,
      isNew: true,
      poolDate: targetDateKey,
      creationContext: {
        mode: 'quick-add',
        targetDate: date,
        sourceView: 'monthly',
        showSimplified: true
      }
    });
  }, [setActiveEditModalTask]);
  
  /** Opens modal to edit an existing task */
  const editTask = useCallback((task: Task) => {
    setActiveEditModalTask({
      ...task,
      isFromPool: !!task.poolDate, // Determine if it's from pool based on poolDate
      isNew: false,
      creationContext: undefined // No creation context for existing tasks
    });
  }, [setActiveEditModalTask]);

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

    // New Context-Aware Task Creation Functions
    createTimelineTask,
    createPoolTask,
    createPoolTaskForDate,
    createQuickTask,
    editTask,

    // State Setters (if direct access is needed)
    setShowClearPoolConfirmation,
    setShowCloneConfirmation,
    setColorPickerState,
    setActiveEditModalTask,
    setInitialDayOffsetForModal,
    setInitialStartHourForModal,
  };
} 