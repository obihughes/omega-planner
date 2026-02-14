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
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  TIMELINE_SPLIT_HOUR_1,
  TIMELINE_SPLIT_HOUR_2,
  TIMELINE_SPLIT_HOUR_3,
  PIXELS_PER_HOUR,
  TIMELINE_COLUMN_HEIGHT,
  TASK_BASE_TOP,
  TASK_BASE_BOTTOM_PADDING,
  AGENDA_PIXELS_PER_HOUR,
} from "@/lib/constants";
import { MemoizedTaskCard } from "./TaskCard";

type TimelinePeriod = "night" | "morning" | "afternoon" | "evening";

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

  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "agenda">("daily");

  const [currentTimeForMarker, setCurrentTimeForMarker] = useState<Date>(
    () => new Date()
  );
  const [activeEditModalTask, setActiveEditModalTask] =
    useState<EnhancedActiveModalTask | null>(null);

  const lastDoubleClickTimestampRef = useRef<number>(0);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const dailyScrollRef = useRef<HTMLDivElement>(null);
  const dailyDayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const agendaScrollRef = useRef<HTMLDivElement>(null);
  const agendaDayRefs = useRef<Map<number, HTMLDivElement>>(new Map());

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

  // Auto-scroll to current day and time in agenda view
  useEffect(() => {
    if (viewMode !== "agenda" || !agendaScrollRef.current) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const currentDayElement = agendaDayRefs.current.get(currentDayOfWeek);

      if (currentDayElement && agendaScrollRef.current) {
        // Scroll to current day horizontally
        const scrollContainer = agendaScrollRef.current;
        const dayLeft = currentDayElement.offsetLeft;
        const dayWidth = currentDayElement.offsetWidth;
        const containerWidth = scrollContainer.clientWidth;
        
        // Center the day in view
        const scrollLeft = dayLeft - (containerWidth / 2) + (dayWidth / 2);
        scrollContainer.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: 'smooth'
        });

        // Scroll to current time vertically
        const currentHourFloat = today.getHours() + today.getMinutes() / 60;
        const timeTop = currentHourFloat * AGENDA_PIXELS_PER_HOUR;
        const containerHeight = scrollContainer.clientHeight;
        
        // Center the current time in view
        const scrollTop = timeTop - (containerHeight / 2);
        scrollContainer.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [viewMode, weekMeta]);

  // Auto-scroll to today's card in 7-day daily view
  useEffect(() => {
    if (viewMode !== "daily" || !dailyScrollRef.current) return;

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
  }, [viewMode, weekMeta]);

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
      case 'night': startHour = TIMELINE_START_HOUR; endHour = TIMELINE_SPLIT_HOUR_1; break;
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
      case 'night': 
        startHour = TIMELINE_START_HOUR; 
        endHour = TIMELINE_SPLIT_HOUR_1; 
        break;
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

  // Weekly view constants (matching daily planner design)
  const WEEKLY_ROW_HEIGHT = 60;
  const WEEKLY_TASK_HEIGHT = 56; // Increased to fill the row
  const WEEKLY_DAY_COLUMN_WIDTH = 95;
  const WEEKLY_TIMELINE_HEADER_HEIGHT = 26;
  const HOURS_PER_ROW = 12; // AM (0-12) and PM (12-24)

  const renderAgendaView = () => {
    const totalHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
    const totalHeight = totalHours * AGENDA_PIXELS_PER_HOUR;
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const currentHourFloat = currentTimeForMarker.getHours() + currentTimeForMarker.getMinutes() / 60;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex flex-1 overflow-auto" ref={agendaScrollRef}>
          {/* Sticky Time Axis */}
          <div className="sticky left-0 z-20 bg-background border-r border-border/30 flex-shrink-0">
            <div className="w-16">
              {/* Header space */}
              <div className="h-16 border-b border-border/30"></div>
              {/* Time labels */}
              <div className="relative" style={{ height: `${totalHeight}px` }}>
                {Array.from({ length: totalHours + 1 }, (_, hour) => (
                  <div
                    key={`time-${hour}`}
                    className={cn(
                      "absolute left-0 right-0 text-xs text-muted-foreground px-2 py-1 border-b border-border/10",
                      hour % 6 === 0 ? "font-medium text-foreground" : ""
                    )}
                    style={{ top: `${hour * AGENDA_PIXELS_PER_HOUR}px` }}
                  >
                    {formatTime(hour)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Days Container */}
          <div className="flex">
            {orderedDayIndices.map((dow) => {
              const meta = weekMeta.find((m) => m.dayOfWeek === dow);
              if (!meta) return null;

              const dateKey = meta.dateKey;
              const tasksForDay = tasksByDate.get(dateKey) || [];
              const isToday = dow === currentDayOfWeek;

              return (
                <div
                  key={dow}
                  ref={(el) => {
                    if (el) {
                      agendaDayRefs.current.set(dow, el);
                    } else {
                      agendaDayRefs.current.delete(dow);
                    }
                  }}
                  className={cn(
                    "flex-shrink-0 border-r relative",
                    isToday 
                      ? "bg-primary/5 border-primary/50 border-l-4 border-l-primary" 
                      : "bg-background border-border/30"
                  )}
                  style={{ width: '250px' }}
                >
                  {/* Day Header */}
                  <div className={cn(
                    "h-16 px-4 py-2 border-b border-border/30 flex flex-col justify-center relative",
                    isToday ? "bg-primary/10" : "bg-muted/10"
                  )}>
                    {isToday && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold uppercase">
                        Today
                      </div>
                    )}
                    <div className={cn(
                      "text-sm font-semibold text-center",
                      isToday ? "text-primary" : "text-foreground"
                    )}>
                      {meta.label}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {meta.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </div>
                    {tasksForDay.length > 0 && (
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        {tasksForDay.length} classes
                      </div>
                    )}
                  </div>

                  {/* Timeline Grid */}
                  <div
                    className="relative"
                    style={{ height: `${totalHeight}px` }}
                  >
                    {/* Hour lines */}
                    {Array.from({ length: totalHours + 1 }, (_, hour) => (
                      <div
                        key={`grid-${hour}`}
                        className={cn(
                          "absolute left-0 right-0 border-b",
                          hour % 6 === 0 ? "border-border/40" : "border-border/10"
                        )}
                        style={{ top: `${hour * AGENDA_PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {/* Current time marker (only for today) */}
                    {isToday && (
                      <div
                        className="absolute left-0 right-0 w-full h-0.5 bg-red-500 z-50 pointer-events-none"
                        style={{ top: `${currentHourFloat * AGENDA_PIXELS_PER_HOUR}px` }}
                      >
                        <div
                          className="absolute -top-1.5 left-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background"
                          style={{ left: '-6px' }}
                        />
                      </div>
                    )}

                    {/* Tasks */}
                    {tasksForDay.map(task => {
                      const startHour = task.startHour ?? 0;
                      const taskTop = startHour * AGENDA_PIXELS_PER_HOUR;
                      const taskHeight = task.duration * AGENDA_PIXELS_PER_HOUR;

                      return (
                        <div
                          key={task.id}
                          className="absolute left-1 right-1 cursor-pointer"
                          style={{
                            top: `${taskTop}px`,
                            height: `${taskHeight}px`,
                          }}
                          onClick={() => handleOpenEditModal(task, { isNew: false })}
                        >
                          <MemoizedTaskCard
                            task={task}
                            height={taskHeight}
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
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const getDayName = (dayOfWeek: number) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return dayNames[dayOfWeek];
    };

    const renderTimelineHeader = (isAM: boolean) => {
      const startHour = isAM ? 0 : 12;
      const hours = Array.from({ length: HOURS_PER_ROW }, (_, i) => startHour + i);
      
      return (
        <div className="flex sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/20">
          {/* Day label column placeholder */}
          <div 
            className="flex-shrink-0 border-r border-border/30"
            style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px`, height: `${WEEKLY_TIMELINE_HEADER_HEIGHT}px` }}
          />
          
          {/* Timeline header */}
          <div className="flex flex-1">
            {hours.map((hour) => (
              <div 
                key={`header-${hour}`} 
                className="flex-1 text-center text-xs text-muted-foreground py-1 border-l border-border/10 min-w-0 overflow-hidden"
              >
                <div className={cn(
                  "font-medium truncate px-1",
                  hour % 6 === 0 ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {formatTime(hour)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderDayRow = (dayMeta: ClassScheduleDayMeta, isAM: boolean) => {
      const dateKey = dayMeta.dateKey;
      const tasksForDay = tasksByDate.get(dateKey) || [];
      const startHour = isAM ? 0 : 12;
      const endHour = isAM ? 12 : 24;
      
      // Filter tasks for this period
      const periodTasks = tasksForDay.filter(t => {
        if (t.startHour === undefined) return false;
        const taskStart = t.startHour;
        const taskEnd = taskStart + t.duration;
        return taskEnd > startHour && taskStart < endHour;
      });

      const today = new Date();
      const isCurrentDay = today.getDay() === dayMeta.dayOfWeek;
      const isWeekendDay = dayMeta.dayOfWeek === 0 || dayMeta.dayOfWeek === 6;
      const periodLabel = isAM ? 'AM' : 'PM';

      // Current time marker
      const getCurrentTimeMarker = () => {
        if (!isCurrentDay) return null;
        
        const currentHourFloat = currentTimeForMarker.getHours() + currentTimeForMarker.getMinutes() / 60;
        if (currentHourFloat < startHour || currentHourFloat >= endHour) return null;

        const percentage = ((currentHourFloat - startHour) / HOURS_PER_ROW) * 100;
        return (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none" 
            style={{ left: `${percentage}%` }}
          >
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
      };

      const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        const percentage = clickXrelative / rect.width;
        const hourFloat = startHour + (percentage * HOURS_PER_ROW);
        const snappedNewStartHour = Math.round(hourFloat * 4) / 4;
        
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

      const renderTasks = () => {
        return periodTasks.map((task) => {
          const taskStartHour = task.startHour ?? startHour;
          const taskStartRelative = Math.max(0, taskStartHour - startHour);
          const taskEndRelative = Math.min(HOURS_PER_ROW, (taskStartHour + task.duration) - startHour);
          
          const startPercent = (taskStartRelative / HOURS_PER_ROW) * 100;
          const widthPercent = ((taskEndRelative - taskStartRelative) / HOURS_PER_ROW) * 100;
          
          if (widthPercent <= 0) return null;
          
          const taskStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
            top: '2px', // Centered vertically in 60px row with 56px height
            height: `${WEEKLY_TASK_HEIGHT}px`,
            zIndex: 40,
          };

          return (
            <div key={task.id} style={taskStyle}>
              <MemoizedTaskCard
                task={task}
                height={WEEKLY_TASK_HEIGHT}
                onStartEdit={(taskToEdit, options) => handleOpenEditModal(taskToEdit, options)}
                onCopy={() => {}}
                onViewNotes={() => {}}
                onResizeStart={() => {}}
                onDragStart={() => {}}
                currentTime={currentTimeForMarker}
              />
            </div>
          );
        });
      };

      return (
        <div 
          className={cn(
            "flex",
            !isAM && "border-t border-border/20"
          )}
        >
          {/* Day label column */}
          <div 
            className={cn(
              "flex-shrink-0 border-r border-border/30 px-3 py-2 flex flex-col justify-center sticky left-0 z-30 relative bg-card",
              isCurrentDay && "after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-primary"
            )}
            style={{ 
              width: `${WEEKLY_DAY_COLUMN_WIDTH}px`, 
              height: `${WEEKLY_ROW_HEIGHT}px`
            }}
          >
            <div className="text-center">
              {isAM ? (
                <>
                  <div className={cn(
                    "text-[11px] font-medium uppercase tracking-wide mb-1",
                    isCurrentDay ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {getDayName(dayMeta.dayOfWeek).toUpperCase()}
                  </div>
                  
                  <div className={cn(
                    "text-2xl font-extrabold leading-none mb-1",
                    "text-foreground"
                  )}>
                    {dayMeta.date.getDate()}
                  </div>
                  
                  <div className={cn(
                    "text-[11px] font-medium text-muted-foreground",
                  )}>
                    {dayMeta.date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </>
              ) : (
                <div className={cn(
                  "text-[12px] font-medium text-muted-foreground",
                )}>
                  {periodLabel}
                </div>
              )}
            </div>
          </div>

          {/* 12-hour Timeline */}
          <div 
            className={cn(
              "relative flex-1 transition-colors duration-200 cursor-pointer",
              isCurrentDay ? "bg-primary/5 hover:bg-primary/10" : isWeekendDay ? "bg-muted/30 hover:bg-muted/40" : "bg-background hover:bg-muted/10"
            )}
            style={{ 
              height: `${WEEKLY_ROW_HEIGHT}px`
            }}
            onDoubleClick={handleTimelineDoubleClick}
          >
            {/* Grid lines for 12 hours */}
            {Array.from({ length: HOURS_PER_ROW }, (_, i) => (
              <div 
                key={`grid-${i}`} 
                className={`absolute h-full ${i % 6 === 0 ? 'border-l border-border/40' : 'border-l border-border/10'} pointer-events-none`}
                style={{ left: `${(i / HOURS_PER_ROW) * 100}%` }} 
              />
            ))}

            {/* Current time marker */}
            {getCurrentTimeMarker()}

            {/* Tasks for this period */}
            {renderTasks()}
          </div>
        </div>
      );
    };

    return (
      <div className="overflow-auto max-h-[80vh]" ref={timelineScrollRef}>
        {orderedDayIndices.map((dow) => {
          const meta = weekMeta.find((m) => m.dayOfWeek === dow);
          if (!meta) return null;
          return (
            <React.Fragment key={dow}>
              {renderTimelineHeader(true)}
              {renderDayRow(meta, true)}
              {renderTimelineHeader(false)}
              {renderDayRow(meta, false)}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full bg-background text-foreground transition-colors">
      <div className="w-full mx-auto h-full">
        {activeEditModalTask && (
          <EditTaskModal
            taskToEdit={activeEditModalTask}
            onSave={handleSaveFromModal}
            onClose={handleCloseModal}
            onDelete={handleDeleteFromModal}
          />
        )}

        <div className="space-y-6 px-6 pb-6">
          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">
                  {viewMode === "daily" ? "Class Schedule" : viewMode === "agenda" ? "Agenda Schedule" : "Weekly Schedule"}
                </span>
                <span className="text-xs text-muted-foreground">
                  • Recurring weekly schedule
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                <div className="flex items-center gap-1 border border-border/30 rounded-md p-0.5">
                  <Button
                    size="sm"
                    variant={viewMode === "daily" ? "default" : "ghost"}
                    className="px-3 text-xs h-6"
                    onClick={() => setViewMode("daily")}
                  >
                    Daily
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "weekly" ? "default" : "ghost"}
                    className="px-3 text-xs h-6"
                    onClick={() => setViewMode("weekly")}
                  >
                    Weekly
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "agenda" ? "default" : "ghost"}
                    className="px-3 text-xs h-6"
                    onClick={() => setViewMode("agenda")}
                  >
                    Agenda
                  </Button>
                </div>

                {/* Add Class button */}
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
            <div
              className={cn(
                "overflow-hidden h-[calc(100vh-200px)]",
                viewMode !== "daily" && "border border-border/20 rounded-b-lg"
              )}
            >
              {viewMode === "daily" ? (
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
                                  "font-medium",
                                  isToday ? "text-primary" : "text-foreground"
                                )}>
                                  {meta.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
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
                              {renderDayPeriod(meta, 'night')}
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
              ) : viewMode === "agenda" ? (
                renderAgendaView()
              ) : (
                renderWeeklyView()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

