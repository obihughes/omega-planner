'use client';

import React, { memo } from 'react';
import { ProjectTask } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  MoreVertical,
  Flag,
  GripVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  id: string;
  task: ProjectTask;
  taskIndex: number;
  totalTasks: number;
  onStatusChange: (taskId: string, status: ProjectTask['status']) => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
}

function TaskItemComponent({ id, task, taskIndex, totalTasks, onStatusChange, onEdit, onDelete }: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusIcon = (status: ProjectTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityIcon = (priority: ProjectTask['priority']) => {
    const colors = {
      low: 'text-gray-400',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    
    return <Flag className={cn("w-4 h-4", colors[priority])} />;
  };

  const getPriorityColor = (priority: ProjectTask['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: ProjectTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300';
      case 'blocked':
        return 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-lg p-3 hover:shadow-sm transition-all duration-200 group flex items-start gap-3",
        task.status === 'completed' && "opacity-75",
        isOverdue && "border-red-200 dark:border-red-800"
      )}
    >
      {/* Drag Handle */}
      <button {...attributes} {...listeners} className="p-1 mt-0.5 text-muted-foreground hover:text-foreground cursor-grab touch-none">
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Original Content */}
      <div className="flex-1 flex items-start space-x-3">
         {/* Task Number */}
         <div className="mt-0.5 text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
          {taskIndex}/{totalTasks}
        </div>
        
        {/* Status Icon */}
        <button
          onClick={() => {
            const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
            onStatusChange(task.id, nextStatus);
          }}
          className="mt-0.5 hover:scale-110 transition-transform"
        >
          {getStatusIcon(task.status)}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={cn(
                "font-medium text-foreground",
                task.status === 'completed' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta Information */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                {/* Completion Date for Completed Tasks */}
                {task.status === 'completed' && task.completedAt && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      Completed {new Date(task.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Due Date for Non-Completed Tasks */}
                {task.status !== 'completed' && task.dueDate && (
                  <div className={cn(
                    "flex items-center space-x-1",
                    isOverdue && "text-red-500"
                  )}>
                    <Calendar className="w-3 h-3" />
                    <span>
                      {isOverdue ? 'Overdue' : `Due ${new Date(task.dueDate).toLocaleDateString()}`}
                    </span>
                  </div>
                )}

                {/* Time Tracking */}
                {task.estimatedHours && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimatedHours}h est.</span>
                    {task.actualHours && (
                      <span className="text-muted-foreground">/ {task.actualHours}h actual</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded hover:bg-accent transition-colors"
                title="Edit task"
              >
                <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                    onDelete(task.id);
                  }
                }}
                className="p-1.5 rounded hover:bg-red-50 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize TaskItem to prevent unnecessary re-renders
export const TaskItem = memo(TaskItemComponent, (prevProps, nextProps) => {
  // Use a more comprehensive comparison to prevent false positives
  const isEqual = (
    prevProps.id === nextProps.id &&
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.completedAt === nextProps.task.completedAt &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.updatedAt === nextProps.task.updatedAt &&
    prevProps.task.order === nextProps.task.order &&
    prevProps.taskIndex === nextProps.taskIndex &&
    prevProps.totalTasks === nextProps.totalTasks
  );
  
  return isEqual;
}); 