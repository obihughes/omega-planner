'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Plus,
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { useCalendarData } from '@/hooks/useCalendarData';
import { formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';
import { MemoizedWeeklyTaskCard } from './WeeklyTaskCard';
import { WeeklyEventsDisplay } from './WeeklyEventsDisplay';
import { EditTaskModal } from './EditTaskModal';

// Weekly view specific constants for row-based layout
const WEEKLY_PIXELS_PER_HOUR = 80;
const WEEKLY_ROW_HEIGHT = 80; // Increased height for single row
const WEEKLY_TASK_HEIGHT = 42; 
const WEEKLY_DAY_COLUMN_WIDTH = 100;
const WEEKLY_EVENTS_COLUMN_WIDTH = 100; // Slightly wider for events
const WEEKLY_TIMELINE_HEADER_HEIGHT = 32; 
const HOURS_PER_ROW = 24; // Full day

interface WeeklyViewProps {}

export default function WeeklyView({}: WeeklyViewProps) {
  const {
    tasksByDate,
    getPoolTasksForDate,
    openEditModal,
    openViewNotesModal,
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

    // Set initial scroll position to 7am (day column + events column + 7 * pixels per hour)
    const initialScrollPosition = 0 + (7 * WEEKLY_PIXELS_PER_HOUR); // Columns are sticky, so we scroll the body? No, with sticky, the container scrolls.
    // However, if we scroll left, the sticky columns stay. 
    // We want to scroll to 7am relative to the timeline start.
    // The timeline starts after (Day + Events) columns.
    // But since they are sticky inside the container, we just scroll the container.
    // The content inside has padding-left or the columns are part of the flow.
    // If sticky, they are part of the flow.
    // So scrollLeft should be 7 * 80 = 560px.
    
    // Actually, we should check if we need to account for the sticky columns width if they are not overlaying.
    // Sticky position keeps them in view, but they still occupy space at start.
    // So scroll 0 is "at the start".
    // 6am is at (6 * 80).
    scrollContainer.scrollLeft = 6 * WEEKLY_PIXELS_PER_HOUR;
  }, [weekOffset, isSameDayView, selectedDayOfWeek]);

  // Handle mouse wheel for horizontal scrolling with velocity
  useEffect(() => {
    const scrollContainer = timelineScrollRef.current;
    if (!scrollContainer) return;

    let scrollVelocity = 0;
    let lastWheelTime = 0;

    const handleWheel = (e: WheelEvent) => {
      // Only intercept if scrolling primarily vertically
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        
        // Apply scroll immediately with high sensitivity
        scrollContainer.scrollLeft += e.deltaY * 2;
        lastWheelTime = Date.now();
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, []);

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
  // With the new layout (single row per day), this is simpler.
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

    // Since we have vertical scroll for the list of days (if they don't fit), we can scroll to the day.
    // But typically 7 rows * 80px = 560px fits on screen.
    // If not, we scroll.
    const rowTop = todayIndex * (WEEKLY_ROW_HEIGHT + 1) + WEEKLY_TIMELINE_HEADER_HEIGHT; // +1 for border
    
    // If the container is vertically scrollable:
    if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        // Center the day
        const targetTop = Math.max(0, rowTop - (scrollContainer.clientHeight / 2) + (WEEKLY_ROW_HEIGHT / 2));
        scrollContainer.scrollTop = targetTop;
    }
    
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

  // Render global timeline header
  const renderTimelineHeader = useCallback(() => {
    const hours = Array.from({ length: HOURS_PER_ROW }, (_, i) => i);
    
    return (
      <div className="flex border-b border-border bg-card shadow-sm sticky top-0 z-[60]" style={{ height: `${WEEKLY_TIMELINE_HEADER_HEIGHT}px`, minWidth: 'fit-content' }}>
        {/* Sticky Spacers */}
        <div className="sticky left-0 z-[70] flex bg-card border-r border-border">
            <div className="flex-shrink-0 bg-card" style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px` }} />
            <div className="flex-shrink-0 bg-card" style={{ width: `${WEEKLY_EVENTS_COLUMN_WIDTH}px` }} />
        </div>
        
        {/* Timeline hours */}
        <div className="flex">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex-none border-r border-border/10 flex items-center justify-start pl-2 bg-card text-xs text-muted-foreground font-medium"
              style={{ width: `${WEEKLY_PIXELS_PER_HOUR}px` }}
            >
              {formatTime(hour)}
            </div>
          ))}
        </div>
      </div>
    );
  }, []);

  // Handle task creation
  const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>, date: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Adjust x for scroll and sticky offset if needed, but relative click on the timeline div should be correct
    // The timeline div starts AFTER the columns.
    const x = e.clientX - rect.left;
    const hourFloat = x / WEEKLY_PIXELS_PER_HOUR;
    const snappedNewStartHour = Math.round(hourFloat * 4) / 4;
    const dayOffset = getDayOffsetFromToday(date);
    
    openEditModal(undefined, {
      isFromPool: false,
      initialDayOffset: dayOffset,
      initialStartHour: Math.min(snappedNewStartHour, 23.75),
      isNew: true
    });
  };

  // Render individual day row
  const renderDayRow = useCallback((date: Date, index: number) => {
    const dateKey = getDateKey(date);
    const dayTasks = tasksByDate.get(dateKey) || [];
    const poolTasks = getPoolTasksForDate(dateKey);
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);
    
    // Filter scheduled tasks
    type ScheduledTask = Task & { startHour: number };
    const isScheduled = (t: Task): t is ScheduledTask =>
      typeof t.startHour === 'number' && t.startHour >= 0; // >= 0 for 24h view
    const scheduledTasks: ScheduledTask[] = dayTasks.filter(isScheduled);
    
    // Current time marker
    const getCurrentTimeMarker = () => {
      if (!isCurrentDay) return null;
      
      const now = new Date();
      const currentHourFloat = now.getHours() + now.getMinutes() / 60;
      
      const markerLeft = currentHourFloat * WEEKLY_PIXELS_PER_HOUR;
      
      return (
        <div 
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none"
          style={{ left: `${markerLeft}px` }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
        </div>
      );
    };
    
    // Render tasks
    const renderTasks = (tasks: ScheduledTask[]) => {
      return tasks.map((task) => {
        const taskStartHour: number = task.startHour;
        const taskEndHour = Math.min(24, task.startHour + task.duration);
        
        const renderLeft = Math.max(0, taskStartHour) * WEEKLY_PIXELS_PER_HOUR;
        const renderWidth = (taskEndHour - Math.max(0, taskStartHour)) * WEEKLY_PIXELS_PER_HOUR;
        
        if (renderWidth <= 0) return null;
        
        const taskStyle: React.CSSProperties = {
          left: `${renderLeft + 2}px`, // +2 for gap
          width: `${Math.max(renderWidth - 4, 30)}px`,
          top: `6px`, // Centered vertically roughly
          height: `${WEEKLY_TASK_HEIGHT}px`,
          zIndex: 40,
        };

        return (
          <div key={`${task.id}`} className="absolute" style={taskStyle}>
            <MemoizedWeeklyTaskCard
              task={task}
              height={WEEKLY_TASK_HEIGHT}
              onStartEdit={(taskToEdit, options) => openEditModal(taskToEdit, options)} 
              onViewNotes={openViewNotesModal}
              currentTime={new Date()}
            />
          </div>
        );
      });
    };
    
    return (
      <div 
        key={dateKey} 
        className={cn(
          "flex border-b border-border/50 transition-colors",
          isCurrentDay ? "bg-primary/5" : "bg-card hover:bg-muted/5"
        )}
        style={{ height: `${WEEKLY_ROW_HEIGHT}px`, minWidth: 'fit-content' }}
      >
        {/* Sticky Container for Day & Events */}
        <div className="sticky left-0 z-50 flex border-r border-border/50 bg-card shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
            {/* Day label column */}
            <div 
                className={cn(
                "flex-shrink-0 border-r border-border/30 px-3 flex flex-col justify-center items-center bg-card",
                isCurrentDay && "bg-primary/5"
                )}
                style={{ width: `${WEEKLY_DAY_COLUMN_WIDTH}px` }}
            >
                <div className="text-center">
                    <div className={cn(
                        "text-[10px] font-bold uppercase tracking-wider mb-0.5",
                        isCurrentDay ? "text-primary" : "text-muted-foreground"
                    )}>
                        {isSameDayView ? getFullDayName(selectedDayOfWeek).slice(0, 3).toUpperCase() : getDayName(date).toUpperCase()}
                    </div>
                    
                    <div className={cn(
                        "text-xl font-bold leading-none mb-0.5",
                        isCurrentDay ? "text-primary" : "text-foreground"
                    )}>
                        {date.getDate()}
                    </div>
                    
                    <div className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                </div>
            </div>

            {/* Events Column */}
            <div 
                className={cn(
                "flex-shrink-0 relative overflow-hidden bg-card",
                isCurrentDay && "bg-primary/5"
                )}
                style={{ width: `${WEEKLY_EVENTS_COLUMN_WIDTH}px` }}
            >
                <div className="absolute inset-1">
                    <WeeklyEventsDisplay
                    events={calendarData.events}
                    date={date}
                    />
                </div>
            </div>
        </div>

        {/* 24-hour Timeline */}
        <div 
          className="relative h-full"
          style={{ width: `${WEEKLY_PIXELS_PER_HOUR * HOURS_PER_ROW}px` }}
          onDoubleClick={(e) => handleTimelineDoubleClick(e, date)}
        >
          {/* Grid lines */}
          {Array.from({ length: HOURS_PER_ROW }, (_, i) => (
            <div 
              key={`grid-${i}`} 
              className={`absolute h-full top-0 ${i % 6 === 0 ? 'border-l border-border/30' : 'border-l border-border/10'} pointer-events-none`}
              style={{ left: `${i * WEEKLY_PIXELS_PER_HOUR}px` }} 
            />
          ))}

          {/* Current time marker */}
          {getCurrentTimeMarker()}

          {/* Tasks */}
          {renderTasks(scheduledTasks)}
        </div>
      </div>
    );
  }, [tasksByDate, getPoolTasksForDate, openEditModal, openViewNotesModal, isSameDayView, selectedDayOfWeek, calendarData.events]);

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
    <div className="h-full bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
      {/* Top Bar - View Controls */}
      <div className="px-4 py-3 border-b border-border bg-card z-40 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Weekly View</h2>
            </div>
            
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50">
                <button
                  onClick={() => setIsSameDayView(false)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all",
                    !isSameDayView 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  This Week
                </button>
                <button
                  onClick={() => setIsSameDayView(true)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-all",
                    isSameDayView 
                      ? "bg-background shadow-sm text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Same Day
                </button>
            </div>

              {isSameDayView && (
                <select
                  value={selectedDayOfWeek}
                  onChange={(e) => setSelectedDayOfWeek(Number(e.target.value))}
                  className="px-2 py-1 text-xs bg-background border border-border rounded-md h-8"
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

              <div className="flex items-center gap-1 border border-border/50 rounded-md bg-card shadow-sm h-8">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="px-3 text-sm font-medium border-l border-r border-border/50 h-full flex items-center min-w-[140px] justify-center">
                  {getWeekRangeString()}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Timeline Scroll Navigation */}
              <div className="flex items-center gap-1 border border-border/50 rounded-md bg-card shadow-sm h-8">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  title="Scroll left (earlier times)"
                  onClick={() => {
                    if (timelineScrollRef.current) {
                      timelineScrollRef.current.scrollLeft -= WEEKLY_PIXELS_PER_HOUR * 3; // Scroll back 3 hours
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">Timeline</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  title="Scroll right (later times)"
                  onClick={() => {
                    if (timelineScrollRef.current) {
                      timelineScrollRef.current.scrollLeft += WEEKLY_PIXELS_PER_HOUR * 3; // Scroll forward 3 hours
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              size="sm" 
              className="flex items-center gap-2 h-8"
              onClick={() => {
                openEditModal(undefined, {
                  isFromPool: false,
                  initialDayOffset: 0,
                  initialStartHour: new Date().getHours(),
                  isNew: true
                });
              }}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>

            <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-md border border-border/30">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{weekStats.total}</span> tasks
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{weekStats.completed}</span> done
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{weekStats.completionRate}%</span> rate
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scrollable Timeline */}
      <div 
        className="flex-1 overflow-auto bg-background/50 relative" 
        ref={timelineScrollRef} 
        style={{ scrollBehavior: 'smooth' }}
      >
        <div style={{ width: 'fit-content', minWidth: '100%' }}>
            {renderTimelineHeader()}
            
            {/* Days Rows */}
            <div className="flex flex-col">
                {weekDates.map((date, index) => renderDayRow(date, index))}
            </div>
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