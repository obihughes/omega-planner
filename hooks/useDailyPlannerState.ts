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
  
  const [topDayOffset, _setTopDayOffset] = useState<number>(DEFAULT_TOP_DAY_OFFSET);
  const [bottomDayOffset, _setBottomDayOffset] = useState<number>(DEFAULT_BOTTOM_DAY_OFFSET);

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

  // Add TIMELINE_SPLIT_HOUR constants here if they are used by handleMouseMoveDrag and not passed in
  // These values should match those in DailyPlanner.tsx
  const TIMELINE_SPLIT_HOUR_1 = 11; // As in DailyPlanner.tsx
  const TIMELINE_SPLIT_HOUR_2 = 18; // As in DailyPlanner.tsx

  // --- Global Mouse Event Handlers ---
  const handleMouseUpGlobal = useCallback(() => {
    let dragTaskToFinalize: Task | null = null;

    if (draggingTask && draggingTask.task) {
      // Before finalizing, ensure the task duration is valid
      const taskToUpdate = { ...draggingTask.task };
      if (!taskToUpdate.duration || taskToUpdate.duration < MIN_TASK_DURATION) {
        taskToUpdate.duration = MIN_TASK_DURATION;
      }
      // Ensure start hour is within bounds considering the duration
      taskToUpdate.startHour = Math.max(TIMELINE_START_HOUR, taskToUpdate.startHour);
      taskToUpdate.startHour = Math.min(TIMELINE_END_HOUR - taskToUpdate.duration, taskToUpdate.startHour);

      // Final check for conflicts before setting the task
      if (!hasConflict(taskToUpdate.id, taskToUpdate.dayOffset, taskToUpdate.startHour, taskToUpdate.duration)) {
        dragTaskToFinalize = taskToUpdate;
        setTasks(currentTasks =>
          currentTasks.map(t => (t.id === dragTaskToFinalize!.id ? { ...dragTaskToFinalize! } : t))
        );
      } else {
        // Handle conflict: e.g., revert to original position or find nearest available slot (more complex)
        // For now, if there's a conflict on drop, we might just not update, or revert.
        // The live preview already tries to avoid this, but this is a final safeguard.
        // Reverting to original task position if drop results in conflict:
        const originalTask = tasks.find(t => t.id === draggingTask.task.id);
        if (originalTask) {
          setTasks(currentTasks => 
            currentTasks.map(t => (t.id === originalTask.id ? {...originalTask} : t))
          );
        }
        console.warn("Conflict detected on drag end, task reverted or not moved.");
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

      // Final conflict check for resize
      if (!hasConflict(rawPreviewTask.id, rawPreviewTask.dayOffset, finalStartHour, finalDuration)) {
        setTasks(currentTasks =>
          currentTasks.map(task =>
            task.id === rawPreviewTask.id
              ? { ...task, startHour: finalStartHour, duration: finalDuration, dayOffset: rawPreviewTask.dayOffset }
              : task
          )
        );
      } else {
        // Revert to original task state if conflict after resize
        const originalTask = tasks.find(t => t.id === rawPreviewTask.id);
        if (originalTask) {
            setTasks(currentTasks => 
                currentTasks.map(t => (t.id === originalTask.id ? {...originalTask} : t))
            );
        }
        console.warn("Conflict detected on resize end, task reverted or not resized.");
      }
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
  }, [draggingTask, resizingTask, setTasks, setDraggingTask, setResizingTask, MIN_TASK_DURATION, TIMELINE_START_HOUR, TIMELINE_END_HOUR, tasks, hasConflict]); // Added tasks and hasConflict

  // --- Task Interaction Handlers (Drag, Resize) ---

  const handleMouseMoveDrag = useCallback((e: MouseEvent) => {
    if (!draggingTask || !draggingTask.taskElement || !draggingTask.task) return;
    e.preventDefault();

    const { task: draggedTaskItem, taskElement, offsetX } = draggingTask;
    const currentOffsetX = offsetX || 0;

    let targetDayOffset: number | null = null;
    let targetPeriod: 'morning' | 'afternoon' | 'evening' | null = null;
    let relativeXInTimelineSegment = 0;
    let baseHourForCalc = TIMELINE_START_HOUR;

    const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
    let dropZone: HTMLElement | null = null;

    for (const elem of elementsUnderMouse) {
      const potentialDropZone = elem.closest('[data-testid^="timeline-area-"]') as HTMLElement;
      if (potentialDropZone) {
        dropZone = potentialDropZone;
        break;
      }
    }

    if (dropZone) {
      const dayOffsetAttr = dropZone.getAttribute('data-day-offset');
      const periodAttr = dropZone.getAttribute('data-section-period') as 'morning' | 'afternoon' | 'evening' | null;
      
      if (dayOffsetAttr && periodAttr) {
        targetDayOffset = parseInt(dayOffsetAttr, 10);
        targetPeriod = periodAttr;

        const rect = dropZone.getBoundingClientRect();
        relativeXInTimelineSegment = (e.clientX - rect.left) - currentOffsetX;

        switch (targetPeriod) {
          case 'morning': baseHourForCalc = TIMELINE_START_HOUR; break;
          case 'afternoon': baseHourForCalc = TIMELINE_SPLIT_HOUR_1; break;
          case 'evening': baseHourForCalc = TIMELINE_SPLIT_HOUR_2; break;
        }
      }
    }

    if (targetDayOffset !== null && targetPeriod !== null) {
      const hourInBlock = relativeXInTimelineSegment / PIXELS_PER_HOUR;
      let rawNewStartHour = baseHourForCalc + hourInBlock;
      const taskDuration = draggedTaskItem.duration || MIN_TASK_DURATION;
      
      rawNewStartHour = Math.max(TIMELINE_START_HOUR, rawNewStartHour);
      rawNewStartHour = Math.min(TIMELINE_END_HOUR - taskDuration, rawNewStartHour);
      
      const DEAD_ZONE_THRESHOLD_HOURS = 2 / 60; 
      const MAGNETIC_THRESHOLD_HOURS = 3 / 60; 
      const nearestSnapPoint = Math.round(rawNewStartHour * 4) / 4;

      let effectiveStartHour = rawNewStartHour; 
      const deltaToSnap = rawNewStartHour - nearestSnapPoint;

      if (Math.abs(deltaToSnap) <= DEAD_ZONE_THRESHOLD_HOURS) {
        effectiveStartHour = nearestSnapPoint;
      } else if (Math.abs(deltaToSnap) <= MAGNETIC_THRESHOLD_HOURS) {
        effectiveStartHour = nearestSnapPoint;
      }

      setDraggingTask(prev => {
        if (!prev || !prev.task) return null;
        return {
          ...prev,
          task: {
            ...prev.task,
            dayOffset: targetDayOffset as number,
            startHour: effectiveStartHour,
          }
        };
      });
    }
  }, [
    draggingTask, 
    setDraggingTask, 
    // Constants like PIXELS_PER_HOUR, TIMELINE_START_HOUR etc. are defined in the hook's outer scope
    // TIMELINE_SPLIT_HOUR_1, TIMELINE_SPLIT_HOUR_2 are now also defined in the hook's outer scope
    // MIN_TASK_DURATION, TIMELINE_END_HOUR are also in outer scope
  ]);

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

  // Effect to add and remove global mouse up listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('mouseup', handleMouseUpGlobal);
        return () => {
            window.removeEventListener('mouseup', handleMouseUpGlobal);
        };
    }
  }, [handleMouseUpGlobal]);

  // Placeholder for where the *correct* handleMouseMoveDrag should be modified later.
  // If the reapply inserted a NEW handleMouseMoveDrag at the top, we'd need to remove that one too.
  // But let's assume for now the original one is still somewhere in the file.

  // --- ORIGINAL handleMouseMoveDrag (or the one that was there before reapply if it was overwritten) ---
  // This is where the simplified snap logic will eventually go.

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