"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Task } from "@/types/planner";
import { useClassScheduleState, ClassScheduleDayMeta } from "@/hooks/useClassScheduleState";
import { useDailyPlanner } from "@/hooks/useDailyPlannerState";
import { EditTaskModal } from "./EditTaskModal";
import { ViewTaskNotesModal } from "./ViewTaskNotesModal";
import { EnhancedActiveModalTask } from "@/hooks/useModalManager";
import { dateFromDateKey } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime } from "@/utils/formatters";
import {
  TIMELINE_END_HOUR,
  TIMELINE_SPLIT_HOUR_1,
  TIMELINE_SPLIT_HOUR_2,
  TIMELINE_SPLIT_HOUR_3,
  PIXELS_PER_HOUR,
  TIMELINE_COLUMN_HEIGHT,
  TASK_BASE_TOP,
  TASK_BASE_BOTTOM_PADDING,
  MIN_TASK_DURATION,
} from "@/lib/constants";
import {
  getPeriodBaseHour,
  getDropZoneContentRect,
  parseTimelineDropZone,
  resolveTimelineDropZone,
  getHourFromPointerInSegment,
  snapHourToQuarter,
  getPixelsPerHourFromRect,
  type TimelinePeriod as DragTimelinePeriod,
} from "@/utils/timelineDragUtils";
import { MemoizedTaskCard } from "./TaskCard";

type TimelinePeriod = "morning" | "afternoon" | "evening";

interface ClassDraggingTask {
  task: Task;
  offsetX: number;
  taskDayOfWeek: number;
  lastValidDropZone?: { dayOffset: number; period: DragTimelinePeriod };
  initialPixelsPerHour: number;
}

interface ClassResizingTask {
  task: Task;
  edge: "start" | "end";
  initialMouseX: number;
  initialStartHour: number;
  initialDuration: number;
  initialPixelsPerHour: number;
}

export default React.memo(function ClassSchedule() {
  console.log('🎨 [ClassSchedule] Component rendering');

  const {
    weekMeta,
    tasksByDate,
    showDailyTasks,
    setShowDailyTasks,
    upsertFromModal,
    deleteTaskById,
    updateClassTaskTime,
  } = useClassScheduleState();

  const {
    tasksByDate: dailyTasksByDate,
    addPoolTask,
    getNextId,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
  } = useDailyPlanner();

  console.log('📊 [ClassSchedule] Received from hook:', {
    weekMetaLength: weekMeta.length,
    tasksByDateSize: tasksByDate.size,
    totalTasks: Array.from(tasksByDate.values()).reduce((sum, tasks) => sum + tasks.length, 0),
  });

  const [currentTimeForMarker, setCurrentTimeForMarker] = useState<Date>(
    () => new Date()
  );
  const [activeEditModalTask, setActiveEditModalTask] =
    useState<EnhancedActiveModalTask | null>(null);
  const [viewingTaskNotes, setViewingTaskNotes] = useState<Task | null>(null);
  const [draggingTask, setDraggingTask] = useState<ClassDraggingTask | null>(null);
  const [resizingTask, setResizingTask] = useState<ClassResizingTask | null>(null);

  const lastDoubleClickTimestampRef = useRef<number>(0);
  const dailyScrollRef = useRef<HTMLDivElement>(null);
  const dailyDayRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Track component mount/unmount
  useEffect(() => {
    console.log('🎬 [ClassSchedule] Component mounted');
    return () => {
      console.log('🔚 [ClassSchedule] Component unmounting');
    };
  }, []);

  // Keep the "now" marker reasonably fresh
  useEffect(() => {
    const id = setInterval(
      () => setCurrentTimeForMarker(new Date()),
      60_000
    );
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to today's card in 7-day daily view
  useEffect(() => {
    if (!dailyScrollRef.current) return;

    const timeoutId = setTimeout(() => {
      const currentDayOfWeek = new Date().getDay();
      const currentDayElement = dailyDayRefs.current.get(currentDayOfWeek);
      const scrollContainer = dailyScrollRef.current;
      if (!currentDayElement || !scrollContainer) return;

      const cardTop = currentDayElement.offsetTop;
      const cardHeight = currentDayElement.offsetHeight;
      const containerHeight = scrollContainer.clientHeight;
      const scrollTop = cardTop - containerHeight / 2 + cardHeight / 2;

      scrollContainer.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "smooth",
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [weekMeta]);

  const orderedDayIndices: number[] = useMemo(
    () => [1, 2, 3, 4, 5, 6, 0], // Monday-first ordering
    []
  );

  const currentDayMeta = useMemo(() => {
    const currentDow = new Date().getDay();
    return weekMeta.find((m) => m.dayOfWeek === currentDow) ?? weekMeta[0];
  }, [weekMeta]);

  const dateKeyByDayOfWeek = useMemo(() => {
    const map = new Map<number, string>();
    weekMeta.forEach((meta) => map.set(meta.dayOfWeek, meta.dateKey));
    return map;
  }, [weekMeta]);

  const isDailyTask = useCallback(
    (taskId: string): boolean => {
      return Array.from(dailyTasksByDate.values()).some((tasks) =>
        tasks.some((task) => task.id === taskId)
      );
    },
    [dailyTasksByDate]
  );

  const shouldUseDailyPlanner = useCallback(
    (task?: Task, isNew?: boolean): boolean => {
      if (isNew) return showDailyTasks;
      if (!task) return showDailyTasks;
      return showDailyTasks || isDailyTask(task.id);
    },
    [showDailyTasks, isDailyTask]
  );

  const handleOpenEditModal = useCallback(
    (task: Task, options?: { isNew?: boolean; isFromPool?: boolean }) => {
      const targetDate = dateFromDateKey(task.baseDate);

      const enhanced: EnhancedActiveModalTask = {
        ...task,
        isFromPool: options?.isFromPool ?? false,
        isNew: options?.isNew ?? false,
        creationContext: {
          mode: "timeline",
          targetDate,
          startHour: task.startHour ?? 9,
          sourceView: "daily",
        },
      };

      setActiveEditModalTask(enhanced);
    },
    []
  );

  const handleSaveFromModal = useCallback(
    (task: Task, options?: { isNew?: boolean; isFromPool?: boolean }) => {
      console.log('💾 [ClassSchedule] handleSaveFromModal called:', {
        taskId: task.id,
        taskName: task.name,
        isNew: options?.isNew,
      });
      const isNew = options?.isNew ?? false;

      if (shouldUseDailyPlanner(task, isNew)) {
        if (isNew) {
          handleAddTask(task.baseDate, task.startHour ?? 9, {
            name: task.name,
            duration: task.duration,
            color: task.color ?? "bg-blue-500",
            notes: task.notes,
            completed: task.completed,
          });
        } else {
          handleUpdateTask(task.id, {
            name: task.name,
            startHour: task.startHour,
            duration: task.duration,
            color: task.color,
            baseDate: task.baseDate,
            notes: task.notes,
            completed: task.completed,
          });
        }
        return;
      }

      upsertFromModal(task, isNew);
    },
    [shouldUseDailyPlanner, handleAddTask, handleUpdateTask, upsertFromModal]
  );

  const handleDeleteFromModal = useCallback(
    (taskId: string, _isFromPool?: boolean) => {
      console.log('🗑️ [ClassSchedule] handleDeleteFromModal called for task:', taskId);
      if (showDailyTasks || isDailyTask(taskId)) {
        handleDeleteTask(taskId);
        return;
      }
      deleteTaskById(taskId);
    },
    [showDailyTasks, isDailyTask, handleDeleteTask, deleteTaskById]
  );

  const handleCloseModal = useCallback(() => {
    setActiveEditModalTask(null);
  }, []);

  const handleViewNotes = useCallback((task: Task) => {
    setViewingTaskNotes(task);
  }, []);

  const handleCloseNotesModal = useCallback(() => {
    setViewingTaskNotes(null);
  }, []);

  const handleCopyTask = useCallback(
    (task: Task) => {
      const poolTaskCopy: Task = {
        ...task,
        id: getNextId(),
        completed: false,
        poolDate: undefined,
      };
      addPoolTask(poolTaskCopy);
    },
    [addPoolTask, getNextId]
  );

  const handleResizeStart = useCallback(
    (task: Task, edge: "start" | "end", e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.button !== 0) return;
      setDraggingTask(null);
      document.body.style.cursor = "col-resize";
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture failures on unsupported targets
      }
      if (task.startHour === undefined) return;

      const dropZone = (e.currentTarget as HTMLElement).closest(
        "[data-timeline-drop]"
      ) as HTMLElement | null;
      const contentRect = dropZone ? getDropZoneContentRect(dropZone) : null;
      const initialPixelsPerHour = contentRect
        ? getPixelsPerHourFromRect(contentRect.width)
        : PIXELS_PER_HOUR;

      setResizingTask({
        task: { ...task },
        edge,
        initialMouseX: e.clientX,
        initialStartHour: task.startHour,
        initialDuration: task.duration,
        initialPixelsPerHour,
      });
    },
    []
  );

  const handleDragStart = useCallback(
    (task: Task, e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      if (e.button !== 0) return;
      setResizingTask(null);

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture failures on unsupported targets
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const dropZone = (e.currentTarget as HTMLElement).closest(
        "[data-timeline-drop]"
      ) as HTMLElement | null;
      const parsedZone = dropZone ? parseTimelineDropZone(dropZone) : null;
      const contentRect = dropZone ? getDropZoneContentRect(dropZone) : null;
      const initialPixelsPerHour = contentRect
        ? getPixelsPerHourFromRect(contentRect.width)
        : PIXELS_PER_HOUR;
      const taskDayOfWeek = dateFromDateKey(task.baseDate).getDay();

      setDraggingTask({
        task: { ...task },
        offsetX,
        taskDayOfWeek,
        lastValidDropZone: parsedZone
          ? { dayOffset: parsedZone.dayOffset, period: parsedZone.period }
          : undefined,
        initialPixelsPerHour,
      });
    },
    []
  );

  const handlePointerMoveResize = useCallback(
    (e: PointerEvent) => {
      if (!resizingTask) return;
      e.preventDefault();

      const {
        edge,
        initialMouseX,
        initialStartHour,
        initialDuration,
        initialPixelsPerHour,
      } = resizingTask;

      const dx = e.clientX - initialMouseX;
      const dHours = dx / initialPixelsPerHour;

      let livePreviewStartHour = initialStartHour;
      let livePreviewDuration = initialDuration;

      if (edge === "start") {
        const nearestSnapPoint = Math.round((initialStartHour + dHours) * 4) / 4;
        livePreviewStartHour = nearestSnapPoint;
        livePreviewDuration =
          initialStartHour + initialDuration - livePreviewStartHour;
      } else {
        const nearestSnapPoint =
          Math.round((initialStartHour + initialDuration + dHours) * 4) / 4;
        livePreviewDuration = nearestSnapPoint - initialStartHour;
      }

      livePreviewDuration = Math.max(MIN_TASK_DURATION, livePreviewDuration);

      if (edge === "start") {
        const originalTaskEnd = initialStartHour + initialDuration;
        livePreviewStartHour = Math.min(
          livePreviewStartHour,
          originalTaskEnd - MIN_TASK_DURATION
        );
        livePreviewStartHour = Math.max(
          TIMELINE_SPLIT_HOUR_1,
          livePreviewStartHour
        );
        livePreviewDuration = originalTaskEnd - livePreviewStartHour;
      } else {
        livePreviewDuration = Math.min(
          livePreviewDuration,
          TIMELINE_END_HOUR - livePreviewStartHour
        );
      }

      livePreviewStartHour = Math.max(
        TIMELINE_SPLIT_HOUR_1,
        livePreviewStartHour
      );
      livePreviewDuration = Math.max(
        MIN_TASK_DURATION,
        Math.min(livePreviewDuration, TIMELINE_END_HOUR - livePreviewStartHour)
      );

      setResizingTask((prev) => {
        if (!prev) return null;
        if (
          prev.task.startHour === livePreviewStartHour &&
          prev.task.duration === livePreviewDuration
        ) {
          return prev;
        }
        return {
          ...prev,
          task: {
            ...prev.task,
            startHour: livePreviewStartHour,
            duration: livePreviewDuration,
          },
        };
      });
    },
    [resizingTask]
  );

  const handlePointerMoveDrag = useCallback(
    (e: PointerEvent) => {
      if (!draggingTask) return;
      e.preventDefault();

      const { task, offsetX, taskDayOfWeek, lastValidDropZone } = draggingTask;
      const zoneInfo = resolveTimelineDropZone(
        e.clientX,
        e.clientY,
        lastValidDropZone
      );
      if (!zoneInfo) return;
      if (!showDailyTasks && zoneInfo.dayOffset !== taskDayOfWeek) return;

      const targetDateKey = dateKeyByDayOfWeek.get(zoneInfo.dayOffset);
      if (showDailyTasks && !targetDateKey) return;

      const baseHour = getPeriodBaseHour(zoneInfo.period);
      let newStartHour = getHourFromPointerInSegment(
        e.clientX,
        zoneInfo.contentRect,
        offsetX,
        baseHour
      );

      const taskDuration = task.duration || MIN_TASK_DURATION;
      newStartHour = Math.max(TIMELINE_SPLIT_HOUR_1, newStartHour);
      newStartHour = Math.min(TIMELINE_END_HOUR - taskDuration, newStartHour);
      const snappedNewStartHour = snapHourToQuarter(newStartHour);

      setDraggingTask((prev) => {
        if (!prev) return null;

        const nextTask = showDailyTasks && targetDateKey
          ? {
              ...prev.task,
              startHour: snappedNewStartHour,
              baseDate: targetDateKey,
            }
          : { ...prev.task, startHour: snappedNewStartHour };

        if (
          prev.task.startHour === nextTask.startHour &&
          prev.task.baseDate === nextTask.baseDate &&
          prev.lastValidDropZone?.period === zoneInfo.period &&
          prev.lastValidDropZone?.dayOffset === zoneInfo.dayOffset
        ) {
          return prev;
        }

        return {
          ...prev,
          lastValidDropZone: {
            dayOffset: zoneInfo.dayOffset,
            period: zoneInfo.period,
          },
          task: nextTask,
        };
      });
    },
    [draggingTask, showDailyTasks, dateKeyByDayOfWeek]
  );

  const commitDailyTaskTime = useCallback(
    (task: Task) => {
      handleUpdateTask(task.id, {
        startHour: task.startHour,
        duration: task.duration,
        baseDate: task.baseDate,
      });
    },
    [handleUpdateTask]
  );

  const endTimelineInteraction = useCallback(() => {
    if (resizingTask?.task.startHour !== undefined) {
      if (showDailyTasks || isDailyTask(resizingTask.task.id)) {
        commitDailyTaskTime(resizingTask.task);
      } else {
        updateClassTaskTime(
          resizingTask.task.id,
          resizingTask.task.startHour,
          resizingTask.task.duration
        );
      }
      setResizingTask(null);
    }
    if (draggingTask?.task.startHour !== undefined) {
      if (showDailyTasks || isDailyTask(draggingTask.task.id)) {
        commitDailyTaskTime(draggingTask.task);
      } else {
        updateClassTaskTime(
          draggingTask.task.id,
          draggingTask.task.startHour,
          draggingTask.task.duration
        );
      }
      setDraggingTask(null);
    }
    document.body.style.cursor = "";
  }, [
    resizingTask,
    draggingTask,
    showDailyTasks,
    isDailyTask,
    commitDailyTaskTime,
    updateClassTaskTime,
  ]);

  useEffect(() => {
    if (!draggingTask && !resizingTask) {
      document.body.style.cursor = "";
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (resizingTask) handlePointerMoveResize(event);
      if (draggingTask) handlePointerMoveDrag(event);
    };

    const onInteractionEnd = () => {
      endTimelineInteraction();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onInteractionEnd);
    window.addEventListener("pointercancel", onInteractionEnd);
    window.addEventListener("blur", onInteractionEnd);
    document.body.style.cursor = draggingTask ? "grabbing" : "col-resize";

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onInteractionEnd);
      window.removeEventListener("pointercancel", onInteractionEnd);
      window.removeEventListener("blur", onInteractionEnd);
    };
  }, [
    draggingTask,
    resizingTask,
    handlePointerMoveResize,
    handlePointerMoveDrag,
    endTimelineInteraction,
  ]);

  const getDisplayTask = useCallback(
    (task: Task): Task => {
      if (resizingTask?.task.id === task.id) return resizingTask.task;
      if (draggingTask?.task.id === task.id) return draggingTask.task;
      return task;
    },
    [resizingTask, draggingTask]
  );

  const renderTimeline = useCallback((period: TimelinePeriod) => {
    let startHour, endHour;
    switch (period) {
      case 'morning': startHour = TIMELINE_SPLIT_HOUR_1; endHour = TIMELINE_SPLIT_HOUR_2; break;
      case 'afternoon': startHour = TIMELINE_SPLIT_HOUR_2; endHour = TIMELINE_SPLIT_HOUR_3; break;
      case 'evening': startHour = TIMELINE_SPLIT_HOUR_3; endHour = TIMELINE_END_HOUR; break; 
    }
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    return (
      <div className="flex h-6 sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 z-20">
        {timelineHours.map((hour) => (
          <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground py-1 px-1 border-l border-border/20" style={{ width: `${PIXELS_PER_HOUR}px` }}>
            <div className={`font-medium ${hour % 6 === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
              {formatTime(hour)}
            </div>
          </div>
        ))}
        <div key={`timeline-end-marker-${period}`} className="flex-none border-l border-border/20" style={{ width: `1px` }}></div>
      </div>
    );
  }, []);

  const handleAddNewClass = useCallback(() => {
    if (!currentDayMeta) return;
    console.log('➕ [ClassSchedule] handleAddNewClass called for day:', currentDayMeta.dayOfWeek);
    const dateKey = currentDayMeta.dateKey;
    const newTask: Task = {
      id: `temp-new-task-${Date.now()}`,
      name: "New Class",
      startHour: 9,
      duration: 1,
      baseDate: dateKey,
      color: "bg-blue-500",
      notes: "",
      completed: false,
    };
    console.log('📝 [ClassSchedule] Opening edit modal for new task:', newTask.id);
    handleOpenEditModal(newTask, { isNew: true, isFromPool: false });
  }, [currentDayMeta, handleOpenEditModal]);

  const renderTaskCard = useCallback(
    (
      task: Task,
      startHour: number,
      endHour: number,
      options?: { overlay?: boolean }
    ) => {
      const startHourVal = task.startHour ?? startHour;
      const taskStartRelativeToSection = Math.max(0, startHourVal - startHour);
      const taskEndRelativeToSection = Math.min(
        endHour - startHour,
        startHourVal + task.duration - startHour
      );
      const renderLeft = taskStartRelativeToSection * PIXELS_PER_HOUR;
      const renderWidth =
        (taskEndRelativeToSection - taskStartRelativeToSection) * PIXELS_PER_HOUR;

      if (renderWidth <= 0) return null;

      const isOverlay = options?.overlay ?? false;
      const isDraggingPreview =
        !isOverlay && draggingTask?.task.id === task.id;
      const cardHeight =
        TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING;

      const taskStyle: React.CSSProperties = {
        left: `${renderLeft}px`,
        width: `${renderWidth}px`,
        top: `${TASK_BASE_TOP}px`,
        height: `${cardHeight}px`,
        zIndex: isOverlay ? 40 : 50,
        ...(isDraggingPreview
          ? { pointerEvents: "none" as const, opacity: 0.85 }
          : {}),
      };

      return (
        <div
          key={isOverlay ? `overlay-${task.id}` : task.id}
          className={cn(
            "absolute",
            isOverlay &&
              "pointer-events-none ring-2 ring-primary/50 ring-inset rounded-md opacity-90"
          )}
          style={taskStyle}
          title={isOverlay ? `Daily planner task: ${task.name}` : undefined}
          onPointerDown={
            isOverlay
              ? undefined
              : (e) => {
                  if (e.button !== 0) return;
                  const target = e.target as HTMLElement;
                  if (target.closest("button, .resize-handle")) return;
                  handleDragStart(task, e);
                }
          }
        >
          <MemoizedTaskCard
            task={task}
            height={cardHeight}
            onStartEdit={
              isOverlay
                ? () => {}
                : (taskToEdit, editOptions) =>
                    handleOpenEditModal(taskToEdit, editOptions)
            }
            onCopy={isOverlay ? () => {} : handleCopyTask}
            onViewNotes={isOverlay ? () => {} : handleViewNotes}
            onResizeStart={
              isOverlay
                ? () => {}
                : (edge, e) => handleResizeStart(task, edge, e)
            }
            currentTime={currentTimeForMarker}
          />
        </div>
      );
    },
    [
      currentTimeForMarker,
      handleOpenEditModal,
      handleCopyTask,
      handleViewNotes,
      handleDragStart,
      handleResizeStart,
      draggingTask,
    ]
  );

  const renderDayPeriod = (dayMeta: ClassScheduleDayMeta, period: TimelinePeriod) => {
    let startHour, endHour;
    switch (period) {
      case 'morning': 
        startHour = TIMELINE_SPLIT_HOUR_1; 
        endHour = TIMELINE_SPLIT_HOUR_2; 
        break;
      case 'afternoon': 
        startHour = TIMELINE_SPLIT_HOUR_2; 
        endHour = TIMELINE_SPLIT_HOUR_3; 
        break;
      case 'evening': 
        startHour = TIMELINE_SPLIT_HOUR_3; 
        endHour = TIMELINE_END_HOUR; 
        break;
    }

    const dateKey = dayMeta.dateKey;
    const tasksForThisColumnDate = tasksByDate.get(dateKey) || [];
    const dailyTasksForThisColumnDate = showDailyTasks
      ? dailyTasksByDate.get(dateKey) || []
      : [];
    
    const tasksToRender = tasksForThisColumnDate.filter((t) => {
      const display = getDisplayTask(t);
      if (display.startHour === undefined) return false;
      const taskStart = display.startHour as number;
      const taskEnd = taskStart + display.duration;
      return taskEnd > startHour && taskStart < endHour;
    });

    const dailyTasksForRender = (() => {
      let tasksForColumn = dailyTasksForThisColumnDate;

      if (showDailyTasks) {
        if (draggingTask?.task) {
          tasksForColumn = tasksForColumn.filter(
            (task) => task.id !== draggingTask.task.id
          );
          if (draggingTask.task.baseDate === dateKey) {
            tasksForColumn = [...tasksForColumn, draggingTask.task];
          }
        } else if (resizingTask?.task?.baseDate === dateKey) {
          tasksForColumn = tasksForColumn.map((task) =>
            task.id === resizingTask.task.id ? resizingTask.task : task
          );
        }
      }

      return tasksForColumn;
    })();

    const dailyTasksToRender = dailyTasksForRender.filter((t) => {
      if (t.startHour === undefined) return false;
      const taskStart = t.startHour as number;
      const taskEnd = taskStart + t.duration;
      return taskEnd > startHour && taskStart < endHour;
    });

    // Current time marker (only show for today's day of week)
    let currentTimeMarker = null;
    const today = new Date();
    if (today.getDay() === dayMeta.dayOfWeek) {
      const currentHourFloat = currentTimeForMarker.getHours() + currentTimeForMarker.getMinutes() / 60;
      if (currentHourFloat >= startHour && currentHourFloat < endHour) {
        const markerLeft = (currentHourFloat - startHour) * PIXELS_PER_HOUR;
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

    const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickXrelative = e.clientX - rect.left;
      const hourInBlock = (clickXrelative / PIXELS_PER_HOUR);
      const snappedNewStartHour = Math.round((startHour + hourInBlock) * 4) / 4;

      const newTask: Task = {
        id: `temp-new-task-${Date.now()}`,
        name: showDailyTasks ? "New Task" : "New Class",
        startHour: snappedNewStartHour,
        duration: 1,
        baseDate: dateKey,
        color: "bg-blue-500",
        notes: "",
        completed: false,
      };
      handleOpenEditModal(newTask, { isNew: true, isFromPool: false });
    };

    const periodWidth = PIXELS_PER_HOUR * (endHour - startHour);

    return (
      <div
        className="relative w-full flex flex-col"
        style={{
          minWidth: `${periodWidth}px`,
          height: `${TIMELINE_COLUMN_HEIGHT}px`,
        }}
      >
        {renderTimeline(period)}
        <div
          className="relative flex-grow bg-background pt-6 overflow-visible cursor-pointer"
          data-timeline-drop
          data-day-offset={dayMeta.dayOfWeek}
          data-section-period={period}
          data-testid={`timeline-area-${period}`}
          onDoubleClick={handleTimelineDoubleClick}
        >
          {currentTimeMarker}
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <div key={`grid-${i}`} className={`absolute h-full ${i % 6 === 0 ? 'border-l border-border/30' : 'border-l border-border/10'}`} style={{ left: `${i * PIXELS_PER_HOUR}px`, top: '0', bottom: '0' }} />
          ))}
          {showDailyTasks
            ? dailyTasksToRender.map((task) =>
                renderTaskCard(getDisplayTask(task), startHour, endHour)
              )
            : tasksToRender.map((task) =>
                renderTaskCard(getDisplayTask(task), startHour, endHour)
              )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground transition-colors">
      <div className="w-full mx-auto flex flex-col flex-1 min-h-0">
        {activeEditModalTask && (
          <EditTaskModal
            taskToEdit={activeEditModalTask}
            onSave={handleSaveFromModal}
            onClose={handleCloseModal}
            onDelete={handleDeleteFromModal}
          />
        )}
        <ViewTaskNotesModal
          task={viewingTaskNotes}
          onClose={handleCloseNotesModal}
          onEdit={(task) => {
            handleOpenEditModal(task, { isNew: false });
            handleCloseNotesModal();
          }}
        />

        <div className="flex flex-col flex-1 min-h-0 px-6 pb-6 gap-6">
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">
                  Class Schedule
                </span>
                <span className="text-xs text-muted-foreground">
                  {showDailyTasks
                    ? "• This week's daily planner tasks"
                    : "• Recurring weekly schedule"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex rounded-md border border-border/60 shrink-0"
                  role="group"
                  aria-label="Class schedule view mode"
                >
                  <button
                    type="button"
                    onClick={() => setShowDailyTasks(false)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-l-md transition-colors",
                      !showDailyTasks
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent hover:bg-muted"
                    )}
                    title="Show recurring class schedule"
                  >
                    Classes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDailyTasks(true)}
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-r-md border-l border-border/60 transition-colors",
                      showDailyTasks
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent hover:bg-muted"
                    )}
                    title="Show daily planner tasks for this week"
                  >
                    Daily Tasks
                  </button>
                </div>
                {!showDailyTasks && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 text-xs h-7"
                    onClick={handleAddNewClass}
                  >
                    + Add Class
                  </Button>
                )}

              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="flex flex-col h-full overflow-y-auto" ref={dailyScrollRef}>
                  <div className="flex justify-center p-4">
                    <div
                      className="border border-border/20 rounded-b-lg overflow-hidden space-y-6"
                      style={{
                        width: `${(TIMELINE_SPLIT_HOUR_2 - TIMELINE_SPLIT_HOUR_1) * PIXELS_PER_HOUR}px`,
                        minWidth: `${(TIMELINE_SPLIT_HOUR_2 - TIMELINE_SPLIT_HOUR_1) * PIXELS_PER_HOUR}px`,
                      }}
                    >
                      {orderedDayIndices.map((dow) => {
                        const meta = weekMeta.find((m) => m.dayOfWeek === dow);
                        if (!meta) return null;
                        const isToday = meta.dayOfWeek === new Date().getDay();
                        const dayTasks = tasksByDate.get(meta.dateKey) || [];
                        const dailyTasks = dailyTasksByDate.get(meta.dateKey) || [];

                        return (
                          <div
                            key={dow}
                            ref={(el) => {
                              if (el) {
                                dailyDayRefs.current.set(dow, el);
                              } else {
                                dailyDayRefs.current.delete(dow);
                              }
                            }}
                            className={cn(
                              "bg-card rounded-lg shadow-sm border overflow-hidden",
                              isToday ? "border-primary/50" : "border-border"
                            )}
                            style={{
                              width: `${(TIMELINE_SPLIT_HOUR_2 - TIMELINE_SPLIT_HOUR_1) * PIXELS_PER_HOUR}px`,
                              minWidth: `${(TIMELINE_SPLIT_HOUR_2 - TIMELINE_SPLIT_HOUR_1) * PIXELS_PER_HOUR}px`,
                            }}
                          >
                            <div className={cn(
                              "flex items-center justify-between px-4 py-2 border-b bg-card/95 backdrop-blur-sm",
                              isToday ? "border-primary/30" : "border-border"
                            )}>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-lg font-semibold",
                                  isToday ? "text-primary" : "text-foreground"
                                )}>
                                  {meta.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {meta.date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                                </span>
                                {isToday && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-bold uppercase">
                                    Today
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {showDailyTasks
                                  ? `${dailyTasks.length} ${dailyTasks.length === 1 ? "task" : "tasks"}`
                                  : `${dayTasks.length} ${dayTasks.length === 1 ? "class" : "classes"}`}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              {renderDayPeriod(meta, 'morning')}
                              {renderDayPeriod(meta, 'afternoon')}
                              {renderDayPeriod(meta, 'evening')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

