'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Task, PinnedTask } from '@/types/planner';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Edit3, Pin, Plus, CalendarDays, X, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDuration, formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';

interface TaskCardProps {
  task: Task;
  isFromTimeline?: boolean;
  onDragStart: (e: React.DragEvent, task: Task, isFromPool: boolean) => void;
  onDragEnd: () => void;
  onTaskClick: (task: Task, isScheduled: boolean) => void;
  onUnassignTask: (task: Task) => void;
}

interface MonthlyTimelineViewProps {
  poolTasks: Task[];
  scheduledTasks: Map<string, Task[]>;
  pinnedTasks: PinnedTask[];
  onAssignTask: (task: Task, date: Date, startHour?: number) => void;
  onUnassignTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDate: Date) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
  getPoolTasksForDate: (dateKey: string) => Task[];
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean }) => void;
  createPoolTask: () => void;
  onNavigateToDaily?: (date: Date) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isFromTimeline = false,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onUnassignTask,
}) => {
  const isScheduled = task.startHour !== undefined;
  const isPinned = 'dueDate' in task;

  const handleDragStart = (e: React.DragEvent) => {
    const taskIsFromPool = task.startHour === undefined || !task.baseDate || task.baseDate === '' || !!task.poolDate;
    onDragStart(e, task, taskIsFromPool);
  };

  return (
    <div
      key={task.id}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative p-3 border rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md",
        isScheduled ? "bg-card border-border hover:border-border/60" : "bg-muted/30 border-dashed border-border/40",
        task.completed && "opacity-60",
        task.color || "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
      )}
      onClick={() => onTaskClick(task, isScheduled)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {isPinned && <Pin className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />}
          <span className={cn(
            "font-medium text-sm line-clamp-2",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.name}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onTaskClick(task, isScheduled);
          }}
        >
          <Edit3 className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(task.duration)}</span>
          {isScheduled && (
            <>
              <span>•</span>
              <span>{formatTime(task.startHour)}</span>
            </>
          )}
        </div>
        {isScheduled && !isFromTimeline && (
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Unschedule "${task.name}"?`)) {
                onUnassignTask(task);
              }
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export function MonthlyTimelineView({
  poolTasks,
  scheduledTasks,
  pinnedTasks,
  onAssignTask,
  onUnassignTask,
  onRescheduleTask,
  onUpdateTask,
  getPoolTasksForDate,
  openEditModal,
  createPoolTask,
  onNavigateToDaily
}: MonthlyTimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverInbox, setDragOverInbox] = useState(false);
  const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate month dates for mini calendar
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay();
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }, [startDate]);

  // Get all upcoming tasks organized by date
  const upcomingTasksByDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the next 60 days for better future planning
    const dateRange = Array.from({ length: 60 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date;
    });

    const tasksByDate = new Map<string, { date: Date; tasks: any[] }>();

    dateRange.forEach(date => {
      const dateKey = getDateKey(date);
      const scheduledForDate = scheduledTasks.get(dateKey) || [];
      const poolForDate = getPoolTasksForDate(dateKey);
      const pinnedForDate = pinnedTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === date.toDateString();
      });

      const allTasks = [...scheduledForDate, ...poolForDate, ...pinnedForDate];
      
      // Remove duplicates
      const uniqueTasks = allTasks.filter((task, index, self) =>
        index === self.findIndex((t) => t.id === task.id)
      );

      // Filter by search term and completion status
      const filteredTasks = uniqueTasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompleted = showCompleted || !task.completed;
        return matchesSearch && matchesCompleted;
      });

      if (filteredTasks.length > 0) {
        tasksByDate.set(dateKey, { date, tasks: filteredTasks });
      }
    });

    return Array.from(tasksByDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scheduledTasks, getPoolTasksForDate, pinnedTasks, searchTerm, showCompleted]);

  // Get filtered pool tasks
  const filteredPoolTasks = useMemo(() => {
    return poolTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompleted = showCompleted || !task.completed;
      return matchesSearch && matchesCompleted;
    });
  }, [poolTasks, searchTerm, showCompleted]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getTasksForDate = (date: Date) => {
    const dateKey = getDateKey(date);
    const scheduled = scheduledTasks.get(dateKey) || [];
    const pool = getPoolTasksForDate(dateKey);
    const pinned = pinnedTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
    return [...scheduled, ...pool, ...pinned].filter((task, index, self) =>
      index === self.findIndex((t) => t.id === task.id)
    );
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task, isFromPool: boolean = false) => {
    const taskIsFromPool = isFromPool || !task.baseDate || task.baseDate === '' || !!task.poolDate;
    
    setDraggedTask(task);
    const dragData = { task, isFromPool: taskIsFromPool, type: 'task-assignment' };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }
    setDraggedTask(null);
    setDragOverDate(null);
    setDragOverInbox(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnterDate = (date: Date) => {
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }
    const dateKey = date.toISOString().split('T')[0];
    setDragOverDate(dateKey);
    setDragOverInbox(false);
  };

  const handleDragLeaveDate = () => {
    dragLeaveTimeoutRef.current = setTimeout(() => {
      setDragOverDate(null);
    }, 50);
  };

  const handleDragEnterInbox = () => {
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }
    setDragOverInbox(true);
    setDragOverDate(null);
  };

  const handleDragLeaveInbox = () => {
    dragLeaveTimeoutRef.current = setTimeout(() => {
      setDragOverInbox(false);
    }, 50);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date | null = null) => {
    e.preventDefault();
    
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }
    setDragOverDate(null);
    setDragOverInbox(false);
    
    try {
      const dataString = e.dataTransfer.getData('text/plain');
      const data = JSON.parse(dataString);
      
      if (data.type === 'task-assignment' && data.task) {
        const { task, isFromPool } = data;
        
        if (targetDate) {
          // Dropping on a calendar date
          if (isFromPool) {
            onAssignTask(task, targetDate, 9);
          } else {
            onRescheduleTask(task, targetDate);
          }
        } else {
          // Dropping on inbox area to unschedule
          if (!isFromPool && task.startHour !== undefined) {
            onUnassignTask(task);
          }
        }
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
    
    setDraggedTask(null);
  };

  const handleTaskClick = (task: Task, isScheduled: boolean) => {
    openEditModal(task, { isFromPool: !isScheduled });
  };

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar with Mini Calendar */}
      <div className="w-80 border-r border-border bg-card/50 flex flex-col">
        {/* Mini Calendar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Calendar</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <h4 className="text-sm font-medium text-center text-muted-foreground">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
        </div>

        {/* Mini Calendar Grid */}
        <div className="p-4 border-b border-border">
          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="p-1">{day}</div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dateKey = day.toISOString().split('T')[0];
              const tasksForDay = getTasksForDate(day);
              const isSelected = selectedDate.toDateString() === day.toDateString();
              
              return (
                <div
                  key={index}
                  className={cn(
                    "relative h-8 p-1 text-xs cursor-pointer transition-all border border-transparent rounded",
                    "hover:bg-accent/50",
                    !isCurrentMonth(day) && "text-muted-foreground/40",
                    isToday(day) && "bg-primary/20 border-primary/30 font-medium",
                    isSelected && "bg-primary text-primary-foreground font-medium",
                    dragOverDate === dateKey && "bg-primary/30 border-primary/50 border-dashed",
                    "flex items-center justify-center"
                  )}
                  onClick={() => setSelectedDate(day)}
                  onDragOver={handleDragOver}
                  onDragEnter={() => handleDragEnterDate(day)}
                  onDragLeave={handleDragLeaveDate}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <span className="relative z-10">
                    {day.getDate()}
                  </span>
                  
                  {/* Task count indicator */}
                  {tasksForDay.length > 0 && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inbox Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Inbox Tasks</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={createPoolTask}
                className="h-7 px-2 text-xs hover:bg-primary/10"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              {filteredPoolTasks.length} unscheduled tasks
            </div>
          </div>
          
          <div
            className={cn(
              "flex-1 p-4 space-y-3 overflow-y-auto transition-all duration-200",
              draggedTask && "border-orange-500/50 bg-orange-500/5",
              dragOverInbox && "border-orange-500 bg-orange-500/10 shadow-lg"
            )}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnterInbox}
            onDragLeave={handleDragLeaveInbox}
            onDrop={(e) => handleDrop(e, null)}
          >
            {filteredPoolTasks.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No unscheduled tasks</p>
                <p className="text-xs mt-1">Create a task to get started</p>
              </div>
            ) : (
              filteredPoolTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onTaskClick={handleTaskClick}
                  onUnassignTask={onUnassignTask}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Timeline View */}
      <div className="flex-1 flex flex-col">
        {/* Timeline Header */}
        <div className="p-6 border-b border-border bg-card/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Upcoming Tasks & Planning
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  {upcomingTasksByDate.reduce((total, day) => total + day.tasks.length, 0)} total tasks across {upcomingTasksByDate.length} days
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-muted-foreground">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-muted-foreground">Unscheduled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Today</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={createPoolTask}
                className="flex items-center gap-2 hover:bg-primary/10"
              >
                <Plus className="w-4 h-4" />
                Quick Add Task
              </Button>
              {onNavigateToDaily && selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToDaily(selectedDate)}
                  className="flex items-center gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Open Daily View
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showCompleted ? 'Hide' : 'Show'} Completed
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {upcomingTasksByDate.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No upcoming tasks</h3>
              <p className="text-sm mb-4">
                Drag tasks from the inbox or create new ones to get started
              </p>
              <Button onClick={createPoolTask} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingTasksByDate.map(({ date, tasks }, index) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isTomorrow = date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                // Show week header
                const isStartOfWeek = date.getDay() === 1 || index === 0;
                const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
                
                let dayLabel = date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                });
                
                if (isToday) dayLabel = `Today - ${dayLabel}`;
                else if (isTomorrow) dayLabel = `Tomorrow - ${dayLabel}`;

                const scheduledTasks = tasks.filter(t => t.startHour !== undefined);
                const unscheduledTasks = tasks.filter(t => t.startHour === undefined);
                
                // Calculate workload (total scheduled hours)
                const scheduledHours = scheduledTasks.reduce((total, task) => total + (task.duration || 0), 0);
                const workloadIndicator = scheduledHours > 8 ? 'high' : scheduledHours > 4 ? 'medium' : 'light';

                return (
                  <div key={getDateKey(date)}>
                    {/* Week Header */}
                    {isStartOfWeek && index > 0 && (
                      <div className="flex items-center gap-4 mb-4 mt-2">
                        <div className="h-px bg-border/40 flex-1"></div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-1 bg-muted/30 rounded-full">
                          Week {weekNumber}
                        </div>
                        <div className="h-px bg-border/40 flex-1"></div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "border border-border/20 rounded-lg overflow-hidden bg-card/30",
                      isToday && "ring-2 ring-primary/30 border-primary/40",
                      isWeekend && "bg-muted/20"
                    )}>
                      {/* Date Header */}
                      <div 
                        className={cn(
                          "p-4 border-b border-border/20 cursor-pointer hover:bg-muted/30 transition-colors",
                          isToday && "bg-primary/10 border-primary/20"
                        )}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className={cn(
                                "text-lg font-semibold",
                                isToday && "text-primary"
                              )}>
                                {dayLabel}
                              </h3>
                              {isWeekend && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                  Weekend
                                </span>
                              )}
                              {/* Workload indicator */}
                              {scheduledHours > 0 && (
                                <div className={cn(
                                  "text-xs px-2 py-1 rounded-full font-medium",
                                  workloadIndicator === 'high' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                                  workloadIndicator === 'medium' && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
                                  workloadIndicator === 'light' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                )}>
                                  {scheduledHours.toFixed(1)}h
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                              {scheduledTasks.length > 0 && (
                                <span> • {scheduledTasks.length} scheduled</span>
                              )}
                              {unscheduledTasks.length > 0 && (
                                <span> • {unscheduledTasks.length} unscheduled</span>
                              )}
                            </p>
                          </div>
                          {onNavigateToDaily && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToDaily(date);
                              }}
                              className="opacity-60 hover:opacity-100"
                            >
                              <CalendarDays className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Tasks for this date */}
                      <div className="p-4">
                        {/* Scheduled Tasks */}
                        {scheduledTasks.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Scheduled
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {scheduledTasks
                                .sort((a, b) => (a.startHour || 0) - (b.startHour || 0))
                                .map(task => (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    isFromTimeline={true}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onTaskClick={handleTaskClick}
                                    onUnassignTask={onUnassignTask}
                                  />
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Unscheduled Tasks */}
                        {unscheduledTasks.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Unscheduled
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {unscheduledTasks.map(task => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  isFromTimeline={true}
                                  onDragStart={handleDragStart}
                                  onDragEnd={handleDragEnd}
                                  onTaskClick={handleTaskClick}
                                  onUnassignTask={onUnassignTask}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Add for Future Dates */}
                        {!isToday && tasks.length === 0 && (
                          <div className="text-center py-4 border-2 border-dashed border-border/30 rounded-lg hover:border-border/50 transition-colors">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={createPoolTask}
                              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="w-4 h-4" />
                              Add task for this day
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}