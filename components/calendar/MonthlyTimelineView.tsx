'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Task, PinnedTask } from '@/types/planner';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Edit3, Pin, Plus, CalendarDays, X, Filter, Search, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDuration, formatTime } from '@/utils/formatters';
import { getDateKey } from '@/utils/dateUtils';
import { MiniDailyTimeline } from '../planner/MiniDailyTimeline';
import { DailyEventsContainer } from '../planner/DailyEventsContainer';
import { useCalendarData } from '../../hooks/useCalendarData';

interface TaskCardProps {
  task: Task;
  isFromTimeline?: boolean;
  onDragStart: (e: React.DragEvent, task: Task, isFromPool: boolean) => void;
  onDragEnd: () => void;
  onTaskClick: (task: Task, isScheduled: boolean) => void;
  onUnassignTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onSchedule?: (task: Task) => void;
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
  onDropFromPool?: (task: Task, targetDate: Date, startHour: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isFromTimeline = false,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onUnassignTask,
  onDeleteTask,
  onSchedule,
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
        <div className="flex items-center gap-1">
          {!isScheduled && onSchedule && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-primary hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onSchedule(task);
              }}
              title="Schedule at 9 AM"
            >
              <CalendarPlus className="w-2.5 h-2.5" />
            </Button>
          )}
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
  onNavigateToDaily,
  onDropFromPool
}: MonthlyTimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [deleteMode, setDeleteMode] = useState<boolean>(false);
  const { data: calendarData } = useCalendarData();
  // Removed unused state variables for search and filters since we're using mini timeline now
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverInbox, setDragOverInbox] = useState(false);
  const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Removed carry-over digest logic since we're using mini timeline now

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

  // Get filtered pool tasks (only show unassigned tasks in inbox)
  const filteredPoolTasks = useMemo(() => {
    return poolTasks.filter(task => {
      // Only show tasks that are not assigned to a specific date (general pool tasks)
      const isUnassigned = !task.baseDate || task.baseDate === '';
      return isUnassigned && !task.completed;
    });
  }, [poolTasks]);

  // Merged tasks for selected date (scheduled + pool) for MiniDailyTimeline
  const mergedTasksForSelectedDate = useMemo(() => {
    const key = getDateKey(selectedDate);
    const scheduled = scheduledTasks.get(key) || [];
    const pool = getPoolTasksForDate(key) || [];
    const merged = [...scheduled, ...pool].filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
    const map = new Map<string, Task[]>();
    map.set(key, merged);
    return map;
  }, [selectedDate, scheduledTasks, getPoolTasksForDate]);

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

  // Removed scrollToDate function since we're using mini timeline now

  const handleMiniCalendarDateClick = (date: Date) => {
    setSelectedDate(date);
    // No need to scroll since we're now showing the timeline on the right
  };

  return (
    <div className="h-full flex bg-background">
      {/* Left Sidebar with Mini Calendar and Inbox */}
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
                onClick={() => openEditModal(undefined, { isNew: true, isFromPool: true })}
                className="h-6 px-2 text-xs hover:bg-primary/10"
              >
                <Plus className="w-2 h-2 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {filteredPoolTasks.length} unscheduled task{filteredPoolTasks.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Drag tasks to the calendar or timeline to schedule.
            </p>
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
                <p className="text-xs mt-1">Click Add to create a task, then drag it to the calendar or timeline.</p>
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
                  onDeleteTask={onDeleteTask}
                  onSchedule={onDropFromPool ? (t) => onDropFromPool(t, selectedDate, 9) : undefined}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Date Header + Bulk Actions + Events + Task Pool + Mini Daily Timeline */}
      <div className="flex-1 bg-background p-3 pt-2 overflow-hidden flex flex-col">
        {/* Date header above events/pool per request */}
        <div className="p-2 border-b border-border/60 bg-card/40 rounded-lg mb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            <div className="text-xs text-muted-foreground">Now: {new Date().toLocaleTimeString('en-US', { hour: 'numeric' })}</div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        <div className="mb-2 flex items-center gap-2">
          <Button size="sm" variant={deleteMode ? 'secondary' : 'outline'} onClick={() => setDeleteMode(!deleteMode)} title="Toggle delete mode">
            <X className="w-4 h-4 mr-1" /> {deleteMode ? 'Exit Delete Mode' : 'Delete Mode'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Clear all scheduled tasks for selected day
              const key = getDateKey(selectedDate);
              const tasks = scheduledTasks.get(key) || [];
              tasks.forEach(t => onDeleteTask(t));
            }}
            title="Clear all tasks for this day"
          >
            Clear Day
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Use saved day templates via DailyPlanner hook API exposed through callbacks if available
              // Here we leverage openEditModal to surface Saved Days UI is not available; instruct users to use Daily view Saved Days if needed.
              // Navigate to Daily view for current selected date
              if (typeof onNavigateToDaily === 'function') {
                onNavigateToDaily(selectedDate);
              }
            }}
            title="Clone saved day to this date"
          >
            Clone Saved Day
          </Button>
        </div>
            
        {/* Events/Periods strip like Daily view */}
        <DailyEventsContainer
          events={calendarData.events}
          periods={calendarData.periods}
          currentDate={selectedDate}
          eventsOnly={false}
          showHeader={false}
        />

        {/* Compact Task Pool row (general + selected-date pool) */}
        <div className="mb-3 bg-card/40 border border-border/60 shadow-sm rounded-lg overflow-hidden">
          <div className="h-10 px-2 py-1 flex items-center gap-2 overflow-x-auto overflow-y-hidden">
                                                        <Button
                              variant="ghost"
                              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={() => openEditModal(undefined, { isNew: true, isFromPool: true, targetDate: selectedDate })}
              title="Add Task to Pool"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
            {(() => {
              const dateKey = getDateKey(selectedDate);
              const datePool = getPoolTasksForDate(dateKey) || [];
              const generalPool = poolTasks.filter(t => !t.baseDate || t.baseDate === '');
              const map = new Map<string, Task>();
              [...datePool, ...generalPool].forEach(t => map.set(t.id, t));
              const pooled = Array.from(map.values());
              return pooled.length === 0 ? (
                <div className="text-xs text-muted-foreground">No pool tasks</div>
              ) : (
                pooled.map(task => (
                  <div
                    key={`pool-mini-${task.id}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ ...task, source: 'pool' }));
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedTask(task);
                    }}
                    onDragEnd={handleDragEnd}
                    className="relative px-2 py-1 bg-muted/30 border border-muted-foreground/30 hover:bg-muted/40 transition-colors rounded flex-shrink-0 h-7 min-w-[9rem] max-w-[12rem] cursor-grab active:cursor-grabbing group/pool"
                    title={task.name}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-schedule-btn]')) return;
                      openEditModal(task, { isFromPool: true });
                    }}
                  >
                    <span className="text-[11px] font-medium truncate block pr-6">{task.name || 'Untitled Task'}</span>
                    {onDropFromPool && (
                      <Button
                        data-schedule-btn
                        size="sm"
                        variant="ghost"
                        className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 p-0 opacity-0 group-hover/pool:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDropFromPool(task, selectedDate, 9);
                        }}
                        title="Schedule at 9 AM"
                      >
                        <CalendarPlus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))
              );
            })()}
                        </div>
                      </div>

        {/* Mini Daily Timeline fills remaining space */}
        <div className="flex-1 min-h-0">
          <MiniDailyTimeline
            selectedDate={selectedDate}
            tasksByDate={mergedTasksForSelectedDate}
            onTaskClick={handleTaskClick}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            openEditModal={openEditModal}
            showHeader={false}
            showUnscheduled={false}
            fitContainer={true}
            deleteMode={deleteMode}
            onDropFromPool={onDropFromPool}
          />
        </div>
      </div>
    </div>
  );
}