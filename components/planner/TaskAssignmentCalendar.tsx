'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, PinnedTask } from '@/types/planner';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Edit3, ArrowLeft, Pin, Plus, CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration, formatTime } from '@/utils/formatters';
import { getDateKeyFromOffset, dateFromDateKey, getDateKey } from '@/utils/dateUtils';
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
  onNavigateToDaily?: (date: Date) => void;
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
  hideInboxSection = false,
  onNavigateToDaily
}: TaskAssignmentCalendarProps) {
  console.log('🔧 TaskAssignmentCalendar rendered with props:', {
    poolTasksCount: poolTasks.length,
    scheduledTasksSize: scheduledTasks.size,
    pinnedTasksCount: pinnedTasks.length,
    hasOnAssignTask: typeof onAssignTask === 'function',
    hasOnUnassignTask: typeof onUnassignTask === 'function',
    hasOnRescheduleTask: typeof onRescheduleTask === 'function',
    hideInboxSection
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverInbox, setDragOverInbox] = useState(false);
  const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Calculate the start date (first Sunday of the calendar grid)
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  const daysInCalendar = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 35; i++) { // 5 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }, [startDate]);

  // Scroll to today's date when component mounts or month changes
  useEffect(() => {
    if (calendarScrollRef.current) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find today's index in the calendar days
      const todayIndex = daysInCalendar.findIndex(day => 
        day.toDateString() === today.toDateString()
      );
      
      if (todayIndex !== -1) {
        // Calculate which row today is in (0-4 for 5 weeks)
        const rowOfToday = Math.floor(todayIndex / 7);
        
        // Calculate scroll position (120px per row + 8px gap)
        const scrollTop = rowOfToday * (120 + 8);
        
        // Scroll to today's row
        calendarScrollRef.current.scrollTop = scrollTop;
      }
    }
  }, [currentDate, daysInCalendar]);

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
    const dateKey = getDateKey(date); // Use standard date utility
    return tasksByDate[dateKey] || [];
  };

  const getPoolTasksForDateKey = (date: Date) => {
    const dateKey = getDateKey(date); // Use standard date utility
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
    // Determine if task is actually from pool by checking multiple indicators
    const taskIsFromPool = isFromPool || 
                           !task.baseDate || 
                           task.baseDate === '' || 
                           !!task.poolDate;
    
    console.log('🚀 DRAG START:', {
      taskName: task.name,
      taskId: task.id,
      isFromPool: taskIsFromPool,
      originalIsFromPool: isFromPool,
      hasStartHour: task.startHour !== undefined,
      startHour: task.startHour,
      baseDate: task.baseDate,
      poolDate: task.poolDate,
      taskObject: task
    });
    
    setDraggedTask(task);
    setDragOverDate(null);
    setDragOverInbox(false);
    
    const dragData = { 
      task, 
      isFromPool: taskIsFromPool,  // Use the corrected value
      type: 'task-assignment' 
    };
    
    console.log('📦 DRAG DATA BEING SET:', dragData);
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    console.log('🏁 DRAG END');
    
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
    
    // Debug: Check what data is available during drag over
    const target = e.currentTarget as HTMLElement;
    console.log('🔄 DRAG OVER:', {
      targetElement: target.className,
      dragOverDate,
      dragOverInbox,
      dropEffect: e.dataTransfer.dropEffect
    });
  };

  const handleDragEnterDate = (date: Date) => {
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }
    const dateKey = date.toISOString().split('T')[0];
    
    console.log('📅 DRAG ENTER DATE:', {
      date: date.toLocaleDateString(),
      dateKey,
      draggedTask: draggedTask?.name
    });
    
    setDragOverDate(dateKey);
    setDragOverInbox(false);
  };

  const handleDragLeaveDate = () => {
    console.log('🚪 DRAG LEAVE DATE');
    dragLeaveTimeoutRef.current = setTimeout(() => {
      setDragOverDate(null);
    }, 50);
  };

  const handleDragEnterInbox = () => {
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }
    
    console.log('📥 DRAG ENTER INBOX:', {
      draggedTask: draggedTask?.name
    });
    
    setDragOverInbox(true);
    setDragOverDate(null);
  };

  const handleDragLeaveInbox = () => {
    console.log('🚪 DRAG LEAVE INBOX');
    dragLeaveTimeoutRef.current = setTimeout(() => {
      setDragOverInbox(false);
    }, 50);
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date | null = null) => {
    e.preventDefault();
    
    console.log('🎯 DROP EVENT STARTED:', {
      targetDate: targetDate?.toLocaleDateString() || 'null (inbox)',
      dragOverDate,
      dragOverInbox,
      event: e.type
    });
    
    // Clear drag over states and timeout
    if (dragLeaveTimeoutRef.current) {
      clearTimeout(dragLeaveTimeoutRef.current);
      dragLeaveTimeoutRef.current = null;
    }
    setDragOverDate(null);
    setDragOverInbox(false);
    
    try {
      const dataString = e.dataTransfer.getData('text/plain');
      console.log('📋 RAW DRAG DATA:', dataString);
      
      const data = JSON.parse(dataString);
      console.log('📋 PARSED DRAG DATA:', data);
      
      if (data.type === 'task-assignment' && data.task) {
        const { task, isFromPool } = data;
        
        console.log('✅ VALID DROP DATA:', { 
          taskName: task.name, 
          taskId: task.id,
          isFromPool, 
          hasStartHour: task.startHour !== undefined,
          startHour: task.startHour,
          baseDate: task.baseDate,
          targetDate: targetDate?.toLocaleDateString() || 'inbox',
          operation: targetDate 
            ? (isFromPool ? 'assign' : 'reschedule') 
            : 'unschedule'
        });
        
        if (targetDate) {
          // Dropping on a calendar date
          console.log('📅 DROPPING ON DATE:', targetDate.toLocaleDateString());
          
          if (isFromPool) {
            console.log('🔄 CALLING onAssignTask with:', {
              task: task.name,
              taskId: task.id,
              targetDate: targetDate.toLocaleDateString(),
              startHour: 9
            });
            onAssignTask(task, targetDate, 9);
            console.log('✅ onAssignTask call completed');
          } else {
            console.log('🔄 CALLING onRescheduleTask with:', {
              task: task.name,
              taskId: task.id,
              currentDate: task.baseDate,
              newDate: targetDate.toLocaleDateString()
            });
            onRescheduleTask(task, targetDate);
            console.log('✅ onRescheduleTask call completed');
          }
        } else {
          // Dropping on inbox area to unschedule
          console.log('📥 DROPPING ON INBOX');
          
          if (!isFromPool && task.startHour !== undefined) {
            console.log('🔄 CALLING onUnassignTask with:', {
              task: task.name,
              taskId: task.id,
              startHour: task.startHour
            });
            onUnassignTask(task);
            console.log('✅ onUnassignTask call completed');
          } else {
            console.log('❌ UNSCHEDULE CONDITIONS NOT MET:', {
              isFromPool,
              hasStartHour: task.startHour !== undefined
            });
          }
        }
      } else {
        console.log('❌ INVALID DROP DATA:', {
          hasType: !!data.type,
          type: data.type,
          hasTask: !!data.task,
          data
        });
      }
    } catch (error) {
      console.error('💥 DROP ERROR:', error);
    }
    
    console.log('🔄 CLEARING draggedTask state');
    setDraggedTask(null);
  };

  const handleTaskClick = (task: Task, isScheduled: boolean) => {
    if (assigningTask) return; // Don't open edit modal during assignment
    
    openEditModal(task, { isFromPool: !isScheduled });
  };

  const handleNavigateToDaily = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent other click handlers
    if (onNavigateToDaily) {
      onNavigateToDaily(date);
    }
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

      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/20 shadow-sm">
        <div className="p-4 pb-2">
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
                className={cn(
                  "flex flex-wrap gap-3 mb-4 min-h-[5rem] p-3 rounded-lg border border-border/40 transition-all duration-200",
                  draggedTask && "border-orange-500/50 bg-orange-500/5",
                  dragOverInbox && "border-orange-500 bg-orange-500/10 shadow-lg"
                )}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnterInbox}
                onDragLeave={handleDragLeaveInbox}
                onDrop={(e) => handleDrop(e, null)}
              >
                {poolTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                        // Determine if this task is actually from pool
                        const taskIsFromPool = task.startHour === undefined || 
                                              !task.baseDate || 
                                              task.baseDate === '' || 
                                              !!task.poolDate;
                        handleDragStart(e, task, taskIsFromPool);
                      }}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "group relative p-3 text-sm cursor-pointer transition-all duration-200 shadow-sm border-2 hover:shadow-md",
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
                  className={cn(
                    "flex flex-col items-center justify-center py-8 px-4 bg-muted/20 rounded-xl border border-border/40 min-h-[8rem] transition-all duration-200",
                    draggedTask && "border-orange-500/50 bg-orange-500/5",
                    dragOverInbox && "border-orange-500 bg-orange-500/10 shadow-lg"
                  )}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnterInbox}
                  onDragLeave={handleDragLeaveInbox}
                  onDrop={(e) => handleDrop(e, null)}
                >
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-muted-foreground/60" />
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">No inbox tasks yet</h4>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Create tasks to organize your work and drag them to the calendar when you're ready to schedule them.
                </p>
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

        {/* Drag operation help overlay */}
        {draggedTask && (
          <div className="fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-sm">
            <div className="text-sm font-medium text-foreground mb-1">
              📋 Dragging: {draggedTask.name}
            </div>
            
            {/* Task info */}
            <div className="text-xs text-muted-foreground mb-2 space-y-1">
              <div>• ID: {draggedTask.id}</div>
              <div>• Base Date: {draggedTask.baseDate || 'None'}</div>
              <div>• Pool Date: {draggedTask.poolDate || 'None'}</div>
              <div>• Start Hour: {draggedTask.startHour ?? 'None'}</div>
            </div>
            
            {/* Current drop zone indicator */}
            {dragOverDate && (
              <div className="text-xs text-blue-600 font-medium mb-2 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                🎯 Over: {new Date(dragOverDate + 'T00:00:00').toLocaleDateString()}
              </div>
            )}
            
            {dragOverInbox && (
              <div className="text-xs text-orange-600 font-medium mb-2 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded border border-orange-200 dark:border-orange-800">
                📥 Over: Inbox
              </div>
            )}
            
            <div className="text-xs text-muted-foreground space-y-1">
              {/* Show different instructions based on task type */}
              {(!draggedTask.baseDate || draggedTask.baseDate === '' || draggedTask.poolDate) ? (
                <div>• Drop on any date to <span className="text-green-600 font-medium">schedule</span></div>
              ) : (
                <>
                  <div>• Drop on any date to <span className="text-blue-600 font-medium">reschedule</span></div>
                  <div>• Drop on inbox or use <span className="text-red-600 font-medium">X button</span> to <span className="text-orange-600 font-medium">unschedule</span></div>
                </>
              )}
            </div>
          </div>
        )}

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
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
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-past-events"
                checked={showPastEvents}
                onCheckedChange={setShowPastEvents}
              />
              <Label htmlFor="show-past-events">Show Past Scheduled Events</Label>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 px-4 py-2 bg-muted/50 border-b border-border/20">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-foreground py-2">
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Calendar Content */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          {/* Calendar Grid Container - Limited to 4 rows with scrollbar */}
          <div ref={calendarScrollRef} className="h-[480px] overflow-y-auto border border-border/20 rounded-lg">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 auto-rows-[120px] p-2">
              {daysInCalendar.map(day => {
            const dateKey = day.toISOString().split('T')[0];
            const isPastDay = new Date(day) < new Date() && !isToday(day);

            const tasksForDay = getTasksForDate(day);
            const poolTasksForDay = getPoolTasksForDateKey(day);
            const pinnedTasksForDay = getPinnedTasksForDate(day);

            const monthlyPinnedTasks = tasksForDay.filter(t => t.isMonthlyPinned);
            
            let allTasks = [...pinnedTasksForDay, ...poolTasksForDay, ...monthlyPinnedTasks];
            
            // Add scheduled tasks based on showPastEvents setting
            if (showPastEvents || !isPastDay) {
              // Show all scheduled tasks if showPastEvents is true OR if it's not a past day
              allTasks = [...allTasks, ...tasksForDay.filter(t => !t.isMonthlyPinned)];
            }
            // If showPastEvents is false AND it's a past day, we skip adding scheduled tasks

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
                onDragEnter={() => handleDragEnterDate(day)}
                onDragLeave={handleDragLeaveDate}
                onDrop={(e) => handleDrop(e, day)}
                onClick={() => handleDateClick(day)}
                onDoubleClick={() => handleDateDoubleClick(day)}
                className={cn(
                  "relative p-2 h-32 border border-border/20 rounded-lg flex flex-col justify-start items-start group transition-colors",
                  isCurrentMonthDay ? "bg-card hover:bg-muted/50" : "bg-muted/20 text-muted-foreground hover:bg-muted/40",
                  isToday(day) && "border-2 border-primary/50",
                  draggedTask && "hover:bg-green-500/10 hover:border-green-500/30",
                  dragOverDate === dateKey && "border-2 border-blue-500 bg-blue-500/10 shadow-lg",
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

                {/* Navigate to Daily View Button */}
                {onNavigateToDaily && (
                  <button
                    onClick={(e) => handleNavigateToDaily(day, e)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary hover:scale-110"
                    title={`Open ${day.toLocaleDateString()} in Daily Planner`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Combined Tasks */}
                <div className="w-full mt-1 space-y-1 overflow-y-auto">
                  {allTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        // Determine if this task is actually from pool
                        const taskIsFromPool = task.startHour === undefined || 
                                              !task.baseDate || 
                                              task.baseDate === '' || 
                                              !!task.poolDate;
                        handleDragStart(e, task, taskIsFromPool);
                      }}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "group relative p-1.5 text-xs leading-tight font-medium truncate cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition-all duration-150 hover:shadow-sm",
                        "border border-border/30 hover:border-border/50",
                        task.color ? task.color : "bg-muted",
                        task.startHour === undefined && "opacity-70 border-dashed",
                        task.startHour !== undefined && "hover:scale-[1.02] hover:-translate-y-0.5"
                      )}
                      title={task.startHour !== undefined ? "Drag to reschedule or drag to inbox to unschedule" : "Drag to schedule"}
                    >
                      {'dueDate' in task && <Pin className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate flex-1">{task.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-accent/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleTaskClick(task, task.startHour !== undefined);
                        }}
                        title="Edit task"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </Button>
                      {task.startHour !== undefined && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-red-500/20 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            if (confirm(`Unschedule "${task.name}"? It will be moved back to your inbox.`)) {
                              onUnassignTask(task);
                            }
                          }}
                          title="Unschedule task"
                        >
                          <X className="w-2.5 h-2.5" />
                        </Button>
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
          </div>

          {/* Navigation Hint */}
          {onNavigateToDaily && (
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground">
                💡 <span className="font-medium">Tip:</span> Hover over any date and click the <CalendarDays className="w-3 h-3 inline mx-1" /> icon to open that day in Daily Planner
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}