'use client';

import React from 'react';
import { Clock, Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/types';
import { formatTime, formatDuration } from '@/utils/formatters';

interface WeeklyTaskCardProps {
  task: Task;
  height: number;
  onTaskClick: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  className?: string;
}

export default function WeeklyTaskCard({ 
  task, 
  height, 
  onTaskClick, 
  onToggleComplete,
  className 
}: WeeklyTaskCardProps) {
  const isCompleted = task.completed;
  const isScheduled = task.startHour !== undefined;
  
  const getColorFromClass = (colorClass: string) => {
    const match = colorClass?.match(/bg-(\w+)-/);
    return match ? match[1] : 'blue';
  };
  
  const taskColor = getColorFromClass(task.color);
  
  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-200 rounded-md overflow-hidden",
        "bg-card border shadow-sm hover:shadow-md",
        "flex items-center p-2 h-full",
        isCompleted && "opacity-60",
        className
      )}
      style={{ 
        borderLeftWidth: '4px',
        borderLeftColor: `rgb(var(--${taskColor}-500) / 1)` || '#3b82f6'
      }}
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className="flex-shrink-0"
          >
            {isCompleted ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground/60" />}
          </button>
          <span className="text-sm font-medium truncate">{task.name}</span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {isScheduled && (
            <span className="text-xs font-mono text-muted-foreground">{formatTime(task.startHour!)}</span>
          )}
          <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">{formatDuration(task.duration)}</span>
        </div>
      </div>
    </div>
  );
} 