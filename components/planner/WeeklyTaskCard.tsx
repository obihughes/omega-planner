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
  
  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-200 rounded-sm",
        "bg-card border-l-4 shadow-sm hover:shadow-md",
        "hover:z-10 hover:scale-[1.02] hover:-translate-y-0.5",
        "flex items-center px-2 py-1 h-full",
        isCompleted && "opacity-60",
        className
      )}
      style={{ 
        borderLeftColor: task.color ? task.color.match(/bg-(\w+)-/)?.[1] ? `var(--${task.color.match(/bg-(\w+)-/)?.[1]}-500)` : '#3b82f6' : '#3b82f6'
      }}
      onClick={() => onTaskClick(task)}
    >
      {/* Main content - horizontal layout */}
      <div className="flex items-center justify-between w-full min-w-0 gap-2">
        {/* Left section - completion toggle and task name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className="flex-shrink-0"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-3 h-3 text-green-600" />
            ) : (
              <Circle className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
          
          <div className="min-w-0 flex-1">
            <span className={cn(
              "text-xs font-semibold leading-tight text-foreground",
              "truncate block",
              "font-['Inter','system-ui',sans-serif]",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {task.name}
            </span>
          </div>
        </div>

        {/* Right section - time and duration info */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isScheduled && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="font-mono">{formatTime(task.startHour!)}</span>
            </div>
          )}
          
          <span className="text-xs font-medium text-muted-foreground">
            {formatDuration(task.duration)}
          </span>
          
          {!isScheduled && (
            <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground font-medium rounded">
              Inbox
            </span>
          )}
        </div>
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/5 pointer-events-none rounded-sm" />
    </div>
  );
} 