import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Task, PinnedTask } from '../types/planner'; // Removed PlannerMode, TaskColor, CloneConfirmationData, ModalOpenOptions
import TaskStorage, { DayViewSettings } from '../utils/storage'; // TaskStorage is default, DayViewSettings is named
// import { TASK_COLORS } from '../components/planner/DailyPlanner'; // TODO: Decouple this, maybe move to a constants file
import { formatTime, formatDuration } from '../utils/formatters'; // Ensure this is imported
import {
  TASK_COLORS,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  MIN_TASK_DURATION,
  PIXELS_PER_HOUR,
  PIXELS_PER_MINUTE,
  DEFAULT_TASK_DURATION,
  DEFAULT_TOP_DAY_OFFSET,
  DEFAULT_BOTTOM_DAY_OFFSET,
  DEFAULT_TASK_COLOR_INDEX
} from '../lib/constants';
import { useModalManager } from './useModalManager';
import type { ActiveModalTask as ImportedActiveModalTask } from './useModalManager';
import { getDateWithoutTime as getUtilDateWithoutTime, isSameCalendarDate as utilIsSameCalendarDate } from '../utils/dateUtils'; // Import the utility
// import { checkOverlap } from '../utils/taskUtils'; // checkOverlap is available via wildcard import

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

// --- START: DUPLICATED HELPER FUNCTIONS (for immediate debugging) ---
// TODO: Move these to a shared utils file and import
// Removed all commented out duplicated helper functions
// --- END: DUPLICATED HELPER FUNCTIONS ---

export function useDailyPlanner() {
  // --- STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [poolTasks, setPoolTasks] = useState<Task[]>([]);
  const [pinnedTasks, setPinnedTasks] = useState<PinnedTask[]>([]);
  const [taskIdCounter, setTaskIdCounter] = useState<number>(-1); // Last used ID, primarily for display or effects
  const taskIdCounterRef = useRef<number>(-1); // Ref for the actual latest ID counter for generation
  const [activeSidebarTab, setActiveSidebarTab] = useState<'pool' | 'pinned'>('pinned');
  const [isTaskPoolOpen, setIsTaskPoolOpen] = useState<boolean>(true); // Added for default open task pool

  const [draggingTask, setDraggingTask] = useState<{
    // taskIndex: number; // No longer used
    initialMouseY: number; 
    initialStartHour: number; 
    initialDayOffset: number; 
    taskElement: HTMLDivElement; 
    task: Task; 
    offsetX?: number; // Added for smoother drag positioning
  } | null>(null);
  
  // Use the new ResizingTaskState interface here
  const [resizingTask, setResizingTask] = useState<ResizingTaskState | null>(null);
  
  // const [editingTaskId, setEditingTaskId] = useState<string | null>(null); // No longer used
  // const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null); // No longer used

  const [copyingTaskData, setCopyingTaskData] = useState<Task | null>(null);
  const [targetCopyDayOffset, setTargetCopyDayOffset] = useState<number | null>(null);

  const [topDayOffset, _setTopDayOffset] = useState<number>(DEFAULT_TOP_DAY_OFFSET);
  const [bottomDayOffset, _setBottomDayOffset] = useState<number>(DEFAULT_BOTTOM_DAY_OFFSET);

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const initialLoadComplete = useRef<boolean>(false); // To prevent saving empty arrays on first render

  const [cloneConflictStrategy, setCloneConflictStrategy] = useState<'skip' | 'replace' | 'adjust'>('skip');

  const [isClient, setIsClient] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false); // New state for sidebar collapse
  const [viewingTaskNotes, setViewingTaskNotes] = useState<Task | null>(null); // State for View Notes Modal

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoized map of tasks by date string
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      // Ensure baseDate is a valid string and normalize it.
      // tasks should always have baseDate as ISO string at midnight UTC.
      const dateNormalized = getUtilDateWithoutTime(task.baseDate); // Use imported utility
      const dateStr = dateNormalized.toISOString();
      
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(task);
    });
    return map;
  }, [tasks]);

  // --- UTILITY FUNCTIONS (originally in DailyPlanner.tsx) ---
  /**
   * Generates a display label for a given day offset.
   * Ensures client-side rendering to prevent hydration mismatches with server-rendered dates.
   * Displays "Today", "Tomorrow", "Yesterday", or the short day name and date (e.g., "Mon, May 27").
   * Dates are based on the client's current date.
   * @param {number} dayOffset - The offset from the current day (0 for today, 1 for tomorrow, etc.).
   * @returns {string} The formatted date label, or "Loading date..." during SSR.
   */
  const getDateLabel = useCallback((dayOffset: number): string => {
    if (!isClient) {
      return "Loading date...";
    }
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    // Always return full date format
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }, [isClient]);

  const getRelativeDayLabel = useCallback((dayOffset: number): string => {
    if (!isClient) {
      return ""; 
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);

    if (dayOffset === 0) return 'Today';
    if (dayOffset === 1) return 'Tomorrow';
    if (dayOffset === -1) return 'Yesterday';

    const diffDays = dayOffset; // Since dayOffset is the difference in days

    if (diffDays > 0) { // Future dates
      if (diffDays < 7) return `In ${diffDays} days`;
      if (diffDays < 14) return `Next week`; // Approx.
      if (diffDays < 21) return `In 2 weeks`;
      if (diffDays < 28) return `In 3 weeks`;
      
      const todayMonth = today.getMonth();
      const targetMonth = targetDate.getMonth();
      const todayYear = today.getFullYear();
      const targetYear = targetDate.getFullYear();

      if (targetYear > todayYear || (targetYear === todayYear && targetMonth > todayMonth)) {
        if (targetYear === todayYear && targetMonth === todayMonth + 1) return 'Next month';
        if (targetYear > todayYear && targetDate.getMonth() === 0 && today.getMonth() === 11) return 'Next month'; // Dec to Jan
        // Could add "In X months" for larger differences
      }
    } else { // Past dates
      const absDiffDays = Math.abs(diffDays);
      if (absDiffDays < 7) return `${absDiffDays} days ago`;
      if (absDiffDays < 14) return `Last week`; // Approx.
      if (absDiffDays < 21) return `2 weeks ago`;
      if (absDiffDays < 28) return `3 weeks ago`;

      const todayMonth = today.getMonth();
      const targetMonth = targetDate.getMonth();
      const todayYear = today.getFullYear();
      const targetYear = targetDate.getFullYear();

      if (targetYear < todayYear || (targetYear === todayYear && targetMonth < todayMonth)) {
        if (targetYear === todayYear && targetMonth === todayMonth - 1) return 'Last month';
        if (targetYear < todayYear && targetDate.getMonth() === 11 && today.getMonth() === 0) return 'Last month'; // Jan to Dec
        // Could add "X months ago"
      }
    }
    
    // Fallback if no specific relative label applies (e.g., >3 weeks but not clearly "next month")
    // The main getDateLabel will show the full date anyway.
    return ''; 
  }, [isClient]);

  const getOrderedDayOffsets = useCallback((): number[] => {
    // Assuming the two views should be distinct and ordered
    // If topDayOffset and bottomDayOffset can be the same, or order doesn't matter,
    // this logic might simplify to just [topDayOffset, bottomDayOffset]
    if (topDayOffset === bottomDayOffset) {
      return [topDayOffset];
    }
    return [Math.min(topDayOffset, bottomDayOffset), Math.max(topDayOffset, bottomDayOffset)];
  }, [topDayOffset, bottomDayOffset]);

  const setTopDayOffset = useCallback((newOffset: number) => {
    _setTopDayOffset(newOffset);
    // No longer calling ensureDifferentDay
  }, [_setTopDayOffset]);

  const setBottomDayOffset = useCallback((newOffset: number) => {
    _setBottomDayOffset(newOffset);
    // No longer calling ensureDifferentDay
  }, [_setBottomDayOffset]);

  const getNextId = useCallback(() => {
    // Use the ref for reliable incrementing
    const newNumId = taskIdCounterRef.current + 1;
    taskIdCounterRef.current = newNumId; // Update ref immediately

    setTaskIdCounter(newNumId); // Update state for any UI dependent on it
    TaskStorage.saveNextId(newNumId); // Persist this new "last assigned ID"
    
    return String(newNumId);
  }, [setTaskIdCounter]); // Dependency on setTaskIdCounter is fine, as it's stable. Ref updates don't trigger re-renders directly.

  /**
   * Adds a new task to the main timeline.
   * The new task's 'baseDate' is set to midnight of the provided 'targetDate'.
   * Its 'dayOffset' will be 0 relative to this 'baseDate'.
   * @param {Date} targetDate - The specific calendar date for the new task.
   * @param {number} startHour - The start hour for the new task.
   * @param {object} taskData - Object containing name, duration, and color for the new task.
   * @param {number} [dayOffset=0] - Should generally be 0 as targetDate now defines the specific day.
   *                                 Included for flexibility but defaults to 0.
   */
  const handleAddTask = useCallback((
    targetDate: Date,
    startHour: number,
    taskData: { name: string; duration: number; color: string; notes?: string; completed?: boolean; },
    dayOffset: number = 0 // Default dayOffset to 0
  ) => {
    // Create a normalized base date from the targetDate with time set to midnight
    const normalizedBaseDate = new Date(targetDate);
    normalizedBaseDate.setHours(0, 0, 0, 0);
    
    const newTask: Task = {
      id: getNextId(),
      name: taskData.name,
      startHour,
      duration: taskData.duration,
      dayOffset, // Use the provided dayOffset, defaulting to 0
      color: taskData.color || TASK_COLORS[DEFAULT_TASK_COLOR_INDEX], // Use default color index
      baseDate: normalizedBaseDate.toISOString(), // baseDate is the normalized targetDate
      notes: taskData.notes, // Add notes
      completed: taskData.completed // Add completed status
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  }, [getNextId]);

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

  // --- Conflict Detection (Moved here, before handleMouseUpGlobal) ---
  // const hasConflict = useCallback((taskIdToExclude: string, dayOffset: number, startHour: number, duration: number): boolean => { //... entire function removed ... });

  // Helper function to check for task overlap (ensure this is defined before use in cloneDayTasks)
  const checkOverlap = useCallback((
    task1Start: number, task1Duration: number,
    task2Start: number, task2Duration: number
  ): boolean => {
    const task1End = task1Start + task1Duration;
    const task2End = task2Start + task2Duration;
    return task1Start < task2End && task1End > task2Start;
  }, []);

  // Add TIMELINE_SPLIT_HOUR constants here if they are used by handleMouseMoveDrag and not passed in
  // These values should match those in DailyPlanner.tsx
  // const TIMELINE_SPLIT_HOUR_1 = 11; // No longer needed here, DailyPlanner.tsx imports them
  // const TIMELINE_SPLIT_HOUR_2 = 18; // No longer needed here

  // --- Global Mouse Event Handlers ---
  const handleMouseUpGlobal = useCallback(() => {
    if (draggingTask) {
      const { task: finalDraggedTaskData, /* taskIndex, */ initialStartHour: originalStartHourBeforeDrag, initialDayOffset: originalDayOffsetBeforeDrag } = draggingTask;
      
      const finalTargetDate = getUtilDateWithoutTime(finalDraggedTaskData.baseDate);

      const otherTasksOnFinalDate = tasks.filter(t => {
        if (t.id === finalDraggedTaskData.id) return false;
        const otherTaskDate = getUtilDateWithoutTime(t.baseDate);
        return utilIsSameCalendarDate(otherTaskDate, finalTargetDate);
      });

      let conflict = false;
      for (const otherTask of otherTasksOnFinalDate) {
        if (checkOverlap(finalDraggedTaskData.startHour, finalDraggedTaskData.duration, otherTask.startHour, otherTask.duration)) {
          conflict = true;
          break;
        }
      }

      if (conflict) {
      } else {
        const newTasks = tasks.map(task =>
          task.id === finalDraggedTaskData.id ? { ...finalDraggedTaskData } : task
        );
        setTasks(newTasks);
      }
      setDraggingTask(null); 
    }

    if (resizingTask) {
      const { task: rawPreviewTask } = resizingTask;
      
      let finalStartHour = rawPreviewTask.startHour;
      let finalDuration = rawPreviewTask.duration;

      // Strict snap to 15-minute intervals on mouse up
      finalStartHour = Math.round(finalStartHour * 4) / 4;
      finalDuration = Math.round(finalDuration * 4) / 4;
      
      // Ensure minimal duration after snapping
      finalDuration = Math.max(MIN_TASK_DURATION, finalDuration);

      // Boundary checks after snapping
      finalStartHour = Math.max(TIMELINE_START_HOUR, finalStartHour);
      finalStartHour = Math.min(TIMELINE_END_HOUR - MIN_TASK_DURATION, finalStartHour); // Ensure start hour allows min duration
      finalDuration = Math.min(finalDuration, TIMELINE_END_HOUR - finalStartHour);
      finalDuration = Math.max(MIN_TASK_DURATION, finalDuration); // Re-ensure min duration after end boundary adjustment

      // The resizingTask.task already contains collision-resolved preview from handleMouseMoveResize.
      // We trust those values after final snapping and boundary checks.
      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === rawPreviewTask.id
            ? { 
                ...task, // Spread existing task to keep other fields like notes, completed, color
                startHour: finalStartHour, 
                duration: finalDuration, 
                baseDate: rawPreviewTask.baseDate, // Ensure the correct baseDate from the preview is used
                dayOffset: 0 // Ensure dayOffset is 0 as per new system
              }
            : task
        )
      );

      setResizingTask(null);
      document.documentElement.classList.remove('resize-active');
      document.body.style.cursor = ''; // Reset cursor on body
    }

    // Clean up general styles if no operation is active
    if (!draggingTask && !resizingTask) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
        document.documentElement.classList.remove('resize-active');
    }
  }, [draggingTask, resizingTask, setTasks, setDraggingTask, setResizingTask, MIN_TASK_DURATION, TIMELINE_START_HOUR, TIMELINE_END_HOUR, tasks]); // Removed hasConflict

  // --- Task Interaction Handlers (Drag, Resize) ---
  // The handleMouseMoveDrag function below is an old version and is no longer used.
  // The active handleMouseMoveDrag is now in DailyPlanner.tsx and passed to the global mouse move listener there.
  // Removing the old function:
  // const handleMouseMoveDrag = useCallback((e: MouseEvent) => { ... });

  // --- Task Pool Functions ---
  const handleActualAddPoolTask = useCallback((taskData: { name: string; duration: number; color?: string }) => {
    const newPoolTask: Task = {
      id: getNextId(),
      name: taskData.name,
      duration: taskData.duration,
      color: taskData.color || TASK_COLORS[DEFAULT_TASK_COLOR_INDEX], // Use default color index
      dayOffset: -1000, // Special dayOffset for pool tasks
      startHour: 0, // Not relevant for pool
      baseDate: new Date().toISOString() // Add base date for pool tasks
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
  }, [setPoolTasks]);

  // --- Pinned Task Functions ---
  const handlePinTask = useCallback((originalTask: Task) => {
    const taskToPin = { ...originalTask }; // Create a copy

    // Ensure baseDate is treated as UTC midnight for calculation
    const sourceBaseDate = new Date(taskToPin.baseDate);
    const year = sourceBaseDate.getUTCFullYear();
    const month = sourceBaseDate.getUTCMonth(); // 0-11
    const day = sourceBaseDate.getUTCDate();

    const hours = Math.floor(taskToPin.startHour);
    const minutes = Math.round((taskToPin.startHour % 1) * 60);

    // Create the dueDate explicitly in UTC
    const dueDateEpoch = Date.UTC(year, month, day, hours, minutes, 0, 0);
    const dueDate = new Date(dueDateEpoch);

    const newPinnedTask: PinnedTask = {
      ...taskToPin, // Spread original task properties
      originalId: taskToPin.id,
      pinnedId: getNextId(), // Unique ID for this pinned instance
      dueDate: dueDate, // Use the correctly calculated dueDate
    };
    setPinnedTasks(prevPinnedTasks => [...prevPinnedTasks, newPinnedTask].sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  }, [getNextId, setPinnedTasks]);

  const handleUnpinTask = useCallback((pinnedIdToUnpin: string) => {
    setPinnedTasks(prevPinnedTasks => prevPinnedTasks.filter(pt => pt.pinnedId !== pinnedIdToUnpin));
  }, [setPinnedTasks]);

  const formatTimeRemaining = useCallback((dueDate: Date): { text: string; isOverdue: boolean } => {
    const now = new Date().getTime();
    const dueTime = dueDate.getTime();
    const diffMs = dueTime - now;
    let isOverdue = false;
    let text = "";

    if (diffMs <= 0) {
      isOverdue = true;
      const absDiffMs = Math.abs(diffMs);
      const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
      if (days > 0) text = `Overdue by ${days} day${days > 1 ? 's' : ''}`;
      else {
        const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
        if (hours > 0) text = `Overdue by ${hours} hr${hours > 1 ? 's' : ''}`;
        else {
          const mins = Math.floor(absDiffMs / (1000 * 60));
          text = `Overdue by ${mins} min${mins > 1 ? 's' : ''}`;
        }
      }
    } else {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) text = `Due in ${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hr${hours > 1 ? 's' : ''}` : ''}`;
      else if (hours > 0) text = `Due in ${hours} hr${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min${mins > 1 ? 's' : ''}` : ''}`;
      else if (mins > 0) text = `Due in ${mins} min${mins > 1 ? 's' : ''}`;
      else text = "Due now";
    }
    return { text, isOverdue };
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

  /**
   * Creates a new task when a copied task (from timeline or pool) is dropped onto the timeline.
   * The new task's 'baseDate' is set to midnight of the provided 'targetDate'.
   * Its 'dayOffset' is set to 0, and 'startHour' is determined by the drop target.
   * @param {Date} targetDate - The specific calendar date where the task is dropped.
   * @param {number} targetStartHour - The start hour where the task is dropped.
   */
  const handleDropCopy = useCallback((targetDate: Date, targetStartHour: number) => {
    if (!copyingTaskData) return;

    // Normalize the targetDate to midnight for the baseDate
    const normalizedBaseDate = new Date(targetDate);
    normalizedBaseDate.setHours(0, 0, 0, 0);

    const newTask: Task = {
      ...copyingTaskData, // Spread properties from the source task being copied
      id: getNextId(),     // Assign a new ID
      dayOffset: 0,        // dayOffset is 0 because baseDate is the specific target date
      startHour: targetStartHour,
      baseDate: normalizedBaseDate.toISOString() // Use the specific target date
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    setCopyingTaskData(null);
    setTargetCopyDayOffset(null);
  }, [copyingTaskData, getNextId, setTasks, setCopyingTaskData, setTargetCopyDayOffset]);

  /**
   * Clones all tasks from a source calendar date to a destination calendar date.
   * New tasks created during cloning have their 'baseDate' set to the 'destinationDate' (normalized to midnight).
   * Their 'dayOffset' is set to 0.
   * Handles conflicts based on the 'cloneConflictStrategy'.
   * @param {Date} sourceCalendarDate - The specific calendar date from which to clone tasks (normalized to midnight).
   * @param {Date} destinationCalendarDate - The specific calendar date to which tasks will be cloned (normalized to midnight).
   */
  const cloneDayTasks = useCallback((sourceCalendarDate: Date, destinationCalendarDate: Date) => {
    const sourceDateNormalized = getUtilDateWithoutTime(sourceCalendarDate.toISOString());
    const destinationDateForComparison = getUtilDateWithoutTime(destinationCalendarDate.toISOString());

    const tasksFromSourceDay = tasks.filter(task => {
      const taskCalendarDate = getUtilDateWithoutTime(task.baseDate);
      return utilIsSameCalendarDate(taskCalendarDate, sourceDateNormalized);
    });

    const existingDestinationTasks = tasks.filter(t => {
      const taskAbsDate = getUtilDateWithoutTime(t.baseDate);
      return utilIsSameCalendarDate(taskAbsDate, destinationDateForComparison) && t.dayOffset === 0;
    });
    
    const newClonedTasks = tasksFromSourceDay.map(sourceTask => {
      const newTask: Task = {
        ...sourceTask,
        id: getNextId(),
        dayOffset: 0,
        baseDate: destinationDateForComparison.toISOString()
      };
      return newTask;
    });

    // Handle conflicts based on strategy
    const finalTasksToApply = newClonedTasks.filter(clonedTask => {
      const hasConflictWithExisting = existingDestinationTasks.some(existingTask => 
        checkOverlap(clonedTask.startHour, clonedTask.duration, existingTask.startHour, existingTask.duration)
      );
      
      if (hasConflictWithExisting) {
        switch (cloneConflictStrategy) {
          case 'skip':
            return false;
          case 'replace':
            return true; 
          case 'adjust':
            let adjustedStartHour = clonedTask.startHour;
            const maxAttempts = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 4; // Max 15-min slots in a day
            let attempts = 0;
            while (existingDestinationTasks.some(existingTask => 
              checkOverlap(adjustedStartHour, clonedTask.duration, existingTask.startHour, existingTask.duration)
            ) && attempts < maxAttempts) {
              adjustedStartHour += 0.25;
              if (adjustedStartHour + clonedTask.duration > TIMELINE_END_HOUR) {
                return false;
              }
              attempts++;
            }
            if (attempts >= maxAttempts) return false;
            clonedTask.startHour = adjustedStartHour;
            return true;
        }
      }
      return true;
    });

    setTasks(prevTasks => {
      return [...prevTasks, ...finalTasksToApply];
    });

  }, [tasks, getNextId, cloneConflictStrategy, TIMELINE_END_HOUR, TIMELINE_START_HOUR, checkOverlap, setTasks]);

  // For updating pool tasks from the modal
  const handleUpdatePoolTask = useCallback((taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => {
    setPoolTasks(prevPoolTasks => 
      prevPoolTasks.map(task => 
        task.id === taskId ? { ...task, ...updatedFields } : task
      )
    );
  }, [setPoolTasks]);

  // --- Use Modal Manager ---
  const modalManager = useModalManager({
    onAddTask: handleAddTask,
    onUpdateTask: handleUpdateTask,
    onUpdatePoolTask: handleUpdatePoolTask,
    onClearPool: clearPool,
    onCloneTasks: cloneDayTasks,
    topDayOffset
  });

  // Destructure all properties from modalManager as defined in ModalManagerState
  // These will be directly available in the scope below
  const {
    showClearPoolConfirmation,
    showCloneConfirmation: mmShowCloneConfirmation,
    colorPickerState: mmColorPickerState,
    activeEditModalTask: mmActiveEditModalTask,
    initialDayOffsetForModal,
    initialStartHourForModal,
    toggleColorPicker: mmToggleColorPicker,
    handleTaskColorChange: mmHandleTaskColorChange,
    showClearPoolModal,
    confirmClearPool,
    cancelClearPool,
    showCloneModal: mmShowCloneModal,
    confirmCloneDay: mmConfirmCloneDay,
    cancelCloneDay,
    openEditModal: mmOpenEditModal,
    closeEditModal: mmCloseEditModal,
    saveTaskFromModal: mmSaveTaskFromModal,
    setShowClearPoolConfirmation,
    setShowCloneConfirmation: mmSetShowCloneConfirmation,
    setColorPickerState,
    setActiveEditModalTask: mmSetActiveEditModalTask,
    setInitialDayOffsetForModal,
    setInitialStartHourForModal
  } = modalManager;

  const handleCopyAndEnterPasteMode = useCallback((taskData: Omit<Task, 'id'>) => {
    const taskToCopy: Task = {
      ...taskData,
      id: 'temp-copy-id'
    };
    startCopy(taskToCopy);
  }, [startCopy]);

  const openViewNotesModal = useCallback((task: Task) => {
    setViewingTaskNotes(task);
  }, []);

  const closeViewNotesModal = useCallback(() => {
    setViewingTaskNotes(null);
  }, []);

  // --- EFFECTS ---

  // Load data from localStorage on initial mount
  useEffect(() => {
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
      const validIds = allLoadedTasksForIdCalc.map(t => {
        const numId = parseInt(t.id, 10);
        return isNaN(numId) ? -Infinity : numId;
      }).filter(id => id !== -Infinity);

      if (validIds.length > 0) {
          maxIdInExistingTasks = Math.max(...validIds, -1);
      }
    }

    const lastStoredId = TaskStorage.loadNextId();

    const effectiveLastUsedId = Math.max(
      maxIdInExistingTasks,
      lastStoredId !== null && lastStoredId !== undefined ? lastStoredId : -1
    );

    setTaskIdCounter(effectiveLastUsedId);
    taskIdCounterRef.current = effectiveLastUsedId;
    
    // --- MODIFIED DAY VIEW SETTINGS LOGIC ---
    _setTopDayOffset(DEFAULT_TOP_DAY_OFFSET);
    _setBottomDayOffset(DEFAULT_BOTTOM_DAY_OFFSET);
    console.log('📅 Forcing application default day view settings and saving to storage.');
    TaskStorage.saveDayViewSettings({ topDayOffset: DEFAULT_TOP_DAY_OFFSET, bottomDayOffset: DEFAULT_BOTTOM_DAY_OFFSET });
    // --- END MODIFIED LOGIC ---

    // Mark initial load as complete after a short delay to allow state updates to settle
    setTimeout(() => {
        initialLoadComplete.current = true;
    }, 100);

    // Check for mobile view and persisted sidebar state
    if (typeof window !== 'undefined') {
      const mobileMediaQuery = window.matchMedia("(max-width: 768px)");
      const persistedCollapseState = TaskStorage.loadSidebarCollapsed();

      if (mobileMediaQuery.matches) {
        setIsSidebarCollapsed(true);
      } else if (persistedCollapseState !== null) {
        setIsSidebarCollapsed(persistedCollapseState);
      }
      // Listener for future changes (e.g. resizing window across breakpoint)
      const handleResize = () => {
        if (mobileMediaQuery.matches) {
          setIsSidebarCollapsed(true);
        } else {
          // If not mobile, and there was a persisted state, use it. Otherwise, default to false (expanded).
          const nonMobilePersistedState = TaskStorage.loadSidebarCollapsed();
          setIsSidebarCollapsed(nonMobilePersistedState !== null ? nonMobilePersistedState : false);
        }
      };
      mobileMediaQuery.addEventListener('change', handleResize);
      // Cleanup listener on unmount
      return () => mobileMediaQuery.removeEventListener('change', handleResize);
    }

  }, []); // Empty dependency array means this runs once on mount

  // Save tasks whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
      TaskStorage.save(tasks);
    }
  }, [tasks]);

  // Save pool tasks whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
      TaskStorage.savePoolTasks(poolTasks);
    }
  }, [poolTasks]);

  // Save pinned tasks whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
      TaskStorage.savePinnedTasks(pinnedTasks);
    }
  }, [pinnedTasks]);

  // Save sidebar collapsed state
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
      // Only save if not on mobile, as mobile defaults to collapsed
      const mobileMediaQuery = window.matchMedia("(max-width: 768px)");
      if (!mobileMediaQuery.matches) {
        TaskStorage.saveSidebarCollapsed(isSidebarCollapsed);
      }
    }
  }, [isSidebarCollapsed]);

  // Save day view settings whenever they change
  useEffect(() => {
    if (initialLoadComplete.current && typeof window !== 'undefined') {
        TaskStorage.saveDayViewSettings({ topDayOffset, bottomDayOffset });
    }
  }, [topDayOffset, bottomDayOffset]);

  // Effect to add and remove global mouse up listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('mouseup', handleMouseUpGlobal);
        return () => {
            window.removeEventListener('mouseup', handleMouseUpGlobal);
        };
    }
  }, [handleMouseUpGlobal]);

  // Effect to detect and fix duplicate task IDs in the main tasks state
  useEffect(() => {
    if (!initialLoadComplete.current) return; // Only run after initial load

    const idCounts = tasks.reduce((acc, task) => {
      acc[task.id] = (acc[task.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);

    if (duplicates.length > 0) {
      const uniqueTaskIds = new Set<string>();
      const uniqueTasks = tasks.filter(task => {
        if (uniqueTaskIds.has(task.id)) {
          return false; // Skip this duplicate
        }
        uniqueTaskIds.add(task.id);
        return true;
      });
      
      if (uniqueTasks.length !== tasks.length) {
        setTasks(uniqueTasks); // Directly update the state within the hook
      }
    }
  }, [tasks]); // This effect runs whenever the tasks array changes

  // --- RETURNED STATE AND FUNCTIONS ---
  return {
    // State
    poolTasks,
    pinnedTasks,
    taskIdCounter,
    activeSidebarTab,
    draggingTask,
    resizingTask,
    copyingTaskData,
    targetCopyDayOffset,

    // States from modalManager (aliased to avoid conflicts if any)
    showClearPoolConfirmation,
    showCloneConfirmation: mmShowCloneConfirmation,
    colorPickerState: mmColorPickerState,
    activeEditModalTask: mmActiveEditModalTask,
    initialDayOffsetForModal,
    initialStartHourForModal,
    showClearPoolModal,
    isSidebarCollapsed,
    isTaskPoolOpen,
    isClient,
    topDayOffset,
    bottomDayOffset,
    timelineScrollRef,
    viewingTaskNotes,
    cloneConflictStrategy,

    // Constants
    TASK_COLORS,
    PIXELS_PER_HOUR,
    PIXELS_PER_MINUTE,
    MIN_TASK_DURATION,
    TIMELINE_START_HOUR,
    TIMELINE_END_HOUR,

    // State Setters (Direct)
    setPoolTasks,
    setPinnedTasks,
    setActiveSidebarTab,
    setDraggingTask,
    setResizingTask,
    setCopyingTaskData,
    setTargetCopyDayOffset,
    setTopDayOffset,
    setBottomDayOffset,
    setIsTaskPoolOpen,
    setIsSidebarCollapsed,
    setCloneConflictStrategy,
    
    // State Setters (from modalManager, aliased)
    setShowClearPoolConfirmation,
    setShowCloneConfirmation: mmSetShowCloneConfirmation,
    setColorPickerState,
    setActiveEditModalTask: mmSetActiveEditModalTask,
    setInitialDayOffsetForModal,
    setInitialStartHourForModal,

    // Date & View Functions
    getDateLabel,
    getRelativeDayLabel,
    getOrderedDayOffsets,

    // Core Task Action Functions
    getNextId,
    handleAddTask,
    handleDeleteTask,
    handleUpdateTask,
    handleTaskCompletionToggle,
    handleMouseUpGlobal,

    // Functions from modalManager (aliased)
    toggleColorPicker: mmToggleColorPicker,
    handleTaskColorChange: mmHandleTaskColorChange,
    confirmClearPool,
    cancelClearPool,
    showCloneModal: mmShowCloneModal,
    confirmCloneDay: mmConfirmCloneDay,
    cancelCloneDay,
    openEditModal: mmOpenEditModal,
    closeEditModal: mmCloseEditModal,
    saveTaskFromModal: mmSaveTaskFromModal,

    // Task Pool Functions
    handleActualAddPoolTask,
    copyTaskToPool,
    moveTaskFromPool,
    handleDeletePoolTask,
    clearPool,

    // Pinned Task Functions
    handlePinTask,
    handleUnpinTask,
    formatTimeRemaining,

    // Copying / Cloning Functions
    startCopy,
    cancelCopy,
    handleDropCopy,
    cloneDayTasks,

    // Memoized Data
    tasksByDate,

    // Other UI Action Functions
    handleCopyAndEnterPasteMode,
    openViewNotesModal,
    closeViewNotesModal,

    // Specific Modal Related Aliases / Properties (ensure these are distinct and necessary)
    isModalOpen: showClearPoolModal,
    modalType: 'Edit',
  };
} 