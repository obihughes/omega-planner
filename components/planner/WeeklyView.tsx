'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar,
  Clock,
  MoreVertical,
  CalendarOff,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { formatTime, formatDuration } from '@/utils/formatters';
import { getDateKey, dateFromDateKey } from '@/utils/dateUtils';
import { TASK_COLORS, DEFAULT_TASK_COLOR_INDEX } from '@/lib/constants';

interface WeeklyViewProps {
  // Removed editTask prop - weekly view will no longer have edit functionality
}

export default function WeeklyView({}: WeeklyViewProps) {
  const {
    tasksByDate,
    getPoolTasksForDate,
    openEditModal,
    handleTaskCompletionToggle,
  } = useDailyPlanner();

  // State for week navigation
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week

  // Calculate week dates
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Get to Monday of the current week
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
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

  // Get tasks for the week - separate scheduled and inbox
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
  const handleCreateTask = (date: Date) => {
    const dateKey = getDateKey(date);
    const dayOffset = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    openEditModal(undefined, {
      isFromPool: false,
      initialDayOffset: dayOffset,
      initialStartHour: 9,
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

  const TaskItem = ({ task, isScheduled }: { task: Task; isScheduled: boolean }) => (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
        "hover:bg-accent/50 hover:shadow-sm cursor-pointer",
        isScheduled 
          ? "bg-card border border-border/40 shadow-sm" 
          : "bg-muted/30 border border-dashed border-muted-foreground/30",
        task.completed && "opacity-60"
      )}
      onClick={() => openEditModal(task, { isFromPool: false })}
    >
      {/* Completion Status */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleTaskCompletionToggle(task.id);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {task.completed ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.name}
          </span>
          {!isScheduled && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Inbox
            </span>
          )}
        </div>
        
        {/* Time and Duration */}
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {isScheduled && task.startHour !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(task.startHour)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>{formatDuration(task.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Compact Header */}
      <div className="px-6 py-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">Weekly View</h2>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={goToCurrentWeek} className="min-w-48 font-medium text-sm">
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

          {/* Compact Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium">{weekStats.total}</span>
              <span className="text-muted-foreground">tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-green-600">{weekStats.completed}</span>
              <span className="text-muted-foreground">done</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-blue-600">{weekStats.completionRate}%</span>
              <span className="text-muted-foreground">complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Week Layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-2 max-w-7xl mx-auto">
          {weekDates.map((date, index) => {
            const dateKey = getDateKey(date);
            const dayData = weekTasks.get(dateKey) || { scheduled: [], inbox: [] };
            const dayName = dayNames[index];
            const isCurrentDay = isToday(date);
            const isPastDay = isPast(date);
            const allTasks = [...dayData.scheduled, ...dayData.inbox];
            const completedTasks = allTasks.filter(task => task.completed).length;

            return (
                              <div 
                  key={dateKey} 
                  className={cn(
                    "group relative rounded-xl border transition-all duration-200",
                    "hover:shadow-md hover:border-border/60 hover:-translate-y-0.5",
                    isCurrentDay 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : isPastDay
                        ? "bg-muted/20 border-muted/40"
                        : "bg-card border-border/40"
                  )}
                >
                <div className="flex items-start gap-6 p-5">
                  {/* Day Header - Compact */}
                                      <div className="flex-shrink-0 w-24 text-center">
                      <div className={cn(
                        "text-xs font-medium mb-1 uppercase tracking-wide",
                        isCurrentDay ? "text-primary" : "text-muted-foreground"
                      )}>
                        {dayName}
                      </div>
                      <div className={cn(
                        "text-2xl font-bold mb-1",
                        isCurrentDay ? "text-primary" : "text-foreground"
                      )}>
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>

                  {/* Tasks Container - Horizontal Flow */}
                  <div className="flex-1 min-w-0">
                    {allTasks.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <div className="text-sm">No tasks scheduled</div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {/* Scheduled Tasks */}
                        {dayData.scheduled.map((task) => (
                          <TaskItem key={task.id} task={task} isScheduled={true} />
                        ))}
                        
                        {/* Inbox Tasks */}
                        {dayData.inbox.map((task) => (
                          <TaskItem key={task.id} task={task} isScheduled={false} />
                        ))}
                      </div>
                    )}
                  </div>

                                      {/* Day Stats & Actions */}
                    <div className="flex-shrink-0 flex items-center gap-4">
                      {allTasks.length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {completedTasks}/{allTasks.length}
                        </div>
                      )}
                      
                      {/* Add Task Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateTask(date)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 