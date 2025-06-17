"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui";
import { Pin, CopyPlus } from 'lucide-react';

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
    DEFAULT_TASK_COLOR_INDEX
} from '../../lib/constants';
import { MemoizedTaskCard } from './TaskCard';
import { EditTaskModal } from './EditTaskModal';
import { ViewTaskNotesModal } from './ViewTaskNotesModal';
import { getCalendarDateForColumn } from '../../utils/dateUtils';
import { resolveCollisionsForResize, resolveCollisionsForDrag } from '../../utils/taskUtils';

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
    if (!draggingTask || !draggingTask.taskElement || !draggingTask.task) return;
    e.preventDefault();

    const { task: draggedTaskItem, offsetX } = draggingTask;
    const currentOffsetX = offsetX || 0;

    let targetDayOffset: number | null = null;
    let targetPeriod: 'morning' | 'afternoon' | 'evening' | null = null;
    let relativeXInTimelineSegment = 0;
    let baseHourForCalc = APP_TIMELINE_START_HOUR;

    const dropZone = (e.target as HTMLElement).closest('[data-testid^="timeline-area-"]') as HTMLElement;

    if (dropZone) {
      const dayOffsetAttr = dropZone.getAttribute('data-day-offset');
      const periodAttr = dropZone.getAttribute('data-section-period') as 'morning' | 'afternoon' | 'evening' | null;
      
      if (dayOffsetAttr && periodAttr) {
        targetDayOffset = parseInt(dayOffsetAttr, 10);
        targetPeriod = periodAttr;
        const rect = dropZone.getBoundingClientRect();
        relativeXInTimelineSegment = (e.clientX - rect.left) - currentOffsetX;

        switch (targetPeriod) {
          case 'morning': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
          case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
          case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
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

      const targetColumnDate = getCalendarDateForColumn(targetDayOffset);
      const collisionResult = resolveCollisionsForDrag(
        { id: draggedTaskItem.id, duration: taskDuration, baseDate: draggedTaskItem.baseDate },
        snappedNewStartHour,
        targetColumnDate,
        tasksByDate.get(targetColumnDate.toISOString().split('T')[0]) || [],
        APP_TIMELINE_START_HOUR,
        APP_TIMELINE_END_HOUR
      );

      if (collisionResult.canMove) {
        setDraggingTask(prev => {
          if (!prev || !prev.task) return null;
          const newBaseDateIso = getCalendarDateForColumn(targetDayOffset as number).toISOString();
          if (prev.task.startHour === collisionResult.snappedNewStartHour && prev.task.baseDate === newBaseDateIso) {
            return prev;
          }
          return { ...prev, task: { ...prev.task, startHour: collisionResult.snappedNewStartHour, baseDate: newBaseDateIso, dayOffset: 0 } };
        });
      }
    }
  }, [draggingTask, setDraggingTask, tasksByDate]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (resizingTask) handleMouseMoveResize(event);
      if (draggingTask) handleMouseMoveDrag(event); 
    };
    if (draggingTask || resizingTask) {
      window.addEventListener('mousemove', onMouseMove);
      document.body.style.cursor = draggingTask ? 'grabbing' : 'col-resize';
    } else {
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

  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>, dayOffset: number, period: 'morning' | 'afternoon' | 'evening') => {
      if (copyingTaskData) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickXrelative = e.clientX - rect.left;
      let baseHourForCalc: number;
      switch (period) {
          case 'morning': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
          case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
          case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
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
          dayOffset: 0, 
          color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX],
          notes: "",
          completed: false,
      };
      openEditModal(newTaskDefaults, { isNew: true });
  };
  
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, dayOffset: number, period: 'morning' | 'afternoon' | 'evening') => {
      if (!copyingTaskData) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickXrelative = e.clientX - rect.left;
      let baseHourForCalc: number;
      switch (period) {
          case 'morning': baseHourForCalc = APP_TIMELINE_START_HOUR; break;
          case 'afternoon': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_1; break;
          case 'evening': baseHourForCalc = APP_TIMELINE_SPLIT_HOUR_2; break;
      }
      const hourInBlock = clickXrelative / APP_PIXELS_PER_HOUR;
      const snappedNewStartHour = Math.round((baseHourForCalc + hourInBlock) * 4) / 4;
      const targetDate = getCalendarDateForColumn(dayOffset);
      handleDropCopy(targetDate, snappedNewStartHour);
  };

  const renderColumn = useCallback((dayOffset: number, period: 'morning' | 'afternoon' | 'evening') => {
    let startHour, endHour;
    switch (period) {
        case 'morning': startHour = APP_TIMELINE_START_HOUR; endHour = APP_TIMELINE_SPLIT_HOUR_1; break;
        case 'afternoon': startHour = APP_TIMELINE_SPLIT_HOUR_1; endHour = APP_TIMELINE_SPLIT_HOUR_2; break;
        case 'evening': startHour = APP_TIMELINE_SPLIT_HOUR_2; endHour = APP_TIMELINE_END_HOUR; break;
    }

    const columnCalendarDate = getCalendarDateForColumn(dayOffset);
    const tasksForThisColumnDate = tasksByDate.get(columnCalendarDate.toISOString().split('T')[0]) || [];

    const tasksToRender = tasksForThisColumnDate.filter(t => {
        const taskToConsider = (draggingTask && draggingTask.task.id === t.id) ? draggingTask.task : t;
        const taskStart = taskToConsider.startHour;
        const taskEnd = taskStart + taskToConsider.duration;
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
                    <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #ef4444' }} />
                </div>
            );
        }
    }

    return (
      <div className={`relative border border-border rounded-md ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500' : ''}`}
        style={{ width: `${APP_PIXELS_PER_HOUR * (endHour - startHour)}px`, height: `${TIMELINE_COLUMN_HEIGHT}px` }}
        data-section-period={period} 
        data-day-offset={dayOffset}
      >
        {renderTimeline(period)}
        <div className={`relative h-full bg-background ${isTargetCopyDay ? 'cursor-copy' : ''}`}
          data-testid={`timeline-area-${dayOffset}-${period}`}
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
              let displayTask = task;
              if (draggingTask && draggingTask.task.id === task.id) displayTask = draggingTask.task;
              if (resizingTask && resizingTask.task.id === task.id) displayTask = resizingTask.task;

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
              };

              return (
                <div key={displayTask.id} 
                  className={`absolute ${isBeingDragged || isBeingResized ? 'opacity-90' : ''} ${isBeingCopied ? 'ring-2 ring-blue-500' : ''}`} 
                  style={taskStyle}
                  onMouseDown={(e) => handleDragStart(displayTask, e)}
                >
                    <MemoizedTaskCard
                        task={displayTask}
                        height={TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}
                        onStartEdit={(taskToEdit, options) => openEditModal(taskToEdit, options)} 
                        onCopy={startCopy} 
                        onViewNotes={openViewNotesModal}
                        onResizeStart={(edge, e) => handleResizeStart(displayTask, edge, e)}
                    />
                </div>
              );
          })}
        </div>
      </div>
    );
  }, [tasksByDate, draggingTask, resizingTask, copyingTaskData, currentTimeForMarker, handleDropCopy, openEditModal, startCopy, openViewNotesModal, renderTimeline, targetCopyDayOffset]);
  
  const handleDragStart = useCallback((taskToDrag: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if the click is on a resize handle
    if ((e.target as HTMLElement).closest('.resize-handle')) {
        return;
    }

    cancelCopy();
    setResizingTask(null);
    if (taskToDrag) {
      const taskElement = e.currentTarget as HTMLDivElement;
      const rect = taskElement.getBoundingClientRect();
      setDraggingTask({ 
        initialMouseY: e.clientY,
        initialStartHour: taskToDrag.startHour,
        initialDayOffset: taskToDrag.dayOffset,
        taskElement: taskElement, 
        task: { ...taskToDrag },
        offsetX: e.clientX - rect.left,
      });
    }
  }, [cancelCopy, setResizingTask, setDraggingTask]);

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
        
        <div className="mb-4 flex gap-2">
            <div className="flex flex-col gap-1 w-40">
                <Button variant={activeSidebarTab === 'pool' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => setActiveSidebarTab('pool')}>
                    <CopyPlus className="mr-2 h-4 w-4" /> Task Pool
                </Button>
                <Button variant={activeSidebarTab === 'pinned' ? 'secondary' : 'ghost'} className="justify-start" onClick={() => setActiveSidebarTab('pinned')}>
                    <Pin className="mr-2 h-4 w-4" /> Pinned
                </Button>
            </div>
            <div className="flex-grow bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="h-48 overflow-y-auto">
                    {activeSidebarTab === 'pool' && (
                        <TaskPoolSidebar
                            poolTasks={poolTasks}
                            TASK_COLORS={TASK_COLORS}
                            activeTab="pool"
                            topDayOffset={topDayOffset}
                            isOpen={isTaskPoolOpen}
                            setIsOpen={setIsTaskPoolOpen}
                            onActualAddPoolTask={handleActualAddPoolTask}
                            onAddTaskToTimeline={(task, dayOffset) => { startCopy(task); const targetDate = getCalendarDateForColumn(dayOffset); handleDropCopy(targetDate, task.startHour || 9); }}
                            onDeletePoolTask={handleDeletePoolTask}
                            onClearPool={clearPool}
                            openEditModal={(task, isFromPool) => openEditModal(task, { isFromPool: isFromPool })}
                        />
                    )}
                    {activeSidebarTab === 'pinned' && (
                        <PinnedTasksSidebar
                            pinnedTasks={pinnedTasks}
                            onUnpinTask={handleUnpinTask}
                            formatTimeRemaining={formatTimeRemaining}
                            openEditModal={openEditModal}
                            onClearOverduePinnedTasks={clearOverduePinnedTasks}
                            onSyncPinnedTasks={syncPinnedTasksWithTimeline}
                        />
                    )}
                </div>
            </div>
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
                <Button onClick={() => openEditModal({ id: `temp-new-task-${Date.now()}`, name: "New Task", startHour: 9, duration: 1, baseDate: getCalendarDateForColumn(topDayOffset).toISOString(), dayOffset: 0, color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX], notes: "", completed: false }, { isNew: true })}>
                    Add Task
                </Button>
              </div>
              <div className="flex flex-col gap-px">
                  {renderColumn(topDayOffset, 'morning')}
                  {renderColumn(topDayOffset, 'afternoon')}
                  {renderColumn(topDayOffset, 'evening')}
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
              <div className="flex flex-col gap-px">
                  {renderColumn(bottomDayOffset, 'morning')}
                  {renderColumn(bottomDayOffset, 'afternoon')}
                  {renderColumn(bottomDayOffset, 'evening')}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
} 