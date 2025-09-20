'use client';

import React, { memo, useMemo } from 'react';
import { Project, ProjectFolder } from '@/types';
import { Clock, MoreVertical, Plus, Edit, Trash2, RotateCcw, GripVertical, Folder, ChevronRight, Briefcase, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';

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
  onClone?: (project: Project) => void;
  onClick: (project: Project) => void;
  isArchived?: boolean;
  folders?: ProjectFolder[];
  onMoveToFolder?: (projectId: string, folderId: string | undefined) => void;
  // Drag and drop props
  isDragging?: boolean;
  transform?: { x: number; y: number; scaleX: number; scaleY: number } | null;
  listeners?: Record<string, Function>;
  attributes?: Record<string, any>;
  setNodeRef?: (node: HTMLElement | null) => void;
  dragOverlayStyle?: React.CSSProperties;
  // New quick action callbacks (optional)
  onQuickAddTask?: (projectId: string) => void;
  onQuickChangeStatus?: (projectId: string, status: Project['status']) => void;
  onQuickChangeColor?: (projectId: string, color: string) => void;
  onQuickChangeDueDate?: (projectId: string, endDate: string | undefined) => void;
}

function ProjectCardComponent({ 
  project, 
  onEdit, 
  onDelete, 
  onRestore,
  onPermanentlyDelete,
  onClone,
  onClick, 
  isArchived = false,
  folders = [],
  onMoveToFolder,
  isDragging = false,
  transform,
  listeners,
  attributes,
  setNodeRef,
  dragOverlayStyle,
  onQuickAddTask,
  onQuickChangeStatus,
  onQuickChangeColor,
  onQuickChangeDueDate
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

  const handleClone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClone) {
      onClone(project);
    }
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

  const handleMoveToFolder = (folderId: string | undefined) => {
    if (onMoveToFolder) {
      onMoveToFolder(project.id, folderId);
    }
  };

  const renderProgressIndicator = () => {
    if (totalTasks === 0) {
      return (
        <div className="flex items-center justify-center py-1 text-muted-foreground text-xs">
          No tasks
        </div>
      );
    }

    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {completedTasks}/{totalTasks} tasks
          </span>
          <span className="text-xs font-medium text-foreground">
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-200",
        isDragging ? 'z-10 scale-[1.01]' : '',
      )}
      {...attributes}
    >
      <div className="bg-card border border-border/60 rounded-lg p-4 hover:border-border transition-all duration-200 hover:shadow-sm h-32 flex flex-col" onClick={handleCardClick}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div 
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div className="min-w-0 flex-1">
              <h3
                className="font-semibold text-sm text-foreground leading-tight line-clamp-2"
                title={project.name && project.name.trim() ? project.name : 'Untitled Project'}
              >
                {project.name && project.name.trim() ? project.name : 'Untitled Project'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {project.progress}% complete
              </p>
            </div>
          </div>
        {!isArchived && (
          <div className="flex items-center">
            <div 
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-accent transition-opacity mr-1"
              {...listeners}
              title="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 w-7 p-0 ml-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              <button
                onClick={handleEdit}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2 rounded-md"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Project</span>
              </button>
              {onClone && (
                <button
                  onClick={handleClone}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2 rounded-md"
                >
                  <Copy className="w-4 h-4" />
                  <span>Clone Project</span>
                </button>
              )}
              {onMoveToFolder && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center space-x-2">
                        <Folder className="w-4 h-4" />
                        <span>Move to Folder</span>
                      </div>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-44 p-0" 
                    side="right"
                    align="start"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleMoveToFolder(undefined)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2",
                          !project.folderId && "bg-accent"
                        )}
                      >
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        <span>Unsorted Projects</span>
                      </button>
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleMoveToFolder(folder.id)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center space-x-2",
                            project.folderId === folder.id && "bg-accent"
                          )}
                        >
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span>{folder.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center space-x-2 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Archive Project</span>
              </button>
            </PopoverContent>
                      </Popover>
          </div>
        )}
        {isArchived && null}
        </div>

              {/* Task Progress Indicator */}
        {isArchived && (
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-1 md:px-2"
              onClick={handleRestore}
              title="Restore project"
            >
              <RotateCcw className="w-4 h-4 mr-0 lg:mr-1" />
              <span className="hidden lg:inline">Restore</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-1 md:px-2"
              onClick={handlePermanentlyDelete}
              title="Delete permanently"
            >
              <Trash2 className="w-4 h-4 mr-0 lg:mr-1" />
              <span className="hidden lg:inline">Delete</span>
            </Button>
          </div>
        )}
        
        <div className="mt-auto">
          {renderProgressIndicator()}
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