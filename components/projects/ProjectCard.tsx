'use client';

import React, { memo, useMemo } from 'react';
import { Project } from '@/types';
import { Clock, MoreVertical, Plus, Edit, Trash2, RotateCcw, GripVertical } from 'lucide-react';
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
        <div className="flex items-center justify-center py-3 bg-muted/20 rounded-lg">
          <div className="flex items-center space-x-2 text-muted-foreground text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Click to add tasks</span>
          </div>
        </div>
      );
    }

    const maxCircles = 12;
    const totalCircles = Math.min(totalTasks, maxCircles);
    const showEllipsis = totalTasks > maxCircles;

    return (
      <div className="flex items-center space-x-3">
        <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
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
            <span className="text-xs text-muted-foreground ml-0.5 whitespace-nowrap font-medium">+{totalTasks - maxCircles}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "card-enhanced p-5 cursor-pointer group relative overflow-hidden",
        "bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm",
        "border border-border/50 rounded-xl shadow-sm",
        "hover:shadow-lg hover:border-primary/40 hover:bg-gradient-to-br hover:from-card/90 hover:to-card/70",
        "transition-all duration-300 ease-out transform hover:scale-[1.02]",
        isDragging && "rotate-2 scale-105 shadow-2xl ring-2 ring-primary/50",
        isArchived && "opacity-60 bg-muted/20 hover:bg-muted/30"
      )}
      onClick={handleCardClick}
      title="Click to open project and manage tasks"
      {...attributes}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: project.color + '1A', 
            }}
          >
            <div className="w-5 h-5" style={{ color: project.color }}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.4 4.925H4.6c-.718 0-1.3.582-1.3 1.3v11.55c0 .718.582 1.3 1.3 1.3h14.8c.718 0 1.3-.582 1.3-1.3V6.225c0-.718-.582-1.3-1.3-1.3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.3 9.7h17.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-semibold group-hover:text-primary transition-colors truncate",
              isArchived ? "text-muted-foreground" : "text-foreground"
            )}>
              {project.name}
              {isArchived && <span className="ml-2 text-xs opacity-70">(Archived)</span>}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium border", 
                getStatusColor(project.status)
              )}>
                {project.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {!isArchived && (
            <div 
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-accent transition-opacity flex-shrink-0"
              {...listeners}
              title="Drag to reorder"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-accent transition-all flex-shrink-0"
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

      <div className="space-y-3">
        {renderProgressCircles()}

        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-2 ml-auto">
            <span className="flex items-center space-x-1.5 bg-muted/30 text-muted-foreground px-2 py-1 rounded-md text-xs font-medium">
              <span>{project.progress}%</span>
              <span className="opacity-80">complete</span>
            </span>
            {timeRemaining && (
              <span className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-medium bg-muted/30 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{timeRemaining.text}</span>
              </span>
            )}
          </div>
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
    prevProps.project.updatedAt === nextProps.project.updatedAt &&
    prevProps.project.tasks?.length === nextProps.project.tasks?.length
  );
}); 