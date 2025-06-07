'use client';

import React, { memo, useMemo } from 'react';
import { Project } from '@/types';
import { Calendar, Clock, CheckCircle2, Circle, MoreVertical, Folder, Plus, Edit, Trash2, RotateCcw, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CSS } from '@dnd-kit/utilities';

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

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Circle className="w-4 h-4 text-blue-500" />;
      case 'on-hold':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'planning':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'cancelled':
        return <Circle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'planning':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTimeRemaining = (dueDate: string): { text: string; isOverdue: boolean } => {
    const now = new Date();
    const due = new Date(dueDate);
    // Reset time to end of day for due date for fair comparison
    due.setHours(23, 59, 59, 999);

    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < -1) return { text: `Overdue by ${Math.abs(diffDays)} days`, isOverdue: true };
    if (diffDays === -1) return { text: `Overdue by 1 day`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  };

  // Memoize expensive calculations
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
  }, [project.tasks, project.endDate, formatTimeRemaining]);

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

  // Render progress circles
  const renderProgressCircles = () => {
    if (totalTasks === 0) {
      return (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
            <Plus className="w-4 h-4" />
            <span>Click to view and add tasks</span>
          </div>
        </div>
      );
    }

    const maxCirclesPerRow = 15; // Show 15 circles per row
    const totalCircles = Math.min(totalTasks, 30); // Maximum 30 circles total (2 rows)
    const showEllipsis = totalTasks > 30;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {Array.from({ length: totalCircles }, (_, i) => {
              const isCompleted = i < completedTasks;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors flex-shrink-0",
                    isCompleted 
                      ? "bg-green-500" 
                      : "bg-muted-foreground/30"
                  )}
                />
              );
            })}
            {showEllipsis && (
              <span className="text-xs text-muted-foreground ml-1 whitespace-nowrap">+{totalTasks - 30}</span>
            )}
          </div>
          <span className="text-sm font-medium text-foreground whitespace-nowrap ml-2">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer group relative",
        isDragging && "rotate-3 scale-105",
        isArchived && "opacity-75 bg-muted/30"
      )}
      onClick={handleCardClick}
      title="Click to open project and manage tasks"
      {...attributes}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        {/* Drag Handle - only show for non-archived projects */}
        {!isArchived && (
          <div 
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent transition-opacity flex-shrink-0"
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.color + '20', color: project.color }}
          >
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-semibold group-hover:text-primary transition-colors truncate",
              isArchived ? "text-muted-foreground" : "text-foreground"
            )}>
              {project.name}
              {isArchived && <span className="ml-2 text-xs">(Archived)</span>}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(project.status)}
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(project.status))}>
                {project.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-all flex-shrink-0"
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

      {/* Description */}
      {project.description && (
        <p className={cn(
          "text-sm mb-3 line-clamp-2",
          isArchived ? "text-muted-foreground/70" : "text-muted-foreground"
        )}>
          {project.description}
        </p>
      )}

      {/* Progress visualization */}
      {renderProgressCircles()}

      {/* Project metrics */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="text-foreground font-medium">{project.progress}%</span>
            <span>complete</span>
          </span>
          {timeRemaining && (
            <span className={cn(
              "flex items-center space-x-1",
              timeRemaining.isOverdue ? "text-red-500" : "text-muted-foreground"
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

// Memoize ProjectCard to prevent unnecessary re-renders
export const ProjectCard = memo(ProjectCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.progress === nextProps.project.progress &&
    prevProps.project.updatedAt === nextProps.project.updatedAt &&
    prevProps.project.tasks?.length === nextProps.project.tasks?.length
  );
}); 