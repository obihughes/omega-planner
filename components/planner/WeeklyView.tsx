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

const TIMELINE_WIDTH_PER_HOUR = 80; // Increased from 60 for better space utilization
const TIMELINE_START_HOUR = 6; // Start at 6 AM instead of midnight
const TIMELINE_END_HOUR = 24; // End at midnight (18 hours total: 6am-12am)
const TOTAL_TIMELINE_WIDTH = TIMELINE_WIDTH_PER_HOUR * (TIMELINE_END_HOUR - TIMELINE_START_HOUR);
const DAY_ROW_HEIGHT = 100; // Adjusted for a tighter layout

// Helper function to resolve task collisions and assign lanes
const resolveCollisions = (tasks: Task[]) => {
  if (!tasks || tasks.length === 0) return [];
  
  const sortedTasks = [...tasks].sort((a, b) => a.startHour - b.startHour);
  const lanes: Task[][] = [];

  sortedTasks.forEach(task => {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      const lastTaskInLane = lanes[i][lanes[i].length - 1];
      if (task.startHour >= lastTaskInLane.startHour + lastTaskInLane.duration) {
        lanes[i].push(task);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([task]);
    }
  });

  return lanes.flatMap((lane, index) => lane.map(task => ({ ...task, lane: index })));
};

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
    const startHour = task.startHour || 6;
    const duration = task.duration || 1;
    
    // Adjust for the new start time (6am = position 0)
    const adjustedStartHour = Math.max(0, startHour - TIMELINE_START_HOUR);
    const left = adjustedStartHour * TIMELINE_WIDTH_PER_HOUR;
    const width = Math.max(duration * TIMELINE_WIDTH_PER_HOUR - 8, 80); // Minimum 80px width, with 8px margin
    
    return {
      left: `${left + 4}px`, // 4px margin from grid line
      width: `${width}px`,
    };
  };

  // Render time grid at the top
  const renderTimeGrid = () => {
    const hours = Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }, (_, i) => TIMELINE_START_HOUR + i);
    
    return (
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/30">
        <div className="flex">
          {/* Day labels column */}
          <div className="w-32 flex-shrink-0 border-r border-border/30 p-3 bg-card/95">
            <div className="text-sm font-medium text-muted-foreground">Time</div>
          </div>
          
          {/* Time labels */}
          <div className="flex" style={{ width: `${TOTAL_TIMELINE_WIDTH}px` }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex items-center justify-center text-xs text-muted-foreground font-mono border-l border-border/20"
                style={{ width: `${TIMELINE_WIDTH_PER_HOUR}px`, height: '48px' }}
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
    const positionedTasks = resolveCollisions(dayData.scheduled);
    
    const laneCount = Math.max(1, ...positionedTasks.map(t => t.lane || 0)) + 1;
    const dynamicRowHeight = Math.max(DAY_ROW_HEIGHT, laneCount * 40 + 20); // Base height + lanes + padding

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

        {/* Timeline row - RELATIVE POSITIONING IS KEY */}
        <div 
          className="relative overflow-hidden"
          style={{ width: `${TOTAL_TIMELINE_WIDTH}px`, height: `${dynamicRowHeight}px` }}
        >
          {/* Hour grid lines */}
          {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => (
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
            
            // Only show indicator if current time is within our timeline (6am-12am)
            if (currentHour >= TIMELINE_START_HOUR && currentHour <= TIMELINE_END_HOUR) {
              const adjustedCurrentHour = currentHour - TIMELINE_START_HOUR;
              const currentTimeLeft = adjustedCurrentHour * TIMELINE_WIDTH_PER_HOUR;
              
              return (
                <div
                  className="absolute top-0 bottom-0 z-30 border-l-2 border-red-500"
                  style={{ left: `${currentTimeLeft}px` }}
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full -mt-1 -ml-1" />
                </div>
              );
            }
            return null;
          })()}

          {/* Scheduled tasks - positioned with collision detection */}
          {positionedTasks.map((task, taskIndex) => {
            const taskStyle = getTaskStyle(task);
            const laneHeight = 32; // Tighter task height
            const laneGap = 3;
            const taskTop = 10 + (task.lane || 0) * (laneHeight + laneGap);
            
            return (
              <div
                key={task.id}
                className="absolute z-20"
                style={{
                  left: taskStyle.left,
                  width: taskStyle.width,
                  top: `${taskTop}px`,
                  height: `${laneHeight}px`
                }}
              >
                <WeeklyTaskCard
                  task={task}
                  height={laneHeight}
                  onTaskClick={(task) => openEditModal(task, { isFromPool: false })}
                  onToggleComplete={handleTaskCompletionToggle}
                />
              </div>
            );
          })}

          {/* Inbox tasks at bottom of this day row */}
          {dayData.inbox.length > 0 && (
            <div className="absolute bottom-1 left-2 right-2 flex gap-1 z-10 overflow-hidden">
              {dayData.inbox.slice(0, 8).map((task, idx) => (
                <div key={task.id} className="flex-shrink-0" style={{ width: '80px', height: '24px' }}>
                  <WeeklyTaskCard
                    task={task}
                    height={24}
                    onTaskClick={(task) => openEditModal(task, { isFromPool: true })}
                    onToggleComplete={handleTaskCompletionToggle}
                    className="opacity-80 border-dashed text-xs shadow-none"
                  />
                </div>
              ))}
              {dayData.inbox.length > 8 && (
                <div className="flex items-center text-xs text-muted-foreground px-1 bg-muted/50 rounded text-center min-w-[30px]">
                  +{dayData.inbox.length - 8}
                </div>
              )}
            </div>
          )}

          {/* Add task click area - only covers this day's timeline */}
          <div
            className="absolute inset-0 z-5"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const hourOffset = Math.floor(x / TIMELINE_WIDTH_PER_HOUR);
              const actualHour = TIMELINE_START_HOUR + hourOffset;
              handleCreateTask(date, actualHour);
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
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
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