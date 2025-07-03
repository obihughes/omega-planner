'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar,
  Clock,
  MoreVertical
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { formatTime, formatDuration } from '@/utils/formatters';
import { getDateKey, dateFromDateKey } from '@/utils/dateUtils';
import { TASK_COLORS, DEFAULT_TASK_COLOR_INDEX } from '@/lib/constants';

interface WeeklyViewProps {
  // Props can be added here if needed
}

export default function WeeklyView({}: WeeklyViewProps) {
  const {
    tasksByDate,
    getPoolTasksForDate,
    openEditModal,
    handleAssignTask,
    handleUnassignTask,
    handleRescheduleTask
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

  // Get tasks for the week
  const weekTasks = useMemo(() => {
    const weekTasksMap = new Map<string, Task[]>();
    
    weekDates.forEach(date => {
      const dateKey = getDateKey(date);
      const dayTasks = tasksByDate.get(dateKey) || [];
      const poolTasks = getPoolTasksForDate(dateKey);
      
      // Combine scheduled tasks and pool tasks for the day
      weekTasksMap.set(dateKey, [...dayTasks, ...poolTasks]);
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

  // Create new task for specific day
  const handleCreateTask = (date: Date) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: 'New Task',
      startHour: 9,
      duration: 1,
      baseDate: getDateKey(date),
      color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX],
      notes: '',
      completed: false
    };

    openEditModal(newTask, { isNew: true });
  };

  // Calculate simple task statistics for the week
  const getWeekStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    weekTasks.forEach(dayTasks => {
      dayTasks.forEach(task => {
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
    <div className="h-full flex flex-col">
      {/* Simplified Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">Weekly View</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={goToCurrentWeek} className="min-w-40 font-medium">
                {getWeekRangeString()}
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {getRelativeWeekLabel() && (
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-sm ml-2">
                  {getRelativeWeekLabel()}
                </span>
              )}
            </div>
          </div>

          {/* Simplified Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-foreground">{weekStats.total}</div>
              <div className="text-muted-foreground">Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{weekStats.completed}</div>
              <div className="text-muted-foreground">Done</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">{weekStats.completionRate}%</div>
              <div className="text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-7 gap-4 h-full">
          {weekDates.map((date, index) => {
            const dateKey = getDateKey(date);
            const dayTasks = weekTasks.get(dateKey) || [];
            const dayName = dayNames[index];
            const isCurrentDay = isToday(date);
            const isPastDay = isPast(date);

            return (
              <div key={dateKey} className="flex flex-col h-full">
                {/* Simplified Day Header */}
                <div className={`p-3 rounded-lg border mb-3 ${
                  isCurrentDay 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : isPastDay
                      ? 'bg-muted/30 text-muted-foreground border-muted'
                      : 'bg-card text-foreground border-border'
                }`}>
                  <div className="text-center">
                    <div className="text-xs font-medium opacity-75">{dayName}</div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </div>
                </div>

                {/* Day Tasks */}
                <div className="flex-1 space-y-2 min-h-0">
                  {dayTasks.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-muted rounded-lg flex flex-col items-center justify-center text-center p-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mb-2" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCreateTask(date)}
                        className="text-xs h-auto p-1"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Task
                      </Button>
                    </div>
                  ) : (
                    <>
                      {dayTasks.map((task) => (
                        <Card 
                          key={task.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-sm border-l-4 ${
                            task.completed ? 'opacity-60' : ''
                          }`}
                          style={{ borderLeftColor: task.color }}
                          onClick={() => openEditModal(task)}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              {/* Task Name */}
                              <div className={`text-sm font-medium leading-tight ${
                                task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}>
                                {task.name}
                              </div>
                              
                              {/* Task Meta */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(task.duration)}
                                </div>
                                {task.startHour && (
                                  <div className="text-xs">
                                    {formatTime(task.startHour)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Add Task Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCreateTask(date)}
                        className="w-full h-8 text-xs border border-dashed border-muted hover:border-border"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Task
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 