"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui";
import { Pin, Eye, Trash2, Calendar, Clock, Edit3, PinOff, Scissors, X, Plus, ChevronDown, Bookmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { formatTime, formatDuration } from '@/utils/formatters';
import { MiniSchedulerCalendar } from '../calendar/MiniSchedulerCalendar';
import { Task, PinnedTask } from '../../types/planner';
import { TaskInboxSidebar } from './TaskInboxSidebar';
import { PinnedTasksSidebar } from './PinnedTasksSidebar';
import { DailyEventsContainer } from './DailyEventsContainer';
import { TaskAssignmentCalendar } from './TaskAssignmentCalendar';
import { MonthlyTimelineView } from '../calendar/MonthlyTimelineView';
import { useDailyPlanner } from '../../hooks/useDailyPlannerState';
import { useCalendarData } from '../../hooks/useCalendarData';
import { 
    TASK_COLORS, 
    TIMELINE_START_HOUR as APP_TIMELINE_START_HOUR,
    TIMELINE_END_HOUR as APP_TIMELINE_END_HOUR,
    MIN_TASK_DURATION as APP_MIN_TASK_DURATION,
    PIXELS_PER_HOUR as APP_PIXELS_PER_HOUR,
    TIMELINE_COLUMN_HEIGHT,
    TASK_BASE_TOP,
    TASK_BASE_BOTTOM_PADDING,
    TIMELINE_SPLIT_HOUR_1 as APP_TIMELINE_SPLIT_HOUR_1,
    TIMELINE_SPLIT_HOUR_2 as APP_TIMELINE_SPLIT_HOUR_2,
    TIMELINE_SPLIT_HOUR_3 as APP_TIMELINE_SPLIT_HOUR_3,
    DEFAULT_TASK_COLOR_INDEX
} from '../../lib/constants';
import { MemoizedTaskCard } from './TaskCard';
import { EditTaskModal } from './EditTaskModal';
import { ViewTaskNotesModal } from './ViewTaskNotesModal';
import { getCalendarDateForColumn, getDateKey, dateFromDateKey } from '../../utils/dateUtils';
import { resolveCollisionsForResize, resolveCollisionsForDrag } from '../../utils/taskUtils';
import WeeklyView from './WeeklyView';

import { useModalManager } from '../../hooks/useModalManager';
import { useViewMode } from '@/app/context/ViewModeContext';
import TaskStorage from '../../utils/storage';

type TimelinePeriod = 'night' | 'morning' | 'afternoon' | 'evening';

export default function DailyPlanner() {
  const { viewMode, setViewMode } = useViewMode();
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const {
    tasksByDate,
    poolTasks: combinedPoolTasks,
    generalPoolTasks,
    currentDayPoolTasks,
    pinnedTasks,
    activeSidebarTab,
    topDayOffset,
    bottomDayOffset,
    getDateLabel,
    setTopDayOffset,
    setBottomDayOffset,
    setActiveSidebarTab,
    draggingTask,
    setDraggingTask,
    resizingTask,
    setResizingTask,
    copyingTaskData,
    handleDeleteTask,
    openEditModal,
    handleActualAddPoolTask,
    handleDeletePoolTask,
    clearPool,
    handlePinTask,
    handleUnpinTask,
    formatTimeRemaining,
    startCopy,
    cancelCopy,
    handleDropCopy,
    cloneDayTasks,
    isTaskPoolOpen,
    setIsTaskPoolOpen,
    isClient,
    getRelativeDayLabel,
    handleCopyAndEnterPasteMode,
    viewingTaskNotes, 
    openViewNotesModal, 
    closeViewNotesModal,
    clearOverduePinnedTasks,
    syncPinnedTasksWithTimeline,
    handleTaskColorChange,
    copyTaskToPool,
    handleAssignTask,
    handleUnassignTask,
    handleRescheduleTask,
    addPoolTaskForDate,
    getPoolTasksForDate,
    removePoolTaskForDate,
    getCombinedPoolTasks,
    addPoolTask,
    removePoolTask,
    handleAddTask,
    handleUpdateTask,
    targetCopyDayOffset,
    showClearPoolConfirmation,
    activeEditModalTask,
    timelineScrollRef,
    cloneConflictStrategy,
    PIXELS_PER_MINUTE,
    setCopyingTaskData,
    setTargetCopyDayOffset,
    setCloneConflictStrategy,
    getOrderedDayOffsets,
    handleTaskCompletionToggle,
    handleMouseUpGlobal,
    moveTaskFromPool,
    poolTasksByDate,
    closeEditModal,
    saveTaskFromModal,
    createPoolTask,
    createPoolTaskForDate,
    createQuickTask,
    handleDropFromPool,
    savedDays,
    saveSavedDay,
    deleteSavedDay,
    renameSavedDay,
    applySavedDay,
  } = useDailyPlanner();

  // Calendar data for events and periods
  const {
    data: calendarData,
  } = useCalendarData();

  const currentViewDateKey = useMemo(() => getDateKey(getCalendarDateForColumn(topDayOffset)), [topDayOffset]);



  const [currentTimeForMarker, setCurrentTimeForMarker] = useState(new Date());
  const [savingName, setSavingName] = useState('');
  
  // Get current date key for saved days functionality
  const currentDateKey = useMemo(() => getCalendarDateForColumn(topDayOffset), [topDayOffset]);

  useEffect(() => {
      const timerId = setInterval(() => setCurrentTimeForMarker(new Date()), 60000);
      return () => clearInterval(timerId);
  }, []);

  // Scroll to calendar when monthly view is activated
  useEffect(() => {
    if (viewMode === 'monthly' && calendarContainerRef.current) {
      // Small delay to ensure the view has rendered
      setTimeout(() => {
        calendarContainerRef.current?.scrollIntoView({ 
          behavior: 'auto',
          block: 'start' 
        });
      }, 50);
    }
  }, [viewMode]);

  // Developer utilities for cleaning up sample tasks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).TaskStorage = TaskStorage;
      (window as any).inspectTasks = TaskStorage.inspectStoredTasks;
      (window as any).removeSampleTasks = TaskStorage.removeSampleTasks;
      (window as any).debugPoolTasksByDate = () => {
        console.log('🗂️ Current poolTasksByDate Map:');
        poolTasksByDate.forEach((tasks, dateKey) => {
          console.log(`  ${dateKey}:`, tasks.map(t => ({ id: t.id, name: t.name, baseDate: t.baseDate })));
        });
        console.log('📋 General pool tasks:', generalPoolTasks.map(t => ({ id: t.id, name: t.name, baseDate: t.baseDate })));
      };
      console.log('🛠️ Developer utilities loaded:');
      console.log('  - inspectTasks() - See all stored tasks');
      console.log('  - removeSampleTasks() - Remove sample tasks');
      console.log('  - debugPoolTasksByDate() - See pool tasks by date');
    }
  }, [poolTasksByDate, generalPoolTasks]);

  // Comprehensive delete handler for all task types
  const handleDeleteAnyTask = useCallback((task: Task) => {
    console.log('🗑️ DELETE DEBUG: handleDeleteAnyTask called with task:', {
      id: task.id,
      name: task.name,
      startHour: task.startHour,
      baseDate: task.baseDate,
      poolDate: (task as any).poolDate,
      hasStartHour: task.startHour !== undefined,
      hasBaseDate: !!task.baseDate,
      hasPoolDate: !!(task as any).poolDate
    });

    // Determine task type more accurately
    const hasPoolDate = !!(task as any).poolDate;
    const hasStartHour = task.startHour !== undefined;
    const hasBaseDate = !!task.baseDate && task.baseDate !== '';
    
    // Task type classification
    const isScheduledTask = hasStartHour && hasBaseDate && !hasPoolDate;
    const isDateSpecificPoolTask = hasPoolDate;
    const isGeneralPoolTask = !hasStartHour && (!hasBaseDate || task.baseDate === '') && !hasPoolDate;
    
    console.log('🗑️ DELETE DEBUG: Task classification:', {
      isScheduledTask,
      isDateSpecificPoolTask,
      isGeneralPoolTask,
      taskType: isScheduledTask ? 'scheduled' : isDateSpecificPoolTask ? 'date-pool' : isGeneralPoolTask ? 'general-pool' : 'unknown'
    });
    
    if (isScheduledTask) {
      console.log('🗑️ DELETE DEBUG: Deleting scheduled task via handleDeleteTask');
      handleDeleteTask(task.id);
    } else if (isDateSpecificPoolTask) {
      console.log('🗑️ DELETE DEBUG: Deleting date-specific pool task via removePoolTaskForDate');
      const poolDateKey = (task as any).poolDate;
      removePoolTaskForDate(poolDateKey, task.id);
    } else if (isGeneralPoolTask) {
      console.log('🗑️ DELETE DEBUG: Deleting general pool task via handleDeletePoolTask');
      handleDeletePoolTask(task.id);
    } else {
      // Fallback: try to determine the best deletion method
      console.warn('🗑️ DELETE DEBUG: Unknown task type, using fallback logic');
      if (hasStartHour) {
        console.log('🗑️ DELETE DEBUG: Fallback to scheduled task deletion');
        handleDeleteTask(task.id);
      } else if (hasBaseDate) {
        console.log('🗑️ DELETE DEBUG: Fallback to date-specific pool task deletion');
        removePoolTaskForDate(task.baseDate, task.id);
      } else {
        console.log('🗑️ DELETE DEBUG: Fallback to general pool task deletion');
        handleDeletePoolTask(task.id);
      }
    }
  }, [handleDeleteTask, handleDeletePoolTask, removePoolTaskForDate]);

  const handleResizeStart = (task: Task, edge: 'start' | 'end', e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    cancelCopy(); 
    setDraggingTask(null); 
    document.body.style.cursor = 'col-resize';
    if (task) {
        setResizingTask({ 
             task: { ...task }, 
             edge,
             initialMouseX: e.clientX,
             initialStartHour: task.startHour,
             initialDuration: task.duration,
        });
    }
  };

  const handleMouseMoveResize = useCallback((e: MouseEvent) => {
    if (!resizingTask) return;
    e.preventDefault();

    const { task: originalTaskAtResizeStart, edge, initialMouseX, initialStartHour, initialDuration } = resizingTask;
    
    const dx = e.clientX - initialMouseX;
    const dHours = dx / APP_PIXELS_PER_HOUR;

    let livePreviewStartHour = initialStartHour;
    let livePreviewDuration = initialDuration;

    if (edge === 'start') {
        let rawNewStartHour = initialStartHour + dHours;
        const nearestSnapPoint = Math.round(rawNewStartHour * 4) / 4;
        livePreviewStartHour = nearestSnapPoint;
        livePreviewDuration = (initialStartHour + initialDuration) - livePreviewStartHour;
    } else {
        let rawNewEndHour = (initialStartHour + initialDuration) + dHours;
        const nearestSnapPoint = Math.round(rawNewEndHour * 4) / 4;
        livePreviewDuration = nearestSnapPoint - initialStartHour;
    }

          const resizeDateKey = originalTaskAtResizeStart.baseDate; // Already in YYYY-MM-DD format
    
    const collisionResult = resolveCollisionsForResize(
      { 
        id: originalTaskAtResizeStart.id, 
        baseDate: originalTaskAtResizeStart.baseDate,
        initialStartHour: initialStartHour, 
        initialDuration: initialDuration 
      },
      livePreviewStartHour, 
      livePreviewDuration, 
      tasksByDate.get(resizeDateKey) || [],
      edge
    );

    livePreviewStartHour = collisionResult.startHour;
    livePreviewDuration = collisionResult.duration;

    livePreviewDuration = Math.max(APP_MIN_TASK_DURATION, livePreviewDuration);

    if (edge === 'start') {
        const originalTaskEnd = initialStartHour + initialDuration;
        livePreviewStartHour = Math.min(livePreviewStartHour, originalTaskEnd - APP_MIN_TASK_DURATION);
        livePreviewStartHour = Math.max(APP_TIMELINE_START_HOUR, livePreviewStartHour);
        livePreviewDuration = originalTaskEnd - livePreviewStartHour;
    } else {
        livePreviewDuration = Math.min(livePreviewDuration, APP_TIMELINE_END_HOUR - livePreviewStartHour);
    }
    
    livePreviewStartHour = Math.max(APP_TIMELINE_START_HOUR, livePreviewStartHour);
    livePreviewDuration = Math.max(APP_MIN_TASK_DURATION, Math.min(livePreviewDuration, APP_TIMELINE_END_HOUR - livePreviewStartHour));

    setResizingTask(prev => {
      if (!prev) return null;
      if (prev.task.startHour === livePreviewStartHour && prev.task.duration === livePreviewDuration) {
        return prev;
      }
      return {
        ...prev, 
        task: { 
          ...prev.task, 
          startHour: livePreviewStartHour,
          duration: livePreviewDuration,
        }
      };
    });
  }, [resizingTask, tasksByDate, setResizingTask]);

  const handleMouseMoveDrag = useCallback((e: MouseEvent) => {
    if (!draggingTask || !draggingTask.task) return;
    e.preventDefault();

    const { task: draggedTaskItem, offsetX } = draggingTask;
    const currentOffsetX = offsetX || 0;

    let targetDayOffset: number | null = null;
    let targetPeriod: TimelinePeriod | null = null;
    let relativeXInTimelineSegment = 0;
    let baseHourForCalc = APP_TIMELINE_START_HOUR;

    // Use elementFromPoint to find the element underneath the mouse cursor
    const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    const dropZone = elementUnderMouse?.closest('[data-testid^="timeline-area-"]') as HTMLElement;

    if (dropZone) {
      const dayOffsetAttr = dropZone.getAttribute('data-day-offset');
      const periodAttr = dropZone.getAttribute('data-section-period') as TimelinePeriod | null;
      
      if (dayOffsetAttr && periodAttr) {
        targetDayOffset = parseInt(dayOffsetAttr, 10);
        targetPeriod = periodAttr;
        const rect = dropZone.getBoundingClientRect();
        relativeXInTimelineSegment = (e.clientX - rect.left) - currentOffsetX;

        switch (targetPeriod) {
          case 'night': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
          case 'morning': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
          case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
          case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_3; break;
        }
      }
    }

    if (targetDayOffset !== null) {
      const hourInBlock = relativeXInTimelineSegment / APP_PIXELS_PER_HOUR;
      let newStartHour = baseHourForCalc + hourInBlock;
      const taskDuration = draggedTaskItem.duration || APP_MIN_TASK_DURATION;
      newStartHour = Math.max(APP_TIMELINE_START_HOUR, newStartHour);
      newStartHour = Math.min(APP_TIMELINE_END_HOUR - taskDuration, newStartHour);
      
      let snappedNewStartHour = Math.round(newStartHour * 4) / 4;

      const targetDateKey = getCalendarDateForColumn(targetDayOffset);
      const tasksForTargetDate = tasksByDate.get(targetDateKey) || [];
      
      const collisionResult = resolveCollisionsForDrag(
        { id: draggedTaskItem.id, duration: taskDuration, baseDate: draggedTaskItem.baseDate },
        snappedNewStartHour,
        targetDateKey,
        tasksForTargetDate,
        APP_TIMELINE_START_HOUR,
        APP_TIMELINE_END_HOUR
      );

      if (collisionResult.canMove) {
        setDraggingTask(prev => {
          if (!prev || !prev.task) return null;
          if (prev.task.startHour === collisionResult.snappedNewStartHour && prev.task.baseDate === targetDateKey) {
            return prev;
          }
          return { ...prev, task: { ...prev.task, startHour: collisionResult.snappedNewStartHour, baseDate: targetDateKey } };
        });
      }
    }
  }, [draggingTask, setDraggingTask, tasksByDate]);

  const handleMouseUp = useCallback(() => {
    if (draggingTask && draggingTask.task) {
        saveTaskFromModal(draggingTask.task, { isNew: false }); 
        setDraggingTask(null);
    }
    
    if (resizingTask && resizingTask.task) {
        saveTaskFromModal(resizingTask.task, { isNew: false });
        setResizingTask(null);
    }
    
    document.body.style.cursor = '';
  }, [draggingTask, resizingTask, saveTaskFromModal, setDraggingTask, setResizingTask]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (resizingTask) {
        handleMouseMoveResize(event);
      }
      if (draggingTask) {
        handleMouseMoveDrag(event); 
      }
    };

    const onMouseUp = () => {
        handleMouseUp();
    };

    if (draggingTask || resizingTask) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = draggingTask ? 'grabbing' : 'col-resize';
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggingTask, resizingTask, handleMouseMoveResize, handleMouseMoveDrag, handleMouseUp]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dayOffset: number, period: TimelinePeriod) => {
    e.preventDefault();
    const taskDataString = e.dataTransfer.getData('text/plain');
    if (!taskDataString) return;

    try {
      const taskData = JSON.parse(taskDataString);
      if (taskData.source !== 'pool') return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;

      let baseHourForCalc: number;
      switch (period) {
        case 'night': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
        case 'morning': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
        case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
        case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_3; break;
      }

      const hourInBlock = x / APP_PIXELS_PER_HOUR;
      const snappedNewStartHour = Math.round((baseHourForCalc + hourInBlock) * 4) / 4;

      const targetDateKey = getCalendarDateForColumn(dayOffset);
      const targetDate = dateFromDateKey(targetDateKey);

      handleDropFromPool(taskData, targetDate, snappedNewStartHour);

    } catch (err) {
      console.error("Failed to handle drop", err);
    }
  };

  const renderTimeline = useCallback((period: TimelinePeriod) => {
    let startHour, endHour;
    switch (period) {
      case 'night': startHour = APP_TIMELINE_START_HOUR; endHour = APP_TIMELINE_SPLIT_HOUR_1; break;
      case 'morning': startHour = APP_TIMELINE_SPLIT_HOUR_1; endHour = APP_TIMELINE_SPLIT_HOUR_2; break;
      case 'afternoon': startHour = APP_TIMELINE_SPLIT_HOUR_2; endHour = APP_TIMELINE_SPLIT_HOUR_3; break;
      case 'evening': startHour = APP_TIMELINE_SPLIT_HOUR_3; endHour = APP_TIMELINE_END_HOUR; break; 
    }
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    return (
      <div className="flex h-6 sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 z-20">
        {timelineHours.map((hour) => (
          <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground py-1 px-1 border-l border-border/20" style={{ width: `${APP_PIXELS_PER_HOUR}px` }}>
            <div className={`font-medium ${hour % 6 === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatTime(hour)}
            </div>
          </div>
        ))}
        <div key={`timeline-end-marker-${period}`} className="flex-none border-l border-border/20" style={{ width: `1px` }}></div>
      </div>
    );
  }, []); 

  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>, dayOffset: number, period: TimelinePeriod) => {
      if (copyingTaskData) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickXrelative = e.clientX - rect.left;
      let baseHourForCalc: number;
      switch (period) {
          case 'night': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
          case 'morning': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
          case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
          case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_3; break;
      }
      const hourInBlock = (clickXrelative / APP_PIXELS_PER_HOUR);
      const snappedNewStartHour = Math.round((baseHourForCalc + hourInBlock) * 4) / 4;
      const targetDateKey = getCalendarDateForColumn(dayOffset);

      const newTaskDefaults: Task = {
          id: `temp-new-task-${Date.now()}`,
          name: "New Task", 
          startHour: snappedNewStartHour,
          duration: 1,
          baseDate: targetDateKey, // Use YYYY-MM-DD format directly
          color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX],
          notes: "",
          completed: false,
      };
      openEditModal(newTaskDefaults, { isNew: true });
  };
  
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, dayOffset: number, period: TimelinePeriod) => {
      if (!copyingTaskData) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickXrelative = e.clientX - rect.left;
      let baseHourForCalc: number;
      switch (period) {
          case 'night': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
          case 'morning': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
          case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
          case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_3; break;
      }
      const hourInBlock = clickXrelative / APP_PIXELS_PER_HOUR;
      const snappedNewStartHour = Math.round((baseHourForCalc + hourInBlock) * 4) / 4;
      const targetDateKey = getCalendarDateForColumn(dayOffset);
      // Convert string back to Date for handleDropCopy compatibility
      const targetDate = new Date(targetDateKey + 'T00:00:00.000');
      handleDropCopy(targetDate, snappedNewStartHour);
  };

  const handleDragStart = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    cancelCopy();
    setResizingTask(null);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    
    setDraggingTask({ 
      task: { ...task }, 
      offsetX,
      initialMouseY: e.clientY,
      initialStartHour: task.startHour,
      taskElement: null,
      originalBaseDate: task.baseDate // Store the original date when drag starts
    });
  };

  const handleClearDay = (dayOffset: number) => {
    const dateToClear = getCalendarDateForColumn(dayOffset);
    // ... existing code ...
  };

  const renderDayColumn = useMemo(() => (dayOffset: number, period: TimelinePeriod) => {
    let startHour, endHour;
    switch (period) {
        case 'night': 
            startHour = APP_TIMELINE_START_HOUR; 
            endHour = APP_TIMELINE_SPLIT_HOUR_1; 
            break;
        case 'morning': 
            startHour = APP_TIMELINE_SPLIT_HOUR_1; 
            endHour = APP_TIMELINE_SPLIT_HOUR_2; 
            break;
        case 'afternoon': 
            startHour = APP_TIMELINE_SPLIT_HOUR_2; 
            endHour = APP_TIMELINE_SPLIT_HOUR_3; 
            break;
        case 'evening': 
            startHour = APP_TIMELINE_SPLIT_HOUR_3; 
            endHour = APP_TIMELINE_END_HOUR; 
            break;
    }

    const dateKey = getCalendarDateForColumn(dayOffset);
    const tasksForThisColumnDate = tasksByDate.get(dateKey) || [];
    
    // Filter out the original task if it's being dragged
    let tasksToDisplay = tasksForThisColumnDate.filter(task => {
        return !(draggingTask && draggingTask.task.id === task.id);
    });

    // If a task is being dragged, check if it belongs in this column
    if (draggingTask) {
        const draggedTaskDateKey = draggingTask.task.baseDate; // baseDate is already YYYY-MM-DD
        if (draggedTaskDateKey === dateKey) {
            tasksToDisplay.push(draggingTask.task);
        }
    }
    
    const tasksToRender = tasksToDisplay.filter(t => {
        const taskStart = t.startHour;
        const taskEnd = taskStart + t.duration;
        return taskEnd > startHour && taskStart < endHour;
    });

    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;

    let currentTimeMarker = null;
    if (dayOffset === 0) {
        const now = currentTimeForMarker;
        const currentHourFloat = now.getHours() + now.getMinutes() / 60;
        if (currentHourFloat >= startHour && currentHourFloat < endHour) {
            const markerLeft = (currentHourFloat - startHour) * APP_PIXELS_PER_HOUR;
            currentTimeMarker = (
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none" style={{ left: `${markerLeft}px` }} title={`Current time: ${formatTime(currentHourFloat)}`}>
                    <div style={{ 
                        position: 'absolute',
                        top: '0px',
                        left: '-3.75px',
                        width: '0', 
                        height: '0', 
                        borderLeft: '4px solid transparent', 
                        borderRight: '4px solid transparent', 
                        borderTop: '6px solid #ef4444' 
                    }} />
                </div>
            );
        }
    }

    return (
      <div className={`relative w-full flex flex-col ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500' : ''}`}
        style={{ minWidth: `${APP_PIXELS_PER_HOUR * (endHour - startHour)}px`, height: `${TIMELINE_COLUMN_HEIGHT}px` }}
      >
        {renderTimeline(period)}
        <div className={`relative flex-grow bg-background pt-6 ${isTargetCopyDay ? 'cursor-copy' : ''}`}
          data-testid={`timeline-area-${dayOffset}-${period}`}
          data-day-offset={dayOffset}
          data-section-period={period}
          onClick={(e) => handleTimelineClick(e, dayOffset, period)}
          onDoubleClick={(e) => handleTimelineDoubleClick(e, dayOffset, period)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, dayOffset, period)}
          onMouseEnter={() => {
            if (copyingTaskData) {
              setTargetCopyDayOffset(dayOffset);
            }
          }}
          onMouseLeave={() => {
            if (copyingTaskData) {
              setTargetCopyDayOffset(null);
            }
          }}
        >
          {currentTimeMarker}
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <div key={`grid-${i}`} className={`absolute h-full ${i % 6 === 0 ? 'border-l border-border/30' : 'border-l border-border/10'}`} style={{ left: `${i * APP_PIXELS_PER_HOUR}px`, top: '0', bottom: '0' }} />
          ))}
          {tasksToRender.map((task) => {
              // The task object from tasksToRender is now always the correct one to display
              const displayTask = resizingTask?.task.id === task.id ? resizingTask.task : task;

              const isBeingDragged = draggingTask?.task.id === displayTask.id;
              const isBeingResized = resizingTask?.task.id === displayTask.id;
              const isBeingCopied = copyingTaskData?.id === displayTask.id;
              
              const taskStartRelativeToSection = Math.max(0, displayTask.startHour - startHour);
              const taskEndRelativeToSection = Math.min(endHour - startHour, (displayTask.startHour + displayTask.duration) - startHour);
              const renderLeft = taskStartRelativeToSection * APP_PIXELS_PER_HOUR;
              const renderWidth = (taskEndRelativeToSection - taskStartRelativeToSection) * APP_PIXELS_PER_HOUR;
              
              if (renderWidth <= 0 && !isBeingDragged) return null;
              
              const taskStyle: React.CSSProperties = {
                left: `${renderLeft}px`,
                width: `${renderWidth}px`,
                top: `${TASK_BASE_TOP}px`,
                height: `${TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}px`,
                zIndex: isBeingDragged || isBeingResized ? 50 : 40,
                cursor: isBeingDragged ? 'grabbing' : (isBeingResized ? 'col-resize' : 'grab'),
                pointerEvents: isBeingDragged ? 'none' : 'auto',
              };

              return (
                <div key={displayTask.id}
                  className={`absolute ${isBeingDragged || isBeingResized ? 'opacity-90' : ''} ${isBeingCopied ? 'ring-2 ring-blue-500' : ''}`} 
                  style={taskStyle}
                >
                    <MemoizedTaskCard
                        task={displayTask}
                        height={TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}
                        onStartEdit={(taskToEdit, options) => openEditModal(taskToEdit, options)} 
                        onCopy={startCopy} 
                        onViewNotes={openViewNotesModal}
                        onResizeStart={(edge, e) => handleResizeStart(displayTask, edge, e)}
                        onDragStart={handleDragStart}
                        currentTime={currentTimeForMarker}
                    />
                </div>
              );
          })}
        </div>
      </div>
    );
  }, [tasksByDate, draggingTask, resizingTask, copyingTaskData, currentTimeForMarker, handleDropCopy, openEditModal, startCopy, openViewNotesModal, renderTimeline, targetCopyDayOffset, handleDragStart]);
  
  const deleteTaskHandlerForModal = (taskId: string, isFromPool?: boolean) => {
    console.log('🗑️ MODAL DELETE DEBUG: deleteTaskHandlerForModal called with:', {
      taskId,
      isFromPool,
      context: 'EditTaskModal delete button'
    });

    // Find the task to get full context for proper deletion
    let task: Task | undefined;
    
    // Search in scheduled tasks by iterating through the Map
    tasksByDate.forEach((tasksForDate, dateKey) => {
      if (!task) {
        task = tasksForDate.find((t: Task) => t.id === taskId);
      }
    });
    
    // If not found, search in pool tasks
    if (!task) {
      task = combinedPoolTasks.find((t: Task) => t.id === taskId) ||
             currentDayPoolTasks.find((t: Task) => t.id === taskId);
    }
    
    if (task) {
      console.log('🗑️ MODAL DELETE DEBUG: Found task, using comprehensive delete handler');
      handleDeleteAnyTask(task);
    } else {
      console.warn('🗑️ MODAL DELETE DEBUG: Task not found, falling back to legacy logic');
      if (isFromPool) {
        if (handleDeletePoolTask) handleDeletePoolTask(taskId);
      } else {
        handleDeleteTask(taskId);
      }
    }
  };

  const handleNavigateToDaily = useCallback((targetDate: Date) => {
    // Calculate the day offset from today to the target date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const dayOffset = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Set the top day offset to show the target date
    setTopDayOffset(dayOffset);
    
    // Switch to daily view
    setViewMode('daily');
  }, [setTopDayOffset, setViewMode]);

  return (
    <div className="h-full bg-background text-foreground transition-colors">
      <div className="w-full mx-auto h-full">
        {activeEditModalTask && (
          <EditTaskModal
            taskToEdit={activeEditModalTask}
            onSave={saveTaskFromModal}
            onClose={closeEditModal}
            onColorChange={handleTaskColorChange}
            onPinTask={handlePinTask}
                          onMoveToInbox={copyTaskToPool}
            pinnedTasks={pinnedTasks}
            onDelete={deleteTaskHandlerForModal}
            onCopyAndEnterPasteMode={handleCopyAndEnterPasteMode}
          />
        )}
        {viewingTaskNotes && (
          <ViewTaskNotesModal task={viewingTaskNotes} onClose={closeViewNotesModal} onEdit={openEditModal} />
        )}



        {/* Conditional Content Based on View Mode */}
        {viewMode === 'daily' && (
          <>
            {/* Daily Events Container */}
            <DailyEventsContainer
              events={calendarData.events}
              periods={calendarData.periods}
              currentDate={dateFromDateKey(getCalendarDateForColumn(topDayOffset))}
              eventsOnly={true}
              showHeader={false}
            />

            {/* Unified Task Pool and Pinned Tasks View */}
            <div className="mb-4 bg-card border border-border shadow-sm overflow-hidden">
              {/* Collapsible Content */}
              {isTaskPoolOpen && (
                <div className="h-12 px-2 py-1">
                  <div className="flex items-center gap-3 h-full overflow-x-auto overflow-y-hidden scrollbar-hide">
                  
                  {/* Add to Pool Button */}
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const currentViewDate = new Date(today);
                        currentViewDate.setDate(today.getDate() + topDayOffset);
                        createPoolTaskForDate(currentViewDate);
                      }}
                      className="flex-shrink-0 w-8 h-8 bg-muted/30 border border-dashed border-muted-foreground/30 rounded-md hover:bg-muted/50 hover:border-muted-foreground/50 transition-all duration-150 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      title="Add Task to Pool"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Task Pool Tasks - Only Current Day */}

                  {/* Current Day Pool Tasks */}
                  {currentDayPoolTasks.map((task) => (
                    <div
                      key={`pool-${task.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ ...task, source: 'pool' }));
                      }}
                      className="relative px-2 py-1 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-150 group flex-shrink-0 h-8 min-w-[9rem] max-w-[12rem] cursor-grab active:cursor-grabbing rounded"
                    >
                                              <div className="flex items-center justify-between gap-2 h-full">
                          <p className="font-medium text-xs text-foreground truncate">
                            {task.name || "Untitled Task"}
                          </p>
                        {/* Action buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            className="h-4 w-4 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openViewNotesModal(task); }}
                            title="View Notes"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="h-4 w-4 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(task, { isFromPool: true }); }}
                            title="Edit Task"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="h-4 w-4 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              
                              console.log('🗑️ POOL DELETE DEBUG: Pool task delete button clicked for task:', {
                                id: task.id,
                                name: task.name,
                                baseDate: task.baseDate,
                                poolDate: (task as any).poolDate
                              });
                              
                              // Use the comprehensive delete handler
                              handleDeleteAnyTask(task);
                            }}
                            title="Delete Task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pinned Tasks */}
                  {pinnedTasks
                    .sort((a, b) => {
                      const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
                      const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map((task) => {
                      const timeRemaining = formatTimeRemaining(task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate));
                      return (
                        <div
                          key={`pinned-${task.id}`}
                          className="relative px-2 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-150 group flex-shrink-0 h-8 min-w-[9rem] max-w-[12rem] rounded"
                        >
                          <div className="flex items-center justify-between gap-2 h-full">
                            <div className="min-w-0">
                              <p className="font-medium text-xs text-foreground truncate leading-tight">
                                {task.name || "Untitled Task"}
                              </p>
                              <div className={`text-[10px] ${timeRemaining.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                {timeRemaining.text}
                              </div>
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="h-3 w-3 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openViewNotesModal(task); }}
                                title="View Notes"
                              >
                                <Eye className="w-1.5 h-1.5" />
                              </button>
                              <button
                                type="button"
                                className="h-3 w-3 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(task); }}
                                title="Edit Task"
                              >
                                <Edit3 className="w-1.5 h-1.5" />
                              </button>
                              <button
                                type="button"
                                className="h-3 w-3 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnpinTask(task.pinnedId); }}
                                title="Unpin Task"
                              >
                                <PinOff className="w-1.5 h-1.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {/* Clear Overdue Button - positioned at the far right */}
                  {pinnedTasks.some(task => {
                    const taskDueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
                    return formatTimeRemaining(taskDueDate).isOverdue;
                  }) && (
                    <div className="ml-auto flex items-center">
                      <button
                        type="button"
                        onClick={clearOverduePinnedTasks}
                        className="h-6 w-6 rounded-full bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/50 dark:border-red-800/50 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex items-center justify-center opacity-60 hover:opacity-100"
                        title="Clear all overdue pinned tasks"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Collapse Button - positioned at the far right */}
                  <div className="ml-auto flex items-center">
                    <button
                      onClick={() => setIsTaskPoolOpen(!isTaskPoolOpen)}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title={isTaskPoolOpen ? "Collapse" : "Expand"}
                    >
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isTaskPoolOpen && "rotate-180")} />
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Show collapse button when collapsed */}
              {!isTaskPoolOpen && (
                <div className="p-2">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsTaskPoolOpen(!isTaskPoolOpen)}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title={isTaskPoolOpen ? "Collapse" : "Expand"}
                    >
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isTaskPoolOpen && "rotate-180")} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6" ref={timelineScrollRef}>
                <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/95 backdrop-blur-sm">
                    <div className="flex items-center">
                      <Button variant="ghost" size="sm" onClick={() => setTopDayOffset(topDayOffset - 7)} title="Previous week">«</Button>
                      <Button variant="ghost" size="sm" onClick={() => setTopDayOffset(topDayOffset - 1)} title="Previous day">‹</Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="text-foreground font-medium text-center px-3 w-52 hover:underline"
                            title="Pick a date"
                          >
                            {isClient ? getDateLabel(topDayOffset) : "Loading..."}
                          </button>
                        </PopoverTrigger>
                        <PopoverPrimitive.Portal>
                          <PopoverContent className="p-0 w-auto !z-[9999]">
                            <MiniSchedulerCalendar
                              className="w-[280px]"
                              hideSelectedTasks
                              onDateSelect={(date) => {
                                const today = new Date();
                                today.setHours(0,0,0,0);
                                const d = new Date(date);
                                d.setHours(0,0,0,0);
                                const dayOffset = Math.floor((d.getTime() - today.getTime()) / (1000*60*60*24));
                                setTopDayOffset(dayOffset);
                              }}
                            />
                          </PopoverContent>
                        </PopoverPrimitive.Portal>
                      </Popover>
                      <Button variant="ghost" size="sm" onClick={() => setTopDayOffset(topDayOffset + 1)} title="Next day">›</Button>
                      <Button variant="ghost" size="sm" onClick={() => setTopDayOffset(topDayOffset + 7)} title="Next week">»</Button>
                      {isClient && getRelativeDayLabel(topDayOffset) && (
                        <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded-sm">
                          {getRelativeDayLabel(topDayOffset)}
                        </span>
                      )}
                      {isClient && savedDays.some(saved => saved.dateKey === getCalendarDateForColumn(topDayOffset)) && (
                        <span 
                          className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/50 dark:border-blue-700/50 font-medium cursor-help shadow-sm"
                          title={`Template: ${savedDays.filter(saved => saved.dateKey === getCalendarDateForColumn(topDayOffset)).map(saved => saved.name).join(', ')}`}
                        >
                          📋 {savedDays.filter(saved => saved.dateKey === getCalendarDateForColumn(topDayOffset)).map(saved => saved.name).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Bookmark className="w-4 h-4" />
                            Saved Days
                          </Button>
                        </PopoverTrigger>
                        <PopoverPrimitive.Portal>
                          <PopoverContent className="w-80 !z-[9999]">
                          <div className="space-y-3">
                            {/* Save Current Day */}
                            <div>
                              <div className="text-sm font-medium mb-2">Save current day as template</div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Name (e.g. Morning Routine)"
                                  value={savingName}
                                  onChange={(e) => setSavingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && savingName.trim()) {
                                      saveSavedDay(savingName.trim(), currentDateKey);
                                      setSavingName('');
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (!savingName.trim()) return;
                                    saveSavedDay(savingName.trim(), currentDateKey);
                                    setSavingName('');
                                  }}
                                  disabled={!savingName.trim()}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>

                            {/* Saved Days List */}
                            <div>
                              <div className="text-sm font-medium mb-2">Apply saved day</div>
                              <div className="space-y-2 max-h-56 overflow-auto">
                                {savedDays.length === 0 ? (
                                  <div className="text-sm text-muted-foreground py-4 text-center">
                                    No saved days yet
                                  </div>
                                ) : (
                                  savedDays.map((savedDay) => (
                                    <div key={savedDay.id} className="flex items-center justify-between gap-2 p-2 border border-border rounded-lg">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">{savedDay.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {savedDay.dateKey} • {new Date(savedDay.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => applySavedDay(savedDay.id, currentDateKey, false)}
                                          title="Apply (add alongside existing tasks)"
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          Apply
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => applySavedDay(savedDay.id, currentDateKey, true)}
                                          title="Replace existing tasks with this template"
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          Replace
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            const newName = prompt('Rename saved day:', savedDay.name);
                                            if (newName && newName.trim()) {
                                              renameSavedDay(savedDay.id, newName.trim());
                                            }
                                          }}
                                          title="Rename"
                                          className="text-xs px-1 py-1 h-auto"
                                        >
                                          ✏️
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            // Calculate day offset from today to template date
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const templateDate = dateFromDateKey(savedDay.dateKey);
                                            const dayOffset = Math.floor((templateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                            
                                            // Navigate to that date
                                            setTopDayOffset(dayOffset);
                                            setBottomDayOffset(dayOffset);
                                          }}
                                          title="View/Edit template tasks"
                                          className="text-xs px-1 py-1 h-auto"
                                        >
                                          📝
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            if (confirm(`Delete saved day "${savedDay.name}"?`)) {
                                              deleteSavedDay(savedDay.id);
                                            }
                                          }}
                                          title="Delete"
                                          className="text-xs px-1 py-1 h-auto"
                                        >
                                          🗑️
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                          </PopoverContent>
                        </PopoverPrimitive.Portal>
                      </Popover>
                      <Button size="sm" onClick={() => openEditModal()}>
                        Add Task
                      </Button>
                    </div>
                  </div>
                  <div className="border border-border/20 rounded-b-lg overflow-hidden">
                    <div className="flex flex-col">
                        {renderDayColumn(topDayOffset, 'night')}
                        {renderDayColumn(topDayOffset, 'morning')}
                        {renderDayColumn(topDayOffset, 'afternoon')}
                        {renderDayColumn(topDayOffset, 'evening')}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/95 backdrop-blur-sm">
                    <div className="flex items-center">
                        <Button variant="ghost" size="sm" onClick={() => setBottomDayOffset(bottomDayOffset - 7)} title="Previous week">«</Button>
                        <Button variant="ghost" size="sm" onClick={() => setBottomDayOffset(bottomDayOffset - 1)} title="Previous day">‹</Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-foreground font-medium text-center px-3 w-52 hover:underline"
                              title="Pick a date"
                            >
                              {isClient ? getDateLabel(bottomDayOffset) : "Loading..."}
                            </button>
                          </PopoverTrigger>
                          <PopoverPrimitive.Portal>
                            <PopoverContent className="p-0 w-auto !z-[9999]">
                              <MiniSchedulerCalendar
                                className="w-[280px]"
                                hideSelectedTasks
                                onDateSelect={(date) => {
                                  const today = new Date();
                                  today.setHours(0,0,0,0);
                                  const d = new Date(date);
                                  d.setHours(0,0,0,0);
                                  const dayOffset = Math.floor((d.getTime() - today.getTime()) / (1000*60*60*24));
                                  setBottomDayOffset(dayOffset);
                                }}
                              />
                            </PopoverContent>
                          </PopoverPrimitive.Portal>
                        </Popover>
                        <Button variant="ghost" size="sm" onClick={() => setBottomDayOffset(bottomDayOffset + 1)} title="Next day">›</Button>
                        <Button variant="ghost" size="sm" onClick={() => setBottomDayOffset(bottomDayOffset + 7)} title="Next week">»</Button>
                        {isClient && getRelativeDayLabel(bottomDayOffset) && (
                            <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded-sm">
                            {getRelativeDayLabel(bottomDayOffset)}
                            </span>
                        )}
                        {isClient && savedDays.some(saved => saved.dateKey === getCalendarDateForColumn(bottomDayOffset)) && (
                          <span 
                            className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/50 dark:border-blue-700/50 font-medium cursor-help shadow-sm"
                            title={`Template: ${savedDays.filter(saved => saved.dateKey === getCalendarDateForColumn(bottomDayOffset)).map(saved => saved.name).join(', ')}`}
                          >
                            📋 {savedDays.filter(saved => saved.dateKey === getCalendarDateForColumn(bottomDayOffset)).map(saved => saved.name).join(', ')}
                          </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Bookmark className="w-4 h-4" />
                            Saved Days
                          </Button>
                        </PopoverTrigger>
                        <PopoverPrimitive.Portal>
                          <PopoverContent className="w-80 !z-[9999]">
                          <div className="space-y-3">
                            {/* Save Current Day */}
                            <div>
                              <div className="text-sm font-medium mb-2">Save current day as template</div>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Name (e.g. Morning Routine)"
                                  value={savingName}
                                  onChange={(e) => setSavingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && savingName.trim()) {
                                      saveSavedDay(savingName.trim(), getCalendarDateForColumn(bottomDayOffset));
                                      setSavingName('');
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (!savingName.trim()) return;
                                    saveSavedDay(savingName.trim(), getCalendarDateForColumn(bottomDayOffset));
                                    setSavingName('');
                                  }}
                                  disabled={!savingName.trim()}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>

                            {/* Saved Days List */}
                            <div>
                              <div className="text-sm font-medium mb-2">Apply saved day</div>
                              <div className="space-y-2 max-h-56 overflow-auto">
                                {savedDays.length === 0 ? (
                                  <div className="text-sm text-muted-foreground py-4 text-center">
                                    No saved days yet
                                  </div>
                                ) : (
                                  savedDays.map((savedDay) => (
                                    <div key={savedDay.id} className="flex items-center justify-between gap-2 p-2 border border-border rounded-lg">
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">{savedDay.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {savedDay.dateKey} • {new Date(savedDay.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => applySavedDay(savedDay.id, getCalendarDateForColumn(bottomDayOffset), false)}
                                          title="Apply (add alongside existing tasks)"
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          Apply
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => applySavedDay(savedDay.id, getCalendarDateForColumn(bottomDayOffset), true)}
                                          title="Replace existing tasks with this template"
                                          className="text-xs px-2 py-1 h-auto"
                                        >
                                          Replace
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            const newName = prompt('Rename saved day:', savedDay.name);
                                            if (newName && newName.trim()) {
                                              renameSavedDay(savedDay.id, newName.trim());
                                            }
                                          }}
                                          title="Rename"
                                          className="text-xs px-1 py-1 h-auto"
                                        >
                                          ✏️
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            // Calculate day offset from today to template date
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const templateDate = dateFromDateKey(savedDay.dateKey);
                                            const dayOffset = Math.floor((templateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                            
                                            // Navigate to that date
                                            setTopDayOffset(dayOffset);
                                            setBottomDayOffset(dayOffset);
                                          }}
                                          title="View/Edit template tasks"
                                          className="text-xs px-1 py-1 h-auto"
                                        >
                                          📝
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            if (confirm(`Delete saved day "${savedDay.name}"?`)) {
                                              deleteSavedDay(savedDay.id);
                                            }
                                          }}
                                          title="Delete"
                                          className="text-xs px-1 py-1 h-auto"
                                        >
                                          🗑️
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                          </PopoverContent>
                        </PopoverPrimitive.Portal>
                      </Popover>
                      <Button size="sm" onClick={() => cloneDayTasks(dateFromDateKey(getCalendarDateForColumn(bottomDayOffset)), dateFromDateKey(getCalendarDateForColumn(topDayOffset)))} title="Clone tasks to the other visible day">
                        Clone to {bottomDayOffset < topDayOffset ? 'Bottom' : 'Top'}
                      </Button>
                    </div>
                  </div>
                  <div className="border border-border/20 rounded-b-lg overflow-hidden">
                    <div className="flex flex-col">
                        {renderDayColumn(bottomDayOffset, 'night')}
                        {renderDayColumn(bottomDayOffset, 'morning')}
                        {renderDayColumn(bottomDayOffset, 'afternoon')}
                        {renderDayColumn(bottomDayOffset, 'evening')}
                    </div>
                  </div>
                </div>
            </div>
          </>
        )}

        {/* Weekly View */}
        {viewMode === 'weekly' && (
          <WeeklyView />
        )}



        {/* Monthly View */}
        {viewMode === 'monthly' && (
          <div ref={calendarContainerRef} className="h-[80vh]">
              <MonthlyTimelineView
                poolTasks={generalPoolTasks}
                scheduledTasks={tasksByDate}
                pinnedTasks={pinnedTasks}
                onAssignTask={handleAssignTask}
                onUnassignTask={handleUnassignTask}
                onRescheduleTask={handleRescheduleTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteAnyTask}
                getPoolTasksForDate={(dateKey) => {
                  const tasks = getPoolTasksForDate(dateKey);
                  console.log(`🔍 getPoolTasksForDate(${dateKey}):`, tasks.map(t => ({ id: t.id, name: t.name, baseDate: t.baseDate })));
                  return tasks;
                }}
                openEditModal={openEditModal}
                createPoolTask={createPoolTask}
                onNavigateToDaily={(date) => {
                  // Switch to daily view and navigate to the selected date
                  setViewMode('daily');
                  // Calculate day offset from today
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const targetDate = new Date(date);
                  targetDate.setHours(0, 0, 0, 0);
                  const dayOffset = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  setTopDayOffset(dayOffset);
                  setBottomDayOffset(dayOffset);
                }}
              />
            </div>
        )}


      </div>
    </div>
  );
} 