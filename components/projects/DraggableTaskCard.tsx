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
        "bg-card rounded-lg p-4 cursor-grab active:cursor-grabbing",
        "hover:bg-accent/30 transition-colors duration-200",
        "border-l-4 group select-none",
        task.priority === 'urgent' && "border-l-red-500",
        task.priority === 'high' && "border-l-orange-500", 
        task.priority === 'medium' && "border-l-blue-500",
        task.priority === 'low' && "border-l-gray-400",
        !task.priority && "border-l-gray-200"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status Toggle */}
        <button
          onClick={handleStatusToggle}
          className="flex-shrink-0 hover:scale-105 transition-transform"
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
              <span className={cn(
                "font-medium",
                dueInfo.isOverdue ? "text-red-600" : "text-muted-foreground"
              )}>
                {dueInfo.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 