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
  onDeleteTask: (task: Task) => void;
}

interface MonthlyTimelineViewProps {
  poolTasks: Task[];
  scheduledTasks: Map<string, Task[]>;
  pinnedTasks: PinnedTask[];
  onAssignTask: (task: Task, date: Date, startHour?: number) => void;
  onUnassignTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDate: Date) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
  onDeleteTask: (task: Task) => void;
  getPoolTasksForDate: (dateKey: string) => Task[];
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean; targetDate?: Date }) => void;
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
  onDeleteTask,
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
        "group relative p-2 border rounded-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-sm",
        isScheduled ? "bg-card border-border hover:border-border/60" : "bg-muted/20 border-dashed border-border/40",
        task.completed && "opacity-60",
        task.color || "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
      )}
      onClick={() => onTaskClick(task, isScheduled)}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {isPinned && <Pin className="w-3 h-3 flex-shrink-0 mt-0.5 text-muted-foreground" />}
          <span className={cn(
            "font-medium text-sm line-clamp-2 leading-tight",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, isScheduled);
            }}
          >
            <Edit3 className="w-2.5 h-2.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete "${task.name}"?`)) {
                onDeleteTask(task);
              }
            }}
          >
            <X className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-2.5 h-2.5" />
          <span>{formatDuration(task.duration)}</span>
          {isScheduled && task.startHour !== undefined && (
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
                console.log('🎯 INBOX DEBUG: Unassign task clicked for task:', task);
                console.log('🎯 INBOX DEBUG: Task details - id:', task.id, 'name:', task.name, 'baseDate:', task.baseDate, 'startHour:', task.startHour, 'poolDate:', (task as any).poolDate);
                onUnassignTask(task);
                console.log('🎯 INBOX DEBUG: onUnassignTask called');
              }
            }}
          >
            <X className="w-2.5 h-2.5" />
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
  onDeleteTask,
  getPoolTasksForDate,
  openEditModal,
  createPoolTask,
  onNavigateToDaily
}: MonthlyTimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showEmptyDays, setShowEmptyDays] = useState(false);
  const [showPastDates, setShowPastDates] = useState(true); // Enable past dates by default
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverInbox, setDragOverInbox] = useState(false);
  const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dayElementsRef = useRef<Map<string, HTMLElement>>(new Map());

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

  // Get all tasks organized by date (past and future)
  const tasksByDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate date range: past 30 days + next 60 days (or just next 60 if past is disabled)
    const startOffset = showPastDates ? -30 : 0;
    const totalDays = showPastDates ? 90 : 60; // 30 past + 60 future = 90 total
    
    const dateRange = Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + startOffset + i);
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

      // Include the day if it has tasks OR if showEmptyDays is enabled
      if (filteredTasks.length > 0 || showEmptyDays) {
        tasksByDate.set(dateKey, { date, tasks: filteredTasks });
      }
    });

    return Array.from(tasksByDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [scheduledTasks, getPoolTasksForDate, pinnedTasks, searchTerm, showCompleted, showEmptyDays, showPastDates]);

  // Get filtered pool tasks (only show unassigned tasks in inbox)
  const filteredPoolTasks = useMemo(() => {
    return poolTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompleted = showCompleted || !task.completed;
      // Only show tasks that are not assigned to a specific date (general pool tasks)
      const isUnassigned = !task.baseDate || task.baseDate === '';
      return matchesSearch && matchesCompleted && isUnassigned;
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
    
    // Enhanced debug logging
    if (scheduled.length > 0 || pool.length > 0 || pinned.length > 0) {
      console.log(`📅 MONTHLY VIEW DEBUG: Tasks for ${dateKey}:`, {
        dateKey,
        scheduled: scheduled.map(t => ({ id: t.id, name: t.name, startHour: t.startHour, baseDate: t.baseDate })),
        pool: pool.map(t => ({ id: t.id, name: t.name, startHour: t.startHour, baseDate: t.baseDate, poolDate: (t as any).poolDate })),
        pinned: pinned.map(t => ({ id: t.id, name: t.name, startHour: t.startHour })),
        scheduledCount: scheduled.length,
        poolCount: pool.length,
        pinnedCount: pinned.length
      });
    }
    
    const allTasks = [...scheduled, ...pool, ...pinned].filter((task, index, self) =>
      index === self.findIndex((t) => t.id === task.id)
    );
    
    console.log(`📅 MONTHLY VIEW DEBUG: Final tasks for ${dateKey}:`, {
      totalTasks: allTasks.length,
      taskBreakdown: allTasks.map(t => ({ 
        id: t.id, 
        name: t.name, 
        startHour: t.startHour, 
        isScheduled: t.startHour !== undefined,
        baseDate: t.baseDate,
        poolDate: (t as any).poolDate
      }))
    });
    
    return allTasks;
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

  const scrollToDate = (date: Date) => {
    const dateKey = getDateKey(date);
    const element = dayElementsRef.current.get(dateKey);
    
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      
      // Add a brief highlight effect
      element.style.transition = 'box-shadow 0.3s ease';
      element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
      setTimeout(() => {
        element.style.boxShadow = '';
      }, 1000);
    } else {
      const hasTasksForDate = tasksByDateRange.some(day => getDateKey(day.date) === dateKey);
      
      if (!hasTasksForDate && !showEmptyDays) {
        setShowEmptyDays(true);
        setTimeout(() => scrollToDate(date), 100);
      }
    }
  };

  const handleMiniCalendarDateClick = (date: Date) => {
    setSelectedDate(date);
    scrollToDate(date);
  };

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar with Mini Calendar */}
      <div className="w-80 border-r border-border bg-card/30 flex flex-col">
        {/* Mini Calendar Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold">Calendar</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-6 w-6 p-0 hover:bg-accent"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <h4 className="text-sm font-medium text-center text-muted-foreground">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
        </div>

        {/* Mini Calendar Grid */}
        <div className="p-3 border-b border-border">
          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, index) => {
              const dateKey = day.toISOString().split('T')[0];
              const tasksForDay = getTasksForDate(day);
              const isSelected = selectedDate.toDateString() === day.toDateString();
              const scheduledCount = tasksForDay.filter(t => t.startHour !== undefined).length;
              const unscheduledCount = tasksForDay.filter(t => t.startHour === undefined).length;
              
              // Debug logging for mini calendar
              if (unscheduledCount > 0) {
                console.log(`📅 MINI CALENDAR DEBUG: Day ${getDateKey(day)} has ${unscheduledCount} unscheduled tasks`);
              }
              
              return (
                <div
                  key={index}
                  className={cn(
                    "relative h-8 text-xs cursor-pointer transition-all border border-transparent rounded-sm",
                    "hover:bg-accent/50 flex items-center justify-center",
                    !isCurrentMonth(day) && "text-muted-foreground/50",
                    isToday(day) && "bg-primary/15 border-primary/30 font-semibold text-primary",
                    isSelected && "bg-primary text-primary-foreground font-semibold",
                    dragOverDate === dateKey && "bg-primary/30 border-primary/50 border-dashed",
                    tasksForDay.length > 0 && !isSelected && !isToday(day) && "bg-accent/20"
                  )}
                  onClick={() => handleMiniCalendarDateClick(day)}
                  onDragOver={handleDragOver}
                  onDragEnter={() => handleDragEnterDate(day)}
                  onDragLeave={handleDragLeaveDate}
                  onDrop={(e) => handleDrop(e, day)}
                  title={tasksForDay.length > 0 ? `${tasksForDay.length} task${tasksForDay.length !== 1 ? 's' : ''} (${scheduledCount} scheduled, ${unscheduledCount} unscheduled)` : ''}
                >
                  <span className="relative z-10">
                    {day.getDate()}
                  </span>
                  
                  {/* Enhanced task indicators */}
                  {tasksForDay.length > 0 && (
                    <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                      {scheduledCount > 0 && (
                        <div className="w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                      {unscheduledCount > 0 && (
                        <div className="w-1 h-1 bg-orange-500 rounded-full" />
                      )}
                      {tasksForDay.length > 2 && (
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inbox Section */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Inbox Tasks</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log('🎯 INBOX DEBUG: Add button clicked in inbox section');
                  console.log('🎯 INBOX DEBUG: Calling openEditModal with isNew: true, isFromPool: true');
                  openEditModal(undefined, { isNew: true, isFromPool: true });
                }}
                className="h-6 px-2 text-xs hover:bg-primary/10"
              >
                <Plus className="w-2 h-2 mr-1" />
                Add
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredPoolTasks.length} unscheduled task{filteredPoolTasks.length !== 1 ? 's' : ''}
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
                  onUnassignTask={(task) => {
                    console.log('🎯 INBOX DEBUG: onUnassignTask prop called for inbox task:', task);
                    onUnassignTask(task);
                  }}
                  onDeleteTask={onDeleteTask}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Timeline View */}
      <div className="flex-1 flex flex-col">
        {/* Timeline Header */}
        <div className="p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Tasks & Planning Timeline
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-muted-foreground">
                  {tasksByDateRange.reduce((total, day) => total + day.tasks.length, 0)} total tasks across {tasksByDateRange.length} days
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-muted-foreground">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-muted-foreground">Unscheduled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Today</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🎯 INBOX DEBUG: Add Task button clicked in header');
                  console.log('🎯 INBOX DEBUG: Calling openEditModal with isNew: true, isFromPool: true');
                  openEditModal(undefined, { isNew: true, isFromPool: true });
                }}
                className="flex items-center gap-2 hover:bg-primary/10 h-8"
              >
                <Plus className="w-3 h-3" />
                Add Task
              </Button>
              {onNavigateToDaily && selectedDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToDaily(selectedDate)}
                  className="flex items-center gap-2 h-8"
                >
                  <CalendarDays className="w-3 h-3" />
                  Open Daily View
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <Button
              variant={showCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 h-8 px-3"
            >
              <Filter className="w-3 h-3" />
              <span className="text-xs">{showCompleted ? 'Hide' : 'Show'} Completed</span>
            </Button>
            <Button
              variant={showEmptyDays ? "default" : "outline"}
              size="sm"
              onClick={() => setShowEmptyDays(!showEmptyDays)}
              className="flex items-center gap-1.5 h-8 px-3"
            >
              <CalendarIcon className="w-3 h-3" />
              <span className="text-xs">{showEmptyDays ? 'Hide' : 'Show'} Empty Days</span>
            </Button>
            <Button
              variant={showPastDates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPastDates(!showPastDates)}
              className="flex items-center gap-1.5 h-8 px-3"
            >
              <ChevronLeft className="w-3 h-3" />
              <span className="text-xs">{showPastDates ? 'Hide' : 'Show'} Past Dates</span>
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {tasksByDateRange.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-medium mb-2">
                {showEmptyDays ? 'No days to show' : showPastDates ? 'No tasks found' : 'No upcoming tasks'}
              </h3>
              <p className="text-sm mb-4">
                {showEmptyDays 
                  ? 'Try adjusting your search filters or create some tasks'
                  : 'Drag tasks from the inbox or create new ones to get started'
                }
              </p>
              <Button onClick={createPoolTask} size="sm" className="flex items-center gap-2">
                <Plus className="w-3 h-3" />
                Create Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasksByDateRange.map(({ date, tasks }, index) => {
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

                const scheduledTasks = tasks.filter(t => t.startHour !== undefined && t.startHour > 0);
                const unscheduledTasks = tasks.filter(t => t.startHour === undefined || t.startHour === 0);
                
                // Enhanced debug logging for task categorization
                if (tasks.length > 0) {
                  console.log(`📊 MONTHLY VIEW FILTER DEBUG: Task categorization for ${getDateKey(date)}:`, {
                    date: getDateKey(date),
                    total: tasks.length,
                    scheduled: scheduledTasks.length,
                    unscheduled: unscheduledTasks.length,
                    scheduledDetails: scheduledTasks.map(t => ({ 
                      id: t.id, 
                      name: t.name, 
                      startHour: t.startHour, 
                      baseDate: t.baseDate,
                      poolDate: (t as any).poolDate
                    })),
                    unscheduledDetails: unscheduledTasks.map(t => ({ 
                      id: t.id, 
                      name: t.name, 
                      startHour: t.startHour, 
                      baseDate: t.baseDate,
                      poolDate: (t as any).poolDate
                    }))
                  });
                  
                  if (unscheduledTasks.length > 0) {
                    console.log(`🎯 UNSCHEDULED TASKS FOUND for ${getDateKey(date)}:`, unscheduledTasks.length, 'tasks');
                  }
                }
                
                // Calculate workload (total scheduled hours)
                const scheduledHours = scheduledTasks.reduce((total, task) => total + (task.duration || 0), 0);
                const workloadIndicator = scheduledHours > 8 ? 'high' : scheduledHours > 4 ? 'medium' : 'light';

                return (
                  <div 
                    key={getDateKey(date)}
                    ref={(el) => {
                      if (el) {
                        dayElementsRef.current.set(getDateKey(date), el);
                      }
                    }}
                  >
                    {/* Week Header */}
                    {isStartOfWeek && index > 0 && (
                      <div className="flex items-center gap-3 mb-3 mt-1">
                        <div className="h-px bg-border/30 flex-1"></div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1 bg-muted/20 rounded-full">
                          Week {weekNumber}
                        </div>
                        <div className="h-px bg-border/30 flex-1"></div>
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
                          "p-3 border-b border-border/20 cursor-pointer hover:bg-muted/30 transition-colors",
                          isToday && "bg-primary/10 border-primary/20"
                        )}
                        onClick={() => handleMiniCalendarDateClick(date)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={cn(
                                "text-base font-semibold",
                                isToday && "text-primary"
                              )}>
                                {dayLabel}
                              </h3>
                              {/* Workload indicator dot */}
                              {scheduledHours > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    workloadIndicator === 'high' && "bg-red-500",
                                    workloadIndicator === 'medium' && "bg-yellow-500", 
                                    workloadIndicator === 'light' && "bg-green-500"
                                  )} 
                                  title={`${scheduledHours.toFixed(1)} hours scheduled`}
                                  />
                                  <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full font-medium",
                                    workloadIndicator === 'high' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                                    workloadIndicator === 'medium' && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
                                    workloadIndicator === 'light' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  )}>
                                    {scheduledHours.toFixed(1)}h
                                  </span>
                                </div>
                              )}
                              {isWeekend && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                  Weekend
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                              {scheduledTasks.length > 0 && (
                                <span> • <span className="text-blue-600 dark:text-blue-400">{scheduledTasks.length} scheduled</span></span>
                              )}
                              {unscheduledTasks.length > 0 && (
                                <span> • <span className="text-orange-600 dark:text-orange-400 font-medium">{unscheduledTasks.length} unscheduled</span></span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Add Task Button */}
                                                        <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(`📝 MONTHLY ADD TASK DEBUG: Adding task for date ${getDateKey(date)}`);
                                openEditModal(undefined, { 
                                  isNew: true, 
                                  isFromPool: true,
                                  targetDate: date // Pass the target date
                                });
                              }}
                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:bg-primary/10"
                              title={`Add task for ${date.toLocaleDateString()}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            {onNavigateToDaily && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToDaily(date);
                                }}
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                                title={`Open ${date.toLocaleDateString()} in Daily View`}
                              >
                                <CalendarDays className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tasks for this date */}
                      <div className="p-3">
                        {/* Scheduled Tasks */}
                        {scheduledTasks.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Scheduled
                            </h4>
                            <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
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
                                    onDeleteTask={onDeleteTask}
                                  />
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Unscheduled Tasks */}
                        {unscheduledTasks.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              🚨 TEST: Unscheduled Tasks ({unscheduledTasks.length})
                            </h4>
                            <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
                              {unscheduledTasks.map(task => {
                                console.log(`🎯 RENDERING UNSCHEDULED TASK for ${getDateKey(date)}:`, { 
                                  id: task.id, 
                                  name: task.name, 
                                  startHour: task.startHour,
                                  poolDate: (task as any).poolDate
                                });
                                return (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    isFromTimeline={false}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onTaskClick={handleTaskClick}
                                    onUnassignTask={onUnassignTask}
                                    onDeleteTask={onDeleteTask}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Empty Day Indicator */}
                        {tasks.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-border/30 rounded-lg hover:border-border/50 transition-colors bg-muted/5">
                            <div className="text-muted-foreground mb-2">
                              <CalendarIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                              <p className="text-sm font-medium">Free Day</p>
                              <p className="text-xs">Perfect for scheduling new tasks</p>
                            </div>
                                                        <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(`📝 MONTHLY ADD TASK (EMPTY DAY) DEBUG: Adding task for date ${getDateKey(date)}`);
                                openEditModal(undefined, { 
                                  isNew: true, 
                                  isFromPool: true,
                                  targetDate: date // Pass the target date
                                });
                              }}
                              className="h-7 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                            >
                              <Plus className="w-3 h-3" />
                              Add task for {isToday ? 'today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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