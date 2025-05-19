import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, PinnedTask } from '../types/planner';
import TaskStorage, { DayViewSettings } from '../utils/storage'; // TaskStorage is default, DayViewSettings is named
import { TASK_COLORS } from '../components/planner/DailyPlanner'; // TODO: Decouple this, maybe move to a constants file
import { formatTime, formatDuration } from '../utils/formatters'; // Ensure this is imported

// --- CONSTANTS (to be moved from DailyPlanner or a shared file) ---
const TIMELINE_START_HOUR = 4;
const TIMELINE_END_HOUR = 25; // Extends to 1 AM next day for overnight tasks
const MIN_TASK_DURATION = 0.25; // 15 minutes
const PIXELS_PER_HOUR = 140; // From DailyPlanner
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const DEFAULT_TASK_DURATION = 1; // Default duration for new tasks
const DEFAULT_TOP_DAY_OFFSET = 0; // Today
const DEFAULT_BOTTOM_DAY_OFFSET = 1; // Tomorrow

// Define the type for the resizingTask state
interface ResizingTaskState {
  task: Task;
  edge: 'start' | 'end';
  initialMouseX: number;
  initialStartHour: number;
  initialDuration: number;
  // initialWidth?: number; // No longer strictly needed by the new resize logic
}

// Add a temporary marker to distinguish task source for modal
interface ActiveModalTask extends Task {
  isFromPool?: boolean;
}

export function useDailyPlanner() {
  // --- STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [poolTasks, setPoolTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<PinnedTask[]>([]);
  const [taskIdCounter, setTaskIdCounter] = useState<number>(-1); // Last used ID, primarily for display or effects
  const taskIdCounterRef = useRef<number>(-1); // Ref for the actual latest ID counter for generation
  const [activeSidebarTab, setActiveSidebarTab] = useState<'pool' | 'pinned'>('pool');

  const [draggingTask, setDraggingTask] = useState<{
    taskIndex: number; 
    initialMouseY: number; 
    initialStartHour: number; 
    initialDayOffset: number; 
    taskElement: HTMLDivElement; 
    task: Task; 
    offsetX?: number; // Added for smoother drag positioning
  } | null>(null);
  
  // Use the new ResizingTaskState interface here
  const [resizingTask, setResizingTask] = useState<ResizingTaskState | null>(null);
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); // For inline editing in TaskCard & main edit modal
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

  const [copyingTaskData, setCopyingTaskData] = useState<Task | null>(null);
  const [targetCopyDayOffset, setTargetCopyDayOffset] = useState<number | null>(null);

  const [showClearPoolConfirmation, setShowClearPoolConfirmation] = useState<boolean>(false);
  const [showCloneConfirmation, setShowCloneConfirmation] = useState<{ dayOffset: number; period: 'morning' | 'afternoon' | 'evening'} | null>(null);
  
  const [topDayOffset, setTopDayOffset] = useState<number>(DEFAULT_TOP_DAY_OFFSET);
  const [bottomDayOffset, setBottomDayOffset] = useState<number>(DEFAULT_BOTTOM_DAY_OFFSET);

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const initialLoadComplete = useRef<boolean>(false); // To prevent saving empty arrays on first render
  const [colorPickerState, setColorPickerState] = useState<{ taskId: string; x: number; y: number } | null>(null);
  const [activeEditModalTask, setActiveEditModalTask] = useState<ActiveModalTask | null>(null);

  // --- UTILITY FUNCTIONS (originally in DailyPlanner.tsx) ---
  const getDateLabel = useCallback((dayOffset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let dayName = '';
    if (date.toDateString() === today.toDateString()) {
      dayName = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayName = 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dayName = 'Yesterday';
    } else {
      dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    }
    return `${dayName}, ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }, []); // Empty dependency array as it's a pure utility based on Date

  const getOrderedDayOffsets = useCallback((): number[] => {
    // Assuming the two views should be distinct and ordered
    // If topDayOffset and bottomDayOffset can be the same, or order doesn't matter,
    // this logic might simplify to just [topDayOffset, bottomDayOffset]
    if (topDayOffset === bottomDayOffset) {
      return [topDayOffset];
    }
    return [Math.min(topDayOffset, bottomDayOffset), Math.max(topDayOffset, bottomDayOffset)];
  }, [topDayOffset, bottomDayOffset]);

  const ensureDifferentDay = useCallback((changedOffset: 'top' | 'bottom') => {
    if (topDayOffset === bottomDayOffset) {
      if (changedOffset === 'top') {
        setBottomDayOffset(topDayOffset + 1);
      } else { // changedOffset === 'bottom'
        setTopDayOffset(bottomDayOffset - 1); 
        // Or, if we want to always push bottom further:
        // setTopDayOffset(bottomDayOffset === 0 ? -1 : bottomDayOffset -1) 
        // For now, simple decrement/increment is fine.
      }
    }
  }, [topDayOffset, bottomDayOffset, setTopDayOffset, setBottomDayOffset]);

  const getNextId = useCallback(() => {
    // Use the ref for reliable incrementing
    const newNumId = taskIdCounterRef.current + 1;
    taskIdCounterRef.current = newNumId; // Update ref immediately

    console.log(`getNextId: Called. Current ref ID (last used): ${taskIdCounterRef.current -1}. New numeric ID to be assigned: ${newNumId}`);
    
    setTaskIdCounter(newNumId); // Update state for any UI dependent on it
    TaskStorage.saveNextId(newNumId); // Persist this new "last assigned ID"
    
    console.log(`getNextId: Returning string ID: "${String(newNumId)}". taskIdCounterRef.current updated to ${newNumId}. taskIdCounter state updated to ${newNumId}.`);
    return String(newNumId);
  }, [setTaskIdCounter]); // Dependency on setTaskIdCounter is fine, as it's stable. Ref updates don't trigger re-renders directly.

  const handleAddTask = useCallback((dayOffset: number, startHour: number, taskDetails: { name: string; duration: number; color: string; }) => {
    const newTask: Task = {
      id: getNextId(),
      dayOffset,
      startHour,
      name: taskDetails.name,
      duration: taskDetails.duration || DEFAULT_TASK_DURATION,
      color: taskDetails.color || TASK_COLORS[0],
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, [getNextId, setTasks]);

  const handleDeleteTask = useCallback((taskIdToDelete: string) => {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== taskIdToDelete));
  }, [setTasks]);

  const handleUpdateTask = useCallback((taskIdToUpdate: string, updatedFields: Partial<Omit<Task, 'id'>>) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskIdToUpdate ? { ...task, ...updatedFields } : task
      )
    );
  }, [setTasks]);

  const handleTaskColorChange = useCallback((taskId: string, newColor: string) => {
    handleUpdateTask(taskId, { color: newColor });
    setColorPickerState(null); // Close color picker after selection
  }, [handleUpdateTask, setColorPickerState]);

  const toggleColorPicker = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up, e.g., closing a modal
    setColorPickerState(prevState => {
      if (prevState && prevState.taskId === taskId) {
        return null; // Close if already open for this task
      } else {
        // Determine position: you might need to adjust based on viewport/scroll
        // For simplicity, using clientX/clientY. In a real app, use getBoundingClientRect for better placement.
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        return { taskId, x: rect.left, y: rect.bottom + 5 }; 
      }
    });
  }, [setColorPickerState]);

  const handleTaskCompletionToggle = useCallback((taskId: string) => {
    // Assuming completion is marked by changing color to a muted/gray color.
    // TASK_COLORS is available in this scope from import.
    // Using one of the gray colors as a "completed" state.
    // Example: TASK_COLORS.find(c => c.includes('gray')) || TASK_COLORS[0]
    // For simplicity, let's pick a specific gray color if available.
    const completedColor = TASK_COLORS.find(c => c.startsWith("bg-gray-300")) || TASK_COLORS[TASK_COLORS.length - 3]; // Default to a known gray or last few
    
    // Check if the task is already "completed" (i.e., has the completedColor)
    // If so, maybe revert to its previous color? This needs more complex state (originalColor)
    // For now, it just sets it to completed color.
    // A more robust solution might involve a dedicated `isCompleted` field or storing original color.
    handleUpdateTask(taskId, { color: completedColor });
  }, [handleUpdateTask, TASK_COLORS]);

  const openEditModal = useCallback((taskToEdit: Task, isFromPool: boolean = false) => {
    setActiveEditModalTask({ ...taskToEdit, isFromPool });
  }, [setActiveEditModalTask]);

  const closeEditModal = useCallback(() => {
    setActiveEditModalTask(null);
  }, [setActiveEditModalTask]);

  const saveTaskFromModal = useCallback((updatedTaskData: Partial<Task> & { id: string }) => {
    const { id, name, startHour, duration, color, dayOffset } = updatedTaskData; // dayOffset might not be relevant for pool tasks if not on timeline
    const taskToSave: Partial<Task> = {};
    if (name !== undefined) taskToSave.name = name;
    // For pool tasks, startHour and dayOffset might not be directly editable or relevant in the same way
    // If they are edited, they should persist on the pool task.
    if (startHour !== undefined) taskToSave.startHour = startHour; 
    if (duration !== undefined) taskToSave.duration = duration;
    if (color !== undefined) taskToSave.color = color;
    if (dayOffset !== undefined) taskToSave.dayOffset = dayOffset; // Keep if edited, though pool tasks usually have a special dayOffset

    if (activeEditModalTask?.isFromPool) {
      setPoolTasks(currentPoolTasks =>
        currentPoolTasks.map(task =>
          task.id === id ? { ...task, ...taskToSave } : task
        )
      );
    } else {
      handleUpdateTask(id, taskToSave); // This updates the main 'tasks' array
    }
    closeEditModal();
  }, [handleUpdateTask, closeEditModal, setPoolTasks, activeEditModalTask]);

  // --- Conflict Detection (Moved here, before handleMouseUpGlobal) ---
  const hasConflict = useCallback((taskIdToExclude: string, dayOffset: number, startHour: number, duration: number): boolean => {
    const endTime = startHour + duration;
    for (const task of tasks) {
      if (task.id === taskIdToExclude || task.dayOffset !== dayOffset) {
        continue; // Skip self or tasks on different days
      }
      const existingTaskEndTime = task.startHour + task.duration;
      // Check for overlap:
      // (StartA < EndB) and (EndA > StartB)
      if (startHour < existingTaskEndTime && endTime > task.startHour) {
        return true;
      }
    }
    return false;
  }, [tasks]);

  const handleMouseUpGlobal = useCallback(() => {
    let dragTaskToFinalize: Task | null = null;

    if (draggingTask && draggingTask.task) {
      dragTaskToFinalize = draggingTask.task; // Dragging already provides snapped values in its task state
      setTasks(currentTasks =>
        currentTasks.map(t => (t.id === dragTaskToFinalize!.id ? { ...dragTaskToFinalize! } : t))
      );
      setDraggingTask(null);
    }

    if (resizingTask) {
      const { task: rawPreviewTask, edge, initialStartHour: rsInitialStartHour, initialDuration: rsInitialDuration } = resizingTask;
      
      // These are the final raw (but minimally constrained) values from the mouse movement
      let finalRawStartHour = rawPreviewTask.startHour;
      let finalRawDuration = rawPreviewTask.duration;

      // --- Apply Snapping to the final raw values ---
      let snappedStartHour = Math.round(finalRawStartHour * 4) / 4;
      let snappedDuration = Math.round(finalRawDuration * 4) / 4;
      
      // --- Apply Full Set of Constraints and Safeguards ---
      snappedDuration = Math.max(MIN_TASK_DURATION, snappedDuration); 

      if (edge === 'start') {
          const originalTaskEndHour = rsInitialStartHour + rsInitialDuration;
          // Adjust start hour: cannot go beyond original end minus min_duration
          snappedStartHour = Math.min(snappedStartHour, originalTaskEndHour - MIN_TASK_DURATION);
          // And cannot go before timeline start
          snappedStartHour = Math.max(TIMELINE_START_HOUR, snappedStartHour);
          
          // Recalculate duration based on adjusted start and original end
          snappedDuration = originalTaskEndHour - snappedStartHour;
          // Ensure duration is at least min_duration and also fits if start was pushed by TIMELINE_START_HOUR
          // And that it doesn't extend beyond TIMELINE_END_HOUR from the new start
          snappedDuration = Math.min(snappedDuration, TIMELINE_END_HOUR - snappedStartHour);
          snappedDuration = Math.max(MIN_TASK_DURATION, snappedDuration);

      } else { // edge === 'end'
          // For end-edge resize, the start hour is anchored to the initial start hour of the resize operation.
          snappedStartHour = rsInitialStartHour; 

          // Adjust duration: cannot go beyond timeline end from the fixed start hour
          snappedDuration = Math.min(snappedDuration, TIMELINE_END_HOUR - snappedStartHour);
          // Ensure duration is at least min_duration
          snappedDuration = Math.max(MIN_TASK_DURATION, snappedDuration);
      }

      // Safeguard pass: ensure everything is within bounds and respects min_duration after all logic.
      snappedStartHour = Math.max(TIMELINE_START_HOUR, snappedStartHour);
      snappedStartHour = Math.min(snappedStartHour, TIMELINE_END_HOUR - MIN_TASK_DURATION); // Ensure start allows for min_duration
      
      snappedDuration = Math.min(snappedDuration, TIMELINE_END_HOUR - snappedStartHour); // Duration cannot exceed remaining timeline
      snappedDuration = Math.max(MIN_TASK_DURATION, snappedDuration);

      // If constraints on duration forced it such that start + duration is still problematic, adjust start one last time.
      // This is crucial if, for example, TIMELINE_END_HOUR - MIN_TASK_DURATION was the cap for start, 
      // but duration was further reduced, start might need to shift left.
      if (snappedStartHour + snappedDuration > TIMELINE_END_HOUR) {
          snappedStartHour = TIMELINE_END_HOUR - snappedDuration;
      }
      // Final check on start hour after all adjustments.
      snappedStartHour = Math.max(TIMELINE_START_HOUR, snappedStartHour);
      // And one last check on duration to ensure it respects min_duration and fits from potentially adjusted startHour
      snappedDuration = Math.max(MIN_TASK_DURATION, Math.min(snappedDuration, TIMELINE_END_HOUR - snappedStartHour));
      
      setTasks(currentTasks =>
          currentTasks.map(t =>
              t.id === rawPreviewTask.id ? { ...t, startHour: snappedStartHour, duration: snappedDuration } : t
          )
      );
      setResizingTask(null);
    }

    // Reset cursor and global styles regardless of which operation (drag/resize) ended
    if (typeof document !== 'undefined') {
        document.body.style.cursor = ''; 
        document.body.style.userSelect = ''; 
        document.body.style.pointerEvents = ''; 
        document.documentElement.classList.remove('resize-active');
    }
  }, [draggingTask, resizingTask, setTasks, setDraggingTask, setResizingTask, MIN_TASK_DURATION, TIMELINE_START_HOUR, TIMELINE_END_HOUR]); // Added back constants for constraints

  // --- Task Pool Functions ---
  const handleActualAddPoolTask = useCallback((taskData: { name: string; duration: number; color: string }) => {
    const newPoolTask: Task = {
      id: getNextId(), // Ensure getNextId is defined and imported/available
      name: taskData.name,
      duration: taskData.duration,
      color: taskData.color,
      dayOffset: -1000, // Special dayOffset for pool tasks, or manage separately
      startHour: 0, // Not relevant for pool, or could be a default
    };
    setPoolTasks(prevPoolTasks => [...prevPoolTasks, newPoolTask]);
  }, [getNextId, setPoolTasks]);

  const copyTaskToPool = useCallback((taskId: string) => {
    const taskToCopy = tasks.find(t => t.id === taskId);
    if (taskToCopy) {
      const poolTaskCopy: Task = {
        ...taskToCopy,
        id: getNextId(), // New ID for the copy in the pool
        dayOffset: -1000, // Pool task identifier
        // Keep original startHour and duration as template values
      };
      setPoolTasks(prevPoolTasks => [...prevPoolTasks, poolTaskCopy]);
    }
  }, [tasks, getNextId, setPoolTasks]);

  // moveTaskFromPool might be handled by the general copy/drop mechanism.
  // For now, let's define a simple version that takes a pool task ID and adds it to main tasks for a default day/time.
  // This is a placeholder and might need refinement based on actual usage in DailyPlanner.tsx
  const moveTaskFromPool = useCallback((poolTaskId: string, targetDayOffset: number, targetStartHour: number) => {
    const taskToMove = poolTasks.find(t => t.id === poolTaskId);
    if (taskToMove) {
      const newTaskForTimeline: Task = {
        ...taskToMove,
        id: getNextId(), // New ID for the timeline instance
        dayOffset: targetDayOffset,
        startHour: targetStartHour,
      };
      setTasks(prev => [...prev, newTaskForTimeline]);
      setPoolTasks(prev => prev.filter(t => t.id !== poolTaskId)); // Remove from pool
    }
  }, [poolTasks, setTasks, setPoolTasks, getNextId]);

  const handleDeletePoolTask = useCallback((taskId: string) => {
    setPoolTasks(prevPoolTasks => prevPoolTasks.filter(task => task.id !== taskId));
  }, [setPoolTasks]);

  const clearPool = useCallback(() => {
    setPoolTasks([]);
    setShowClearPoolConfirmation(false); // Assuming this state exists for a confirmation dialog
  }, [setPoolTasks, setShowClearPoolConfirmation]);

  // --- Pinned Task Functions ---
  const handlePinTask = useCallback((taskToPin: Task) => {
    const now = new Date();
    const taskStartDate = new Date();
    taskStartDate.setDate(now.getDate() + taskToPin.dayOffset);
    taskStartDate.setHours(Math.floor(taskToPin.startHour), (taskToPin.startHour % 1) * 60, 0, 0);

    const newPinnedTask: PinnedTask = {
      ...taskToPin, // Spread original task properties
      originalId: taskToPin.id,
      pinnedId: getNextId(), // Unique ID for this pinned instance
      dueDate: taskStartDate,
    };
    setPinnedTasks(prevPinnedTasks => [...prevPinnedTasks, newPinnedTask].sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()));
  }, [getNextId, setPinnedTasks]);

  const handleUnpinTask = useCallback((pinnedIdToUnpin: string) => {
    setPinnedTasks(prevPinnedTasks => prevPinnedTasks.filter(pt => pt.pinnedId !== pinnedIdToUnpin));
  }, [setPinnedTasks]);

  const formatTimeRemaining = useCallback((dueDate: Date): string => {
    const now = new Date().getTime();
    const dueTime = dueDate.getTime();
    const diffMs = dueTime - now;

    if (diffMs <= 0) {
      const absDiffMs = Math.abs(diffMs);
      const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
      if (days > 0) return `Overdue by ${days}d`;
      const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
      if (hours > 0) return `Overdue by ${hours}h`;
      const mins = Math.floor(absDiffMs / (1000 * 60));
      return `Overdue by ${mins}m`;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    if (mins > 0) return `In ${mins}m`;
    return "Due now";
  }, []);

  // --- Copying / Cloning Functions ---
  const startCopy = useCallback((taskToCopy: Task) => {
    // Don't pre-assign a new ID here - wait until the actual paste happens
    setCopyingTaskData({...taskToCopy});
    setTargetCopyDayOffset(null); // Clear previous target
  }, [setCopyingTaskData, setTargetCopyDayOffset]);

  const cancelCopy = useCallback(() => {
    setCopyingTaskData(null);
    setTargetCopyDayOffset(null);
  }, [setCopyingTaskData, setTargetCopyDayOffset]);

  const handleDropCopy = useCallback((destinationDayOffset: number, destinationStartHour: number) => {
    if (copyingTaskData) { // targetCopyDayOffset !== null check is removed as dayOffset is now a direct param
      const newTask: Task = {
        ...copyingTaskData,
        id: getNextId(), // Generate the new ID at paste time, not during copy initialization
        dayOffset: destinationDayOffset,
        startHour: destinationStartHour,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      cancelCopy(); // Reset copy mode after successful paste
    }
  }, [copyingTaskData, getNextId, setTasks, cancelCopy]); // Added getNextId to dependencies

  const cloneDayTasks = useCallback((sourceDayOffset: number, destinationDayOffset: number) => {
    const tasksToClone = tasks.filter(task => task.dayOffset === sourceDayOffset);
    const newClonedTasks: Task[] = tasksToClone.map(task => ({
      ...task,
      id: getNextId(),
      dayOffset: destinationDayOffset,
    }));
    setTasks(prevTasks => [...prevTasks, ...newClonedTasks]);
    setShowCloneConfirmation(null); // Close confirmation after cloning
  }, [tasks, getNextId, setTasks, setShowCloneConfirmation]);

  // --- EFFECTS ---

  // Load data from localStorage on initial mount
  useEffect(() => {
    console.log("🔄 useDailyPlanner: Loading data from storage...");
    const loadedTasks = TaskStorage.load();
    if (loadedTasks) {
      setTasks(loadedTasks);
    }
    const loadedPoolTasks = TaskStorage.loadPoolTasks();
    if (loadedPoolTasks) {
      setPoolTasks(loadedPoolTasks);
    }
    const loadedPinnedTasks = TaskStorage.loadPinnedTasks();
    if (loadedPinnedTasks) {
      setPinnedTasks(loadedPinnedTasks);
    }

    // Initialize taskIdCounter and taskIdCounterRef
    const allLoadedTasksForIdCalc = [
      ...(loadedTasks || []),
      ...(loadedPoolTasks || []),
      ...(loadedPinnedTasks || [])
    ];

    let maxIdInExistingTasks = -1;
    if (allLoadedTasksForIdCalc.length > 0) {
      // Correctly parse string IDs to numbers before finding max
      const validIds = allLoadedTasksForIdCalc.map(t => {
        const numId = parseInt(t.id, 10);
        return isNaN(numId) ? -Infinity : numId; // Use -Infinity for unparseable, won't affect Math.max
      }).filter(id => id !== -Infinity);

      if (validIds.length > 0) {
          maxIdInExistingTasks = Math.max(...validIds, -1);
      }
    }

    const lastStoredId = TaskStorage.loadNextId(); // This should be the last ID *used*

    const effectiveLastUsedId = Math.max(
      maxIdInExistingTasks,
      lastStoredId !== null && lastStoredId !== undefined ? lastStoredId : -1
    );

    setTaskIdCounter(effectiveLastUsedId);
    taskIdCounterRef.current = effectiveLastUsedId; // Initialize the ref here
    
    // Updated console log for clarity
    console.log(`🔢 Initial last used ID set to: ${effectiveLastUsedId}. Next ID will be ${effectiveLastUsedId + 1}. (Details: Max from tasks: ${maxIdInExistingTasks}, ID from storage: ${lastStoredId === null || lastStoredId === undefined ? 'N/A' : lastStoredId})`);

    const loadedSettings = TaskStorage.loadDayViewSettings();
    if (loadedSettings) {
      setTopDayOffset(loadedSettings.topDayOffset);
      setBottomDayOffset(loadedSettings.bottomDayOffset);
    } else {
      // Save default view if nothing is loaded
      TaskStorage.saveDayViewSettings({ topDayOffset: DEFAULT_TOP_DAY_OFFSET, bottomDayOffset: DEFAULT_BOTTOM_DAY_OFFSET });
    }

    // Mark initial load as complete after a short delay to allow state updates to settle
    setTimeout(() => {
        initialLoadComplete.current = true;
        console.log('✅ useDailyPlanner: Initial load complete.');
    }, 100);

  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
      console.log('💾 Saving tasks to storage...', tasks);
      TaskStorage.save(tasks);
    }
  }, [tasks]);

  // Save pool tasks whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
      console.log('💾 Saving pool tasks to storage...', poolTasks);
      TaskStorage.savePoolTasks(poolTasks);
    }
  }, [poolTasks]);

  // Save pinned tasks whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
      console.log('💾 Saving pinned tasks to storage...', pinnedTasks);
      TaskStorage.savePinnedTasks(pinnedTasks);
    }
  }, [pinnedTasks]);

  // Save day view settings whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
        console.log('💾 Saving day view settings to storage...', { topDayOffset, bottomDayOffset });
        TaskStorage.saveDayViewSettings({ topDayOffset, bottomDayOffset });
    }
  }, [topDayOffset, bottomDayOffset]);

  // Add effects to call ensureDifferentDay when offsets change
  useEffect(() => {
    ensureDifferentDay('top');
  }, [topDayOffset, ensureDifferentDay]);

  useEffect(() => {
    ensureDifferentDay('bottom');
  }, [bottomDayOffset, ensureDifferentDay]);

  // Effect to add and remove global mouse up listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('mouseup', handleMouseUpGlobal);
        return () => {
            window.removeEventListener('mouseup', handleMouseUpGlobal);
        };
    }
  }, [handleMouseUpGlobal]);

  // --- RETURNED STATE AND FUNCTIONS ---
  return {
    // State
    tasks,
    poolTasks,
    pinnedTasks,
    taskIdCounter,
    activeSidebarTab,
    draggingTask,
    resizingTask,
    editingTaskId,
    contextMenu,
    copyingTaskData,
    targetCopyDayOffset,
    showClearPoolConfirmation,
    showCloneConfirmation,
    topDayOffset,
    bottomDayOffset,
    timelineScrollRef,
    TASK_COLORS, // Exporting this for now, ideally moved to a shared constants file
    colorPickerState,
    activeEditModalTask,
    PIXELS_PER_HOUR,
    PIXELS_PER_MINUTE,
    MIN_TASK_DURATION,
    TIMELINE_START_HOUR,
    TIMELINE_END_HOUR,

    // State Setters (some might be replaced by dedicated functions later)
    setTasks,
    setPoolTasks,
    setPinnedTasks,
    setActiveSidebarTab,
    setDraggingTask,
    setResizingTask,
    setEditingTaskId,
    setContextMenu,
    setCopyingTaskData,
    setTargetCopyDayOffset,
    setShowClearPoolConfirmation,
    setShowCloneConfirmation,
    setTopDayOffset,
    setBottomDayOffset,
    setColorPickerState,
    setActiveEditModalTask,

    // Date & View
    getDateLabel,
    getOrderedDayOffsets,
    ensureDifferentDay,
    
    // Core Task Actions
    getNextId,
    handleAddTask,
    handleDeleteTask,
    handleUpdateTask,
    handleTaskColorChange,
    toggleColorPicker,
    handleTaskCompletionToggle,

    // Task Editing (Modal)
    openEditModal,
    closeEditModal,
    saveTaskFromModal,

    // Drag & Resize (Placeholders - full implementation needed if moving from DailyPlanner.tsx)
    handleMouseUpGlobal,

    // Task Pool
    handleActualAddPoolTask,
    copyTaskToPool,
    moveTaskFromPool,
    handleDeletePoolTask,
    clearPool,

    // Pinned Tasks
    handlePinTask,
    handleUnpinTask,
    formatTimeRemaining,

    // Copying / Cloning
    startCopy,
    cancelCopy,
    handleDropCopy,
    cloneDayTasks,

    // Conflict Detection (primarily internal, but might be useful for UI previews)
    hasConflict,
  };
} 