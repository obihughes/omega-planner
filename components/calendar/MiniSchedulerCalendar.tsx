'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  tasks = []
}: MiniSchedulerCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Calculate the start date (first Sunday of the calendar grid)
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  // Generate calendar days (6 weeks * 7 days = 42 days)
  const calendarDays = useMemo(() => {
    const days: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Count tasks for this date
      const taskCount = tasks.filter(task => 
        task.dueDate && new Date(task.dueDate).toDateString() === date.toDateString()
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
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

  return (
    <div className={cn("bg-card border border-border rounded-lg shadow-sm", className)}>
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
                "relative h-8 p-1 text-xs cursor-pointer rounded transition-colors",
                "hover:bg-accent/50 border border-transparent",
                !day.isCurrentMonth && "text-muted-foreground/40",
                day.isToday && "bg-primary/20 border-primary/30 font-medium",
                dragOverDate === day.date.toDateString() && "bg-primary/30 border-primary/50 border-dashed",
                "flex items-center justify-center"
              )}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter(day.date)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(day.date)}
              title={`Drop task on ${day.date.toLocaleDateString()}`}
            >
              <span className="relative z-10">
                {day.date.getDate()}
              </span>
              
              {/* Task count indicator */}
              {day.taskCount > 0 && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Drop Zone Indicator */}
      <div className="p-2 border-t border-border/50">
        <div className="text-xs text-muted-foreground text-center">
          Drag tasks here to schedule
        </div>
      </div>
    </div>
  );
} 