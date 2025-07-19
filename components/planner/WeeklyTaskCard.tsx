'use client';

import React from 'react';
import { Clock, Circle, CheckCircle2, Calendar, Timer } from 'lucide-react';
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
  
  // Enhanced color mapping with better visual consistency
  const colorMap: Record<string, { border: string; bg: string; hover: string }> = {
    blue: { border: '#3b82f6', bg: 'rgb(59 130 246 / 0.1)', hover: 'rgb(59 130 246 / 0.2)' },
    green: { border: '#10b981', bg: 'rgb(16 185 129 / 0.1)', hover: 'rgb(16 185 129 / 0.2)' },
    purple: { border: '#8b5cf6', bg: 'rgb(139 92 246 / 0.1)', hover: 'rgb(139 92 246 / 0.2)' },
    red: { border: '#ef4444', bg: 'rgb(239 68 68 / 0.1)', hover: 'rgb(239 68 68 / 0.2)' },
    yellow: { border: '#f59e0b', bg: 'rgb(245 158 11 / 0.1)', hover: 'rgb(245 158 11 / 0.2)' },
    pink: { border: '#ec4899', bg: 'rgb(236 72 153 / 0.1)', hover: 'rgb(236 72 153 / 0.2)' },
    indigo: { border: '#6366f1', bg: 'rgb(99 102 241 / 0.1)', hover: 'rgb(99 102 241 / 0.2)' },
    orange: { border: '#f97316', bg: 'rgb(249 115 22 / 0.1)', hover: 'rgb(249 115 22 / 0.2)' },
    teal: { border: '#14b8a6', bg: 'rgb(20 184 166 / 0.1)', hover: 'rgb(20 184 166 / 0.2)' },
    gray: { border: '#6b7280', bg: 'rgb(107 114 128 / 0.1)', hover: 'rgb(107 114 128 / 0.2)' }
  };
  
  const colors = colorMap[taskColor] || colorMap.blue;
  
  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-300 rounded-xl overflow-hidden relative",
        "bg-card/98 backdrop-blur-sm border-2 shadow-md hover:shadow-xl",
        "flex items-center p-3 h-full",
        isCompleted && "opacity-75",
        !isCompleted && "hover:scale-[1.03] hover:-translate-y-1 hover:rotate-[0.5deg]",
        className
      )}
      style={{ 
        borderLeftWidth: '5px',
        borderLeftColor: colors.border,
        background: isCompleted 
          ? 'linear-gradient(135deg, rgb(var(--muted) / 0.9) 0%, rgb(var(--muted) / 0.6) 100%)'
          : `linear-gradient(135deg, rgb(var(--card) / 0.98) 0%, ${colors.bg} 100%)`
      }}
      onClick={() => onTaskClick(task)}
    >
      {/* Completed overlay with subtle animation */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-green-500/8 to-transparent animate-pulse" />
      )}
      
      {/* Subtle glow effect for active tasks */}
      {!isCompleted && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-500 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${colors.hover} 0%, transparent 70%)`
          }}
        />
      )}
      
      <div className="flex items-center justify-between w-full gap-3 relative z-10">
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className={cn(
              "flex-shrink-0 transition-all duration-300 hover:scale-125 active:scale-110",
              isCompleted 
                ? "text-green-500 hover:text-green-400" 
                : "text-muted-foreground/60 hover:text-green-500 hover:drop-shadow-sm"
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 drop-shadow-sm" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          
          <span className={cn(
            "text-sm font-semibold truncate transition-all duration-300",
            isCompleted 
              ? "line-through text-muted-foreground/80" 
              : "text-foreground group-hover:text-foreground"
          )}>
            {task.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {isScheduled ? (
            <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 rounded-lg shadow-sm">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 tracking-wide">
                {formatTime(task.startHour!)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 rounded-lg shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-bold text-orange-700 tracking-wide">
                Inbox
              </span>
            </div>
          )}
          
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm border transition-all duration-300",
            isCompleted 
              ? "bg-muted/60 text-muted-foreground border-muted/60" 
              : "bg-primary/15 text-primary border-primary/30 group-hover:bg-primary/20"
          )}>
            <Timer className="w-3 h-3" />
            {formatDuration(task.duration)}
          </div>
        </div>
      </div>
      
      {/* Animated border highlight */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 1px ${colors.border}40`
        }}
      />
    </div>
  );
} 