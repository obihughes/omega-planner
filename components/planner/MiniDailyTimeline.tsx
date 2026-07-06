'use client';

import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { Task } from '@/types/planner';
import { TimelineColumn } from './TimelineColumn';
import {
    TIMELINE_START_HOUR,
    TIMELINE_END_HOUR,
    TIMELINE_SPLIT_HOUR_1,
    TIMELINE_SPLIT_HOUR_2,
    TIMELINE_SPLIT_HOUR_3,
    PIXELS_PER_HOUR,
    TASK_COLORS,
    DEFAULT_TASK_COLOR_INDEX
} from '@/lib/constants';
import { getDateKey } from '@/utils/dateUtils';
import { formatTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Clock, Calendar } from 'lucide-react';

type TimelinePeriod = 'night' | 'morning' | 'afternoon' | 'evening';

/** Optional - when provided, enables drag/resize/copy on timeline tasks */
interface TimelineDragContext {
  draggingTask: { task: Task; offsetX?: number; originalBaseDate?: string } | null;
  resizingTask: { task: Task; edge: 'start' | 'end' } | null;
  copyingTaskData: Task | null;
  targetCopyDayOffset: number | null;
  setTargetCopyDayOffset: (offset: number | null) => void;
  handleDropCopy: (targetDate: Date, startHour: number) => void;
  handleDragStart: (task: Task, e: React.PointerEvent<HTMLElement>) => void;
  onResizeStart: (task: Task, edge: 'start' | 'end', e: React.MouseEvent<HTMLDivElement>) => void;
  onCopy: (task: Task) => void;
  onViewNotes: (task: Task) => void;
  onDoubleClickAdd: (date: Date, startHour: number) => void;
  lastDoubleClickTimestampRef: React.MutableRefObject<number>;
}

interface MiniDailyTimelineProps {
  selectedDate: Date;
  tasksByDate: Map<string, Task[]>;
  onTaskClick: (task: Task, isScheduled: boolean) => void;
  onDeleteTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean; targetDate?: Date }) => void;
  showHeader?: boolean;
  showUnscheduled?: boolean;
  fitContainer?: boolean;
  deleteMode?: boolean;
  /** When provided, enables drop from pool/inbox onto timeline (scheduling view) */
  onDropFromPool?: (task: Task, targetDate: Date, startHour: number) => void;
  /** When provided, enables drag/resize/copy on timeline tasks */
  timelineDragContext?: TimelineDragContext;
}

export function MiniDailyTimeline({
  selectedDate,
  tasksByDate,
  onTaskClick,
  onDeleteTask,
  onUpdateTask,
  openEditModal,
  showHeader = true,
  showUnscheduled = true,
  fitContainer = false,
  deleteMode = false,
  onDropFromPool,
  timelineDragContext
}: MiniDailyTimelineProps) {
  const dateKey = getDateKey(selectedDate);
  const tasksForDate = tasksByDate.get(dateKey) || [];
  const lastDoubleClickTimestampRef = useRef<number>(0);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [miniPixelsPerHour, setMiniPixelsPerHour] = useState<number>(72);
  const [miniColumnHeight, setMiniColumnHeight] = useState<number>(72);
  
  // Calculate day offset from today for the selected date
  const dayOffset = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);
    return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [selectedDate]);
  
  // Separate scheduled and unscheduled tasks
  const scheduledTasks = tasksForDate.filter(t => t.startHour !== undefined && t.startHour > 0);
  const unscheduledTasks = tasksForDate.filter(t => t.startHour === undefined || t.startHour === 0);
  
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const currentTime = new Date();
  
  // Timeline periods configuration - same as daily view
  const periods: TimelinePeriod[] = ['night', 'morning', 'afternoon', 'evening'];
  
  const noopDropCopy = useCallback((_targetDate: Date, _startHour: number) => {}, []);
  const noopDragStart = useCallback((_task: Task, _e: React.MouseEvent) => {}, []);
  const handleDropCopy = timelineDragContext?.handleDropCopy ?? noopDropCopy;
  const handleDragStart = timelineDragContext?.handleDragStart ?? noopDragStart;
  
  // Compute compact sizing based on container
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const compute = () => {
      const width = el.clientWidth;
      const hoursInPeriod = 6; // 6-hour blocks
      const pph = Math.max(48, Math.floor(width / hoursInPeriod));
      setMiniPixelsPerHour(pph);
      if (fitContainer) {
        const containerHeight = el.clientHeight;
        const perPeriod = Math.max(56, Math.floor((containerHeight - 4) / 4));
        setMiniColumnHeight(perPeriod);
      } else {
        const height = Math.max(64, Math.min(120, Math.floor(pph * 0.9)));
        setMiniColumnHeight(height);
      }
    };
    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitContainer]);
  
  // Render a single timeline period
  const renderPeriod = useCallback((period: TimelinePeriod) => {
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

    return (
      <div key={period} className={cn("border-b border-border/20 bg-background")}>
        {/* Timeline Column - compact sizing (no period label to match Daily view) */}
        <div className="relative">
          <TimelineColumn
            dayOffset={dayOffset}
            period={period}
            tasksByDate={tasksByDate}
            draggingTask={timelineDragContext?.draggingTask ?? null}
            resizingTask={timelineDragContext?.resizingTask ?? null}
            copyingTaskData={timelineDragContext?.copyingTaskData ?? null}
            targetCopyDayOffset={timelineDragContext?.targetCopyDayOffset ?? null}
            currentTimeForMarker={currentTime}
            handleDropCopy={handleDropCopy}
            openEditModal={(task, options) => {
              onTaskClick(task, options.isFromPool !== true);
            }}
            setTargetCopyDayOffset={timelineDragContext?.setTargetCopyDayOffset ?? (() => {})}
            lastDoubleClickTimestampRef={timelineDragContext?.lastDoubleClickTimestampRef ?? lastDoubleClickTimestampRef}
            handleDragStart={handleDragStart}
            pixelsPerHour={miniPixelsPerHour}
            columnHeightPx={miniColumnHeight}
            fillWidth={true}
            deleteMode={deleteMode}
            onDeleteTask={onDeleteTask}
            onDropFromPool={onDropFromPool}
            targetDate={onDropFromPool ? selectedDate : undefined}
            onDoubleClickAdd={timelineDragContext?.onDoubleClickAdd}
            onCopy={timelineDragContext?.onCopy}
            onViewNotes={timelineDragContext?.onViewNotes}
            onResizeStart={timelineDragContext?.onResizeStart}
          />
        </div>
      </div>
    );
  }, [dayOffset, tasksByDate, currentTime, handleDropCopy, onTaskClick, handleDragStart, miniPixelsPerHour, miniColumnHeight, deleteMode, onDeleteTask, onDropFromPool, selectedDate, timelineDragContext]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      {showHeader && (
      <div className="p-2 border-b border-border/60 bg-card/40 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Daily Timeline
          </h3>
          {isToday && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Now: {formatTime(currentTime.getHours())}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {scheduledTasks.length} scheduled • {unscheduledTasks.length} unscheduled
        </div>
      </div>
      )}

      {/* Timeline Content */}
      <div ref={contentRef} className={cn("flex-1", fitContainer ? "overflow-hidden" : "overflow-y-auto") }>
        {/* Unscheduled Tasks Section */}
        {showUnscheduled && unscheduledTasks.length > 0 && (
          <div className="p-2 border-b border-border bg-orange-50/50 dark:bg-orange-900/10">
            <h4 className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              Unscheduled ({unscheduledTasks.length})
            </h4>
            <div className="space-y-1">
              {unscheduledTasks.map(task => (
                <div
                  key={task.id}
                  draggable={!!onDropFromPool}
                  onDragStart={onDropFromPool ? (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ ...task, source: 'pool' }));
                    e.dataTransfer.effectAllowed = 'move';
                  } : undefined}
                  className={cn(
                    "p-1.5 bg-card border border-orange-200 dark:border-orange-800 rounded text-xs hover:bg-orange-50 dark:hover:bg-orange-900/20",
                    onDropFromPool ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                  )}
                  onClick={() => onTaskClick(task, false)}
                >
                  <div className="font-medium text-xs">{task.name}</div>
                  <div className="text-muted-foreground text-xs">{task.duration}h</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Periods */}
        <div className="flex-1">
          {periods.map(renderPeriod)}
        </div>

        {/* Empty state */}
        {scheduledTasks.length === 0 && unscheduledTasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <h4 className="font-medium mb-1 text-sm">No tasks for this day</h4>
              <p className="text-xs">Double-click on timeline to add tasks</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
