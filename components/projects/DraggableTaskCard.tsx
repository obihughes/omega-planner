'use client';

import React from 'react';
import { CheckCircle2, Clock, Minus, Circle, CheckSquare2, Square } from 'lucide-react';
import { cn, celebrateAtElement } from '@/lib';
import { formatDueDate as formatDueDateUtil } from '@/utils/dateUtils';
import { ProjectTask } from '@/types/projects';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface DraggableTaskCardProps {
  task: TaskWithProject;
  onStatusChange?: (taskId: string, status: ProjectTask['status']) => void;
}

export function DraggableTaskCard({ task, onStatusChange }: DraggableTaskCardProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      
      // Trigger exciting animation when completing a task
      if (nextStatus === 'completed') {
        setIsAnimating(true);
        setShowConfetti(true);
        try { celebrateAtElement(e.currentTarget as HTMLElement); } catch {}
        
        // Reset animation states
        setTimeout(() => {
          setIsAnimating(false);
          setShowConfetti(false);
        }, 1000);
      }
      
      onStatusChange(task.id, nextStatus);
    }
  };

  // Removed local confetti particle generator; using shared celebration utility

  const getStatusIcon = () => {
    if (task.status === 'completed') {
      return (
        <div className="relative">
          <CheckSquare2 className={cn(
            "w-5 h-5 text-green-600 transition-all duration-300",
            isAnimating && "drop-shadow-lg"
          )} />
          {/* Success ring animation */}
          {isAnimating && (
            <div className="absolute inset-0 rounded border-2 border-green-400 animate-ping" />
          )}
        </div>
      );
    } else {
      return (
        <Square className={cn(
          "w-5 h-5 text-muted-foreground transition-all duration-200",
          "hover:text-green-500 hover:scale-105"
        )} />
      );
    }
  };

  // Use the centralized formatDueDate utility function
  const formatDueDate = formatDueDateUtil;

  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "bg-card rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group border-l-4 relative overflow-hidden",
        "hover:bg-accent/30",
        task.status === 'completed' 
          ? "opacity-60 bg-muted/30" 
          : "hover:bg-accent/20",
        task.priority === 'urgent' && "border-l-red-500",
        task.priority === 'high' && "border-l-orange-500", 
        task.priority === 'medium' && "border-l-blue-500",
        task.priority === 'low' && "border-l-gray-400",
        !task.priority && "border-l-gray-200",
        isAnimating && "animate-pulse"
      )}
    >
      {/* Celebration background effect */}
      {showConfetti && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-blue-100/50 animate-fade-in-out pointer-events-none" />
      )}
      
      <div className="flex items-center gap-3">
        {/* Animated Square Checkbox */}
        <button
          onClick={handleStatusToggle}
          className={cn(
            "flex-shrink-0 transition-all duration-300 relative",
            "hover:scale-110 active:scale-95",
            isAnimating && "animate-bounce"
          )}
          style={{
            transform: isAnimating ? 'scale(1.2)' : undefined,
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          {getStatusIcon()}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title with project indicator inline */}
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.projectColor }}
            />
            <h4 className={cn(
              "font-medium text-sm text-foreground line-clamp-1 flex-1",
              task.status === 'completed' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>
          </div>

          {/* Due date - only show if exists */}
          {dueInfo && (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                {dueInfo.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 