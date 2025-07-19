'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Clock
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';
import WeeklyTaskCard from './WeeklyTaskCard';

interface WeeklyViewProps {}

const TIMELINE_WIDTH_PER_HOUR = 100; // Increased for better spacing and readability
const TIMELINE_START_HOUR = 6;
const TIMELINE_END_HOUR = 22; // Changed to 10 PM for better focus on active hours
const TOTAL_TIMELINE_WIDTH = TIMELINE_WIDTH_PER_HOUR * (TIMELINE_END_HOUR - TIMELINE_START_HOUR);
const DAY_ROW_HEIGHT = 120; // Increased for better task visibility and spacing

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

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  // Calculate task position and size for horizontal layout
  const getTaskStyle = (task: Task) => {
    const startHour = task.startHour || 6;
    const duration = task.duration || 1;
    
    // Adjust for the new start time (6am = position 0)
    const adjustedStartHour = Math.max(0, startHour - TIMELINE_START_HOUR);
    const left = adjustedStartHour * TIMELINE_WIDTH_PER_HOUR;
    const width = Math.max(duration * TIMELINE_WIDTH_PER_HOUR - 16, 120); // Increased minimum width and margin
    
    return {
      left: `${left + 8}px`, // 8px margin from grid line
      width: `${width}px`,
    };
  };

  // Render time grid at the top
  const renderTimeGrid = () => {
    const hours = Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }, (_, i) => TIMELINE_START_HOUR + i);
    
    return (
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-lg">
        <div className="flex">
          {/* Day labels column */}
          <div className="w-44 flex-shrink-0 border-r border-border/30 p-4 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Time</span>
            </div>
          </div>
          
          {/* Time labels */}
          <div className="flex" style={{ width: `${TOTAL_TIMELINE_WIDTH}px` }}>
            {hours.map((hour, index) => (
              <div
                key={hour}
                className={cn(
                  "flex items-center justify-center text-sm font-medium text-muted-foreground border-l transition-colors",
                  index % 2 === 0 ? "border-border/30 bg-muted/10" : "border-border/15 bg-muted/5"
                )}
                style={{ width: `${TIMELINE_WIDTH_PER_HOUR}px`, height: '64px' }}
              >
                <span className="bg-background/90 px-3 py-1.5 rounded-full shadow-sm border border-border/20 font-medium">
                  {formatTime(hour)}
                </span>
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
    const isWeekendDay = isWeekend(date);
    const allTasks = [...dayData.scheduled, ...dayData.inbox];
    const positionedTasks = resolveCollisions(dayData.scheduled);
    
    const laneCount = Math.max(1, ...positionedTasks.map(t => t.lane || 0)) + 1;
    const dynamicRowHeight = Math.max(DAY_ROW_HEIGHT, laneCount * 60 + 40); // Increased spacing for better arrangement

    return (
      <div key={dateKey} className={cn(
        "flex border-b border-border/20 last:border-b-0 transition-all duration-200 hover:bg-muted/15",
        isCurrentDay && "bg-primary/8 shadow-sm"
      )}>
        {/* Day header */}
        <div className={cn(
          "w-44 flex-shrink-0 border-r border-border/30 p-5 flex flex-col justify-center relative transition-colors",
          isCurrentDay && "bg-primary/12 border-primary/40",
          isWeekendDay && !isCurrentDay && "bg-orange-500/8 border-orange-500/20",
          isPastDay && "opacity-80"
        )}>
          {isCurrentDay && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-full shadow-sm" />
          )}
          
          <div className={cn(
            "text-sm font-bold uppercase tracking-wider mb-2",
            isCurrentDay ? "text-primary" : isWeekendDay ? "text-orange-600" : "text-muted-foreground"
          )}>
            {dayNames[index]}
          </div>
          <div className={cn(
            "text-4xl font-black mb-2 leading-none",
            isCurrentDay ? "text-primary" : "text-foreground"
          )}>
            {date.getDate()}
          </div>
          <div className="text-sm text-muted-foreground mb-3 font-medium">
            {date.toLocaleDateString('en-US', { month: 'long' })}
          </div>
          
          {allTasks.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className={cn(
                "text-xs font-bold px-3 py-1.5 rounded-full border",
                isCurrentDay 
                  ? "bg-primary/20 text-primary border-primary/30" 
                  : "bg-muted/80 text-muted-foreground border-muted"
              )}>
                {allTasks.filter(t => t.completed).length}/{allTasks.length}
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.min(allTasks.length, 6) }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full shadow-sm",
                      allTasks[i]?.completed ? "bg-green-500" : "bg-muted-foreground/40"
                    )}
                  />
                ))}
                {allTasks.length > 6 && (
                  <span className="text-xs text-muted-foreground ml-2 font-medium">
                    +{allTasks.length - 6}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground/70 italic font-medium">
              No tasks – click to add
            </div>
          )}
        </div>

        {/* Timeline row */}
        <div 
          className="relative overflow-hidden bg-gradient-to-r from-background via-muted/8 to-background"
          style={{ width: `${TOTAL_TIMELINE_WIDTH}px`, height: `${dynamicRowHeight}px` }}
        >
          {/* Hour grid lines */}
          {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "absolute top-0 bottom-0 border-l transition-opacity",
                i % 2 === 0 ? "border-border/25" : "border-border/12"
              )}
              style={{ left: `${i * TIMELINE_WIDTH_PER_HOUR}px` }}
            />
          ))}

          {/* Current time indicator */}
          {isCurrentDay && (() => {
            const now = new Date();
            const currentHour = now.getHours() + now.getMinutes() / 60;
            
            if (currentHour >= TIMELINE_START_HOUR && currentHour <= TIMELINE_END_HOUR) {
              const adjustedCurrentHour = currentHour - TIMELINE_START_HOUR;
              const currentTimeLeft = adjustedCurrentHour * TIMELINE_WIDTH_PER_HOUR;
              
              return (
                <>
                  <div
                    className="absolute top-0 bottom-0 z-30 border-l-2 border-red-500 shadow-lg"
                    style={{ left: `${currentTimeLeft}px` }}
                  />
                  <div
                    className="absolute z-30 w-4 h-4 bg-red-500 rounded-full shadow-lg transform -translate-x-2 border-2 border-white"
                    style={{ left: `${currentTimeLeft}px`, top: '12px' }}
                  />
                  <div
                    className="absolute z-30 bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg transform -translate-x-1/2 font-bold"
                    style={{ left: `${currentTimeLeft}px`, top: '32px' }}
                  >
                    {formatTime(currentHour)}
                  </div>
                </>
              );
            }
            return null;
          })()}

          {/* Scheduled tasks */}
          {positionedTasks.map((task, taskIndex) => {
            const taskStyle = getTaskStyle(task);
            const laneHeight = 44; // Better task card height
            const laneGap = 8;
            const taskTop = 20 + (task.lane || 0) * (laneHeight + laneGap);
            
            return (
              <div
                key={task.id}
                className="absolute z-20 transition-all duration-200 hover:z-30 hover:scale-[1.02] hover:-translate-y-1"
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

          {/* Inbox tasks */}
          {dayData.inbox.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10 overflow-hidden">
              <div className="flex items-center gap-2 mr-3">
                <div className="w-2.5 h-2.5 bg-orange-500/60 rounded-full shadow-sm" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Inbox
                </span>
              </div>
              {dayData.inbox.slice(0, 6).map((task, idx) => (
                <div key={task.id} className="flex-shrink-0" style={{ width: '140px', height: '32px' }}>
                  <WeeklyTaskCard
                    task={task}
                    height={32}
                    onTaskClick={(task) => openEditModal(task, { isFromPool: true })}
                    onToggleComplete={handleTaskCompletionToggle}
                    className="opacity-75 border-dashed border-orange-500/30 text-xs shadow-sm hover:opacity-100 hover:border-orange-500/50 transition-all"
                  />
                </div>
              ))}
              {dayData.inbox.length > 6 && (
                <div className="flex items-center text-xs text-muted-foreground px-3 py-1.5 bg-muted/70 rounded-lg border border-dashed border-muted min-w-[50px] justify-center font-medium">
                  +{dayData.inbox.length - 6}
                </div>
              )}
            </div>
          )}

          {/* Add task click area */}
          <div
            className="absolute inset-0 z-5 cursor-pointer hover:bg-muted/5 transition-colors"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const hourOffset = Math.floor(x / TIMELINE_WIDTH_PER_HOUR);
              const actualHour = TIMELINE_START_HOUR + hourOffset;
              handleCreateTask(date, actualHour);
            }}
            title="Click to add a task"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background/98 to-muted/10">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border/60 bg-card/90 backdrop-blur-xl sticky top-0 z-30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <Calendar className="w-7 h-7 text-primary drop-shadow-sm" />
              <h2 className="text-3xl font-black text-foreground tracking-tight">Weekly View</h2>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToPreviousWeek} 
                className="hover:bg-muted/70 hover:scale-105 transition-all duration-200 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={goToCurrentWeek} 
                className="min-w-80 font-bold text-xl hover:bg-muted/70 transition-all duration-200 shadow-sm px-6 py-3"
              >
                {getWeekRangeString()}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToNextWeek} 
                className="hover:bg-muted/70 hover:scale-105 transition-all duration-200 shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              {getRelativeWeekLabel() && (
                <span className="text-sm font-bold text-primary px-4 py-2 bg-primary/15 rounded-xl border border-primary/30 shadow-sm">
                  {getRelativeWeekLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Stats with Progress Bars */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium">Total Tasks</span>
                <span className="font-black text-xl text-foreground">{weekStats.total}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium">Completed</span>
                <span className="font-black text-xl text-foreground">{weekStats.completed}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-full shadow-sm" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground font-medium">Progress</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl text-primary">{weekStats.completionRate}%</span>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${weekStats.completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-muted/60 scrollbar-track-transparent hover:scrollbar-thumb-muted transition-colors">
          {/* Time grid header */}
          {renderTimeGrid()}
          
          {/* Day rows */}
          <div className="divide-y divide-border/25">
            {weekDates.map((date, index) => renderDayRow(date, index))}
          </div>
        </div>
      </div>
    </div>
  );
} 