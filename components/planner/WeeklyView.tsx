'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';
import WeeklyTaskCard from './WeeklyTaskCard';

interface WeeklyViewProps {}

const TIMELINE_WIDTH_PER_HOUR = 60; // pixels per hour
const TIMELINE_START_HOUR = 0; // 12 AM
const TIMELINE_END_HOUR = 24; // 12 AM next day
const TOTAL_TIMELINE_WIDTH = TIMELINE_WIDTH_PER_HOUR * 24;
const DAY_ROW_HEIGHT = 120; // height of each day row

export default function WeeklyView({}: WeeklyViewProps) {
  const {
    tasksByDate,
    getPoolTasksForDate,
    openEditModal,
    handleTaskCompletionToggle,
  } = useDailyPlanner();

  // State for week navigation
  const [weekOffset, setWeekOffset] = useState(0);

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

  // Get tasks for the week
  const weekTasks = useMemo(() => {
    const weekTasksMap = new Map<string, { scheduled: Task[], inbox: Task[] }>();
    
    weekDates.forEach(date => {
      const dateKey = getDateKey(date);
      const dayTasks = tasksByDate.get(dateKey) || [];
      const poolTasks = getPoolTasksForDate(dateKey);
      
      // Separate scheduled tasks (have specific times) from unscheduled (pool tasks)
      const scheduledTasks = dayTasks.filter(task => !task.poolDate && task.startHour !== undefined);
      const inboxTasks = poolTasks;
      
      // Sort scheduled tasks by start time
      scheduledTasks.sort((a, b) => (a.startHour || 0) - (b.startHour || 0));
      
      weekTasksMap.set(dateKey, {
        scheduled: scheduledTasks,
        inbox: inboxTasks
      });
    });
    
    return weekTasksMap;
  }, [weekDates, tasksByDate, getPoolTasksForDate]);

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

  // Handle task creation
  const handleCreateTask = (date: Date, hour?: number) => {
    const dayOffset = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    openEditModal(undefined, {
      isFromPool: false,
      initialDayOffset: dayOffset,
      initialStartHour: hour || 9,
      isNew: true
    });
  };

  // Get week statistics
  const getWeekStats = () => {
    let total = 0;
    let completed = 0;
    
    weekTasks.forEach(dayData => {
      const allTasks = [...dayData.scheduled, ...dayData.inbox];
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

  // Helper functions
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Calculate task position and size for horizontal layout
  const getTaskStyle = (task: Task) => {
    const startHour = task.startHour || 0;
    const duration = task.duration || 1;
    
    const left = startHour * TIMELINE_WIDTH_PER_HOUR;
    const width = Math.max(duration * TIMELINE_WIDTH_PER_HOUR, 60); // Minimum 60px width
    
    return {
      left: `${left}px`,
      width: `${width}px`,
    };
  };

  // Render time grid at the top
  const renderTimeGrid = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="sticky top-16 z-20 bg-card/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex">
          {/* Day labels column */}
          <div className="w-32 flex-shrink-0 border-r border-border/30 p-2 bg-card/95">
            <div className="text-sm font-medium text-muted-foreground">Time</div>
          </div>
          
          {/* Time labels */}
          <div className="flex" style={{ width: `${TOTAL_TIMELINE_WIDTH}px` }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex items-center justify-center text-xs text-muted-foreground font-mono border-l border-border/20"
                style={{ width: `${TIMELINE_WIDTH_PER_HOUR}px`, height: '40px' }}
              >
                <span>{formatTime(hour)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render day row
  const renderDayRow = (date: Date, index: number) => {
    const dateKey = getDateKey(date);
    const dayData = weekTasks.get(dateKey) || { scheduled: [], inbox: [] };
    const isCurrentDay = isToday(date);
    const isPastDay = isPast(date);
    const allTasks = [...dayData.scheduled, ...dayData.inbox];
    
    return (
      <div key={dateKey} className="flex border-b border-border/20 last:border-b-0">
        {/* Day header */}
        <div className={cn(
          "w-32 flex-shrink-0 border-r border-border/30 p-3 flex flex-col justify-center",
          isCurrentDay && "bg-primary/5 border-primary/20"
        )}>
          <div className={cn(
            "text-sm font-medium",
            isCurrentDay ? "text-primary" : "text-muted-foreground"
          )}>
            {dayNames[index]}
          </div>
          <div className={cn(
            "text-xl font-bold",
            isCurrentDay ? "text-primary" : "text-foreground"
          )}>
            {date.getDate()}
          </div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </div>
          {allTasks.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {allTasks.filter(t => t.completed).length}/{allTasks.length}
            </div>
          )}
        </div>

        {/* Timeline row */}
        <div 
          className="relative"
          style={{ width: `${TOTAL_TIMELINE_WIDTH}px`, height: `${DAY_ROW_HEIGHT}px` }}
        >
          {/* Hour grid lines */}
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-border/10"
              style={{ left: `${i * TIMELINE_WIDTH_PER_HOUR}px` }}
            />
          ))}

          {/* Current time indicator */}
          {isCurrentDay && (() => {
            const now = new Date();
            const currentHour = now.getHours() + now.getMinutes() / 60;
            const currentTimeLeft = currentHour * TIMELINE_WIDTH_PER_HOUR;
            
            return (
              <div
                className="absolute top-0 bottom-0 z-20 border-l-2 border-red-500"
                style={{ left: `${currentTimeLeft}px` }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full -mt-1 -ml-1" />
              </div>
            );
          })()}

          {/* Scheduled tasks */}
          {dayData.scheduled.map((task) => (
            <div
              key={task.id}
              className="absolute top-2 z-10"
              style={{
                ...getTaskStyle(task),
                height: '50px'
              }}
            >
              <WeeklyTaskCard
                task={task}
                height={50}
                onTaskClick={(task) => openEditModal(task, { isFromPool: false })}
                onToggleComplete={handleTaskCompletionToggle}
                className="!left-0 !right-0"
              />
            </div>
          ))}

          {/* Inbox tasks at bottom */}
          {dayData.inbox.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-1 z-10 max-w-full overflow-x-auto">
              {dayData.inbox.slice(0, 4).map((task, idx) => (
                <div key={task.id} className="relative flex-shrink-0" style={{ width: '120px', height: '35px' }}>
                  <WeeklyTaskCard
                    task={task}
                    height={35}
                    onTaskClick={(task) => openEditModal(task, { isFromPool: true })}
                    onToggleComplete={handleTaskCompletionToggle}
                    className="opacity-70 !left-0 !right-0"
                  />
                </div>
              ))}
              {dayData.inbox.length > 4 && (
                <div className="flex items-center text-xs text-muted-foreground px-2 bg-muted rounded">
                  +{dayData.inbox.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Add task click area */}
          <div
            className="absolute inset-0 z-5"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const hour = Math.floor(x / TIMELINE_WIDTH_PER_HOUR);
              handleCreateTask(date, hour);
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">Weekly View</h2>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
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
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          {/* Time grid header */}
          {renderTimeGrid()}
          
          {/* Day rows */}
          <div className="divide-y divide-border/20">
            {weekDates.map((date, index) => renderDayRow(date, index))}
          </div>
        </div>
      </div>
    </div>
  );
} 