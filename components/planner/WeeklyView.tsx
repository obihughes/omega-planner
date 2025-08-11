'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Plus,
  ToggleLeft,
  ToggleRight
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

// Weekly view specific constants for row-based layout (reduced by 5% width, 34% height)
const WEEKLY_PIXELS_PER_HOUR = 97; // Reduced from 102 (5% smaller)
const WEEKLY_ROW_HEIGHT = 52; // Reduced from 55 (another 5% smaller)
const WEEKLY_TASK_HEIGHT = 39; // Reduced from 41 (another 5% smaller)  
const WEEKLY_DAY_COLUMN_WIDTH = 65; // Reduced from 68 (5% smaller)
const WEEKLY_TIMELINE_HEADER_HEIGHT = 23; // Reduced from 24 (another 5% smaller)
const HOURS_PER_ROW = 12; // 12 hours per row (AM/PM split)

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

  // State for week navigation and view mode
  const [weekOffset, setWeekOffset] = useState(0);
  const [isSameDayView, setIsSameDayView] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(0); // 0 = Sunday, 1 = Monday, etc.
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Set initial scroll position to 6am
  useEffect(() => {
    const scrollContainer = timelineScrollRef.current;
    if (!scrollContainer) return;

    // Set initial scroll position to 6am (day column + 6 * pixels per hour)
    const initialScrollPosition = WEEKLY_DAY_COLUMN_WIDTH + (6 * WEEKLY_PIXELS_PER_HOUR);
    scrollContainer.scrollLeft = initialScrollPosition;
  }, [weekOffset, isSameDayView, selectedDayOfWeek]); // Re-run when view changes

  // Calculate week dates (starting from previous day, with today as second day)
  const getWeekDates = (offset: number) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const startOfWeek = new Date(today);
    
    // Start from yesterday (today - 1 day)
    startOfWeek.setDate(today.getDate() - 1 + (offset * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      weekDates.push(date);
    }
    
    return weekDates;
  };

  // Calculate same day across multiple weeks
  const getSameDayDates = (dayOfWeek: number, weeksBack: number = 0) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const dates = [];
    
    // Start from the most recent occurrence of the selected day
    const startDate = new Date(today);
    const todayDayOfWeek = today.getDay();
    const daysToTarget = (dayOfWeek - todayDayOfWeek + 7) % 7;
    
    // If target day is in the future, go back a week
    if (daysToTarget > 0) {
      startDate.setDate(today.getDate() - (7 - daysToTarget));
    } else if (daysToTarget === 0) {
      // If today is the target day, use today
      startDate.setDate(today.getDate());
    } else {
      startDate.setDate(today.getDate() + daysToTarget);
    }
    
    // Add the offset for navigation
    startDate.setDate(startDate.getDate() + (weeksBack * 7));
    
    // Get 7 instances of the same day going backwards
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() - (i * 7));
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      dates.unshift(date); // Add to beginning to keep chronological order
    }
    
    return dates;
  };

  // Initialize selectedDayOfWeek to today's day when switching to same-day view
  React.useEffect(() => {
    if (isSameDayView && selectedDayOfWeek === 0) {
      const today = new Date();
      setSelectedDayOfWeek(today.getDay());
    }
  }, [isSameDayView, selectedDayOfWeek]);

  const weekDates = isSameDayView 
    ? getSameDayDates(selectedDayOfWeek, weekOffset)
    : getWeekDates(weekOffset);
  // Day names for display (will dynamically show based on actual dates)
  const getDayName = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[date.getDay()];
  };

  // Navigation functions
  const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setWeekOffset(prev => prev + 1);
  const goToCurrentWeek = () => setWeekOffset(0);

  // Get full day name from day of week number
  const getFullDayName = (dayOfWeek: number) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[dayOfWeek];
  };

  // Get week range string
  const getWeekRangeString = () => {
    if (isSameDayView) {
      const dayName = getFullDayName(selectedDayOfWeek);
      const firstDay = weekDates[0];
      const lastDay = weekDates[6];
      return `${dayName}s: ${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      const firstDay = weekDates[0];
      const lastDay = weekDates[6];
      return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  // Get relative week label
  const getRelativeWeekLabel = () => {
    if (isSameDayView) {
      if (weekOffset === 0) return `Recent ${getFullDayName(selectedDayOfWeek)}s`;
      if (weekOffset === -1) return `Previous ${getFullDayName(selectedDayOfWeek)}s`;
      if (weekOffset === 1) return `Future ${getFullDayName(selectedDayOfWeek)}s`;
      return null;
    } else {
      if (weekOffset === 0) return 'This Week';
      if (weekOffset === -1) return 'Last Week';
      if (weekOffset === 1) return 'Next Week';
      return null;
    }
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

  // Render timeline header with period-specific hours
  const renderTimelineHeader = useCallback((isAM: boolean) => {
    const baseHour = isAM ? 0 : 12;
    const hours = Array.from({ length: HOURS_PER_ROW }, (_, i) => baseHour + i);
    
    return (
      <div className="flex border-b border-border/5 bg-muted/5" style={{ height: `${WEEKLY_TIMELINE_HEADER_HEIGHT}px` }}>
        {/* Empty spacer for day column */}
        <div className="flex-shrink-0 border-r border-border/30 bg-card/50" style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px` }}>
        </div>
        
        {/* Timeline hours for this period */}
        <div className="flex" style={{ minWidth: `${WEEKLY_PIXELS_PER_HOUR * HOURS_PER_ROW}px` }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex-none border-r border-border/5 flex items-center justify-center bg-muted/5"
              style={{ width: `${WEEKLY_PIXELS_PER_HOUR}px` }}
            >
              <div className={`text-xs font-medium ${hour % 6 === 0 ? 'text-foreground/80' : 'text-muted-foreground/60'}`}>
                {formatTime(hour)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, []);

  // Handle task creation
  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>, date: Date, isAM: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const hourFloat = x / WEEKLY_PIXELS_PER_HOUR;
    const baseHour = isAM ? 0 : 12; // AM starts at 0, PM starts at 12
    const snappedNewStartHour = baseHour + Math.round(hourFloat * 4) / 4;
    const dayOffset = getDayOffsetFromToday(date);
    
    openEditModal(undefined, {
      isFromPool: false,
      initialDayOffset: dayOffset,
      initialStartHour: Math.min(snappedNewStartHour, 23.75), // Ensure max is 23:45
      isNew: true
    });
  };

  // Render individual day with AM/PM rows
  const renderDayRows = useCallback((date: Date, index: number) => {
    const dateKey = getDateKey(date);
    const dayTasks = tasksByDate.get(dateKey) || [];
    const poolTasks = getPoolTasksForDate(dateKey);
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);
    const dayOffset = getDayOffsetFromToday(date);
    
    // Filter scheduled tasks
    const scheduledTasks = dayTasks.filter(task => task.startHour !== undefined);
    
    // Split tasks into AM (0-11.99) and PM (12-23.99)
    const amTasks = scheduledTasks.filter(task => task.startHour < 12);
    const pmTasks = scheduledTasks.filter(task => task.startHour >= 12);
    
    // Current time marker for today
    const getCurrentTimeMarker = (isAM: boolean) => {
      if (!isCurrentDay) return null;
      
      const now = new Date();
      const currentHourFloat = now.getHours() + now.getMinutes() / 60;
      
      // Check if current time is in this period
      const isCurrentPeriod = isAM ? currentHourFloat < 12 : currentHourFloat >= 12;
      if (!isCurrentPeriod) return null;
      
      const periodHour = isAM ? currentHourFloat : currentHourFloat - 12;
      const markerLeft = periodHour * WEEKLY_PIXELS_PER_HOUR;
      
      return (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none" 
          style={{ left: `${markerLeft}px` }}
        >
          <div className="absolute top-0 left-[-3px] w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent border-t-red-500" />
        </div>
      );
    };
    
    // Render tasks for a specific period (AM or PM)
    const renderTasks = (tasks: any[], isAM: boolean) => {
      return tasks.map((task) => {
        const taskStartHour = task.startHour;
        const taskEndHour = Math.min(isAM ? 12 : 24, task.startHour + task.duration);
        
        // Calculate position within the 12-hour period
        const periodStartHour = isAM ? taskStartHour : taskStartHour - 12;
        const periodEndHour = isAM ? taskEndHour : taskEndHour - 12;
        
        // Handle tasks that span across AM/PM boundary
        let renderStartHour = periodStartHour;
        let renderEndHour = periodEndHour;
        
        if (isAM && taskEndHour > 12) {
          renderEndHour = 12; // Cap AM tasks at 12
        } else if (!isAM && taskStartHour < 12) {
          renderStartHour = 0; // Start PM tasks at 0 if they began in AM
        }
        
        // Skip if task doesn't belong in this period
        if (isAM && taskStartHour >= 12) return null;
        if (!isAM && taskEndHour <= 12) return null;
        
        const renderLeft = Math.max(0, renderStartHour) * WEEKLY_PIXELS_PER_HOUR;
        const renderWidth = (renderEndHour - Math.max(0, renderStartHour)) * WEEKLY_PIXELS_PER_HOUR;
        
        if (renderWidth <= 0) return null;
        
        const taskStyle: React.CSSProperties = {
          left: `${renderLeft + 1}px`,
          width: `${Math.max(renderWidth - 2, 30)}px`,
          top: `0px`,
          height: `${WEEKLY_ROW_HEIGHT}px`,
          zIndex: 40,
        };

        return (
          <div key={`${task.id}-${isAM ? 'am' : 'pm'}`} className="absolute" style={taskStyle}>
            <MemoizedWeeklyTaskCard
              task={task}
              height={WEEKLY_ROW_HEIGHT}
              onStartEdit={(taskToEdit, options) => openEditModal(taskToEdit, options)} 
              onViewNotes={openViewNotesModal}
              currentTime={new Date()}
            />
          </div>
        );
      });
    };
    
    // Render a period row (AM or PM)
    const renderPeriodRow = (isAM: boolean) => {
      const tasks = isAM ? amTasks : pmTasks;
      const periodLabel = isAM ? 'AM' : 'PM';
      
              return (
          <div 
            key={`${dateKey}-${periodLabel}`} 
            className={cn(
              "flex",
              !isAM && "border-t border-border/5" // Very subtle separator for PM row
            )}
          >
          {/* Day label column */}
          <div 
            className={cn(
              "flex-shrink-0 border-r border-border/30 p-2 flex flex-col justify-center sticky left-0 z-50 bg-background",
              isCurrentDay && isAM && "bg-muted/20" // Gentle highlight for today's AM row
            )}
            style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px`, height: `${WEEKLY_ROW_HEIGHT}px` }}
          >
            <div className="text-center">
              {isAM ? (
                <>
                  <div className={cn(
                    "text-xs font-medium uppercase tracking-wide mb-1",
                    isCurrentDay && "text-foreground font-semibold",
                    !isCurrentDay && "text-muted-foreground"
                  )}>
                    {isSameDayView ? getFullDayName(selectedDayOfWeek).slice(0, 3).toUpperCase() : getDayName(date).toUpperCase()}
                  </div>
                  
                  <div className={cn(
                    "text-xl font-semibold leading-none mb-1",
                    isCurrentDay && "text-foreground font-bold",
                    !isCurrentDay && "text-foreground"
                  )}>
                    {date.getDate()}
                  </div>
                  
                  <div className={cn(
                    "text-xs",
                    isCurrentDay && "text-muted-foreground font-medium",
                    !isCurrentDay && "text-muted-foreground"
                  )}>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </>
              ) : (
                <div className={cn(
                  "text-xs font-medium text-muted-foreground/70 mt-2",
                )}>
                  {periodLabel}
                </div>
              )}
            </div>
          </div>

          {/* 12-hour Timeline */}
          <div 
            className="relative bg-background"
            style={{ 
              width: `${WEEKLY_PIXELS_PER_HOUR * HOURS_PER_ROW}px`,
              height: `${WEEKLY_ROW_HEIGHT}px`
            }}
            onDoubleClick={(e) => handleTimelineDoubleClick(e, date, isAM)}
          >
            {/* Grid lines for 12 hours */}
            {Array.from({ length: HOURS_PER_ROW }, (_, i) => (
              <div 
                key={`grid-${i}`} 
                className={`absolute h-full ${i % 6 === 0 ? 'border-l border-border/30' : 'border-l border-border/10'}`}
                style={{ left: `${i * WEEKLY_PIXELS_PER_HOUR}px` }} 
              />
            ))}

            {/* Current time marker */}
            {getCurrentTimeMarker(isAM)}

            {/* Tasks for this period */}
            {renderTasks(tasks, isAM)}
          </div>
        </div>
      );
    };
    
    return (
      <Fragment key={dateKey}>
        {renderTimelineHeader(true)}    {/* AM timeline header */}
        {renderPeriodRow(true)}         {/* AM row */}
        {renderTimelineHeader(false)}   {/* PM timeline header */}
        {renderPeriodRow(false)}        {/* PM row */}
      </Fragment>
    );
  }, [tasksByDate, getPoolTasksForDate, openEditModal, openViewNotesModal, isSameDayView, selectedDayOfWeek]);

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
            
            {/* View Toggle and Navigation */}
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSameDayView(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    !isSameDayView 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  This Week
                </button>
                <button
                  onClick={() => setIsSameDayView(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    isSameDayView 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Same Day
                </button>
              </div>

              {/* Day Selector for Same Day View */}
              {isSameDayView && (
                <select
                  value={selectedDayOfWeek}
                  onChange={(e) => setSelectedDayOfWeek(Number(e.target.value))}
                  className="px-2 py-1 text-xs bg-background border border-border rounded-md"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              )}

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
        <div className="h-full overflow-auto" ref={timelineScrollRef} style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
          {/* Day rows with AM/PM split and individual timeline headers */}
          <div className="bg-transparent" style={{ minWidth: `${WEEKLY_DAY_COLUMN_WIDTH + (WEEKLY_PIXELS_PER_HOUR * HOURS_PER_ROW)}px` }}>
            {weekDates.map((date, index) => (
              <div key={getDateKey(date)} className={cn(
                "border-b-2 border-border/40",
                index === 0 && "border-t-2 border-border/40",
                "relative"
              )}>
                {renderDayRows(date, index)}
                {/* Day separator line */}
                {index < weekDates.length - 1 && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 