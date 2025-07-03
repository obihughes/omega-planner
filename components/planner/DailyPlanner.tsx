"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui";
import { Pin, CopyPlus, Trash2, Calendar, Clock, Edit3, PinOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { formatTime } from '@/utils/formatters';
import { Task } from '../../types/planner';
import { TaskPoolSidebar } from './TaskPoolSidebar';
import { PinnedTasksSidebar } from './PinnedTasksSidebar';
import { TaskAssignmentCalendar } from './TaskAssignmentCalendar';
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
import { getCalendarDateForColumn, getDateKeyFromOffset, dateFromDateKey } from '../../utils/dateUtils';
import { resolveCollisionsForResize, resolveCollisionsForDrag } from '../../utils/taskUtils';
import UnscheduledTasksView from './UnscheduledTasksView';
import WeeklyView from './WeeklyView';
import { useModalManager } from '../../hooks/useModalManager';

type TimelinePeriod = 'night' | 'morning' | 'afternoon' | 'evening';

export default function DailyPlanner() {
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
    editTask,
    createQuickTask,
  } = useDailyPlanner();

  // Debug logging for modal functions
  console.log('🐛 [DailyPlanner] Modal functions from useDailyPlanner:');
  console.log('🐛 [DailyPlanner] createPoolTask:', createPoolTask, 'type:', typeof createPoolTask);
  console.log('🐛 [DailyPlanner] createPoolTaskForDate:', createPoolTaskForDate, 'type:', typeof createPoolTaskForDate);
  console.log('🐛 [DailyPlanner] editTask:', editTask, 'type:', typeof editTask);

  // Debug logging for modal state
  console.log('🐛 [DailyPlanner] activeEditModalTask:', activeEditModalTask);
  console.log('🐛 [DailyPlanner] Modal should be open:', !!activeEditModalTask);

  const [currentTimeForMarker, setCurrentTimeForMarker] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'unscheduled' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
      const timerId = setInterval(() => setCurrentTimeForMarker(new Date()), 60000);
      return () => clearInterval(timerId);
  }, []);

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
      <div className="flex h-8 sticky top-0 bg-card z-20">
        {timelineHours.map((hour) => (
          <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground/60 pt-1 pl-0.5 border-l border-border/20" style={{ width: `${APP_PIXELS_PER_HOUR}px` }}>
            {formatTime(hour)}
          </div>
        ))}
        <div key={`timeline-end-marker-${period}`} className="flex-none border-l border-border/20" style={{ width: `2px` }}></div>
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
        <div className={`relative flex-grow bg-background ${isTargetCopyDay ? 'cursor-copy' : ''}`}
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
            <div key={`grid-${i}`} className="border-l border-border/10 absolute h-full" style={{ left: `${i * APP_PIXELS_PER_HOUR}px`, top: '0', bottom: '0' }} />
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

        {/* Page View Mode Navigation */}
        <div className="mb-4 bg-card border border-border rounded-lg shadow-sm overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Daily Planner</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('daily')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Daily
              </Button>
              <Button
                variant={viewMode === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('weekly')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Weekly
              </Button>
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('monthly')}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Monthly
              </Button>
              <Button
                variant={viewMode === 'unscheduled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('unscheduled')}
                className="flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Unscheduled
              </Button>
            </div>
          </div>
        </div>

        {/* Conditional Content Based on View Mode */}
        {viewMode === 'daily' && (
          <>
            {/* Unified Task Pool and Pinned Tasks View */}
            <div className="mb-4 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="h-32">
                {/* Combined Header */}
                <div className="flex items-center justify-between p-3 bg-muted/10 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CopyPlus className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Task Pool</h3>
                      <span className="text-xs text-muted-foreground">({currentDayPoolTasks.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pin className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Pinned</h3>
                      <span className="text-xs text-muted-foreground">({pinnedTasks.length})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pinnedTasks.some(task => {
                      const taskDueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
                      return taskDueDate.getTime() < new Date().getTime();
                    }) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground text-xs h-6"
                        onClick={clearOverduePinnedTasks}
                        title="Clear overdue pinned tasks"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Clear Overdue
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground text-xs h-6"
                      onClick={clearPool}
                      title="Clear all pool tasks"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Clear Pool
                    </Button>
                  </div>
                </div>
                
                {/* Combined Content - Pool tasks first, then pinned tasks by due date */}
                <div className="flex-1 overflow-hidden p-2">
                  <div className="flex gap-3 h-full overflow-x-auto overflow-y-hidden">
                    {/* Render Task Pool tasks first */}
                    {currentDayPoolTasks.map((task) => (
                      <div
                        key={`pool-${task.id}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', JSON.stringify({ ...task, source: 'pool' }));
                        }}
                        className="relative p-3 rounded-lg bg-transparent border border-border/50 hover:shadow-md transition-all duration-150 group flex-shrink-0 w-48 h-20 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-3 h-full">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex flex-col flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate leading-tight mb-2">
                                {task.name || "Untitled Task"}
                              </p>
                              <div className="text-xs text-muted-foreground">
                                <span>Pool Task</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openEditModal(task, { isFromPool: true });
                              }}
                              title="Edit Task"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeletePoolTask(task.id);
                              }}
                              title="Delete Task"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Render Pinned tasks sorted by due date */}
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
                            className="relative p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-150 group flex-shrink-0 w-48 h-20"
                          >
                            <div className="flex items-start justify-between gap-3 h-full">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="flex flex-col flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate leading-tight mb-1">
                                    {task.name || "Untitled Task"}
                                  </p>
                                  <div className={`text-xs ${timeRemaining.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                    <span>{timeRemaining.text}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openEditModal(task);
                                  }}
                                  title="Edit Task"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleUnpinTask(task.id);
                                  }}
                                  title="Unpin Task"
                                >
                                  <PinOff className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6" ref={timelineScrollRef}>
                <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-4">
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
                    <Button onClick={() => openEditModal()}>
                        Add Task
                    </Button>
                  </div>
                  <div className="border border-border/30 rounded-md overflow-hidden">
                    <div className="flex flex-col">
                        {renderDayColumn(topDayOffset, 'night')}
                        {renderDayColumn(topDayOffset, 'morning')}
                        {renderDayColumn(topDayOffset, 'afternoon')}
                        {renderDayColumn(topDayOffset, 'evening')}
                    </div>
                  </div>
                </div>

                <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
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
                    <Button onClick={() => cloneDayTasks(dateFromDateKey(getCalendarDateForColumn(bottomDayOffset)), dateFromDateKey(getCalendarDateForColumn(topDayOffset)))} title="Clone tasks to the other visible day">
                        Clone to {bottomDayOffset < topDayOffset ? 'Top' : 'Bottom'}
                    </Button>
                  </div>
                  <div className="border border-border/30 rounded-md overflow-hidden">
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

        {/* Unscheduled View */}
        {viewMode === 'unscheduled' && (
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <UnscheduledTasksView 
              poolTasks={combinedPoolTasks}
              pinnedTasks={pinnedTasks}
              getPoolTasksForDate={getPoolTasksForDate}
              getCombinedPoolTasks={getCombinedPoolTasks}
              addPoolTask={addPoolTask}
              removePoolTask={removePoolTask}
              removePoolTaskForDate={removePoolTaskForDate}
              createPoolTask={createPoolTask}
              createPoolTaskForDate={createPoolTaskForDate}
              editTask={editTask}
            />
          </div>
        )}

        {/* Weekly View */}
        {viewMode === 'weekly' && (
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <WeeklyView editTask={editTask} />
          </div>
        )}

        {/* Monthly View */}
        {viewMode === 'monthly' && (
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <TaskAssignmentCalendar
              poolTasks={generalPoolTasks}
              scheduledTasks={tasksByDate}
              pinnedTasks={pinnedTasks}
              onAssignTask={handleAssignTask}
              onUnassignTask={handleUnassignTask}
              onRescheduleTask={handleRescheduleTask}
              onCreatePoolTask={addPoolTaskForDate}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onAddPoolTaskForDate={addPoolTaskForDate}
              onClearPool={clearPool}
              getPoolTasksForDate={getPoolTasksForDate}
              createQuickTask={createQuickTask}
              editTask={editTask}
            />
          </div>
        )}


      </div>
    </div>
  );
} 