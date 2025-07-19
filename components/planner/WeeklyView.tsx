'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Plus
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';
import { MemoizedTaskCard } from './TaskCard';
import { 
  TIMELINE_START_HOUR as APP_TIMELINE_START_HOUR,
  TIMELINE_END_HOUR as APP_TIMELINE_END_HOUR,
  PIXELS_PER_HOUR as APP_PIXELS_PER_HOUR,
  TIMELINE_COLUMN_HEIGHT,
  TASK_BASE_TOP,
  TASK_BASE_BOTTOM_PADDING,
  MIN_TASK_DURATION as APP_MIN_TASK_DURATION
} from '../../lib/constants';

interface WeeklyViewProps {}

export default function WeeklyView({}: WeeklyViewProps) {
  const {
    tasksByDate,
    getPoolTasksForDate,
    openEditModal,
    handleTaskCompletionToggle,
    startCopy,
    openViewNotesModal,
    isClient
  } = useDailyPlanner();

  // State for week navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Calculate week dates
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Get to Monday of the current week
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(today.getDate() + daysToMonday + (offset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };

  const weekDates = getWeekDates(weekOffset);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Navigation functions
  const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setWeekOffset(prev => prev + 1);
  const goToCurrentWeek = () => setWeekOffset(0);

  // Get week range string
  const getWeekRangeString = () => {
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Get relative week label
  const getRelativeWeekLabel = () => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    if (weekOffset === 1) return 'Next Week';
    return null;
  };

  // Helper functions
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  // Get day offset from today for a given date
  const getDayOffsetFromToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Render timeline header (time labels)
  const renderTimelineHeader = useCallback(() => {
    const hours = Array.from({ length: APP_TIMELINE_END_HOUR - APP_TIMELINE_START_HOUR }, (_, i) => APP_TIMELINE_START_HOUR + i);
    
    return (
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex">
          {/* Day label spacer */}
          <div className="w-48 flex-shrink-0 border-r border-border/30 p-3 bg-card">
            <span className="text-sm font-medium text-muted-foreground">Time</span>
          </div>
          
          {/* Time labels */}
          <div className="flex h-12 bg-card">
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex-none text-xs text-muted-foreground/60 pt-1 pl-0.5 border-l border-border/20 flex items-center justify-center"
                style={{ width: `${APP_PIXELS_PER_HOUR}px` }}
              >
                {formatTime(hour)}
              </div>
            ))}
            <div className="flex-none border-l border-border/20" style={{ width: '2px' }} />
          </div>
        </div>
      </div>
    );
  }, []);

  // Handle task creation
  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>, date: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const hourInBlock = x / APP_PIXELS_PER_HOUR;
    const snappedNewStartHour = Math.round((APP_TIMELINE_START_HOUR + hourInBlock) * 4) / 4;
    const dayOffset = getDayOffsetFromToday(date);
    
    openEditModal(undefined, {
      isFromPool: false,
      initialDayOffset: dayOffset,
      initialStartHour: snappedNewStartHour,
      isNew: true
    });
  };

  // Render individual day timeline
  const renderDayTimeline = useCallback((date: Date, index: number) => {
    const dateKey = getDateKey(date);
    const dayTasks = tasksByDate.get(dateKey) || [];
    const poolTasks = getPoolTasksForDate(dateKey);
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);
    const dayOffset = getDayOffsetFromToday(date);
    
    // Filter scheduled tasks
    const scheduledTasks = dayTasks.filter(task => task.startHour !== undefined);
    
    // Current time marker for today
    let currentTimeMarker = null;
    if (isCurrentDay) {
      const now = new Date();
      const currentHourFloat = now.getHours() + now.getMinutes() / 60;
      if (currentHourFloat >= APP_TIMELINE_START_HOUR && currentHourFloat < APP_TIMELINE_END_HOUR) {
        const markerLeft = (currentHourFloat - APP_TIMELINE_START_HOUR) * APP_PIXELS_PER_HOUR;
        currentTimeMarker = (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none" 
            style={{ left: `${markerLeft}px` }}
          >
            <div className="absolute top-0 left-[-3.75px] w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-red-500" />
          </div>
        );
      }
    }

    const timelineWidth = APP_PIXELS_PER_HOUR * (APP_TIMELINE_END_HOUR - APP_TIMELINE_START_HOUR);

    return (
      <div key={dateKey} className="bg-card border border-border/30 rounded-lg shadow-sm overflow-hidden mb-4">
        {/* Day Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-border/30",
          isCurrentDay && "bg-primary/5 border-primary/20",
          isWeekendDay && "bg-orange-500/5"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex flex-col",
              isCurrentDay && "text-primary"
            )}>
              <span className={cn(
                "text-sm font-semibold uppercase tracking-wide",
                isWeekendDay && !isCurrentDay && "text-orange-600"
              )}>
                {dayNames[index]}
              </span>
              <span className="text-2xl font-bold">
                {date.getDate()}
              </span>
              <span className="text-sm text-muted-foreground">
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </span>
            </div>
            
            {/* Task stats */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {scheduledTasks.length + poolTasks.length}
                </span> tasks
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-green-600">
                  {[...scheduledTasks, ...poolTasks].filter(t => t.completed).length}
                </span> done
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openEditModal(undefined, {
              isFromPool: false,
              initialDayOffset: dayOffset,
              initialStartHour: 9,
              isNew: true
            })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Timeline */}
        <div className="flex">
          {/* Day label column */}
          <div className="w-48 flex-shrink-0 border-r border-border/30 p-4 flex flex-col justify-center bg-muted/20">
            {poolTasks.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Inbox ({poolTasks.length})
                </div>
                {poolTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="text-xs p-1 bg-orange-500/10 border border-orange-500/20 rounded cursor-pointer hover:bg-orange-500/20 transition-colors truncate"
                    onClick={() => openEditModal(task, { isFromPool: true })}
                  >
                    {task.name}
                  </div>
                ))}
                {poolTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{poolTasks.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline area */}
          <div 
            className="relative bg-background"
            style={{ 
              width: `${timelineWidth}px`, 
              height: `${TIMELINE_COLUMN_HEIGHT}px`,
              minHeight: '120px'
            }}
            onDoubleClick={(e) => handleTimelineDoubleClick(e, date)}
          >
            {/* Grid lines */}
            {Array.from({ length: APP_TIMELINE_END_HOUR - APP_TIMELINE_START_HOUR }, (_, i) => (
              <div 
                key={`grid-${i}`} 
                className="border-l border-border/10 absolute h-full" 
                style={{ left: `${i * APP_PIXELS_PER_HOUR}px` }} 
              />
            ))}

            {/* Current time marker */}
            {currentTimeMarker}

            {/* Tasks */}
            {scheduledTasks.map((task) => {
              const taskStartRelative = Math.max(0, task.startHour - APP_TIMELINE_START_HOUR);
              const taskEndRelative = Math.min(
                APP_TIMELINE_END_HOUR - APP_TIMELINE_START_HOUR, 
                (task.startHour + task.duration) - APP_TIMELINE_START_HOUR
              );
              const renderLeft = taskStartRelative * APP_PIXELS_PER_HOUR;
              const renderWidth = (taskEndRelative - taskStartRelative) * APP_PIXELS_PER_HOUR;
              
              if (renderWidth <= 0) return null;
              
              const taskStyle: React.CSSProperties = {
                left: `${renderLeft}px`,
                width: `${renderWidth}px`,
                top: `${TASK_BASE_TOP}px`,
                height: `${TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}px`,
                zIndex: 40,
              };

              return (
                <div key={task.id} className="absolute" style={taskStyle}>
                  <MemoizedTaskCard
                    task={task}
                    height={TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}
                    onStartEdit={(taskToEdit, options) => openEditModal(taskToEdit, options)} 
                    onCopy={startCopy} 
                    onViewNotes={openViewNotesModal}
                    onResizeStart={() => {}} // Disable resize in weekly view for simplicity
                    onDragStart={() => {}} // Disable drag in weekly view for simplicity
                    currentTime={new Date()}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [tasksByDate, getPoolTasksForDate, openEditModal, startCopy, openViewNotesModal]);

  // Get week statistics
  const getWeekStats = () => {
    let total = 0;
    let completed = 0;
    
    weekDates.forEach(date => {
      const dateKey = getDateKey(date);
      const dayTasks = tasksByDate.get(dateKey) || [];
      const poolTasks = getPoolTasksForDate(dateKey);
      const allTasks = [...dayTasks, ...poolTasks];
      
      total += allTasks.length;
      completed += allTasks.filter(task => task.completed).length;
    });
    
    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const weekStats = getWeekStats();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Weekly View</h2>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={goToCurrentWeek} className="min-w-60 font-medium">
                {getWeekRangeString()}
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {getRelativeWeekLabel() && (
                <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-md">
                  {getRelativeWeekLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{weekStats.total}</span> tasks
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{weekStats.completed}</span> done
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{weekStats.completionRate}%</span> complete
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto" ref={timelineScrollRef}>
          {/* Timeline header */}
          {renderTimelineHeader()}
          
          {/* Day timelines */}
          <div className="p-4 space-y-4">
            {weekDates.map((date, index) => renderDayTimeline(date, index))}
          </div>
        </div>
      </div>
    </div>
  );
} 