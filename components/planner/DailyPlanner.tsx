"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui";
import { Pin, CopyPlus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatTime } from '@/utils/formatters';
import { Task } from '../../types/planner';
import { TaskPoolSidebar } from './TaskPoolSidebar';
import { PinnedTasksSidebar } from './PinnedTasksSidebar';
import { useDailyPlanner } from '../../hooks/useDailyPlannerState';
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
import { getCalendarDateForColumn } from '../../utils/dateUtils';
import { resolveCollisionsForResize, resolveCollisionsForDrag } from '../../utils/taskUtils';

type TimelinePeriod = 'night' | 'morning' | 'afternoon' | 'evening';

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
    setActiveSidebarTab,
    draggingTask,
    setDraggingTask,
    resizingTask,
    setResizingTask,
    copyingTaskData,
    activeEditModalTask,
    handleDeleteTask,
    openEditModal,
    closeEditModal,
    saveTaskFromModal,
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
    copyTaskToPool
  } = useDailyPlanner();

  const [currentTimeForMarker, setCurrentTimeForMarker] = useState(new Date());
  const [targetCopyDayOffset, setTargetCopyDayOffset] = useState<number | null>(null);

  useEffect(() => {
      const timerId = setInterval(() => setCurrentTimeForMarker(new Date()), 60000);
      return () => clearInterval(timerId);
  }, []);

  const timelineScrollRef = useRef<HTMLDivElement>(null);

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
    console.log('EVENT: handleMouseMoveResize');
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

    const collisionResult = resolveCollisionsForResize(
      { 
        id: originalTaskAtResizeStart.id, 
        baseDate: originalTaskAtResizeStart.baseDate,
        initialStartHour: initialStartHour, 
        initialDuration: initialDuration 
      },
      livePreviewStartHour, 
      livePreviewDuration, 
      tasksByDate.get(new Date(originalTaskAtResizeStart.baseDate).toISOString().split('T')[0]) || [],
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
    console.log('EVENT: handleMouseMoveDrag');
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

    console.log('DRAG DEBUG: elementUnderMouse:', elementUnderMouse?.tagName, elementUnderMouse?.className);
    console.log('DRAG DEBUG: dropZone:', dropZone?.getAttribute('data-testid'));

    if (dropZone) {
      const dayOffsetAttr = dropZone.getAttribute('data-day-offset');
      const periodAttr = dropZone.getAttribute('data-section-period') as TimelinePeriod | null;
      
      console.log('DRAG DEBUG: dayOffsetAttr:', dayOffsetAttr, 'periodAttr:', periodAttr);
      
      if (dayOffsetAttr && periodAttr) {
        targetDayOffset = parseInt(dayOffsetAttr, 10);
        targetPeriod = periodAttr;
        const rect = dropZone.getBoundingClientRect();
        relativeXInTimelineSegment = (e.clientX - rect.left) - currentOffsetX;

        console.log('DRAG DEBUG: rect.left:', rect.left, 'clientX:', e.clientX, 'offsetX:', currentOffsetX);
        console.log('DRAG DEBUG: relativeXInTimelineSegment:', relativeXInTimelineSegment);

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

      console.log('DRAG DEBUG: hourInBlock:', hourInBlock, 'newStartHour:', newStartHour, 'snappedNewStartHour:', snappedNewStartHour);

      const targetColumnDate = getCalendarDateForColumn(targetDayOffset);

      // Use the same date key format as in useDailyPlannerState.ts
      const targetDateKey = targetColumnDate.toISOString().split('T')[0];
      const tasksForTargetDate = tasksByDate.get(targetDateKey) || [];
      
      const collisionResult = resolveCollisionsForDrag(
        { id: draggedTaskItem.id, duration: taskDuration, baseDate: draggedTaskItem.baseDate },
        snappedNewStartHour,
        targetColumnDate,
        tasksForTargetDate,
        APP_TIMELINE_START_HOUR,
        APP_TIMELINE_END_HOUR
      );

      console.log('DRAG DEBUG: collisionResult:', collisionResult);

      if (collisionResult.canMove) {
        setDraggingTask(prev => {
          if (!prev || !prev.task) return null;
          const newBaseDateIso = targetColumnDate.toISOString();
          if (prev.task.startHour === collisionResult.snappedNewStartHour && prev.task.baseDate === newBaseDateIso) {
            return prev;
          }
          console.log('DRAG DEBUG: Updating task position to:', collisionResult.snappedNewStartHour, newBaseDateIso);
          return { ...prev, task: { ...prev.task, startHour: collisionResult.snappedNewStartHour, baseDate: newBaseDateIso } };
        });
      } else {
        console.log('DRAG DEBUG: Cannot move - collision detected');
      }
    } else {
      console.log('DRAG DEBUG: No valid drop zone found');
    }
  }, [draggingTask, setDraggingTask, tasksByDate]);

  const handleMouseUp = useCallback(() => {
    console.log('==== MOUSE UP INITIATED ====');
    console.log('MOUSE UP: Current draggingTask state:', draggingTask ? {
      taskId: draggingTask.task.id,
      taskName: draggingTask.task.name,
      currentStartHour: draggingTask.task.startHour,
      currentBaseDate: draggingTask.task.baseDate
    } : null);
    console.log('MOUSE UP: Current resizingTask state:', !!resizingTask);
    
    if (draggingTask && draggingTask.task) {
      console.log('MOUSE UP: Processing drag end - saving task:', draggingTask.task);
      saveTaskFromModal(draggingTask.task, { isNew: false }); 
      setDraggingTask(null);
      console.log('MOUSE UP: Drag task saved and state cleared');
    }
    
    if (resizingTask && resizingTask.task) {
        console.log('MOUSE UP: Processing resize end - saving task:', resizingTask.task);
        saveTaskFromModal(resizingTask.task, { isNew: false });
        setResizingTask(null);
        console.log('MOUSE UP: Resize task saved and state cleared');
    }
    
    document.body.style.cursor = '';
    console.log('MOUSE UP: Reset cursor and completed');
  }, [draggingTask, resizingTask, saveTaskFromModal, setDraggingTask, setResizingTask]);

  useEffect(() => {
    console.log('==== MOUSE LISTENERS EFFECT ====');
    console.log('EFFECT: draggingTask state:', draggingTask ? {
      taskId: draggingTask.task.id,
      taskName: draggingTask.task.name,
      initialStartHour: draggingTask.initialStartHour,
      currentStartHour: draggingTask.task.startHour,
      baseDate: draggingTask.task.baseDate
    } : null);
    console.log('EFFECT: resizingTask state:', !!resizingTask);
    
    const onMouseMove = (event: MouseEvent) => {
      console.log('EVENT: Global mouse move detected');
      if (resizingTask) {
        console.log('EVENT: Calling handleMouseMoveResize');
        handleMouseMoveResize(event);
      }
      if (draggingTask) {
        console.log('EVENT: Calling handleMouseMoveDrag');
        handleMouseMoveDrag(event); 
      }
    };

    const onMouseUp = () => {
        console.log('EVENT: Global mouse up detected');
        handleMouseUp();
    };

    if (draggingTask || resizingTask) {
      console.log('EFFECT: ADDING global mouse listeners');
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = draggingTask ? 'grabbing' : 'col-resize';
      console.log('EFFECT: Set cursor to:', draggingTask ? 'grabbing' : 'col-resize');
    } else {
      console.log('EFFECT: No active drag/resize state, not adding listeners');
      document.body.style.cursor = '';
    }

    return () => {
      console.log('EFFECT: CLEANUP - removing global mouse listeners');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggingTask, resizingTask, handleMouseMoveResize, handleMouseMoveDrag, handleMouseUp]);

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
      <div className="flex h-8 border-b border-border sticky top-0 bg-card z-20">
        {timelineHours.map((hour) => (
          <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground pt-1 pl-0.5 border-l border-border" style={{ width: `${APP_PIXELS_PER_HOUR}px` }}>
            {formatTime(hour)}
          </div>
        ))}
        <div key={`timeline-end-marker-${period}`} className="flex-none border-l border-border" style={{ width: `2px` }}></div>
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
      const targetDate = getCalendarDateForColumn(dayOffset);
      const newTaskDefaults: Task = {
          id: `temp-new-task-${Date.now()}`,
          name: "New Task", 
          startHour: snappedNewStartHour,
          duration: 1,
          baseDate: targetDate.toISOString(),
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
      const targetDate = getCalendarDateForColumn(dayOffset);
      handleDropCopy(targetDate, snappedNewStartHour);
  };

  const handleDragStart = useCallback((taskToDrag: Task, e: React.MouseEvent) => {
    console.log('==== DRAG START INITIATED ====');
    console.log('DRAG START: Task details:', {
      id: taskToDrag.id,
      name: taskToDrag.name,
      startHour: taskToDrag.startHour,
      baseDate: taskToDrag.baseDate
    });
    console.log('DRAG START: Mouse event details:', {
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target,
      currentTarget: e.currentTarget
    });
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if the click is on a resize handle
    if ((e.target as HTMLElement).closest('.resize-handle')) {
        console.log('DRAG START: Click was on resize handle, aborting drag');
        return;
    }

    console.log('DRAG START: Calling helper functions...');
    cancelCopy();
    setResizingTask(null);
    
    if (taskToDrag) {
      const draggingState = { 
        initialMouseY: e.clientY,
        initialStartHour: taskToDrag.startHour,
        taskElement: null, // We don't need this for the new approach
        task: { ...taskToDrag },
        offsetX: 0, // Start with 0 offset for simpler calculation
      };
      
      console.log('DRAG START: Setting dragging state:', draggingState);
      setDraggingTask(draggingState);
      console.log('DRAG START: Drag initialization complete');
    } else {
      console.log('DRAG START: ERROR - taskToDrag is null/undefined');
    }
  }, [cancelCopy, setResizingTask, setDraggingTask]);

  const renderColumn = useCallback((dayOffset: number, period: TimelinePeriod) => {
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

    const columnCalendarDate = getCalendarDateForColumn(dayOffset);
    const dateKey = columnCalendarDate.toISOString().split('T')[0];
    const tasksForThisColumnDate = tasksByDate.get(dateKey) || [];
    
    // Filter out the original task if it's being dragged
    let tasksToDisplay = tasksForThisColumnDate.filter(task => {
        return !(draggingTask && draggingTask.task.id === task.id);
    });

    // If a task is being dragged, check if it belongs in this column
    if (draggingTask) {
        const draggedTaskDateKey = new Date(draggingTask.task.baseDate).toISOString().split('T')[0];
        if (draggedTaskDateKey === dateKey) {
            tasksToDisplay.push(draggingTask.task);
        }
    }
    
    const tasksToRender = tasksToDisplay.filter(t => {
        const taskStart = t.startHour;
        const taskEnd = taskStart + t.duration;
        return taskEnd > startHour && taskStart < endHour;
    });

    console.log(`RENDER: Column ${dayOffset}-${period} rendering ${tasksToRender.length} tasks:`, 
      tasksToRender.map(t => ({ id: t.id, name: t.name, startHour: t.startHour })));

    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;

    let currentTimeMarker = null;
    if (dayOffset === 0) {
        const now = currentTimeForMarker;
        const currentHourFloat = now.getHours() + now.getMinutes() / 60;
        if (currentHourFloat >= startHour && currentHourFloat < endHour) {
            const markerLeft = (currentHourFloat - startHour) * APP_PIXELS_PER_HOUR;
            currentTimeMarker = (
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none" style={{ left: `${markerLeft}px` }} title={`Current time: ${formatTime(currentHourFloat)}`}>
                    <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #ef4444' }} />
                </div>
            );
        }
    }

    return (
      <div className={`relative w-full border border-border rounded-md ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500' : ''}`}
        style={{ minWidth: `${APP_PIXELS_PER_HOUR * (endHour - startHour)}px`, height: `${TIMELINE_COLUMN_HEIGHT}px` }}
      >
        {renderTimeline(period)}
        <div className={`relative h-full bg-background ${isTargetCopyDay ? 'cursor-copy' : ''}`}
          data-testid={`timeline-area-${dayOffset}-${period}`}
          data-day-offset={dayOffset}
          data-section-period={period}
          onClick={(e) => handleTimelineClick(e, dayOffset, period)}
          onDoubleClick={(e) => handleTimelineDoubleClick(e, dayOffset, period)}
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
            <div key={`grid-${i}`} className="border-l border-border/20 absolute h-full" style={{ left: `${i * APP_PIXELS_PER_HOUR}px`, top: '0', bottom: '0' }} />
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
                        onDragStart={(task, e) => {
                          console.log('RENDER: onDragStart prop called for task:', task.name);
                          handleDragStart(task, e);
                        }}
                    />
                </div>
              );
          })}
        </div>
      </div>
    );
  }, [tasksByDate, draggingTask, resizingTask, copyingTaskData, currentTimeForMarker, handleDropCopy, openEditModal, startCopy, openViewNotesModal, renderTimeline, targetCopyDayOffset, handleDragStart]);
  
  const deleteTaskHandlerForModal = (taskId: string, isFromPool?: boolean) => {
    if (isFromPool) {
      if (handleDeletePoolTask) handleDeletePoolTask(taskId);
    } else {
      handleDeleteTask(taskId);
    }
  };

  return (
    <div className="min-h-screen p-2 bg-background text-foreground transition-colors">
      <div className="w-full mx-auto">
        {activeEditModalTask && (
          <EditTaskModal
            taskToEdit={activeEditModalTask}
            onSave={saveTaskFromModal}
            onClose={closeEditModal}
            onColorChange={handleTaskColorChange}
            onPinTask={handlePinTask}
            onMoveToPool={copyTaskToPool}
            pinnedTasks={pinnedTasks}
            onDelete={deleteTaskHandlerForModal}
            onCopyAndEnterPasteMode={handleCopyAndEnterPasteMode}
          />
        )}
        {viewingTaskNotes && (
          <ViewTaskNotesModal task={viewingTaskNotes} onClose={closeViewNotesModal} onEdit={openEditModal} />
        )}
        
        <div className="mb-4 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <Tabs defaultValue="pinned" className="flex h-28">
            <div className="flex flex-col w-32 border-r border-border bg-muted/20">
              <TabsList className="flex-col h-auto bg-transparent p-1">
                <TabsTrigger value="pool" className="w-full justify-start text-xs">
                  <CopyPlus className="mr-1 h-3 w-3" /> Pool
                </TabsTrigger>
                <TabsTrigger value="pinned" className="w-full justify-start text-xs">
                  <Pin className="mr-1 h-3 w-3" /> Pinned
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 p-1">
                {pinnedTasks.some(task => new Date(task.dueDate).getTime() < new Date().getTime()) && (
                   <Button
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground text-xs h-6 w-full"
                      onClick={clearOverduePinnedTasks}
                      title="Clear all overdue pinned tasks"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <TabsContent value="pool" className="h-full m-0 p-0">
                  <TaskPoolSidebar
                      poolTasks={poolTasks}
                      TASK_COLORS={TASK_COLORS}
                      activeTab="pool"
                      topDayOffset={topDayOffset}
                      isOpen={true}
                      setIsOpen={() => {}}
                      onActualAddPoolTask={handleActualAddPoolTask}
                      onAddTaskToTimeline={(task, dayOffset) => { startCopy(task); const targetDate = getCalendarDateForColumn(dayOffset); handleDropCopy(targetDate, task.startHour || 9); }}
                      onDeletePoolTask={handleDeletePoolTask}
                      onClearPool={clearPool}
                      openEditModal={(task, isFromPool) => openEditModal(task, { isFromPool: isFromPool })}
                  />
              </TabsContent>
              <TabsContent value="pinned" className="h-full m-0 p-0">
                  <PinnedTasksSidebar
                      pinnedTasks={pinnedTasks}
                      onUnpinTask={handleUnpinTask}
                      formatTimeRemaining={formatTimeRemaining}
                      openEditModal={openEditModal}
                      onClearOverduePinnedTasks={clearOverduePinnedTasks}
                      onSyncPinnedTasks={syncPinnedTasksWithTimeline}
                  />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="space-y-2" ref={timelineScrollRef}>
            <div className="bg-card p-3 rounded-lg shadow-sm border border-border overflow-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset - 7)} title="Previous week">«</Button>
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset - 1)} title="Previous day">‹</Button>
                  <span className="text-foreground font-medium text-center px-3 w-52">
                    {isClient ? getDateLabel(topDayOffset) : "Loading..."}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset + 1)} title="Next day">›</Button>
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset + 7)} title="Next week">»</Button>
                  {isClient && getRelativeDayLabel(topDayOffset) && (
                    <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded-sm">
                      {getRelativeDayLabel(topDayOffset)}
                    </span>
                  )}
                </div>
                <Button onClick={() => openEditModal({ id: `temp-new-task-${Date.now()}`, name: "New Task", startHour: 9, duration: 1, baseDate: getCalendarDateForColumn(topDayOffset).toISOString(), color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX], notes: "", completed: false }, { isNew: true })}>
                    Add Task
                </Button>
              </div>
              <div className="overflow-x-auto">
                <div className="flex flex-col gap-1">
                    {renderColumn(topDayOffset, 'night')}
                    {renderColumn(topDayOffset, 'morning')}
                    {renderColumn(topDayOffset, 'afternoon')}
                    {renderColumn(topDayOffset, 'evening')}
                </div>
              </div>
            </div>

            <div className="bg-card p-3 rounded-lg shadow-sm border border-border overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset - 7)} title="Previous week">«</Button>
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset - 1)} title="Previous day">‹</Button>
                    <span className="text-foreground font-medium text-center px-3 w-52">
                        {isClient ? getDateLabel(bottomDayOffset) : "Loading..."}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset + 1)} title="Next day">›</Button>
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset + 7)} title="Next week">»</Button>
                    {isClient && getRelativeDayLabel(bottomDayOffset) && (
                        <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded-sm">
                        {getRelativeDayLabel(bottomDayOffset)}
                        </span>
                    )}
                </div>
                <Button onClick={() => cloneDayTasks(getCalendarDateForColumn(bottomDayOffset), getCalendarDateForColumn(topDayOffset))} title="Clone tasks to the other visible day">
                    Clone to {bottomDayOffset < topDayOffset ? 'Top' : 'Bottom'}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <div className="flex flex-col gap-1">
                    {renderColumn(bottomDayOffset, 'night')}
                    {renderColumn(bottomDayOffset, 'morning')}
                    {renderColumn(bottomDayOffset, 'afternoon')}
                    {renderColumn(bottomDayOffset, 'evening')}
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
} 