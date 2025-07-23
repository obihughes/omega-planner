'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Circle, CheckCircle2, Minus } from 'lucide-react';
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
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      onStatusChange(task.id, nextStatus);
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'blocked':
        return <Minus className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', isOverdue: true };
    if (diffDays === 0) return { text: 'Today', isOverdue: false };
    if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false };
    
    return { text: due.toLocaleDateString(), isOverdue: false };
  };

  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "bg-card border border-border/60 rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:shadow-md hover:border-primary/30 transition-all duration-200",
        "group select-none"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Status Toggle */}
        <button
          onClick={handleStatusToggle}
          className="flex-shrink-0 hover:scale-110 transition-transform mt-0.5"
        >
          {getStatusIcon()}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className={cn(
            "font-medium text-sm text-foreground mb-1 line-clamp-2",
            task.status === 'completed' && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>

          {/* Project indicator */}
          <div className="flex items-center gap-1.5 mb-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: task.projectColor }}
            />
            <span className="text-xs text-muted-foreground font-medium">
              {task.projectName}
            </span>
          </div>

          {/* Due date */}
          {dueInfo && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className={cn(
                "text-xs font-medium",
                dueInfo.isOverdue ? "text-red-600" : "text-muted-foreground"
              )}>
                {dueInfo.text}
              </span>
            </div>
          )}

          {/* Priority indicator */}
          {(task.priority === 'urgent' || task.priority === 'high') && (
            <div className="flex items-center gap-1 mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                task.priority === 'urgent' ? "bg-red-500" : "bg-orange-500"
              )} />
              <span className={cn(
                "text-xs font-medium uppercase tracking-wide",
                task.priority === 'urgent' ? "text-red-600" : "text-orange-600"
              )}>
                {task.priority}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 