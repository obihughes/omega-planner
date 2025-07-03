'use client';

import React, { useState, useMemo } from 'react';
import { Task } from '@/types/planner';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Edit3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/formatters';
import { QuickAddTaskModal } from '@/components/modals/QuickAddTaskModal';

interface TaskAssignmentCalendarProps {
  poolTasks: Task[];
  scheduledTasks: Map<string, Task[]>; // tasksByDate
  onAssignTask: (task: Task, date: Date, startHour?: number) => void;
  onUnassignTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDate: Date) => void;
  onCreatePoolTask: (dateKey: string, task: Partial<Task>) => void;
  openEditModal: (task: Task, options?: any) => void;
  getPoolTasksForDate: (dateKey: string) => Task[];
}

export function TaskAssignmentCalendar({
  poolTasks,
  scheduledTasks,
  onAssignTask,
  onUnassignTask,
  onRescheduleTask,
  onCreatePoolTask,
  openEditModal,
  getPoolTasksForDate
}: TaskAssignmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<Date | null>(null);

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Calculate the start date (first Sunday of the calendar grid)
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  const daysInCalendar = [];
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    daysInCalendar.push(date);
  }

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
      setSelectedDateForAdd(date);
      setQuickAddModalOpen(true);
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
    
    openEditModal(task, { 
      isFromPool: !isScheduled,
      showUnassignOption: isScheduled 
    });
  };

  const handleQuickAddSave = (task: Partial<Task>) => {
    if (!selectedDateForAdd) return;
    
    const dateKey = selectedDateForAdd.toISOString().split('T')[0];
    onCreatePoolTask(dateKey, task);
    
    setQuickAddModalOpen(false);
    setSelectedDateForAdd(null);
  };

  const handleQuickAddClose = () => {
    setQuickAddModalOpen(false);
    setSelectedDateForAdd(null);
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
                      : "hover:scale-[1.02]"
                  )}
                  style={{ 
                    backgroundColor: task.color + '15', 
                    borderColor: task.color + '40',
                    borderLeftWidth: '3px',
                    borderLeftColor: task.color
                  }}
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

        {/* Calendar Grid */}
        <div className="card-enhanced rounded-xl overflow-hidden shadow-lg border border-border/50">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border/50 text-center font-semibold text-muted-foreground bg-card/80">
            <div className="p-3 text-sm">Sun</div>
            <div className="p-3 text-sm">Mon</div>
            <div className="p-3 text-sm">Tue</div>
            <div className="p-3 text-sm">Wed</div>
            <div className="p-3 text-sm">Thu</div>
            <div className="p-3 text-sm">Fri</div>
            <div className="p-3 text-sm">Sat</div>
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {daysInCalendar.map((date, index) => {
              const dayTasks = getTasksForDate(date);
              const dayPoolTasks = getPoolTasksForDateKey(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              const isTodayDate = isToday(date);
              const isAssignmentTarget = assigningTask !== null;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "min-h-[130px] p-3 border-r border-b border-border/50 last:border-r-0 transition-colors",
                    !isCurrentMonthDay && "bg-muted/20 text-muted-foreground/50",
                    isTodayDate && "bg-primary/10 border-primary/20",
                    isAssignmentTarget && isCurrentMonthDay && "hover:bg-primary/5 cursor-pointer",
                    isAssignmentTarget && !isCurrentMonthDay && "opacity-50",
                    !isAssignmentTarget && "hover:bg-accent/30"
                  )}
                  onClick={() => isCurrentMonthDay && handleDateClick(date)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, date)}
                >
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    !isCurrentMonthDay && "text-muted-foreground",
                    isTodayDate && "text-primary font-bold"
                  )}>
                    {date.getDate()}
                  </div>
                  
                  {/* Show date-specific pool tasks */}
                  <div className="space-y-1">
                    {dayPoolTasks.map((task, taskIndex) => (
                      <div
                        key={`pool-${task.id}-${taskIndex}`}
                        className={cn(
                          "text-xs p-1 rounded cursor-pointer transition-all hover:scale-[1.02]",
                          "border border-border/30"
                        )}
                        style={{ 
                          backgroundColor: task.color + '20', 
                          borderLeftColor: task.color,
                          borderLeftWidth: '2px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task, false);
                        }}
                      >
                        <div className="font-medium truncate text-foreground">
                          {task.name}
                        </div>
                        <div className="text-muted-foreground flex items-center">
                          <Clock className="w-2 h-2 mr-1" />
                          {formatDuration(task.duration)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Empty space hint */}
                  {dayPoolTasks.length === 0 && !isAssignmentTarget && isCurrentMonthDay && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity">
                        Click to add task
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

      {/* Quick Add Task Modal */}
      <QuickAddTaskModal
        isOpen={quickAddModalOpen}
        onClose={handleQuickAddClose}
        onSave={handleQuickAddSave}
        selectedDate={selectedDateForAdd}
      />
    </div>
  );
} 