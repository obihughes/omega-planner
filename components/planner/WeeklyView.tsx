'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { MemoizedWeeklyTaskCard } from './WeeklyTaskCard';
import { 
  TIMELINE_START_HOUR as APP_TIMELINE_START_HOUR,
  TIMELINE_END_HOUR as APP_TIMELINE_END_HOUR,
  PIXELS_PER_HOUR as APP_PIXELS_PER_HOUR,
  TIMELINE_COLUMN_HEIGHT,
  TASK_BASE_TOP,
  TASK_BASE_BOTTOM_PADDING,
  MIN_TASK_DURATION as APP_MIN_TASK_DURATION
} from '../../lib/constants';

// Weekly view specific constants for row-based layout
const WEEKLY_PIXELS_PER_HOUR = 120; // Increased for better task visibility
const WEEKLY_ROW_HEIGHT = 80; // Height for each time period row
const WEEKLY_TASK_HEIGHT = 60; // Taller, more square task cards
const WEEKLY_DAY_COLUMN_WIDTH = 80; // Width for day column labels

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
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  // Render timeline header with 24-hour timeline
  const renderTimelineHeader = useCallback(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex">
          {/* Day label spacer - sticky */}
          <div className="flex-shrink-0 border-r border-border/30 py-2 px-2 bg-card sticky left-0 z-30" style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px` }}>
            <span className="text-xs font-medium text-muted-foreground">Day</span>
          </div>
          
          {/* Timeline hours */}
          <div className="flex" style={{ minWidth: `${WEEKLY_PIXELS_PER_HOUR * 24}px` }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex-none border-r border-border/10 py-2 px-1 text-center bg-card"
                style={{ width: `${WEEKLY_PIXELS_PER_HOUR}px` }}
              >
                <div className="text-xs text-muted-foreground">{formatTime(hour)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }, []);

  // Handle task creation
  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>, date: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const hourFloat = x / WEEKLY_PIXELS_PER_HOUR;
    const snappedNewStartHour = Math.round(hourFloat * 4) / 4;
    const dayOffset = getDayOffsetFromToday(date);
    
    openEditModal(undefined, {
      isFromPool: false,
      initialDayOffset: dayOffset,
      initialStartHour: snappedNewStartHour,
      isNew: true
    });
  };

    // Render individual day with single row and 24-hour timeline
  const renderDayRow = useCallback((date: Date, index: number) => {
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
      const markerLeft = currentHourFloat * WEEKLY_PIXELS_PER_HOUR;
      currentTimeMarker = (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none" 
          style={{ left: `${markerLeft}px` }}
        >
          <div className="absolute top-0 left-[-3px] w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent border-t-red-500" />
        </div>
      );
    }
    
    return (
      <div key={dateKey} className={cn(
        "flex border-b border-border/20",
        index % 2 === 0 ? "bg-background" : "bg-muted/30" // Alternating backgrounds
      )}>
        {/* Day label column */}
        <div 
          className={cn(
            "flex-shrink-0 border-r border-border/40 p-2 flex flex-col justify-center sticky left-0 z-50 shadow-sm",
            isCurrentDay && "bg-primary/10 text-primary border-primary/30",
            isWeekendDay && !isCurrentDay && "bg-orange-500/10 text-orange-700 border-orange-500/30",
            !isCurrentDay && !isWeekendDay && (index % 2 === 0 ? "bg-card" : "bg-muted/50")
          )}
          style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px`, height: `${WEEKLY_ROW_HEIGHT}px` }}
        >
          <div className="text-center">
            <div className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              isWeekendDay && !isCurrentDay && "text-orange-600"
            )}>
              {dayNames[index]}
            </div>
            <div className="text-lg font-bold leading-tight">
              {date.getDate()}
            </div>
            <div className="text-xs text-muted-foreground">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </div>
            {poolTasks.length > 0 && (
              <div className="text-xs text-orange-600 mt-1">
                {poolTasks.length} inbox
              </div>
            )}
          </div>
        </div>

        {/* 24-hour Timeline */}
        <div 
          className="relative bg-background"
          style={{ 
            width: `${WEEKLY_PIXELS_PER_HOUR * 24}px`,
            height: `${WEEKLY_ROW_HEIGHT}px`
          }}
          onDoubleClick={(e) => handleTimelineDoubleClick(e, date)}
        >
          {/* Grid lines for all 24 hours */}
          {Array.from({ length: 24 }, (_, i) => (
            <div 
              key={`grid-${i}`} 
              className="border-l border-border/10 absolute h-full" 
              style={{ left: `${i * WEEKLY_PIXELS_PER_HOUR}px` }} 
            />
          ))}

          {/* Current time marker */}
          {currentTimeMarker}

          {/* All scheduled tasks */}
          {scheduledTasks.map((task) => {
            const taskStartHour = task.startHour;
            const taskEndHour = Math.min(24, task.startHour + task.duration);
            const renderLeft = taskStartHour * WEEKLY_PIXELS_PER_HOUR;
            const renderWidth = (taskEndHour - taskStartHour) * WEEKLY_PIXELS_PER_HOUR;
            
            if (renderWidth <= 0) return null;
            
            const taskStyle: React.CSSProperties = {
              left: `${renderLeft}px`,
              width: `${Math.max(renderWidth, 30)}px`,
              top: `${(WEEKLY_ROW_HEIGHT - WEEKLY_TASK_HEIGHT) / 2}px`,
              height: `${WEEKLY_TASK_HEIGHT}px`,
              zIndex: 40,
            };

            return (
              <div key={task.id} className="absolute" style={taskStyle}>
                <MemoizedWeeklyTaskCard
                  task={task}
                  height={WEEKLY_TASK_HEIGHT}
                  onStartEdit={(taskToEdit, options) => openEditModal(taskToEdit, options)} 
                  onViewNotes={openViewNotesModal}
                  currentTime={new Date()}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [tasksByDate, getPoolTasksForDate, openEditModal, openViewNotesModal, dayNames]);

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
      <div className="px-4 py-3 border-b border-border bg-card/50 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Weekly View</h2>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={goToCurrentWeek} className="min-w-52 font-medium text-sm">
                {getWeekRangeString()}
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {getRelativeWeekLabel() && (
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
                  {getRelativeWeekLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{weekStats.total}</span> tasks
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{weekStats.completed}</span> done
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{weekStats.completionRate}%</span> complete
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto" ref={timelineScrollRef} style={{ overflowX: 'auto' }}>
          {/* Timeline header */}
          {renderTimelineHeader()}
          
          {/* Day rows */}
          <div className="bg-transparent" style={{ minWidth: `${WEEKLY_DAY_COLUMN_WIDTH + (WEEKLY_PIXELS_PER_HOUR * 24)}px` }}>
            {weekDates.map((date, index) => renderDayRow(date, index))}
          </div>
        </div>
      </div>
    </div>
  );
} 