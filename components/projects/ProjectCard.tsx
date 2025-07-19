'use client';

import React, { memo, useMemo } from 'react';
import { Project } from '@/types';
import { Clock, MoreVertical, Plus, Edit, Trash2, RotateCcw, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CSS } from '@dnd-kit/utilities';

// Task Indicator Component - shows dots up to 12, then numbers
interface TaskIndicatorProps {
  completed: number;
  total: number;
  className?: string;
}

function TaskIndicator({ completed, total, className }: TaskIndicatorProps) {
  if (total === 0) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        No tasks
      </div>
    );
  }

  // If more than 12 tasks, show numbers instead of dots
  if (total > 12) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="text-xs font-medium text-foreground">
          {completed}/{total}
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-8 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round((completed / total) * 100)}%
          </span>
        </div>
      </div>
    );
  }

  // Show dots for 12 or fewer tasks
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-200",
              i < completed 
                ? "bg-green-500" 
                : "bg-muted border border-border"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-1">
        {completed}/{total}
      </span>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onRestore?: (projectId: string) => void;
  onPermanentlyDelete?: (projectId: string) => void;
  onClick: (project: Project) => void;
  isArchived?: boolean;
  // Drag and drop props
  isDragging?: boolean;
  transform?: { x: number; y: number; scaleX: number; scaleY: number } | null;
  listeners?: Record<string, Function>;
  attributes?: Record<string, any>;
  setNodeRef?: (node: HTMLElement | null) => void;
  dragOverlayStyle?: React.CSSProperties;
}

function ProjectCardComponent({ 
  project, 
  onEdit, 
  onDelete, 
  onRestore,
  onPermanentlyDelete,
  onClick, 
  isArchived = false,
  isDragging = false,
  transform,
  listeners,
  attributes,
  setNodeRef,
  dragOverlayStyle
}: ProjectCardProps) {

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      case 'planning':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const formatTimeRemaining = (dueDate: string): { text: string; isOverdue: boolean } => {
    const now = new Date();
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999);

    const diffMs = due.getTime() - now.getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    const diffDays = diffMs >= 0 ? Math.floor(diffMs / dayMs) : Math.ceil(diffMs / dayMs);

    if (diffDays < -1) return { text: `Overdue by ${Math.abs(diffDays)} days`, isOverdue: true };
    if (diffDays === -1) return { text: `Overdue by 1 day`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  };

  const { tasks, completedTasks, totalTasks, timeRemaining } = useMemo(() => {
    const projectTasks = project.tasks || [];
    const completed = projectTasks.filter(task => task?.status === 'completed').length;
    const total = projectTasks.length;
    const timeRemainingData = project.endDate ? formatTimeRemaining(project.endDate) : null;
    
    return {
      tasks: projectTasks,
      completedTasks: completed,
      totalTasks: total,
      timeRemaining: timeRemainingData
    };
  }, [project.tasks, project.endDate]);

  const style: React.CSSProperties = {
    ...(transform ? {
      transform: CSS.Transform.toString(transform)
    } : {}),
    ...(dragOverlayStyle || {}),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'pointer'
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    onClick(project);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore?.(project.id);
  };

  const handlePermanentlyDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      onPermanentlyDelete?.(project.id);
    }
  };

  const renderProgressCircles = () => {
    if (totalTasks === 0) {
      return (
        <div className="flex items-center justify-center py-4 bg-muted/10 border border-dashed border-muted-foreground/20">
          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <Plus className="w-4 h-4" />
            <span>Click to add tasks</span>
          </div>
        </div>
      );
    }

    const maxCircles = 12;
    const totalCircles = Math.min(totalTasks, maxCircles);
    const showEllipsis = totalTasks > maxCircles;

    return (
      <div className="flex items-center space-x-3 py-3">
        <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
          {completedTasks}/{totalTasks}
        </span>
        <div className="flex flex-wrap gap-1.5 items-center">
          {Array.from({ length: totalCircles }, (_, i) => {
            const isCompleted = i < completedTasks;
            return (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0",
                  isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                )}
              />
            );
          })}
          {showEllipsis && (
            <span className="text-sm text-muted-foreground ml-1 whitespace-nowrap font-medium">+{totalTasks - maxCircles}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: project.color + '08', // Very light tint of project color
        borderColor: project.color + '20', // Subtle border with project color
      }}
      className={cn(
        "p-6 cursor-pointer group relative overflow-hidden",
        "bg-card border-2 shadow-sm",
        "hover:shadow-md hover:border-opacity-40",
        "transition-all duration-200 ease-out",
        "font-['Inter',sans-serif]", // Use Inter font like text canvas
        isDragging && "rotate-1 scale-105 shadow-xl ring-2 ring-primary/30",
        isArchived && "opacity-60 bg-muted/20 hover:bg-muted/30"
      )}
      onClick={handleCardClick}
      title="Click to open project and manage tasks"
      {...attributes}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h3 className={cn(
            "text-xl font-semibold group-hover:text-primary transition-colors truncate mb-2 text-center",
            "font-['Inter',sans-serif] tracking-tight", // Larger text with Inter font, centered
            isArchived ? "text-muted-foreground" : "text-foreground"
          )}>
            {project.name}
            {isArchived && <span className="ml-2 text-sm opacity-70">(Archived)</span>}
          </h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {!isArchived && (
            <div 
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-2 rounded-md hover:bg-accent transition-opacity flex-shrink-0"
              {...listeners}
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-accent transition-all flex-shrink-0"
                title="More options"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-40 p-0" 
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {!isArchived && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Project</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Archive Project</span>
                    </button>
                  </>
                )}
                {isArchived && (
                  <>
                    <button
                      onClick={handleRestore}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore Project</span>
                    </button>
                    <button
                      onClick={handlePermanentlyDelete}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Forever</span>
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Progress Section - Now with Green Circle Indicator */}
      <div className="mb-6">
        {totalTasks === 0 ? (
          <div className="flex items-center justify-center py-4 bg-muted/10 border border-dashed border-muted-foreground/20">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <Plus className="w-4 h-4" />
              <span>Click to add tasks</span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {/* Empty space for main content area */}
          </div>
        )}
      </div>

      {/* Task Progress - Above Bottom Line, Left Side */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <TaskIndicator 
            completed={completedTasks} 
            total={totalTasks}
            className="justify-start"
          />
        </div>
      )}

      {/* Consolidated Status Line at Bottom */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/30">
        <div className="flex items-center space-x-4">
          <span className="font-medium">
            {project.progress}% complete
          </span>
          {timeRemaining && (
            <span className={cn(
              "flex items-center space-x-1",
              timeRemaining.isOverdue ? "text-red-600" : "text-muted-foreground"
            )}>
              <Clock className="w-3 h-3" />
              <span>{timeRemaining.text}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const ProjectCard = memo(ProjectCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.progress === nextProps.project.progress &&
    prevProps.project.color === nextProps.project.color &&
    prevProps.project.updatedAt === nextProps.project.updatedAt &&
    prevProps.project.tasks?.length === nextProps.project.tasks?.length
  );
}); 