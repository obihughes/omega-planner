'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  // Handle task reschedule via drag and drop (to be implemented)
  const handleTaskDrop = (task: Task, newDate: Date) => {
    if (task.baseDate) {
      // This is a scheduled task, reschedule it
      handleRescheduleTask(task, newDate);
    } else {
      // This is a pool task, assign it
      handleAssignTask(task, newDate, task.startHour || 9);
    }
  };

  // Calculate task statistics for the week
  const getWeekStats = () => {
    let totalTasks = 0;
    let totalDuration = 0;
    let completedTasks = 0;

    weekTasks.forEach(dayTasks => {
      dayTasks.forEach(task => {
        totalTasks++;
        totalDuration += task.duration;
        if (task.completed) completedTasks++;
      });
    });

    return {
      total: totalTasks,
      completed: completedTasks,
      remaining: totalTasks - completedTasks,
      totalHours: totalDuration,
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header with Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground">Weekly View</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={goToCurrentWeek} className="min-w-32">
                {getWeekRangeString()}
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {getRelativeWeekLabel() && (
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-sm">
                  {getRelativeWeekLabel()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Week Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{weekStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">{weekStats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-600">{weekStats.remaining}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatDuration(weekStats.totalHours)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-600">{weekStats.completionRate}%</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateKey = getDateKey(date);
          const dayTasks = weekTasks.get(dateKey) || [];
          const dayName = dayNames[index];
          const isCurrentDay = isToday(date);
          const isPastDay = isPast(date);

          return (
            <div key={dateKey} className="space-y-2">
              {/* Day Header */}
              <div className={`p-3 rounded-lg border ${
                isCurrentDay 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : isPastDay
                    ? 'bg-muted/50 text-muted-foreground border-muted'
                    : 'bg-card text-foreground border-border'
              }`}>
                <div className="text-center">
                  <div className="text-sm font-medium">{dayName}</div>
                  <div className="text-lg font-bold">
                    {date.getDate()}
                  </div>
                  <div className="text-xs opacity-75">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              </div>

              {/* Day Tasks */}
              <div className="space-y-2 min-h-64">
                {dayTasks.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center">
                    <Calendar className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">No tasks</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCreateTask(date)}
                      className="text-xs"
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
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          task.completed ? 'opacity-60' : ''
                        }`}
                        onClick={() => openEditModal(task)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: task.color }}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(task);
                                }}
                                className="p-1 h-auto"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className={`text-sm font-medium truncate ${
                              task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {task.name}
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(task.duration)}
                              </div>
                              {task.startHour && (
                                <div>
                                  {formatTime(task.startHour)}
                                </div>
                              )}
                            </div>
                            
                            {task.notes && (
                              <p className="text-xs text-muted-foreground truncate">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Add Task Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateTask(date)}
                      className="w-full text-xs"
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
  );
} 