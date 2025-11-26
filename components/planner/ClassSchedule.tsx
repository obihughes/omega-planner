"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Task } from "@/types/planner";
import { useClassScheduleState } from "@/hooks/useClassScheduleState";
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

export default function ClassSchedule() {
  const {
    weekMeta,
    tasksByDate,
    upsertFromModal,
    deleteTaskById,
  } = useClassScheduleState();

  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(() => {
    if (typeof window === "undefined") return new Date().getDay();
    return new Date().getDay();
  });

  const [currentTimeForMarker, setCurrentTimeForMarker] = useState<Date>(
    () => new Date()
  );
  const [activeEditModalTask, setActiveEditModalTask] =
    useState<EnhancedActiveModalTask | null>(null);

  const lastDoubleClickTimestampRef = useRef<number>(0);

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
      const isNew = options?.isNew ?? false;
      upsertFromModal(task, isNew);
    },
    [upsertFromModal]
  );

  const handleDeleteFromModal = useCallback(
    (taskId: string, _isFromPool?: boolean) => {
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

  const renderDayColumn = useCallback((period: TimelinePeriod) => {
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

    const dateKey = selectedMeta.referenceDate;
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
  }, [tasksByDate, currentTimeForMarker, selectedMeta, selectedDayOfWeek, handleOpenEditModal, renderTimeline]);

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
                  {selectedMeta.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  • Recurring weekly schedule
                </span>
              </div>
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
            </div>
            <div className="border border-border/20 rounded-b-lg overflow-hidden">
              <div className="flex flex-col">
                {renderDayColumn('night')}
                {renderDayColumn('morning')}
                {renderDayColumn('afternoon')}
                {renderDayColumn('evening')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

