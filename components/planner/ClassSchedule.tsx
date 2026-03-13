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
import { EditTaskModal } from "./EditTaskModal";
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
} from "@/lib/constants";
import { MemoizedTaskCard } from "./TaskCard";

type TimelinePeriod = "morning" | "afternoon" | "evening";

export default React.memo(function ClassSchedule() {
  console.log('🎨 [ClassSchedule] Component rendering');

  const {
    weekMeta,
    tasksByDate,
    upsertFromModal,
    deleteTaskById,
  } = useClassScheduleState();

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
      upsertFromModal(task, isNew);
    },
    [upsertFromModal]
  );

  const handleDeleteFromModal = useCallback(
    (taskId: string, _isFromPool?: boolean) => {
      console.log('🗑️ [ClassSchedule] handleDeleteFromModal called for task:', taskId);
      deleteTaskById(taskId);
    },
    [deleteTaskById]
  );

  const handleCloseModal = useCallback(() => {
    setActiveEditModalTask(null);
  }, []);

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
    
    const tasksToRender = tasksForThisColumnDate.filter(t => {
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
      
      const targetDate = dateFromDateKey(dateKey);
      const newTask: Task = {
        id: `temp-new-task-${Date.now()}`,
        name: "New Class",
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
        <div className="relative flex-grow bg-background pt-6 cursor-pointer"
          onDoubleClick={handleTimelineDoubleClick}
        >
          {currentTimeMarker}
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <div key={`grid-${i}`} className={`absolute h-full ${i % 6 === 0 ? 'border-l border-border/30' : 'border-l border-border/10'}`} style={{ left: `${i * PIXELS_PER_HOUR}px`, top: '0', bottom: '0' }} />
          ))}
          {tasksToRender.map((task) => {
            const startHourVal = (task.startHour ?? startHour);
            const taskStartRelativeToSection = Math.max(0, startHourVal - startHour);
            const taskEndRelativeToSection = Math.min(endHour - startHour, (startHourVal + task.duration) - startHour);
            const renderLeft = taskStartRelativeToSection * PIXELS_PER_HOUR;
            const renderWidth = (taskEndRelativeToSection - taskStartRelativeToSection) * PIXELS_PER_HOUR;
            
            if (renderWidth <= 0) return null;
            
            const taskStyle: React.CSSProperties = {
              left: `${renderLeft}px`,
              width: `${renderWidth}px`,
              top: `${TASK_BASE_TOP}px`,
              height: `${TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}px`,
              zIndex: 40,
            };

            return (
              <div key={task.id}
                className="absolute" 
                style={taskStyle}
              >
                <MemoizedTaskCard
                  task={task}
                  height={TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}
                  onStartEdit={(taskToEdit, options) => handleOpenEditModal(taskToEdit, options)} 
                  onCopy={() => {}}
                  onViewNotes={() => {}}
                  onResizeStart={() => {}}
                  onDragStart={() => {}}
                  currentTime={currentTimeForMarker}
                />
              </div>
            );
          })}
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

        <div className="flex flex-col flex-1 min-h-0 px-6 pb-6 gap-6">
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">
                  Class Schedule
                </span>
                <span className="text-xs text-muted-foreground">
                  • Recurring weekly schedule
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="px-3 text-xs h-7"
                  onClick={handleAddNewClass}
                >
                  + Add Class
                </Button>

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
                                {dayTasks.length} {dayTasks.length === 1 ? "class" : "classes"}
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

