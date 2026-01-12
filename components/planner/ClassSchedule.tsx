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

  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(() => {
    if (typeof window === "undefined") return new Date().getDay();
    return new Date().getDay();
  });

  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "agenda">("daily");

  const [currentTimeForMarker, setCurrentTimeForMarker] = useState<Date>(
    () => new Date()
  );
  const [activeEditModalTask, setActiveEditModalTask] =
    useState<EnhancedActiveModalTask | null>(null);

  const lastDoubleClickTimestampRef = useRef<number>(0);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

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

  const selectedMeta = useMemo(() => {
    return (
      weekMeta.find((m) => m.dayOfWeek === selectedDayOfWeek) ?? weekMeta[0]
    );
  }, [weekMeta, selectedDayOfWeek]);

  const orderedDayIndices: number[] = useMemo(
    () => [1, 2, 3, 4, 5, 6, 0], // Monday-first ordering
    []
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
    console.log('➕ [ClassSchedule] handleAddNewClass called for day:', selectedMeta.dayOfWeek);
    const dateKey = selectedMeta.dateKey;
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
  }, [selectedMeta, handleOpenEditModal]);

  const renderDayColumn = (period: TimelinePeriod) => {
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

    const dateKey = selectedMeta.dateKey;
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
    if (today.getDay() === selectedDayOfWeek) {
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

    return (
      <div className="relative w-full flex flex-col"
        style={{ minWidth: `${PIXELS_PER_HOUR * (endHour - startHour)}px`, height: `${TIMELINE_COLUMN_HEIGHT}px` }}
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
    return (
      <div className="p-6 overflow-y-auto h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-background/50">
          {orderedDayIndices.map((dow) => {
            const meta = weekMeta.find((m) => m.dayOfWeek === dow);
            if (!meta) return null;

            const dateKey = meta.dateKey;
            const tasksForDay = tasksByDate.get(dateKey) || [];
            const sortedTasks = [...tasksForDay].sort((a, b) => (a.startHour ?? 0) - (b.startHour ?? 0));
            
            const isToday = new Date().getDay() === dow;

            return (
              <div 
                key={dow} 
                className={cn(
                  "flex flex-col rounded-xl border bg-card shadow-sm h-fit",
                  isToday ? "border-primary/50 shadow-md ring-1 ring-primary/20" : "border-border/40"
                )}
              >
                {/* Day Header */}
                <div className={cn(
                  "px-4 py-3 border-b border-border/20 flex items-center justify-between flex-shrink-0",
                  isToday ? "bg-primary/5" : "bg-muted/10"
                )}>
                  <div>
                    <div className={cn(
                      "text-sm font-semibold",
                      isToday ? "text-primary" : "text-foreground"
                    )}>
                      {meta.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {meta.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  {sortedTasks.length > 0 && (
                    <div className="px-2 py-0.5 rounded-full bg-background border border-border/20 text-[10px] font-medium text-muted-foreground">
                      {sortedTasks.length} classes
                    </div>
                  )}
                </div>

                {/* Tasks List */}
                <div className="p-3 flex flex-col gap-3">
                  {sortedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/40 py-8 text-sm italic">
                      No classes scheduled
                    </div>
                  ) : (
                    sortedTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => handleOpenEditModal(task, { isNew: false })}
                        className={cn(
                          "group relative rounded-lg border-2 border-border/20 p-3 transition-all hover:shadow-lg cursor-pointer",
                          task.color,
                          "hover:border-border/40"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="font-bold text-base leading-tight break-words flex-1 min-w-0">
                            {task.name}
                          </div>
                          <div className="text-xs font-medium opacity-90 whitespace-nowrap bg-black/10 px-2 py-1 rounded flex-shrink-0 ml-2">
                            {formatTime(task.startHour ?? 0)} - {formatTime((task.startHour ?? 0) + task.duration)}
                          </div>
                        </div>
                        
                        {task.notes && (
                          <div className="text-sm opacity-95 whitespace-pre-wrap leading-relaxed border-t border-black/10 pt-2 mt-2 break-words">
                            {task.notes}
                          </div>
                        )}
                        
                        {!task.notes && (
                          <div className="text-xs opacity-50 italic mt-1">
                            No notes
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
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
                  {viewMode === "daily" ? selectedMeta.label : "Weekly Schedule"}
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

                {/* Day selector (only show in daily view) */}
                {viewMode === "daily" && (
                  <div className="flex items-center gap-1">
                    {orderedDayIndices.map((dow) => {
                      const meta = weekMeta.find((m) => m.dayOfWeek === dow);
                      if (!meta) return null;
                      const isActive = dow === selectedDayOfWeek;
                      return (
                        <Button
                          key={dow}
                          size="sm"
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "px-2 text-xs h-7",
                            !isActive && "hover:bg-secondary"
                          )}
                          onClick={() => setSelectedDayOfWeek(dow)}
                        >
                          {meta.shortLabel}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="border border-border/20 rounded-b-lg overflow-hidden h-[calc(100vh-200px)]">
              {viewMode === "daily" ? (
                <div className="flex flex-col h-full overflow-y-auto">
                  {renderDayColumn('night')}
                  {renderDayColumn('morning')}
                  {renderDayColumn('afternoon')}
                  {renderDayColumn('evening')}
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

