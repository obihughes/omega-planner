'use client';

import React, { useState, useMemo } from 'react';
import { Task, PinnedTask } from '@/types/planner';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Edit3, ArrowLeft, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/formatters';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useModalManager } from '@/hooks/useModalManager';

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
  getPoolTasksForDate
}: TaskAssignmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Set up the unified modal manager
  const modalManager = useModalManager({
    onAddTask: onAddTask,
    onUpdateTask: onUpdateTask,
    onUpdatePoolTask: onUpdateTask,
    onAddPoolTask: (task: Task) => {
      // For monthly view, we need to create pool tasks with proper date handling
      const dateKey = task.poolDate || task.baseDate;
      if (dateKey) {
        onCreatePoolTask(dateKey, task);
      }
    },
    onAddPoolTaskForDate: (dateKey: string, task: Partial<Task>) => {
      onCreatePoolTask(dateKey, task);
    },
    onClearPool: onClearPool,
    onCloneTasks: () => {},
    topDayOffset: 0
  });

  const { createQuickTask, editTask, activeEditModalTask, closeEditModal, saveTaskFromModal } = modalManager;

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
    } else {
      // Open Quick-Add modal for creating a new task
      createQuickTask(date);
    }
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

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.type === 'task-assignment' && data.task) {
        const { task, isFromPool } = data;
        
        if (isFromPool) {
          // Assign from pool to date
          onAssignTask(task, targetDate, 9);
        } else {
          // Reschedule existing task
          onRescheduleTask(task, targetDate);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
    
    setDraggedTask(null);
  };

  const handleTaskClick = (task: Task, isScheduled: boolean) => {
    if (assigningTask) return; // Don't open edit modal during assignment
    
    editTask(task);
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
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Unscheduled Tasks ({poolTasks.length})
          </h3>
          
          {poolTasks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {poolTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, true)}
                  className={cn(
                    "p-2 rounded-lg text-xs cursor-pointer transition-all shadow-sm border group",
                    assigningTask?.id === task.id 
                      ? "ring-2 ring-primary bg-primary/10" 
                      : "hover:scale-[1.02]",
                    task.color ? task.color : "bg-card"
                  )}
                  onClick={() => handleTaskAssignClick(task)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs truncate flex-1">
                      {task.name}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task, false);
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-2 h-2 mr-1" />
                    <span>{formatDuration(task.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                        "p-1.5 rounded text-xs leading-tight font-medium truncate cursor-pointer flex items-center gap-1.5",
                        "border-l-2",
                        task.color ? task.color : "bg-muted",
                        !task.startHour && "opacity-70"
                      )}
                    >
                      {'dueDate' in task && <Pin className="w-3 h-3 flex-shrink-0" />}
                      <span>{task.name}</span>
                    </div>
                  ))}
                  {allTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground font-medium pt-1">
                      + {allTasks.length - 3} more
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
            <h4 className="text-sm font-medium text-foreground mb-2">Unscheduled</h4>
            <div className="text-xl font-bold text-primary">
              {poolTasks.length}
            </div>
            <div className="text-xs text-muted-foreground">Tasks in pool</div>
          </div>
        </div>
      </div>
    </div>
  );
}