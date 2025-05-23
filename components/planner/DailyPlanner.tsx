"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from 'react-dom';
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Edit3, Copy, Pin, CopyPlus, Trash2, PinOff } from 'lucide-react';

import { formatDuration, formatTime } from '@/utils/formatters';
import { Task, PinnedTask } from '../../types/planner';
import { TaskPoolSidebar } from './TaskPoolSidebar';
import { PinnedTasksSidebar } from './PinnedTasksSidebar';
import { useDailyPlanner } from '../../hooks/useDailyPlannerState';
import { 
    TASK_COLORS, 
    TIMELINE_START_HOUR as APP_TIMELINE_START_HOUR, // Renamed to avoid conflict with local variables if any
    TIMELINE_END_HOUR as APP_TIMELINE_END_HOUR,
    MIN_TASK_DURATION as APP_MIN_TASK_DURATION,
    PIXELS_PER_HOUR as APP_PIXELS_PER_HOUR,
    PIXELS_PER_MINUTE as APP_PIXELS_PER_MINUTE,
    // Import new constants
    TIMELINE_COLUMN_HEIGHT,
    TASK_BASE_TOP,
    TASK_BASE_BOTTOM_PADDING,
    TIMELINE_SPLIT_HOUR_1 as APP_TIMELINE_SPLIT_HOUR_1,
    TIMELINE_SPLIT_HOUR_2 as APP_TIMELINE_SPLIT_HOUR_2,
    TIMELINE_HEADER_HEIGHT_PX,
    GRID_LINE_STYLE
} from '../../lib/constants';
import { TaskCard, MemoizedTaskCard } from './TaskCard';
import { EditTaskModal } from './EditTaskModal';
import { getCalendarDateForColumn, getDateWithoutTime, isSameCalendarDate } from '../../utils/dateUtils';
import { checkOverlap, resolveCollisionsForResize, resolveCollisionsForDrag } from '../../utils/taskUtils';

export default function DailyPlanner() {
  const {
    tasksByDate,
    poolTasks,
    pinnedTasks,
    activeSidebarTab,
    topDayOffset,
    bottomDayOffset,
    getDateLabel,
    setTopDayOffset,
    setBottomDayOffset,
    setPoolTasks,
    setPinnedTasks,
    setActiveSidebarTab,
    showClearPoolConfirmation,
    showCloneConfirmation,
    draggingTask,
    setDraggingTask,
    resizingTask,
    setResizingTask,
    copyingTaskData,
    setCopyingTaskData,
    targetCopyDayOffset,
    setTargetCopyDayOffset,
    colorPickerState,
    activeEditModalTask,
    handleAddTask,
    handleDeleteTask,
    handleUpdateTask,
    handleTaskColorChange,
    toggleColorPicker,
    handleTaskCompletionToggle,
    openEditModal,
    closeEditModal,
    saveTaskFromModal,
    handleActualAddPoolTask,
    copyTaskToPool,
    moveTaskFromPool,
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
    showClearPoolModal,
    showCloneModal,
    cancelCloneDay,
    cancelClearPool,
    isClient,
    getRelativeDayLabel,
  } = useDailyPlanner();

  const [currentTimeForMarker, setCurrentTimeForMarker] = useState(new Date());
  useEffect(() => {
      const timerId = setInterval(() => setCurrentTimeForMarker(new Date()), 60000); // Update every minute
      return () => clearInterval(timerId); // Cleanup on unmount
  }, []); // Empty dependency array ensures this runs only once on mount and cleans up on unmount

  const TASK_HEIGHT = TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING;

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const topDayTimelineRef = useRef<HTMLDivElement>(null);
  const bottomDayTimelineRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = (task: Task, edge: 'start' | 'end', e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (cancelCopy) cancelCopy(); 
    setDraggingTask(null); 
    
    document.body.style.cursor = 'col-resize';
    
    document.documentElement.classList.add('resize-active');
    
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
    const SNAP_THRESHOLD_HOURS = 2 / 60; // 2 minutes

    let livePreviewStartHour = initialStartHour;
    let livePreviewDuration = initialDuration;

    // Determine the calendar date of the task being resized.
    // const taskCalendarDate = getDateWithoutTime(originalTaskAtResizeStart.baseDate); // Now handled within resolveCollisionsForResize

    if (edge === 'start') {
        let rawNewStartHour = initialStartHour + dHours;
        const nearestSnapPoint = Math.round(rawNewStartHour * 4) / 4;
        if (Math.abs(rawNewStartHour - nearestSnapPoint) <= SNAP_THRESHOLD_HOURS) {
            rawNewStartHour = nearestSnapPoint;
        }
        livePreviewStartHour = rawNewStartHour;
        livePreviewDuration = (initialStartHour + initialDuration) - livePreviewStartHour;
    } else { // edge === 'end'
        let rawNewEndHour = (initialStartHour + initialDuration) + dHours;
        const nearestSnapPoint = Math.round(rawNewEndHour * 4) / 4;
        if (Math.abs(rawNewEndHour - nearestSnapPoint) <= SNAP_THRESHOLD_HOURS) {
            rawNewEndHour = nearestSnapPoint;
        }
        livePreviewDuration = rawNewEndHour - initialStartHour;
    }

    // Resolve collisions using the new helper function
    const collisionResult = resolveCollisionsForResize(
      { 
        id: originalTaskAtResizeStart.id, 
        baseDate: originalTaskAtResizeStart.baseDate,
        initialStartHour: initialStartHour, 
        initialDuration: initialDuration 
      },
      livePreviewStartHour, 
      livePreviewDuration, 
      tasksByDate.get(getDateWithoutTime(originalTaskAtResizeStart.baseDate).toISOString()) || [],
      edge
    );

    livePreviewStartHour = collisionResult.startHour;
    livePreviewDuration = collisionResult.duration;

    // --- Apply Minimal Constraints for Live Preview (to the potentially magnetically snapped AND collision-adjusted values) ---
    livePreviewDuration = Math.max(APP_MIN_TASK_DURATION, livePreviewDuration);

    if (edge === 'start') {
        const originalTaskEnd = initialStartHour + initialDuration;
        livePreviewStartHour = Math.min(livePreviewStartHour, originalTaskEnd - APP_MIN_TASK_DURATION);
        livePreviewStartHour = Math.max(APP_TIMELINE_START_HOUR, livePreviewStartHour);
        livePreviewDuration = originalTaskEnd - livePreviewStartHour; // Recalculate duration based on constrained start
        livePreviewDuration = Math.max(APP_MIN_TASK_DURATION, livePreviewDuration);
        livePreviewDuration = Math.min(livePreviewDuration, APP_TIMELINE_END_HOUR - livePreviewStartHour);
    } else { // edge === 'end'
        // livePreviewStartHour remains initialStartHour for end-edge resize (already set before collision check)
        livePreviewDuration = Math.min(livePreviewDuration, APP_TIMELINE_END_HOUR - livePreviewStartHour);
        livePreviewDuration = Math.max(APP_MIN_TASK_DURATION, livePreviewDuration);
    }

    // Final boundary checks for start hour and resulting duration
    livePreviewStartHour = Math.max(APP_TIMELINE_START_HOUR, livePreviewStartHour);
    livePreviewStartHour = Math.min(livePreviewStartHour, APP_TIMELINE_END_HOUR - APP_MIN_TASK_DURATION);
    livePreviewDuration = Math.max(APP_MIN_TASK_DURATION, Math.min(livePreviewDuration, APP_TIMELINE_END_HOUR - livePreviewStartHour));

    setResizingTask(prev => {
      if (!prev) return null;

      // Check if the snapped 15-min values have actually changed
      if (prev.task.startHour === livePreviewStartHour && prev.task.duration === livePreviewDuration) {
        return prev; // No change in 15-min interval, return previous state
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

  }, [resizingTask, APP_PIXELS_PER_HOUR, APP_MIN_TASK_DURATION, APP_TIMELINE_START_HOUR, APP_TIMELINE_END_HOUR, setResizingTask, tasksByDate]);

  /**
   * Handles mouse move events during a task drag operation.
   * Updates the `draggingTask` state with the new `startHour`, `baseDate` (absolute date of the target column),
   * and `dayOffset` (set to 0 relative to the new `baseDate`).
   * @param e - The mouse event.
   */
  const handleMouseMoveDrag = useCallback((e: MouseEvent) => {
    if (!draggingTask || !draggingTask.taskElement || !draggingTask.task) return;
    e.preventDefault();

    const { task: draggedTaskItem, taskElement, offsetX } = draggingTask;
    const currentOffsetX = offsetX || 0;

    let targetDayOffset: number | null = null;
    let targetPeriod: 'morning' | 'afternoon' | 'evening' | null = null;
    let relativeXInTimelineSegment = 0;
    let baseHourForCalc = APP_TIMELINE_START_HOUR;

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

        // Calculate the actual calendar date of the target column
        const targetCalendarDate = getCalendarDateForColumn(targetDayOffset as number);

        const rect = dropZone.getBoundingClientRect();
        relativeXInTimelineSegment = (e.clientX - rect.left) - currentOffsetX;

        switch (targetPeriod) {
          case 'morning': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
          case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
          case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
        }
      }
    }

    if (targetDayOffset !== null && targetPeriod !== null) {
      const hourInBlock = relativeXInTimelineSegment / APP_PIXELS_PER_HOUR;
      let newStartHour = baseHourForCalc + hourInBlock;

      const taskDuration = draggedTaskItem.duration || APP_MIN_TASK_DURATION;
      newStartHour = Math.max(APP_TIMELINE_START_HOUR, newStartHour);
      newStartHour = Math.min(APP_TIMELINE_END_HOUR - taskDuration, newStartHour);
      
      let snappedNewStartHourBeforeCollision = Math.round(newStartHour * 4) / 4;

      // Collision detection for dragging using the new helper function
      const targetColumnDate = getCalendarDateForColumn(targetDayOffset as number);
      
      const collisionResult = resolveCollisionsForDrag(
        { 
          id: draggedTaskItem.id, 
          duration: taskDuration, 
          baseDate: draggedTaskItem.baseDate 
        },
        snappedNewStartHourBeforeCollision,
        targetColumnDate,
        tasksByDate.get(targetColumnDate.toISOString()) || [],
        APP_TIMELINE_START_HOUR,
        APP_TIMELINE_END_HOUR
      );

      const { snappedNewStartHour, canMove } = collisionResult;

      if (canMove) {
        setDraggingTask(prev => {
          if (!prev || !prev.task) return null;
          
          let newBaseDateIso = prev.task.baseDate;
          let newDayOffset = prev.task.dayOffset;

          if (targetDayOffset !== null) {
            const currentTargetCalendarDate = getCalendarDateForColumn(targetDayOffset as number);
            newBaseDateIso = currentTargetCalendarDate.toISOString();
            newDayOffset = 0; 
          }

          // Check if snapped start hour or baseDate (column) has changed
          if (prev.task.startHour === snappedNewStartHour && prev.task.baseDate === newBaseDateIso) {
            return prev; // No change, return previous state
          }
          
          return {
            ...prev,
            task: {
              ...prev.task,
              startHour: snappedNewStartHour,
              baseDate: newBaseDateIso,
              dayOffset: newDayOffset, // Ensure it's set
            }
          };
        });
      }
    }
  }, [
    draggingTask, 
    setDraggingTask, 
    APP_PIXELS_PER_HOUR, 
    APP_TIMELINE_START_HOUR, 
    APP_TIMELINE_SPLIT_HOUR_1, 
    APP_TIMELINE_SPLIT_HOUR_2, 
    APP_TIMELINE_END_HOUR,
    APP_MIN_TASK_DURATION,
    tasksByDate
  ]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (resizingTask) handleMouseMoveResize(event);
      if (draggingTask) handleMouseMoveDrag(event); 
    };

    if (draggingTask) {
      document.body.style.cursor = 'grabbing';
      window.addEventListener('mousemove', onMouseMove);
    } else if (resizingTask) {
      // Use a more direct approach for cursor consistency
      document.body.style.cursor = 'col-resize'; 
      window.addEventListener('mousemove', onMouseMove);
      
      // Capture pointer events to ensure cursor remains consistent
      // This helps prevent the cursor from being affected by elements under it
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        // Reset styles when done resizing
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
      };
    } else {
      // Ensure cursor is reset if no drag or resize operation is active
      document.body.style.cursor = '';
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [draggingTask, resizingTask, handleMouseMoveResize, handleMouseMoveDrag]);

  const renderTimeline = useCallback((period: 'morning' | 'afternoon' | 'evening') => {
    let startHour, endHour;
    switch (period) {
      case 'morning': startHour = APP_TIMELINE_START_HOUR; endHour = APP_TIMELINE_SPLIT_HOUR_1; break;
      case 'afternoon': startHour = APP_TIMELINE_SPLIT_HOUR_1; endHour = APP_TIMELINE_SPLIT_HOUR_2; break;
      case 'evening': startHour = APP_TIMELINE_SPLIT_HOUR_2; endHour = APP_TIMELINE_END_HOUR; break; 
    }
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    return (
      <div className="flex h-8 border-b border-neutral-700 dark:border-neutral-800 sticky top-0 bg-neutral-900 dark:bg-neutral-900 z-20">
        {timelineHours.map((hour) => (
          <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-neutral-300 pt-1 pl-0.5 border-l border-neutral-700 dark:border-neutral-700" style={{ width: `${APP_PIXELS_PER_HOUR}px`, boxSizing: 'border-box' }}>
            {formatTime(hour)}
          </div>
        ))}
         <div key={`timeline-end-marker-${period}`} className="flex-none border-l-2 border-neutral-700 dark:border-neutral-700" style={{ width: `2px`, boxSizing: 'border-box' }}></div>
      </div>
    );
  }, [APP_PIXELS_PER_HOUR, APP_TIMELINE_START_HOUR, APP_TIMELINE_END_HOUR, APP_TIMELINE_SPLIT_HOUR_1, APP_TIMELINE_SPLIT_HOUR_2]); 

  /**
   * Renders a single column in the timeline for a specific day offset and period (morning, afternoon, evening).
   * Filters tasks to display only those that belong to the column's calendar date and fall within the period's time range.
   * Task date association relies on `task.baseDate` (an ISO string normalized to midnight) and `task.dayOffset`.
   * The column's calendar date is determined by `dayOffset` relative to the current actual date.
   * @param {number} dayOffset - The offset from the current day for this column.
   * @param {'morning' | 'afternoon' | 'evening'} period - The time period this column represents.
   */
  const renderColumn = useCallback((dayOffset: number, period: 'morning' | 'afternoon' | 'evening') => {
    let startHour, endHour;
    switch (period) {
      case 'morning': startHour = APP_TIMELINE_START_HOUR; endHour = APP_TIMELINE_SPLIT_HOUR_1; break;
      case 'afternoon': startHour = APP_TIMELINE_SPLIT_HOUR_1; endHour = APP_TIMELINE_SPLIT_HOUR_2; break;
      case 'evening': startHour = APP_TIMELINE_SPLIT_HOUR_2; endHour = APP_TIMELINE_END_HOUR; break;
    }

    const columnCalendarDate = getCalendarDateForColumn(dayOffset);

    // Get tasks for this specific column date from the memoized map
    const tasksForThisColumnDate = tasksByDate.get(columnCalendarDate.toISOString()) || [];

    const tasksToRender = tasksForThisColumnDate.filter(t => {
      // If we have a task being dragged, handle it specially
      if (draggingTask && draggingTask.task.id === t.id) {
        const draggingTaskTargetDate = getDateWithoutTime(draggingTask.task.baseDate);
        const decision = isSameCalendarDate(draggingTaskTargetDate, columnCalendarDate);
        
        return decision;
      }

      // For normal tasks, their baseDate (which is already an ISO string at midnight)
      // directly maps to the key in tasksByDate. No further date math needed here if tasksByDate is correct.
      // The tasksForThisColumnDate should already contain only tasks for this columnCalendarDate.
      // The check below becomes redundant if tasksForThisColumnDate is sourced correctly.
      // const taskDate = getDateWithoutTime(t.baseDate); 
      // taskDate.setDate(taskDate.getDate() + t.dayOffset); // t.dayOffset should be 0
      // return isSameCalendarDate(taskDate, columnCalendarDate);
      return true; // All tasks in tasksForThisColumnDate are for this column
    }).filter(t => {
      // Continue with same filter for time periods...
      const taskToConsider = (draggingTask && draggingTask.task.id === t.id) ? draggingTask.task : t;
      
      return (
        (taskToConsider.startHour >= startHour && taskToConsider.startHour < endHour) || 
        (taskToConsider.startHour < startHour && taskToConsider.startHour + taskToConsider.duration > startHour) ||
        (taskToConsider.startHour >= startHour && taskToConsider.startHour < endHour && taskToConsider.startHour + taskToConsider.duration > endHour) ||
        (taskToConsider.startHour < startHour && taskToConsider.startHour + taskToConsider.duration > endHour)
      );
    });
    const columnHeight = TIMELINE_COLUMN_HEIGHT; 
    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;
    let currentTimeMarker = null;
    if (dayOffset === 0) {
      const now = currentTimeForMarker;
      const currentHourFloat = now.getHours() + now.getMinutes() / 60;
      if (currentHourFloat >= startHour && currentHourFloat < endHour) {
        const markerLeft = (currentHourFloat - startHour) * APP_PIXELS_PER_HOUR;
        currentTimeMarker = (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[120] pointer-events-none flex flex-col justify-end items-center"
            style={{ left: `${markerLeft}px` }}
            title={`Current time: ${formatTime(currentHourFloat)}`}
          >
            {/* Arrowhead: simple triangle pointing down (inverse for end of line) */}
            {/* This is a basic way to make a triangle with borders. Adjust size/color as needed. */}
            <div 
              style={{ 
                width: '0', 
                height: '0', 
                borderLeft: '4px solid transparent', 
                borderRight: '4px solid transparent', 
                borderTop: '6px solid #ef4444', // Corresponds to bg-red-500
                marginBottom: '-1px' // Adjust to align with the line
              }}
            />
          </div>
        );
      }
    }

    // Handles single click for pasting
    const handleTimelineSingleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); // Prevent event from bubbling to parent elements
        if (!copyingTaskData) return; // Only proceed if in copy mode

        const sectionClicked = e.currentTarget.getAttribute('data-section-period');
        const dayOffsetClickedAttr = e.currentTarget.getAttribute('data-day-offset');
        const dayOffsetClicked = dayOffsetClickedAttr ? parseInt(dayOffsetClickedAttr) : null;

        if (!sectionClicked || dayOffsetClicked === null) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        let baseHourForCalc: number;

        switch (sectionClicked) {
            case 'morning': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
            case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
            case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
            default: return;
        }

        const hourInBlock = (clickXrelative / APP_PIXELS_PER_HOUR);
        const calculatedNewStartHour = baseHourForCalc + hourInBlock;
        const snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;

        // Calculate the targetDate using the helper function
        const targetDate = getCalendarDateForColumn(dayOffsetClicked);
        handleDropCopy(targetDate, snappedNewStartHour);
    };

    // Handles double click for creating a new task
    const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.detail !== 2) return; // Ensure it's a double click
        if (copyingTaskData) return; // Don't create task if in copy mode

        const sectionClicked = e.currentTarget.getAttribute('data-section-period') as 'morning' | 'afternoon' | 'evening' | null; // Keep period for start hour calc
        const dayOffsetClickedAttr = e.currentTarget.getAttribute('data-day-offset');
        const dayOffsetClicked = dayOffsetClickedAttr ? parseInt(dayOffsetClickedAttr) : null;

        if (!sectionClicked || dayOffsetClicked === null) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        let baseHourForCalc: number;

        switch (sectionClicked) {
            case 'morning': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
            case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
            case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
            default: return;
        }

        const hourInBlock = (clickXrelative / APP_PIXELS_PER_HOUR);
        const calculatedNewStartHour = baseHourForCalc + hourInBlock;
        // Snap to nearest 15-minute interval
        let snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;

        // Ensure snappedNewStartHour is within timeline boundaries
        snappedNewStartHour = Math.max(APP_TIMELINE_START_HOUR, snappedNewStartHour);
        // Ensure task can have min duration -- this should now consider the new default 1h duration
        snappedNewStartHour = Math.min(APP_TIMELINE_END_HOUR - 1, snappedNewStartHour); 
        
        const targetDate = getCalendarDateForColumn(dayOffsetClicked);
        const newTempId = `temp-new-task-${Date.now()}`;

        const newTaskDefaults: Task = {
            id: newTempId,
            name: "New Task", 
            startHour: snappedNewStartHour,
            duration: 1, // Default duration to 1 hour
            baseDate: targetDate.toISOString(),
            dayOffset: 0, 
            color: TASK_COLORS[0],
            notes: "",
            completed: false,
        };

        openEditModal(newTaskDefaults, { isNew: true, isFromPool: false });
    };

    return (
      <div className={`w-full transition-colors duration-200 relative ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
        <div 
          className={`relative border border-gray-200 dark:border-neutral-800 rounded-md ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50 dark:bg-blue-900/30' : ''}`}
          style={{ 
            width: `${APP_PIXELS_PER_HOUR * (endHour - startHour)}px`, 
            minWidth: `${APP_PIXELS_PER_HOUR * (endHour - startHour)}px`,
            maxWidth: '100%', height: `${columnHeight}px`, overflow: 'hidden'
          }}
          data-section-period={period} 
          data-day-offset={dayOffset}
          onClick={handleTimelineSingleClick}
          onDoubleClick={handleTimelineDoubleClick}
          onMouseEnter={() => {
            if (copyingTaskData && targetCopyDayOffset !== dayOffset) {
              setTargetCopyDayOffset(dayOffset);
            }
          }}
        > 
          {renderTimeline(period)}
          <div
            className={`relative h-full bg-neutral-900 ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/30 cursor-copy' : 'cursor-pointer'}`}
            data-section-period={period} 
            data-day-offset={dayOffset}
            data-testid={`timeline-area-${dayOffset}-${period}`}
            onClick={handleTimelineSingleClick}
            onDoubleClick={handleTimelineDoubleClick}
            onMouseEnter={() => {
              if (copyingTaskData && targetCopyDayOffset !== dayOffset) {
                setTargetCopyDayOffset(dayOffset);
              }
            }}
          >
            {isTargetCopyDay && ( <div className="absolute inset-0 pointer-events-none z-10"><div className="absolute inset-0 bg-blue-100/30 dark:bg-blue-800/30 animate-pulse"></div><div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-300 font-bold text-lg">Click to paste task</div></div>)}
            {currentTimeMarker}
            {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
              <div 
                key={`grid-${i}-${dayOffset}-${period}`} 
                className={`border-l-2 border-neutral-700 dark:border-neutral-700 z-10 ${GRID_LINE_STYLE}`}
                style={{ left: `${i * APP_PIXELS_PER_HOUR}px`, height: '100%', top: 0, borderLeftStyle: 'dashed', position: 'absolute'}} 
              />
            ))}
            {tasksToRender.map((task) => {
              let displayTask = task; // Start with the task from the main array
              if (draggingTask && draggingTask.task.id === task.id) {
                  displayTask = draggingTask.task; // Dragging preview overrides
              }
              if (resizingTask && resizingTask.task.id === task.id) {
                  // If this task is being resized, use the preview data from resizingTask.task
                  displayTask = resizingTask.task;
              }

              // const originalIndex = tasks.findIndex((t) => t.id === task.id); // Old way, tasks no longer available here
              // New approach for a somewhat stable color index if task.color is not set:
              let colorIndex = 0;
              if (displayTask.id) {
                const numericIdPart = parseInt(displayTask.id.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(numericIdPart)) {
                  colorIndex = numericIdPart;
                }
              }
              // Ensure originalIndex is not -1 if the task is a new temporary task from dragging/resizing that might not be in tasksByDate yet
              const isTempDraggingTask = draggingTask && draggingTask.task.id === task.id && !tasksByDate.get(getDateWithoutTime(task.baseDate).toISOString())?.find(t => t.id === task.id);
              const isTempResizingTask = resizingTask && resizingTask.task.id === task.id && !tasksByDate.get(getDateWithoutTime(task.baseDate).toISOString())?.find(t => t.id === task.id);

              if (isTempDraggingTask || isTempResizingTask) {
                // For new tasks not yet in the main state, originalIndex check might be tricky.
                // Defaulting to a specific color or a random one from the list for these previews.
              } else {
                // This check is to prevent errors if a task somehow isn't in tasksByDate (should not happen for rendered tasks)
                const tasksOnDate = tasksByDate.get(getDateWithoutTime(task.baseDate).toISOString());
                if (!tasksOnDate || !tasksOnDate.find(t => t.id === task.id)) {
                  // If task is not found in tasksByDate (e.g. it's a new task being dragged/resized before saving)
                  // we can use the colorIndex derived from its ID, or a default.
                  // The `displayTask` should be the one from draggingTask or resizingTask in these cases.
                } 
              }
              
              const color = displayTask.color || TASK_COLORS[colorIndex % TASK_COLORS.length]; 
              const isBeingDragged = draggingTask?.task.id === displayTask.id; 
              const isBeingResized = resizingTask?.task.id === displayTask.id; 
              const isBeingCopied = copyingTaskData?.id === displayTask.id;
              
              // Determine global operation state
              const globalResizingActive = !!resizingTask;
              const globalDraggingActive = !!draggingTask;

              let cardCursorStyle;
              if (globalResizingActive) {
                cardCursorStyle = 'inherit'; // Use 'inherit' instead of 'col-resize' to follow document.body style
              } else if (globalDraggingActive) {
                cardCursorStyle = 'grabbing'; // Explicitly set to grabbing for all cards
              } else if (copyingTaskData?.id === displayTask.id) {
                cardCursorStyle = 'default';
              } else {
                cardCursorStyle = 'grab';
              }
              
              let isPastTask = false;
              // Check if the task is on the *actual current day* and if its end time has passed.
              const taskAbsoluteDate = getDateWithoutTime(displayTask.baseDate);
              const todayAbsoluteDate = getCalendarDateForColumn(0); // 0 offset means today

              if (isSameCalendarDate(taskAbsoluteDate, todayAbsoluteDate)) {
                const now = currentTimeForMarker; // Assuming currentTimeForMarker is up-to-date
                const currentHourFloat = now.getHours() + now.getMinutes() / 60;
                if ((displayTask.startHour + displayTask.duration) < currentHourFloat) {
                  isPastTask = true;
                }
              }
              
              const taskStartRelativeToSection = Math.max(0, displayTask.startHour - startHour);
              const taskEndRelativeToSection = Math.min(endHour - startHour, (displayTask.startHour + displayTask.duration) - startHour);
              const renderLeft = taskStartRelativeToSection * APP_PIXELS_PER_HOUR;
              const renderWidth = Math.max(APP_PIXELS_PER_MINUTE * 15, (taskEndRelativeToSection - taskStartRelativeToSection) * APP_PIXELS_PER_HOUR);
              
              if (renderWidth <= 0 && !isBeingDragged) return null;
              
              const zIndex = (isBeingDragged || isBeingResized ? 100 : 40);
              const taskCardBaseClassName = `absolute select-none transition-transform duration-100 ease-out hover:shadow-md group ${isBeingDragged || isBeingResized ? 'opacity-95 shadow-lg scale-[1.01] ring-1 ring-white' : 'shadow-sm'} ${isBeingCopied ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${isPastTask ? 'filter saturate-50 brightness-75' : ''}`;

              const taskStyleObj: React.CSSProperties = {
                left: `${renderLeft}px`, width: `${renderWidth}px`,
                top: `${TASK_BASE_TOP}px`, height: `${TASK_HEIGHT}px`,
                zIndex: zIndex,
                cursor: cardCursorStyle,
              };

              if (displayTask.startHour < startHour) taskStyleObj.borderLeftStyle = 'dashed';
              if ((displayTask.startHour + displayTask.duration) > endHour) taskStyleObj.borderRightStyle = 'dashed';

              return (
                <div
                  key={`task-container-${displayTask.id}-${period}-${dayOffset}`}
                  className={`${taskCardBaseClassName} border-transparent`}
                  style={taskStyleObj}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    const isButton = target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'INPUT' || target.closest('.resize-handle');
                    const isDraggableArea = target.classList.contains('draggable-area') || target.closest('.draggable-area');
                    
                    if (/*!isCurrentlyEditing &&*/ !isBeingCopied && !isButton && isDraggableArea) {
                      handleDragStart(displayTask, e);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                    <MemoizedTaskCard
                    task={displayTask}
                    height={TASK_HEIGHT}
                    onStartEdit={openEditModal} 
                    onCopy={startCopy} 
                    />
                  {/*!(activeEditModalTask?.id === displayTask.id) &&*/ (
                      <>
                        <div
                        className={`resize-handle absolute left-0 top-0 bottom-0 w-1.5 ${isBeingResized ? 'cursor-inherit' : 'cursor-ew-resize'} group-hover:bg-blue-500/20 active:bg-blue-500/30 z-30 transition-colors duration-150 ease-in-out`}
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(displayTask, 'start', e); }}
                      ><div className={`absolute inset-y-0 right-0 w-px ${isBeingDragged || isBeingResized ? 'bg-white/70' : 'bg-transparent group-hover:bg-blue-300/70'}`}></div></div>
                      <div
                        className={`resize-handle absolute right-0 top-0 bottom-0 w-1.5 ${isBeingResized ? 'cursor-inherit' : 'cursor-ew-resize'} group-hover:bg-blue-500/20 active:bg-blue-500/30 z-30 transition-colors duration-150 ease-in-out`}
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(displayTask, 'end', e); }}
                      ><div className={`absolute inset-y-0 left-0 w-px ${isBeingDragged || isBeingResized ? 'bg-white/70' : 'bg-transparent group-hover:bg-blue-300/70'}`}></div></div>
                      </>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [tasksByDate, APP_PIXELS_PER_HOUR, APP_PIXELS_PER_MINUTE, APP_TIMELINE_START_HOUR, APP_TIMELINE_END_HOUR, APP_TIMELINE_SPLIT_HOUR_1, APP_TIMELINE_SPLIT_HOUR_2, copyingTaskData, targetCopyDayOffset, draggingTask, resizingTask, openEditModal, handleDeleteTask, startCopy, TASK_COLORS, topDayOffset, setCopyingTaskData, handleDropCopy, activeEditModalTask, currentTimeForMarker, tasksByDate]);

  /**
   * Handles the submission of the new task form.
   * It calculates the targetDate based on the form's dayOffset input using getCalendarDateForColumn.
   * Then, it calls handleAddTask with this specific targetDate, the task details from the form,
   * and a dayOffset of 0 (as targetDate now represents the task's absolute date).
   */
  const [cloneConflictStrategy, setCloneConflictStrategy] = useState<'skip' | 'replace' | 'adjust'>('skip');
  const handleConfirmClone = () => {
    if (cloneDayTasks && showCloneConfirmation) {
      const sourceDate = showCloneConfirmation.date; // This is the absolute Date object for the source
      
      let destinationDayViewOffset = topDayOffset;
      if (topDayOffset === showCloneConfirmation.dayOffset) { // If top view is the source, clone to bottom view
        destinationDayViewOffset = bottomDayOffset;
      }
      const destinationDate = getCalendarDateForColumn(destinationDayViewOffset);

      cloneDayTasks(sourceDate, destinationDate);
    }
  };

  const handleClearPool = () => {
    showClearPoolModal(); 
  };

  const confirmClearPool = () => { 
    if (setPoolTasks) setPoolTasks(() => []);
  };

  const handleCloneDay = (dayOffset: number) => {
    const date = getCalendarDateForColumn(dayOffset);
    showCloneModal({ dayOffset, date });
  };

  /**
   * Initiates a task drag operation.
   * @param {Task} taskToDrag - The task object being dragged.
   * @param {React.MouseEvent} e - The mouse event that triggered the drag.
   */
  const handleDragStart = useCallback((taskToDrag: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cancelCopy) cancelCopy(); 
    setResizingTask(null); 
    // taskToDrag is now the direct object, hopefully up-to-date
    if (taskToDrag) {
      document.body.style.cursor = 'grabbing';
      // currentTarget should be the div on which onMouseDown is attached
      const taskElement = e.currentTarget as HTMLDivElement;
      const rect = taskElement.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;

      // Find the index of this task in the current tasks array for taskIndex (if still needed by other logic)
      // const taskIndex = tasks.findIndex(t => t.id === taskToDrag.id); // No longer needed

      setDraggingTask({ 
        // taskIndex: taskIndex, // No longer used
        initialMouseY: e.clientY, 
        initialStartHour: taskToDrag.startHour,
        initialDayOffset: taskToDrag.dayOffset, // Should be 0 for a correctly cloned task
        taskElement: taskElement, 
        task: { ...taskToDrag }, // task.baseDate is destination, task.dayOffset is 0
        offsetX: offsetX,
      });
    }
  }, [cancelCopy, setResizingTask, setDraggingTask]); // Removed tasks from dependency array

  return (
    <div className="min-h-screen p-2 bg-transparent text-white transition-colors">
      <div className="w-full mx-auto">
        {/* Global Modals and Overlays */}
        {typeof document !== 'undefined' && activeEditModalTask && (
          <EditTaskModal
            taskToEdit={activeEditModalTask}
            onSave={saveTaskFromModal}
            onClose={closeEditModal}
            onColorChange={handleTaskColorChange}
            onPinTask={handlePinTask}
            onMoveToPool={copyTaskToPool}
            pinnedTasks={pinnedTasks}
            onDelete={handleDeleteTask}
          />
        )}

        <div className="flex gap-2">
          <div className="w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col sticky top-4 h-[calc(100vh-2rem-env(safe-area-inset-bottom))] overflow-hidden z-[150]">
            <div className="flex border-b border-neutral-700">
              <button type="button" className={`flex-1 p-2 text-sm font-medium text-center transition-colors focus:outline-none ${activeSidebarTab === 'pool' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'}`} onClick={() => setActiveSidebarTab('pool')}>Task Pool</button>
              <button type="button" className={`flex-1 p-2 text-sm font-medium text-center transition-colors focus:outline-none ${activeSidebarTab === 'pinned' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'}`} onClick={() => setActiveSidebarTab('pinned')}>Pinned Tasks</button>
            </div>
            {activeSidebarTab === 'pool' && (
              <TaskPoolSidebar
                poolTasks={poolTasks} 
                TASK_COLORS={TASK_COLORS} 
                activeTab={activeSidebarTab} 
                topDayOffset={topDayOffset} 
                isOpen={isTaskPoolOpen}
                setIsOpen={setIsTaskPoolOpen}
                onActualAddPoolTask={handleActualAddPoolTask} 
                onAddTaskToTimeline={(taskFromPool, dayOffsetForDrop) => {
                  if (startCopy) startCopy(taskFromPool); 
                  const dropStartHour = taskFromPool.startHour !== 0 ? taskFromPool.startHour : 9; // Default or actual start hour
                  const targetDate = getCalendarDateForColumn(dayOffsetForDrop);
                  if (handleDropCopy) handleDropCopy(targetDate, dropStartHour);
                }} 
                onDeletePoolTask={handleDeletePoolTask} 
                onClearPool={clearPool} 
                openEditModal={(task, isFromPool) => {
                  openEditModal(task, { isFromPool: isFromPool });
                }} 
              />
            )}
            {activeSidebarTab === 'pinned' && (
              <PinnedTasksSidebar
                pinnedTasks={pinnedTasks} 
                onUnpinTask={handleUnpinTask} 
                formatTimeRemaining={formatTimeRemaining} 
              />
            )}
          </div>

          <div className="flex-1 space-y-2 min-w-0 overflow-x-auto" ref={timelineScrollRef}>
            <div className="bg-neutral-900 p-3 rounded-lg shadow-sm border border-neutral-800 overflow-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset - 7)} title="Previous week">◀◀</button>
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset - 1)} title="Previous day">◀</button>
                  <span className="text-white font-medium text-center">
                    {isClient ? getDateLabel(topDayOffset) : "Loading date..."}
                  </span>
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset + 1)} title="Next day">▶</button>
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset + 7)} title="Next week">▶▶</button>
                  {isClient && getRelativeDayLabel(topDayOffset) && (
                    <span className="text-xs text-neutral-300 ml-3 px-1.5 py-0.5 bg-neutral-700 rounded-sm font-normal">
                      {getRelativeDayLabel(topDayOffset)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-4">
                  <button type="button" className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                    onClick={() => {
                      const newTempId = `temp-new-task-${Date.now()}`;
                      const targetDateForNewTask = getCalendarDateForColumn(topDayOffset);
                      const newTaskDefaults: Task = {
                        id: newTempId,
                        name: "New Task",
                        startHour: 9, // Default start time
                        duration: 1,  // Default duration to 1 hour
                        baseDate: targetDateForNewTask.toISOString(),
                        dayOffset: 0, 
                        color: TASK_COLORS[0],
                        notes: "",
                        completed: false,
                      };
                      openEditModal(newTaskDefaults, { isNew: true, isFromPool: false });
                    }}
                  >
                    <span>+</span><span>Add New Task</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-px">
                  {renderColumn(topDayOffset, 'morning')}
                  {renderColumn(topDayOffset, 'afternoon')}
                  {renderColumn(topDayOffset, 'evening')}
              </div>
            </div>

            <div className="bg-neutral-900 p-3 rounded-lg shadow-sm border border-neutral-800 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset - 7)} title="Previous week">◀◀</button>
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset - 1)} title="Previous day">◀</button>
                  <span className="text-white font-medium text-center">
                    {isClient ? getDateLabel(bottomDayOffset) : "Loading date..."}
                  </span>
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset + 1)} title="Next day">▶</button>
                  <button type="button" className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset + 7)} title="Next week">▶▶</button>
                  {isClient && getRelativeDayLabel(bottomDayOffset) && (
                    <span className="text-xs text-neutral-300 ml-3 px-1.5 py-0.5 bg-neutral-700 rounded-sm font-normal">
                      {getRelativeDayLabel(bottomDayOffset)}
                    </span>
                  )}
                </div>
                <button type="button" className="border border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200" 
                  onClick={() => {
                    const date = getCalendarDateForColumn(bottomDayOffset);
                    showCloneModal({ dayOffset: bottomDayOffset, date });
                  }}
                  title="Clone tasks from this day to the top day"
                >
                  <span>↑</span><span>Clone to Top Day</span>
                </button>
              </div>
              <div className="flex flex-col gap-px">
                  {renderColumn(bottomDayOffset, 'morning')}
                  {renderColumn(bottomDayOffset, 'afternoon')}
                  {renderColumn(bottomDayOffset, 'evening')}
              </div>
            </div>

            {showCloneConfirmation && (() => {
              // Determine source and destination labels for the message
              const sourceDayLabel = getDateLabel(showCloneConfirmation.dayOffset);
              let destinationDayViewOffset = topDayOffset; // Default destination is top view
              if (topDayOffset === showCloneConfirmation.dayOffset) { // If top view is the source, clone to bottom view
                destinationDayViewOffset = bottomDayOffset;
              }
              // If source and destination are the same (e.g. single view mode or cloning to self, which is unlikely for button)
              // This might need a more robust way to determine a *different* day if they are the same.
              // For now, this handles the two-view clone scenario.
              if (destinationDayViewOffset === showCloneConfirmation.dayOffset && topDayOffset !== bottomDayOffset) {
                // This case means source is (e.g.) top, and top became bottom, so they are same.
                // Pick the *other* view.
                // If initially source was top, and top is still top (but also somehow destination), then use bottom.
                // This logic is primarily for the case where top and bottom might have swapped or become identical.
                // A simple rule: if source is top, dest is bottom. If source is bottom, dest is top.
                // This is already handled by the initial assignment and the if block.
              }
              const destinationDayLabel = getDateLabel(destinationDayViewOffset);

              return (
              <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-[1001]">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-md w-full">
                  <h3 className="text-xl font-bold mb-2 dark:text-white">Clone Tasks</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {isClient ? `Clone tasks from ${sourceDayLabel} to ${destinationDayLabel}.` : "Loading details..."}
                  </p>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conflict Strategy:</h4>
                    <div className="space-y-2">
                        {['skip', 'replace', 'adjust'].map(strategy => (
                            <label key={`conflict-strategy-${strategy}`} className="flex items-center">
                                <input type="radio" name="conflictStrategy" value={strategy} checked={cloneConflictStrategy === strategy} onChange={() => setCloneConflictStrategy(strategy as any)} className="mr-2"/>
                                <span className="capitalize text-gray-800 dark:text-white">{strategy}</span>
                      </label>
                        ))}
                        </div>
                        </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={cancelCloneDay}>Cancel</Button>
                    <Button onClick={handleConfirmClone}>Clone Tasks</Button>
                  </div>
                </div>
              </div>
              )} )()}

            {colorPickerState && (
              <div 
                className="fixed z-[1005] bg-white dark:bg-gray-800 p-2 rounded-md shadow-lg border dark:border-gray-700"
                style={{ top: colorPickerState.y, left: colorPickerState.x }}
              >
                <div className="grid grid-cols-6 gap-1">
                  {TASK_COLORS.map(color => (
                    <button
                      key={`floating-color-button-${color}-${colorPickerState.taskId}`}
                      type="button"
                      className={`w-5 h-5 rounded ${color} hover:ring-1 ring-gray-400`}
                      onClick={() => handleTaskColorChange(colorPickerState.taskId, color)}
                    />
                  ))}
                </div>
              </div>
            )}
            {showClearPoolConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white">Clear Task Pool?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to remove all tasks from the pool? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={cancelClearPool}>
                                Cancel
                            </Button>
                            <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-100 dark:hover:bg-red-800 hover:text-red-600" onClick={() => {
                                confirmClearPool(); 
                            }}>
                                Clear Pool
                            </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}