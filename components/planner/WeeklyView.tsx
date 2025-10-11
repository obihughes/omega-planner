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
import { useCalendarData } from '@/hooks/useCalendarData';
import { formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';
import { MemoizedWeeklyTaskCard } from './WeeklyTaskCard';
import { WeeklyEventsDisplay } from './WeeklyEventsDisplay';
import { EditTaskModal } from './EditTaskModal';
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
const WEEKLY_PIXELS_PER_HOUR = 90; // Original width
const WEEKLY_ROW_HEIGHT = 60; // Increased height for better date display and events visibility
const WEEKLY_TASK_HEIGHT = 39; // Reduced from 41 (another 5% smaller)  
const WEEKLY_DAY_COLUMN_WIDTH = 95; // Increased for proper date display visibility
const WEEKLY_EVENTS_COLUMN_WIDTH = 85; // Slightly reduced for better balance
const WEEKLY_TIMELINE_HEADER_HEIGHT = 26; // Increased for better header visibility
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
    isClient,
    activeEditModalTask,
    closeEditModal,
    saveTaskFromModal,
    handleTaskColorChange,
    handlePinTask,
    pinnedTasks,
    copyTaskToPool,
    handleDeleteTask
  } = useDailyPlanner();

  // Calendar data for events
  const {
    data: calendarData,
  } = useCalendarData();

  // State for week navigation and view mode
  const [weekOffset, setWeekOffset] = useState(0);
  const [isSameDayView, setIsSameDayView] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(0); // 0 = Sunday, 1 = Monday, etc.
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const didAutoScrollToTodayRef = useRef(false);

  // Set initial scroll position to 6am
  useEffect(() => {
    const scrollContainer = timelineScrollRef.current;
    if (!scrollContainer) return;

    // Set initial scroll position to 6am (day column + events column + 6 * pixels per hour)
    const initialScrollPosition = WEEKLY_DAY_COLUMN_WIDTH + WEEKLY_EVENTS_COLUMN_WIDTH + (6 * WEEKLY_PIXELS_PER_HOUR);
    scrollContainer.scrollLeft = initialScrollPosition;
  }, [weekOffset, isSameDayView, selectedDayOfWeek]); // Re-run when view changes

  // (moved below weekDates initialization)

  // Calculate week dates (Monday to Sunday for the current week)
  const getWeekDates = (offset: number) => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    // Adjust today by the offset (for week navigation)
    const adjustedToday = new Date(today);
    adjustedToday.setDate(today.getDate() + (offset * 7));
    adjustedToday.setHours(12, 0, 0, 0);

    // Calculate the start of the week (Monday)
    const dayOfWeek = adjustedToday.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to go back to Monday
    const monday = new Date(adjustedToday);
    monday.setDate(adjustedToday.getDate() - daysFromMonday);
    monday.setHours(12, 0, 0, 0);

    const weekDates = [] as Date[];

    // Add 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(12, 0, 0, 0);
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
  
  // Auto-scroll vertically to today's row on initial load for current week
  useEffect(() => {
    const scrollContainer = timelineScrollRef.current;
    if (!scrollContainer) return;
    if (didAutoScrollToTodayRef.current) return; // run once

    // Only auto-scroll for the current week (offset 0)
    if (weekOffset !== 0) return;

    // Find today's date within the rendered weekDates
    const todayIndex = weekDates.findIndex((d) => {
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });

    if (todayIndex === -1) return;

    const todayKey = getDateKey(weekDates[todayIndex]);
    const todayEl = scrollContainer.querySelector<HTMLDivElement>(`[data-date-key="${todayKey}"]`);
    if (!todayEl) return;

    // Scroll so today's AM row is near the top with a small margin
    const targetTop = Math.max(0, todayEl.offsetTop - 16);
    scrollContainer.scrollTop = targetTop;
    didAutoScrollToTodayRef.current = true;
  }, [weekOffset, weekDates]);
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
      <div className="flex border-b border-border/20 bg-card/80" style={{ height: `${WEEKLY_TIMELINE_HEADER_HEIGHT}px` }}>
        {/* Empty spacer for day column */}
        <div className="flex-shrink-0 border-r border-border/30 bg-card" style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px` }}>
        </div>
        
        {/* Events column header */}
        <div className="flex-shrink-0 border-r border-border/30 bg-card flex items-center justify-center" style={{ width: `${WEEKLY_EVENTS_COLUMN_WIDTH}px` }}>
          <span className="text-[11px] font-medium text-muted-foreground/80 tracking-wide">Events</span>
        </div>
        
        {/* Timeline hours for this period */}
        <div className="flex" style={{ minWidth: `${WEEKLY_PIXELS_PER_HOUR * HOURS_PER_ROW}px` }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex-none border-r border-border/10 flex items-center justify-start pl-1 bg-muted/5"
              style={{ width: `${WEEKLY_PIXELS_PER_HOUR}px` }}
            >
              <div className={`text-[11px] font-medium ${hour % 6 === 0 ? 'text-foreground/60' : 'text-muted-foreground/40'}`}>
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
    
    // Filter scheduled tasks (exclude unscheduled tasks with startHour 0 or undefined)
    type ScheduledTask = Task & { startHour: number };
    const isScheduled = (t: Task): t is ScheduledTask =>
      typeof t.startHour === 'number' && t.startHour > 0;
    const scheduledTasks: ScheduledTask[] = dayTasks.filter(isScheduled);
    
    // Split tasks into AM (0-11.99) and PM (12-23.99)
    // Tasks that cross the AM/PM boundary should appear in both periods
    const amTasks: ScheduledTask[] = scheduledTasks.filter(task => task.startHour < 12);
    const pmTasks: ScheduledTask[] = scheduledTasks.filter(task => 
      task.startHour >= 12 || (task.startHour < 12 && task.startHour + task.duration > 12)
    );
    
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
          className="absolute top-0 bottom-0 w-[2px] bg-red-500/70 z-50 pointer-events-none"
          style={{ left: `${markerLeft}px` }}
        >
          {/* Glow */}
          <div className="absolute inset-y-0 -left-[2px] -right-[2px] bg-red-500/10" />
          {/* Dot and label */}
          <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/30" />
          <div className="absolute top-0 left-2 text-[10px] px-1 py-0.5 rounded bg-background/80 backdrop-blur border border-border/50 text-foreground/80">
            Now
          </div>
        </div>
      );
    };
    
    // Render tasks for a specific period (AM or PM)
    const renderTasks = (tasks: ScheduledTask[], isAM: boolean) => {
      return tasks.map((task) => {
        const taskStartHour: number = task.startHour; // guaranteed by type guard
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
              !isAM && "border-t border-border/20"
            )}
          >
          {/* Day label column */}
          <div 
            className={cn(
              "flex-shrink-0 border-r border-border/30 px-3 py-2 flex flex-col justify-center sticky left-0 z-50 relative bg-card",
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
                    {isSameDayView ? getFullDayName(selectedDayOfWeek).slice(0, 3).toUpperCase() : getDayName(date).toUpperCase()}
                  </div>
                  
                  <div className={cn(
                    "text-2xl font-extrabold leading-none mb-1",
                    "text-foreground"
                  )}>
                    {date.getDate()}
                  </div>
                  
                  <div className={cn(
                    "text-[11px] font-medium text-muted-foreground",
                  )}>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
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

          {/* Events Column */}
          <div 
            className={cn(
              "flex-shrink-0 border-r border-border/30 relative",
              isCurrentDay ? "bg-primary/5" : isWeekendDay ? "bg-muted/30" : "bg-background"
            )}
            style={{ 
              width: `${WEEKLY_EVENTS_COLUMN_WIDTH}px`,
              height: `${WEEKLY_ROW_HEIGHT}px`
            }}
          >
            {/* Events for this day (only show in AM row) */}
            {isAM && (
              <div className="absolute inset-2 flex flex-col justify-start">
                <WeeklyEventsDisplay
                  events={calendarData.events}
                  date={date}
                />
              </div>
            )}
          </div>

          {/* 12-hour Timeline */}
          <div 
            className={cn(
              "relative transition-colors duration-200 cursor-pointer",
              isCurrentDay ? "bg-primary/5 hover:bg-primary/10" : isWeekendDay ? "bg-muted/30 hover:bg-muted/40" : "bg-background hover:bg-muted/10"
            )}
            style={{ 
              width: `${WEEKLY_PIXELS_PER_HOUR * HOURS_PER_ROW}px`,
              height: `${WEEKLY_ROW_HEIGHT}px`
            }}
            onDoubleClick={(e) => handleTimelineDoubleClick(e, date, isAM)}
          >
            {/* Grid lines for 12 hours - only in timeline area */}
            {Array.from({ length: HOURS_PER_ROW }, (_, i) => (
              <div 
                key={`grid-${i}`} 
                className={`absolute h-full ${i % 6 === 0 ? 'border-l border-border/40' : 'border-l border-border/10'} pointer-events-none`}
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
    <div className="h-full bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Sticky Header - Fixed at top */}
      <div className="px-4 py-3 border-b border-border bg-card z-50 shadow-sm shrink-0">
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

          {/* Add Task Button and Stats */}
          <div className="flex items-center gap-4">
            {/* Quick Add Task Button */}
            <Button 
              size="sm" 
              className="flex items-center gap-2 h-8"
              onClick={() => {
                openEditModal(undefined, {
                  isFromPool: false,
                  initialDayOffset: 0, // Default to today
                  initialStartHour: new Date().getHours(),
                  isNew: true
                });
              }}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>

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
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto bg-background" ref={timelineScrollRef} style={{ overflowX: 'auto', scrollBehavior: 'smooth' }}>
        <div style={{ minWidth: `${WEEKLY_DAY_COLUMN_WIDTH + (WEEKLY_PIXELS_PER_HOUR * HOURS_PER_ROW)}px` }}>
          {weekDates.map((date, index) => (
            <div key={getDateKey(date)} data-date-key={getDateKey(date)} className={cn(
              "border-b-2 border-border/60",
              index === 0 && "border-t-2",
              "relative"
            )}>
              {renderDayRows(date, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Task Edit Modal */}
      {activeEditModalTask && (
        <EditTaskModal
          taskToEdit={activeEditModalTask}
          onSave={saveTaskFromModal}
          onClose={closeEditModal}
          onColorChange={handleTaskColorChange}
          onPinTask={handlePinTask}
          onMoveToInbox={copyTaskToPool}
          pinnedTasks={pinnedTasks}
          onDelete={(taskId, isFromPool) => handleDeleteTask(taskId)}
        />
      )}
    </div>
  );
} 