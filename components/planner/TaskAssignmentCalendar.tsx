'use client';

import React, { useState, useMemo } from 'react';
import { Task, PinnedTask } from '@/types/planner';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Edit3, ArrowLeft, Pin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration, formatTime } from '@/utils/formatters';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface TaskAssignmentCalendarProps {
  poolTasks: Task[];
  scheduledTasks: Map<string, Task[]>; // tasksByDate
  pinnedTasks: PinnedTask[];
  onAssignTask: (task: Task, date: Date, startHour?: number) => void;
  onUnassignTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDate: Date) => void;
  onCreatePoolTask: (dateKey: string, task: Partial<Task>) => void;
  onAddTask: (targetDate: Date, startHour: number, taskData: any, dayOffset?: number) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
  onAddPoolTaskForDate: (dateKey: string, task: Partial<Task>) => void;
  onClearPool: () => void;
  getPoolTasksForDate: (dateKey: string) => Task[];
  createQuickTask: (date: Date) => void;
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean }) => void;
  createPoolTask: () => void;
  hideInboxSection?: boolean;
}

export function TaskAssignmentCalendar({
  poolTasks,
  scheduledTasks,
  pinnedTasks,
  onAssignTask,
  onUnassignTask,
  onRescheduleTask,
  onCreatePoolTask,
  onAddTask,
  onUpdateTask,
  onAddPoolTaskForDate,
  onClearPool,
  getPoolTasksForDate,
  createQuickTask,
  openEditModal,
  createPoolTask,
  hideInboxSection = false
}: TaskAssignmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Calculate the start date (first Sunday of the calendar grid)
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  const daysInCalendar = [];
  for (let i = 0; i < 35; i++) { // 5 weeks * 7 days
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    daysInCalendar.push(date);
  }

  const getPinnedTasksForDate = (date: Date) => {
    return pinnedTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Group scheduled tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    
    scheduledTasks.forEach((tasks, dateKey) => {
      grouped[dateKey] = tasks;
    });
    
    return grouped;
  }, [scheduledTasks]);

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
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return tasksByDate[dateKey] || [];
  };

  const getPoolTasksForDateKey = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return getPoolTasksForDate(dateKey);
  };

  const handleDateClick = (date: Date) => {
    if (assigningTask) {
      // Assign the task to this date
      onAssignTask(assigningTask, date, 9); // Default to 9 AM
      setAssigningTask(null);
    }
    // Remove single-click task creation
  };

  const handleDateDoubleClick = (date: Date) => {
    if (assigningTask) {
      return; // Don't create tasks during assignment mode
    }
    
    // Use the createQuickTask function designed for monthly view
    createQuickTask(date);
  };

  const handleTaskAssignClick = (task: Task) => {
    setAssigningTask(task);
  };

  const handleCancelAssignment = () => {
    setAssigningTask(null);
  };

  const handleDragStart = (e: React.DragEvent, task: Task, isFromPool: boolean = false) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', JSON.stringify({ 
      task, 
      isFromPool,
      type: 'task-assignment' 
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date | null = null) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'task-assignment' && data.task) {
        const { task, isFromPool } = data;
        
        if (targetDate) {
          // Dropping on a calendar date
          if (isFromPool) {
            // Assign from pool to date
            onAssignTask(task, targetDate, 9);
          } else {
            // Reschedule existing task
            onRescheduleTask(task, targetDate);
          }
        } else {
          // Dropping on inbox area to unschedule
          if (!isFromPool && task.startHour !== undefined) {
            // Unschedule the task - move it back to pool
            onUnassignTask(task);
          }
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
    
    setDraggedTask(null);
  };

  const handleTaskClick = (task: Task, isScheduled: boolean) => {
    if (assigningTask) return; // Don't open edit modal during assignment
    
    openEditModal(task, { isFromPool: !isScheduled });
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Assignment Mode Header */}
      {assigningTask && (
        <div className="bg-primary/10 border-b border-primary/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Assigning: <span className="font-bold">{assigningTask.name}</span>
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancelAssignment}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Click on a date to assign this task
          </p>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {/* Pool Tasks Section */}
        {!hideInboxSection && (
          <div 
            className="mb-6"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Inbox Tasks ({poolTasks.length})
              </h3>
              <div className="flex items-center gap-3">
                {poolTasks.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Drag a task to the calendar to schedule it.
                  </p>
                )}
                <div className="text-xs text-muted-foreground bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20">
                  Drag scheduled tasks here to unschedule
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createPoolTask()}
                  className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </div>
            
            {poolTasks.length > 0 ? (
              <div 
                className="flex flex-wrap gap-3 mb-4 min-h-[5rem] p-3 rounded-lg border-2 border-dashed border-green-500/30 bg-green-500/5 hover:border-green-500/50 hover:bg-green-500/10 transition-all duration-200"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, null)}
              >
                {poolTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, true)}
                    className={cn(
                      "group relative p-3 rounded-xl text-sm cursor-pointer transition-all duration-200 shadow-sm border-2 hover:shadow-md",
                      "w-40 h-20 flex flex-col justify-between bg-gradient-to-br from-background to-muted/20",
                      assigningTask?.id === task.id 
                        ? "ring-2 ring-primary/50 bg-primary/5 border-primary/30 shadow-md scale-[1.02]" 
                        : "border-border/40 hover:border-border/60 hover:scale-[1.02]",
                      task.color ? task.color : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
                    )}
                    onClick={() => handleTaskAssignClick(task)}
                  >
                    <div className="flex items-start justify-between min-h-0">
                      <span className="font-medium text-sm line-clamp-2 flex-1 mr-2 text-foreground/90">
                        {task.name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-accent/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task, false);
                        }}
                        title="Edit task"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground/70 mt-auto">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs font-medium">{formatDuration(task.duration)}</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary/40 opacity-60"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center py-8 px-4 bg-muted/20 rounded-xl border-2 border-dashed border-border/40 min-h-[8rem] hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-200"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, null)}
              >
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-muted-foreground/60" />
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">No inbox tasks yet</h4>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Create tasks to organize your work and drag them to the calendar when you're ready to schedule them.
                </p>
                <div className="text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-md mb-4 border border-green-500/20">
                  ↑ Drop scheduled tasks here to unschedule them
                </div>
                <Button
                  size="sm"
                  onClick={() => openEditModal(undefined, { isNew: true, isFromPool: true })}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Task
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-lg font-semibold text-foreground min-w-[200px] text-center mx-4">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="show-past-events"
            checked={showPastEvents}
            onCheckedChange={setShowPastEvents}
          />
          <Label htmlFor="show-past-events">Show Past Scheduled Events</Label>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 grid-rows-5 gap-2">
          {daysInCalendar.map(day => {
            const dateKey = day.toISOString().split('T')[0];
            const isPastDay = new Date(day) < new Date() && !isToday(day);

            const tasksForDay = getTasksForDate(day);
            const poolTasksForDay = getPoolTasksForDateKey(day);
            const pinnedTasksForDay = getPinnedTasksForDate(day);

            const monthlyPinnedTasks = tasksForDay.filter(t => t.isMonthlyPinned);
            
            let allTasks = [...pinnedTasksForDay, ...poolTasksForDay, ...monthlyPinnedTasks];
            if (showPastEvents && isPastDay) {
              allTasks = [...allTasks, ...tasksForDay.filter(t => !t.isMonthlyPinned)];
            }

            // Remove duplicates
            allTasks = allTasks.filter((task, index, self) =>
              index === self.findIndex((t) => (
                t.id === task.id
              ))
            )

            const isCurrentMonthDay = isCurrentMonth(day);

            return (
              <div
                key={dateKey}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
                onClick={() => handleDateClick(day)}
                onDoubleClick={() => handleDateDoubleClick(day)}
                className={cn(
                  "relative p-2 h-32 border border-border/20 rounded-lg flex flex-col justify-start items-start group transition-colors",
                  isCurrentMonthDay ? "bg-card hover:bg-muted/50" : "bg-muted/20 text-muted-foreground hover:bg-muted/40",
                  isToday(day) && "border-2 border-primary/50",
                  draggedTask && "hover:bg-green-500/10",
                  assigningTask && "cursor-pointer"
                )}
              >
                <time
                  dateTime={dateKey}
                  className={cn(
                    "text-xs font-semibold",
                    isToday(day) && "text-primary"
                  )}
                >
                  {day.getDate()}
                </time>

                {/* Combined Tasks */}
                <div className="w-full mt-1 space-y-1 overflow-y-auto">
                  {allTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task, !task.startHour)}
                      onClick={(e) => { e.stopPropagation(); handleTaskClick(task, !!task.startHour); }}
                      className={cn(
                        "p-1.5 rounded-md text-xs leading-tight font-medium truncate cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition-all duration-150 hover:shadow-sm",
                        "border border-border/30 hover:border-border/50",
                        task.color ? task.color : "bg-muted",
                        !task.startHour && "opacity-70 border-dashed",
                        task.startHour && "hover:scale-[1.02] hover:-translate-y-0.5"
                      )}
                      title={task.startHour ? "Drag to reschedule or drag to inbox to unschedule" : "Drag to schedule"}
                    >
                      {'dueDate' in task && <Pin className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{task.name}</span>
                      {task.startHour && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-mono">
                            {formatTime(task.startHour)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {allTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground font-medium pt-1 px-1">
                      + {allTasks.length - 3} more tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="card-enhanced p-4 bg-card/60 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-foreground mb-2">This Month</h4>
            <div className="text-xl font-bold text-primary">
              {Object.values(tasksByDate)
                .filter(tasks => {
                  const dateKey = Object.keys(tasksByDate).find(key => tasksByDate[key] === tasks);
                  if (!dateKey) return false;
                  const date = new Date(dateKey);
                  return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
                })
                .reduce((total, tasks) => total + tasks.length, 0)
              }
            </div>
            <div className="text-xs text-muted-foreground">Tasks scheduled</div>
          </div>
          
          <div className="card-enhanced p-4 bg-card/60 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-foreground mb-2">Days Planned</h4>
            <div className="text-xl font-bold text-primary">
              {Object.keys(tasksByDate)
                .filter(dateKey => {
                  const date = new Date(dateKey);
                  return date.getMonth() === currentDate.getMonth() && 
                         date.getFullYear() === currentDate.getFullYear() &&
                         tasksByDate[dateKey].length > 0;
                })
                .length
              }
            </div>
            <div className="text-xs text-muted-foreground">Days with scheduled tasks</div>
          </div>
          
          <div className="card-enhanced p-4 bg-card/60 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-foreground mb-2">Inbox</h4>
            <div className="text-xl font-bold text-primary">
              {poolTasks.length}
            </div>
            <div className="text-xs text-muted-foreground">Tasks in inbox</div>
          </div>
        </div>
      </div>
    </div>
  );
}