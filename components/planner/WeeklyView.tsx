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
  CalendarOff
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

  // Get tasks for the week - separate scheduled and unscheduled
  const weekTasks = useMemo(() => {
    const weekTasksMap = new Map<string, { scheduled: Task[], unscheduled: Task[] }>();
    
    weekDates.forEach(date => {
      const dateKey = getDateKey(date);
      const dayTasks = tasksByDate.get(dateKey) || [];
      const poolTasks = getPoolTasksForDate(dateKey);
      
      // Separate scheduled tasks (have specific times) from unscheduled (pool tasks)
      const scheduledTasks = dayTasks.filter(task => !task.poolDate && task.startHour !== undefined);
      const unscheduledTasks = poolTasks;
      
      // Sort scheduled tasks by start time
      scheduledTasks.sort((a, b) => (a.startHour || 0) - (b.startHour || 0));
      
      weekTasksMap.set(dateKey, {
        scheduled: scheduledTasks,
        unscheduled: unscheduledTasks
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
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // Get relative week label
  const getRelativeWeekLabel = () => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    if (weekOffset === 1) return 'Next Week';
    return null;
  };

  // Create new task for specific day (use context-aware function)
  const handleCreateTask = (date: Date) => {
    // Create a temp task and open edit modal directly
    const newTask = {
      id: `task-${Date.now()}`,
      name: 'New Task',
      startHour: 0,
      duration: 1,
      baseDate: getDateKey(date),
      color: '',
      notes: '',
      completed: false,
      poolDate: getDateKey(date),
      isNew: true,
      isFromPool: true
    };
    
    openEditModal(newTask, { isNew: true, isFromPool: true });
  };

  // Calculate simple task statistics for the week
  const getWeekStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    weekTasks.forEach(dayData => {
      [...dayData.scheduled, ...dayData.unscheduled].forEach(task => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    });

    return {
      total: totalTasks,
      completed: completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const weekStats = getWeekStats();

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in the past
  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold text-foreground">Weekly View</h2>
            
            {/* Week Navigation */}
            <div className="flex items-center gap-3">
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
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md ml-2">
                  {getRelativeWeekLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg text-foreground">{weekStats.total}</div>
              <div className="text-xs text-muted-foreground">Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-green-600">{weekStats.completed}</div>
              <div className="text-xs text-muted-foreground">Done</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-blue-600">{weekStats.completionRate}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-7 gap-4 h-full">
          {weekDates.map((date, index) => {
            const dateKey = getDateKey(date);
            const dayData = weekTasks.get(dateKey) || { scheduled: [], unscheduled: [] };
            const dayName = dayNames[index];
            const isCurrentDay = isToday(date);
            const isPastDay = isPast(date);

            return (
              <div 
                key={dateKey} 
                className="flex flex-col h-full relative group"
              >
                {/* Day Header */}
                <div className={`p-4 rounded-lg border mb-4 text-center ${
                  isCurrentDay 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : isPastDay
                      ? 'bg-muted/30 text-muted-foreground border-muted'
                      : 'bg-card text-foreground border-border'
                }`}>
                  <div className="text-xs font-medium opacity-80 mb-1">{dayName}</div>
                  <div className="text-2xl font-bold">{date.getDate()}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>

                {/* Day Tasks Container */}
                <div className="flex-1 flex flex-col min-h-0">
                  {dayData.scheduled.length === 0 && dayData.unscheduled.length === 0 ? (
                    <div className="flex-1"></div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                      {/* Show unscheduled tasks first */}
                      {dayData.unscheduled.map((task) => (
                        <div
                          key={task.id}
                          className={`
                            relative px-2 pt-2 pb-1 rounded-md transition-all duration-200 hover:shadow-sm group
                            min-h-[80px] flex flex-row justify-between items-start
                            bg-muted/30 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50
                            ${task.completed ? 'opacity-60' : ''}
                          `}
                        >
                          {/* Left side: Name and "No time" */}
                          <div className="flex flex-col mr-2">
                            {/* Task Name */}
                            <div className={`text-base font-semibold leading-tight line-clamp-2 ${
                              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {task.name}
                            </div>
                            
                            {/* "No time" text */}
                            <div className="flex items-center gap-1.5 text-sm text-foreground/70 mt-1">
                                <CalendarOff className="w-4 h-4" />
                                <span>Unscheduled</span>
                            </div>
                          </div>

                          {/* Right side: Duration */}
                          <div className="text-sm font-semibold text-foreground/70 flex-shrink-0">
                            {formatDuration(task.duration)}
                          </div>
                        </div>
                      ))}

                      {/* Show scheduled tasks after unscheduled ones */}
                      {dayData.scheduled.map((task) => (
                        <div
                          key={task.id}
                          className={`
                            relative px-2 pt-2 pb-1 rounded-md transition-all duration-200 hover:shadow-sm group
                            min-h-[80px] flex flex-row justify-between items-start
                            ${task.color} border border-border/40 hover:ring-1 hover:ring-border/60
                            ${task.completed ? 'opacity-60' : ''}
                          `}
                        >
                          {/* Left side: Name and Start Time */}
                          <div className="flex flex-col mr-2">
                            {/* Task Name */}
                            <div className={`text-base font-semibold leading-tight line-clamp-2 ${
                              task.completed ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {task.name}
                            </div>
                            
                            {/* Start Time */}
                            {task.startHour && !task.poolDate && (
                                <div className="flex items-center gap-1.5 text-sm opacity-80 mt-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(task.startHour)}</span>
                                </div>
                            )}
                          </div>

                          {/* Right side: Duration */}
                          <div className="text-sm font-semibold opacity-80 flex-shrink-0">
                            {formatDuration(task.duration)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Hidden popup add button - appears on hover */}
                <button
                  onClick={() => handleCreateTask(date)}
                  className="absolute top-2 right-2 w-8 h-8 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  title="Add Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 