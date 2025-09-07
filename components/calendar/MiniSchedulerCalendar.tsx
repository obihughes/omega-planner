'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProjectTask } from '@/types/projects';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface MiniSchedulerCalendarProps {
  className?: string;
  onDateDrop?: (date: Date, taskId: string) => void;
  tasks?: TaskWithProject[];
  onDateSelect?: (date: Date) => void;
  hideSelectedTasks?: boolean;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  taskCount: number;
}

export function MiniSchedulerCalendar({
  className = '',
  onDateDrop,
  tasks = [],
  onDateSelect,
  hideSelectedTasks = false
}: MiniSchedulerCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()); // Start with today selected
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Calculate the start date (first Sunday of the calendar grid)
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  // Helper function to format date as YYYY-MM-DD for consistent comparison
  const formatDateForComparison = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate calendar days (6 weeks * 7 days = 42 days)
  const calendarDays = useMemo(() => {
    const days: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Count tasks for this date using consistent date format
      const dateKey = formatDateForComparison(date);
      const taskCount = tasks.filter(task => 
        task.dueDate && task.dueDate === dateKey
      ).length;
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: date.toDateString() === new Date().toDateString(),
        taskCount,
      });
    }
    return days;
  }, [startDate, currentDate, tasks]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const selectedDateKey = formatDateForComparison(selectedDate);
    return tasks.filter(task => 
      task.dueDate && task.dueDate === selectedDateKey
    );
  }, [selectedDate, tasks]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) onDateSelect(date);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (date: Date) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(date.toDateString());
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDate(null);
  };

  const handleDrop = (date: Date) => (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverDate(null);
    
    if (taskId && onDateDrop) {
      onDateDrop(date, taskId);
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', isOverdue: false };
    } else {
      return { text: `Due in ${diffDays} days`, isOverdue: false };
    }
  };

  return (
    <div className={cn("bg-card border border-border shadow-sm", className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <h3 className="text-sm font-medium text-foreground">
          {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Mini Calendar Grid */}
      <div className="p-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-1">
          <div className="p-1">S</div>
          <div className="p-1">M</div>
          <div className="p-1">T</div>
          <div className="p-1">W</div>
          <div className="p-1">T</div>
          <div className="p-1">F</div>
          <div className="p-1">S</div>
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                "relative h-8 p-1 text-xs cursor-pointer transition-colors",
                "hover:bg-accent/50 border border-transparent",
                !day.isCurrentMonth && "text-muted-foreground/40",
                day.isToday && "bg-primary/20 border-primary/30 font-medium",
                selectedDate && selectedDate.toDateString() === day.date.toDateString() && "bg-primary/40 border-primary font-medium",
                dragOverDate === day.date.toDateString() && "bg-primary/30 border-primary/50 border-dashed",
                "flex items-center justify-center"
              )}
              onClick={() => handleDateClick(day.date)}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter(day.date)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(day.date)}
              title={`Click to view tasks for ${day.date.toLocaleDateString()}`}
            >
              <span className="relative z-10">
                {day.date.getDate()}
              </span>
              
              {/* Unlimited dots: wrap along bottom center */}
              {day.taskCount > 0 && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex flex-wrap gap-0.5 max-w-full px-1 justify-center">
                  {tasks
                    .filter(t => t.dueDate && t.dueDate === formatDateForComparison(day.date))
                    .map(t => (
                      <span key={t.id} className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: t.projectColor }} />
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected Date Tasks */}
      {!hideSelectedTasks && selectedDate && (
        <div className="border-t border-border">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </h4>
              <span className="text-xs text-muted-foreground">
                ({selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'})
              </span>
            </div>
            
            {selectedDateTasks.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No tasks scheduled for this date
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedDateTasks.map(task => {
                  const dueInfo = formatDueDate(task.dueDate!);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 p-2 bg-muted/30 text-xs"
                    >
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: task.projectColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground line-clamp-1">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-muted-foreground">
                            {task.projectName}
                          </span>
                          {task.priority && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-xs font-medium",
                              task.priority === 'urgent' && "bg-red-100 text-red-700",
                              task.priority === 'high' && "bg-orange-100 text-orange-700",
                              task.priority === 'medium' && "bg-blue-100 text-blue-700",
                              task.priority === 'low' && "bg-gray-100 text-gray-700"
                            )}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        {dueInfo.isOverdue && (
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {dueInfo.text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Drop Zone Indicator */}
      {!hideSelectedTasks && (
        <div className="p-2 border-t border-border/50">
          <div className="text-xs text-muted-foreground text-center">
            Drag tasks here to schedule
          </div>
        </div>
      )}
    </div>
  );
} 