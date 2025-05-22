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
import { TASK_COLORS } from '../../lib/constants';
import { TaskCard } from './TaskCard';

// Helper function to check for task overlap
const checkOverlap = (
  task1Start: number, task1Duration: number,
  task2Start: number, task2Duration: number
): boolean => {
  const task1End = task1Start + task1Duration;
  const task2End = task2Start + task2Duration;
  // Check if task1 overlaps task2.
  // Tasks overlap if one starts before the other ends, AND one ends after the other starts.
  return task1Start < task2End && task1End > task2Start;
};

/**
 * Helper function to get the actual calendar date for a column offset from the current day.
 * The date is normalized to midnight (00:00:00:000).
 * @param {number} columnDayOffset - The number of days to offset from the current date.
 * @returns {Date} The calculated calendar date, normalized to midnight.
 */
const getCalendarDateForColumn = (columnDayOffset: number): Date => {
  const date = new Date(); // Today's actual date
  date.setHours(0, 0, 0, 0); // Normalize to start of day
  date.setDate(date.getDate() + columnDayOffset);
  return date;
};

/**
 * Helper function to extract a Date object representing the calendar date (normalized to midnight)
 * from an ISO date string.
 * @param {string} isoDateString - The ISO string representation of a date.
 * @returns {Date} A Date object normalized to midnight of the given ISO string's date.
 */
const getDateWithoutTime = (isoDateString: string): Date => {
  const date = new Date(isoDateString);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Helper function to compare two Date objects to see if they fall on the same calendar date,
 * ignoring the time component.
 * @param {Date} date1 - The first date.
 * @param {Date} date2 - The second date.
 * @returns {boolean} True if both dates are on the same calendar day, false otherwise.
 */
const isSameCalendarDate = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

export default function DailyPlanner() {
  const {
    tasks,
    poolTasks,
    pinnedTasks,
    activeSidebarTab,
    topDayOffset,
    bottomDayOffset,
    getDateLabel,
    setTopDayOffset,
    setBottomDayOffset,
    setTasks,
    setPoolTasks,
    setPinnedTasks,
    setActiveSidebarTab,
    TIMELINE_START_HOUR,
    TIMELINE_END_HOUR,
    PIXELS_PER_HOUR,
    MIN_TASK_DURATION,
    showClearPoolConfirmation,
    showCloneConfirmation,
    draggingTask,
    setDraggingTask,
    resizingTask,
    setResizingTask,
    editingTaskId,
    setEditingTaskId,
    contextMenu,
    setContextMenu,
    copyingTaskData,
    setCopyingTaskData,
    targetCopyDayOffset,
    setTargetCopyDayOffset,
    colorPickerState,
    activeEditModalTask,
    hasConflict,
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
  } = useDailyPlanner();

  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);
  const [newTaskName, setNewTaskName] = useState<string>("");
  const [newTaskHour, setNewTaskHour] = useState<number>(9);
  const [newTaskDuration, setNewTaskDuration] = useState<number>(1);
  const [newTaskColor, setNewTaskColor] = useState<string>(TASK_COLORS[0]);
  const [newTaskDayOffset, setNewTaskDayOffset] = useState<number>(0);

  const TIMELINE_COLUMN_HEIGHT = 100;
  const TASK_BASE_TOP = 0;
  const TASK_BASE_BOTTOM_PADDING = 33;
  const TASK_HEIGHT = TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING;
  const TIMELINE_SPLIT_HOUR_1 = 11;
  const TIMELINE_SPLIT_HOUR_2 = 18;
  const TIMELINE_HEADER_HEIGHT_PX = 28;
  const GRID_LINE_STYLE = "border-l-2 border-gray-400 z-10";
  const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

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
    const dHours = dx / PIXELS_PER_HOUR;
    const SNAP_THRESHOLD_HOURS = 2 / 60; // 2 minutes

    let livePreviewStartHour = initialStartHour;
    let livePreviewDuration = initialDuration;

    if (edge === 'start') {
        let rawNewStartHour = initialStartHour + dHours;
        const nearestSnapPoint = Math.round(rawNewStartHour * 4) / 4;
        if (Math.abs(rawNewStartHour - nearestSnapPoint) <= SNAP_THRESHOLD_HOURS) {
            rawNewStartHour = nearestSnapPoint;
        }
        livePreviewStartHour = rawNewStartHour;
        livePreviewDuration = (initialStartHour + initialDuration) - livePreviewStartHour;

        // Collision detection for start edge
        const otherTasksOnSameDay = tasks.filter(t => 
            t.id !== originalTaskAtResizeStart.id && 
            t.dayOffset === originalTaskAtResizeStart.dayOffset
        );

        let maxEndTimeOfCollidingTasks = -Infinity;
        for (const otherTask of otherTasksOnSameDay) {
            if (checkOverlap(livePreviewStartHour, livePreviewDuration, otherTask.startHour, otherTask.duration)) {
                 // We are trying to move the start edge to the left, potentially over otherTask
                 // So, the new startHour cannot be less than the end of otherTask
                if (livePreviewStartHour < (otherTask.startHour + otherTask.duration)) {
                    maxEndTimeOfCollidingTasks = Math.max(maxEndTimeOfCollidingTasks, otherTask.startHour + otherTask.duration);
                }
            }
        }
        if (maxEndTimeOfCollidingTasks > -Infinity && livePreviewStartHour < maxEndTimeOfCollidingTasks) {
            livePreviewStartHour = maxEndTimeOfCollidingTasks;
            livePreviewDuration = (initialStartHour + initialDuration) - livePreviewStartHour;
        }

    } else { // edge === 'end'
        let rawNewEndHour = (initialStartHour + initialDuration) + dHours;
        const nearestSnapPoint = Math.round(rawNewEndHour * 4) / 4;
        if (Math.abs(rawNewEndHour - nearestSnapPoint) <= SNAP_THRESHOLD_HOURS) {
            rawNewEndHour = nearestSnapPoint;
        }
        // livePreviewStartHour remains initialStartHour for end-edge resize
        livePreviewDuration = rawNewEndHour - initialStartHour;

        // Collision detection for end edge
        const otherTasksOnSameDay = tasks.filter(t => 
            t.id !== originalTaskAtResizeStart.id && 
            t.dayOffset === originalTaskAtResizeStart.dayOffset
        );
        let minStartTimeOfCollidingTasks = Infinity;
        for (const otherTask of otherTasksOnSameDay) {
            if (checkOverlap(livePreviewStartHour, livePreviewDuration, otherTask.startHour, otherTask.duration)) {
                // We are trying to move the end edge to the right, potentially over otherTask
                // So, the new end (start + duration) cannot be greater than the start of otherTask
                if ((livePreviewStartHour + livePreviewDuration) > otherTask.startHour) {
                    minStartTimeOfCollidingTasks = Math.min(minStartTimeOfCollidingTasks, otherTask.startHour);
                }
            }
        }
        if (minStartTimeOfCollidingTasks < Infinity && (livePreviewStartHour + livePreviewDuration) > minStartTimeOfCollidingTasks) {
            livePreviewDuration = minStartTimeOfCollidingTasks - livePreviewStartHour;
        }
    }

    // --- Apply Minimal Constraints for Live Preview (to the potentially magnetically snapped AND collision-adjusted values) ---
    livePreviewDuration = Math.max(MIN_TASK_DURATION, livePreviewDuration);

    if (edge === 'start') {
        const originalTaskEnd = initialStartHour + initialDuration;
        livePreviewStartHour = Math.min(livePreviewStartHour, originalTaskEnd - MIN_TASK_DURATION);
        livePreviewStartHour = Math.max(TIMELINE_START_HOUR, livePreviewStartHour);
        livePreviewDuration = originalTaskEnd - livePreviewStartHour; // Recalculate duration based on constrained start
        livePreviewDuration = Math.max(MIN_TASK_DURATION, livePreviewDuration);
        livePreviewDuration = Math.min(livePreviewDuration, TIMELINE_END_HOUR - livePreviewStartHour);
    } else { // edge === 'end'
        livePreviewStartHour = initialStartHour; // Start is fixed
        livePreviewDuration = Math.min(livePreviewDuration, TIMELINE_END_HOUR - livePreviewStartHour);
        livePreviewDuration = Math.max(MIN_TASK_DURATION, livePreviewDuration);
    }

    // Final boundary checks for start hour and resulting duration
    livePreviewStartHour = Math.max(TIMELINE_START_HOUR, livePreviewStartHour);
    livePreviewStartHour = Math.min(livePreviewStartHour, TIMELINE_END_HOUR - MIN_TASK_DURATION);
    livePreviewDuration = Math.max(MIN_TASK_DURATION, Math.min(livePreviewDuration, TIMELINE_END_HOUR - livePreviewStartHour));

    setResizingTask(prev => {
      if (!prev) return null;
      return {
        ...prev, 
        task: { 
          ...prev.task, 
          startHour: livePreviewStartHour,
          duration: livePreviewDuration,
        }
      };
    });

  }, [resizingTask, PIXELS_PER_HOUR, MIN_TASK_DURATION, TIMELINE_START_HOUR, TIMELINE_END_HOUR, setResizingTask]);

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
      let newStartHour = baseHourForCalc + hourInBlock;

      const taskDuration = draggedTaskItem.duration || MIN_TASK_DURATION;
      newStartHour = Math.max(TIMELINE_START_HOUR, newStartHour);
      newStartHour = Math.min(TIMELINE_END_HOUR - taskDuration, newStartHour);
      
      let snappedNewStartHour = Math.round(newStartHour * 4) / 4;

      // Collision detection for dragging
      const otherTasksOnSameDay = tasks.filter(t => 
        t.id !== draggedTaskItem.id && 
        t.dayOffset === targetDayOffset
      );

      let canMove = true;
      for (const otherTask of otherTasksOnSameDay) {
        if (checkOverlap(snappedNewStartHour, taskDuration, otherTask.startHour, otherTask.duration)) {
          // Attempt to place the task adjacent to the colliding task if possible
          // If the dragged task is to the left of the other task
          if (snappedNewStartHour < otherTask.startHour) {
            snappedNewStartHour = otherTask.startHour - taskDuration;
          } else { // Dragged task is to the right of the other task
            snappedNewStartHour = otherTask.startHour + otherTask.duration;
          }
          // Re-check boundaries after adjustment attempt (though snapping might already handle this)
          snappedNewStartHour = Math.max(TIMELINE_START_HOUR, snappedNewStartHour);
          snappedNewStartHour = Math.min(TIMELINE_END_HOUR - taskDuration, snappedNewStartHour);
          snappedNewStartHour = Math.round(snappedNewStartHour * 4) / 4; // Re-snap after adjustment

          // Final check if the adjusted position is still overlapping (e.g. squeezed between two tasks)
          if (checkOverlap(snappedNewStartHour, taskDuration, otherTask.startHour, otherTask.duration)) {
             canMove = false; // If still overlaps after trying to adjust, then prevent move for this iteration
          }
          break; // For simplicity, handle first collision encountered. More complex logic could find best fit.
        }
      }

      if (canMove) {
        setDraggingTask(prev => {
          if (!prev || !prev.task) return null;
          return {
            ...prev,
            task: {
              ...prev.task,
              dayOffset: targetDayOffset as number,
              startHour: snappedNewStartHour,
            }
          };
        });
      }
    }
  }, [
    draggingTask, 
    setDraggingTask, 
    PIXELS_PER_HOUR, 
    TIMELINE_START_HOUR, 
    TIMELINE_SPLIT_HOUR_1, 
    TIMELINE_SPLIT_HOUR_2, 
    TIMELINE_END_HOUR,
    MIN_TASK_DURATION,
    tasks // Added tasks to dependency array
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
      case 'morning': startHour = TIMELINE_START_HOUR; endHour = TIMELINE_SPLIT_HOUR_1; break;
      case 'afternoon': startHour = TIMELINE_SPLIT_HOUR_1; endHour = TIMELINE_SPLIT_HOUR_2; break;
      case 'evening': startHour = TIMELINE_SPLIT_HOUR_2; endHour = TIMELINE_END_HOUR; break; 
    }
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    return (
      <div className="flex h-8 border-b border-neutral-700 dark:border-neutral-800 sticky top-0 bg-neutral-900 dark:bg-neutral-900 z-20">
        {timelineHours.map((hour) => (
          <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-neutral-300 pt-1 pl-0.5 border-l border-neutral-700 dark:border-neutral-700" style={{ width: `${PIXELS_PER_HOUR}px`, boxSizing: 'border-box' }}>
            {formatTime(hour)}
          </div>
        ))}
         <div key={`timeline-end-marker-${period}`} className="flex-none border-l-2 border-neutral-700 dark:border-neutral-700" style={{ width: `2px`, boxSizing: 'border-box' }}></div>
      </div>
    );
  }, [PIXELS_PER_HOUR, TIMELINE_START_HOUR, TIMELINE_END_HOUR]); 

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
      case 'morning': startHour = TIMELINE_START_HOUR; endHour = TIMELINE_SPLIT_HOUR_1; break;
      case 'afternoon': startHour = TIMELINE_SPLIT_HOUR_1; endHour = TIMELINE_SPLIT_HOUR_2; break;
      case 'evening': startHour = TIMELINE_SPLIT_HOUR_2; endHour = TIMELINE_END_HOUR; break;
    }

    const columnCalendarDate = getCalendarDateForColumn(dayOffset);

    const tasksToRender = tasks.filter(t => {
      // If we have a task being dragged, handle it specially
      if (draggingTask && draggingTask.task.id === t.id) {
        const draggingTaskTargetDate = getCalendarDateForColumn(draggingTask.task.dayOffset);
        return isSameCalendarDate(draggingTaskTargetDate, columnCalendarDate);
      }

      // For normal tasks, use their baseDate + dayOffset to determine where they belong
      const taskDate = getDateWithoutTime(t.baseDate);
      taskDate.setDate(taskDate.getDate() + t.dayOffset);
      
      return isSameCalendarDate(taskDate, columnCalendarDate);
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
    const [currentTimeForMarker, setCurrentTimeForMarker] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setCurrentTimeForMarker(new Date()), 60000);
        return () => clearInterval(timerId);
    }, []);
    let currentTimeMarker = null;
    if (dayOffset === 0) {
      const now = currentTimeForMarker;
      const currentHourFloat = now.getHours() + now.getMinutes() / 60;
      if (currentHourFloat >= startHour && currentHourFloat < endHour) {
        const markerLeft = (currentHourFloat - startHour) * PIXELS_PER_HOUR;
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
            case 'morning': baseHourForCalc = TIMELINE_START_HOUR; break;
            case 'afternoon': baseHourForCalc = TIMELINE_SPLIT_HOUR_1; break;
            case 'evening': baseHourForCalc = TIMELINE_SPLIT_HOUR_2; break;
            default: return;
        }

        const hourInBlock = (clickXrelative / PIXELS_PER_HOUR);
        const calculatedNewStartHour = baseHourForCalc + hourInBlock;
        const snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;

        handleDropCopy(dayOffsetClicked, snappedNewStartHour);
    };

    // Handles double click for creating a new task
    const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.detail !== 2) return; // Ensure it's a double click
        if (copyingTaskData) return; // Don't create task if in copy mode

        const sectionClicked = e.currentTarget.getAttribute('data-section-period');
        const dayOffsetClickedAttr = e.currentTarget.getAttribute('data-day-offset');
        const dayOffsetClicked = dayOffsetClickedAttr ? parseInt(dayOffsetClickedAttr) : null;

        if (!sectionClicked || dayOffsetClicked === null) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        let baseHourForCalc: number;

        switch (sectionClicked) {
            case 'morning': baseHourForCalc = TIMELINE_START_HOUR; break;
            case 'afternoon': baseHourForCalc = TIMELINE_SPLIT_HOUR_1; break;
            case 'evening': baseHourForCalc = TIMELINE_SPLIT_HOUR_2; break;
            default: return;
        }

        const hourInBlock = (clickXrelative / PIXELS_PER_HOUR);
        const calculatedNewStartHour = baseHourForCalc + hourInBlock;
        const snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;

        setNewTaskDayOffset(dayOffsetClicked);
        setNewTaskHour(snappedNewStartHour);
        setNewTaskName("New Task"); 
        setNewTaskDuration(1); 
        setNewTaskColor(TASK_COLORS[0]);
        setShowTaskForm(true);
    };

    return (
      <div className={`w-full transition-colors duration-200 relative ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
        <div 
          className={`relative border border-gray-200 dark:border-neutral-800 rounded-md ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50 dark:bg-blue-900/30' : ''}`}
          style={{ 
            width: `${PIXELS_PER_HOUR * (endHour - startHour)}px`, 
            minWidth: `${PIXELS_PER_HOUR * (endHour - startHour)}px`,
            maxWidth: '100%', height: `${columnHeight}px`, overflow: 'hidden'
          }}
          data-section-period={period} 
          data-day-offset={dayOffset}
          onClick={handleTimelineSingleClick}
          onDoubleClick={(e) => e.stopPropagation()}
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
                className={`border-l-2 border-neutral-700 dark:border-neutral-700 z-10`}
                style={{ left: `${i * PIXELS_PER_HOUR}px`, height: '100%', top: 0, borderLeftStyle: 'dashed', position: 'absolute'}} 
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

              const originalIndex = tasks.findIndex((t) => t.id === task.id); // Use task.id for originalIndex from main array
              if (originalIndex === -1 && !(draggingTask && draggingTask.task.id === task.id)) return null; 
              
              const color = displayTask.color || TASK_COLORS[originalIndex % TASK_COLORS.length]; 
              const isBeingDragged = draggingTask?.task.id === displayTask.id; 
              const isBeingResized = resizingTask?.task.id === displayTask.id; 
              const isBeingCopied = copyingTaskData?.id === displayTask.id;
              const isCurrentlyEditing = editingTaskId === displayTask.id; 
              
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
              if (displayTask.dayOffset === 0) {
                const now = currentTimeForMarker;
                const currentHourFloat = now.getHours() + now.getMinutes() / 60;
                if ((displayTask.startHour + displayTask.duration) < currentHourFloat) isPastTask = true;
              }
              
              const taskStartRelativeToSection = Math.max(0, displayTask.startHour - startHour);
              const taskEndRelativeToSection = Math.min(endHour - startHour, (displayTask.startHour + displayTask.duration) - startHour);
              const renderLeft = taskStartRelativeToSection * PIXELS_PER_HOUR;
              const renderWidth = Math.max(PIXELS_PER_MINUTE * 15, (taskEndRelativeToSection - taskStartRelativeToSection) * PIXELS_PER_HOUR);
              
              if (renderWidth <= 0 && !isBeingDragged) return null;
              
              const zIndex = isCurrentlyEditing ? 110 : (isBeingDragged || isBeingResized ? 100 : 40);
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
                    
                    const mainTaskIndex = tasks.findIndex(t => t.id === displayTask.id); 
                    if (mainTaskIndex !== -1 && !isCurrentlyEditing && !isBeingCopied && !isButton && isDraggableArea) {
                      handleDragStart(mainTaskIndex, e); 
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                    <TaskCard
                    task={displayTask}
                    height={TASK_HEIGHT}
                    onStartEdit={openEditModal} 
                    onUpdateTask={handleUpdateTask} 
                      onDelete={handleDeleteTask}
                    onCopy={startCopy} 
                    onColorChange={handleTaskColorChange} 
                      editingTaskId={editingTaskId}
                      setEditingTaskId={setEditingTaskId}
                      onMoveToPool={copyTaskToPool}
                    onPinTask={handlePinTask} 
                    />
                  {!isCurrentlyEditing && (
                      <>
                        <div
                        className={`resize-handle absolute left-0 top-0 bottom-0 w-3 ${isBeingResized ? 'cursor-inherit' : 'cursor-ew-resize'} hover:bg-blue-200/70 active:bg-blue-300/70 z-30`}
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(displayTask, 'start', e); }}
                      ><div className={`absolute inset-y-0 right-0 w-0.5 ${isBeingDragged || isBeingResized ? 'bg-white' : 'bg-transparent group-hover:bg-gray-300/50'}`}></div></div>
                      <div
                        className={`resize-handle absolute right-0 top-0 bottom-0 w-3 ${isBeingResized ? 'cursor-inherit' : 'cursor-ew-resize'} hover:bg-blue-200/70 active:bg-blue-300/70 z-30`}
                        onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(displayTask, 'end', e); }}
                      ><div className={`absolute inset-y-0 left-0 w-0.5 ${isBeingDragged || isBeingResized ? 'bg-white' : 'bg-transparent group-hover:bg-gray-300/50'}`}></div></div>
                      </>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [tasks, PIXELS_PER_HOUR, PIXELS_PER_MINUTE, TIMELINE_START_HOUR, TIMELINE_END_HOUR, copyingTaskData, targetCopyDayOffset, draggingTask, resizingTask, editingTaskId, openEditModal, handleDeleteTask, startCopy, handleTaskColorChange, setEditingTaskId, copyTaskToPool, handlePinTask, TASK_COLORS, topDayOffset, setCopyingTaskData, handleDropCopy, setNewTaskName, setNewTaskDuration, setNewTaskColor, setNewTaskHour, setNewTaskDayOffset, setShowTaskForm]);

  const handleSubmitNewTaskForm = () => {
    if (newTaskName.trim() === "") return;
    // newTaskDayOffset and newTaskHour are now set by the action that opened the form
    handleAddTask(newTaskDayOffset, newTaskHour, { 
      name: newTaskName,
      duration: newTaskDuration,
      color: newTaskColor,
    });
    setShowTaskForm(false); // Close form
    // Reset fields to default for next generic open, but not strictly necessary if button re-initializes
    setNewTaskName("");
    setNewTaskHour(9);
    setNewTaskDuration(1);
    setNewTaskColor(TASK_COLORS[0]);
    setNewTaskDayOffset(topDayOffset); // Default to top day for next generic open
  };
  
  const [cloneConflictStrategy, setCloneConflictStrategy] = useState<'skip' | 'replace' | 'adjust'>('skip');
  const handleConfirmClone = () => {
    if (cloneDayTasks && showCloneConfirmation) {
      cloneDayTasks(showCloneConfirmation.dayOffset, topDayOffset === showCloneConfirmation.dayOffset ? bottomDayOffset : topDayOffset);
    }
    // Modal closing is handled by confirmCloneDay from the hook, which should be called by the modal itself if this is just a handler
  };

  // Diagnostic useEffect to check for duplicate task IDs in the main tasks state
  useEffect(() => {
    const idCounts = tasks.reduce((acc, task) => {
      acc[task.id] = (acc[task.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    if (duplicates.length > 0) {
      console.warn('Duplicate task IDs found in tasks state in DailyPlanner.tsx:', Object.fromEntries(duplicates));
      // console.log('Full tasks array with duplicates:', tasks); // Optionally log full array
      
      // Fix duplicate task IDs by keeping only the first occurrence of each ID
      const uniqueTaskIds = new Set<string>();
      const uniqueTasks = tasks.filter(task => {
        if (uniqueTaskIds.has(task.id)) {
          return false; // Skip this duplicate
        }
        uniqueTaskIds.add(task.id);
        return true;
      });
      
      // Only update if we actually removed any duplicates
      if (uniqueTasks.length !== tasks.length) {
        console.log('Fixing duplicate tasks - removing', tasks.length - uniqueTasks.length, 'duplicates');
        setTasks(uniqueTasks);
      }
    }
  }, [tasks]);

  const handleClearPool = () => {
    showClearPoolModal(); 
  };

  // confirmClearPool is provided by the hook and handles its own logic including modal closure.
  // The local confirmClearPool can be removed if the button directly calls the hook's version.
  // For now, let's assume the button calls this local version, which then calls the hook's setPoolTasks.
  const confirmClearPool = () => { 
    if (setPoolTasks) setPoolTasks(() => []);
    // Hook's confirmClearPool implies modal closing.
  };

  const handleCloneDay = (dayOffset: number, period: 'morning' | 'afternoon' | 'evening') => {
    showCloneModal({ dayOffset, period });
  };

  const handleDragStart = (taskIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cancelCopy) cancelCopy(); 
    setResizingTask(null); 
    const taskToDrag = tasks[taskIndex]; 
    if (taskToDrag) {
      document.body.style.cursor = 'grabbing';
      const taskElement = e.currentTarget as HTMLDivElement;
      const rect = taskElement.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;

      setDraggingTask({ 
        taskIndex: taskIndex,
        initialMouseY: e.clientY, // Retained for potential future vertical dragging logic
        initialStartHour: taskToDrag.startHour,
        initialDayOffset: taskToDrag.dayOffset,
        taskElement: taskElement, 
        task: { ...taskToDrag },
        offsetX: offsetX, // Store the initial X offset within the task card
      });
    }
  };

  return (
    <div className="min-h-screen p-2 bg-transparent text-white transition-colors">
      <div className="w-full mx-auto">
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
                  if (handleDropCopy) handleDropCopy(dayOffsetForDrop, dropStartHour);
                }} 
                onDeletePoolTask={handleDeletePoolTask} 
                onClearPool={clearPool} 
                openEditModal={openEditModal} 
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
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset - 7)} title="Previous week">◀◀</button>
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset - 1)} title="Previous day">◀</button>
                  <span className="text-white font-medium w-[250px] text-center">
                    {isClient ? getDateLabel(topDayOffset) : "Loading date..."}
                  </span>
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset + 1)} title="Next day">▶</button>
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setTopDayOffset(topDayOffset + 7)} title="Next week">▶▶</button>
                </div>
                <div className="flex items-center justify-end space-x-4">
                  <button type="button" className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                    onClick={() => {
                      // Initialize form states for button click scenario
                      setNewTaskName("New Task");
                      setNewTaskHour(9); 
                      setNewTaskDuration(1);
                      setNewTaskColor(TASK_COLORS[0]);
                      setNewTaskDayOffset(topDayOffset); // Default to top day
                      setShowTaskForm(true);
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
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset - 7)} title="Previous week">◀◀</button>
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset - 1)} title="Previous day">◀</button>
                  <span className="text-white font-medium w-[250px] text-center">
                    {isClient ? getDateLabel(bottomDayOffset) : "Loading date..."}
                  </span>
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset + 1)} title="Next day">▶</button>
                  <button type="button" className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors" onClick={() => setBottomDayOffset(bottomDayOffset + 7)} title="Next week">▶▶</button>
                </div>
                <button type="button" className="border border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200" 
                  onClick={() => showCloneModal({ dayOffset: bottomDayOffset, period: 'morning' })} 
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

            {showTaskForm && (
              <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-[1001]">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Create New Task</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newTaskNameInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name</label>
                      <Input id="newTaskNameInput" type="text" value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} placeholder="Enter task name" />
                    </div>
                    <div>
                      <label htmlFor="newTaskSectionSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Period / Day</label>
                      {/* Temporarily simplify/disable direct state update from this select to avoid NaN issues until it's fully refactored */}
                      <select
                        id="newTaskSectionSelect"
                        // value={newTaskDayOffset === topDayOffset ? 'top_morning' : ...} // Complex value binding
                        // onChange={(e) => { ... complex logic to set newTaskDayOffset and potentially newTaskHour ... }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value={`${topDayOffset}_morning`}>Top Day - Morning</option> {/* Example value, would need parsing */} 
                        <option value={`${topDayOffset}_afternoon`}>Top Day - Afternoon</option>
                        <option value={`${topDayOffset}_evening`}>Top Day - Evening</option>
                        <option value={`${bottomDayOffset}_morning`}>Bottom Day - Morning</option>
                        <option value={`${bottomDayOffset}_afternoon`}>Bottom Day - Afternoon</option>
                        <option value={`${bottomDayOffset}_evening`}>Bottom Day - Evening</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="newTaskHourSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Hour (approx)</label>
                        <Input id="newTaskHourSelect" type="number" value={newTaskHour} onChange={(e) => setNewTaskHour(parseFloat(e.target.value))} step="0.25" min={TIMELINE_START_HOUR} max={TIMELINE_END_HOUR-MIN_TASK_DURATION} />
                      </div>
                      <div>
                        <label htmlFor="newTaskDurationSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                        <select id="newTaskDurationSelect" value={newTaskDuration} onChange={(e) => setNewTaskDuration(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white">
                          {[0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4].map(d => <option key={d} value={d}>{formatDuration(d)}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                      <div className="grid grid-cols-8 gap-1.5">
                        {TASK_COLORS.map((color) => (<button key={`color-button-${color}-${newTaskName}`} type="button" className={`w-6 h-6 rounded-full ${color} ${newTaskColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : ''}`} onClick={() => setNewTaskColor(color)}/>))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 gap-2">
                    <Button variant="outline" onClick={() => setShowTaskForm(false)}>Cancel</Button>
                    <Button onClick={handleSubmitNewTaskForm}>Create Task</Button>
                  </div>
                </div>
              </div>
            )}

            {showCloneConfirmation && (
              <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-[1001]">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-md w-full">
                  <h3 className="text-xl font-bold mb-2 dark:text-white">Clone Tasks</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {isClient ? `Clone tasks from ${getDateLabel(bottomDayOffset)} to ${getDateLabel(topDayOffset)}.` : "Loading details..."}
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
            )}

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