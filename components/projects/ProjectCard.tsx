'use client';

import React from 'react';
import { Project } from '@/types';
import { Calendar, Clock, CheckCircle2, Circle, MoreVertical, Folder, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onClick: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete, onClick }: ProjectCardProps) {
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

  // Ensure tasks array exists and calculate metrics safely
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(task => task?.status === 'completed').length;
  const totalTasks = tasks.length;

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

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(project);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Add dropdown menu
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

    const maxCircles = 8; // Maximum circles to show
    const circlesToShow = Math.min(totalTasks, maxCircles);
    const showEllipsis = totalTasks > maxCircles;

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {Array.from({ length: circlesToShow }, (_, i) => {
            const isCompleted = i < completedTasks;
            return (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isCompleted 
                    ? "bg-green-500" 
                    : "bg-muted-foreground/30"
                )}
              />
            );
          })}
          {showEllipsis && (
            <span className="text-xs text-muted-foreground ml-1">...</span>
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          {completedTasks}/{totalTasks}
        </span>
      </div>
    );
  };

  return (
    <div 
      className="bg-card border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
      title="Click to open project and manage tasks"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.color + '20', color: project.color }}
          >
            <Folder className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {project.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(project.status)}
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(project.status))}>
                {project.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleMoreClick}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-all flex-shrink-0"
          title="More options"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Tasks</span>
        </div>
        {renderProgressCircles()}
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {project.startDate && (
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
          </div>
        )}
        {project.endDate && (() => {
          const { text, isOverdue } = formatTimeRemaining(project.endDate);
          return (
            <div className={cn("flex items-center space-x-1", isOverdue ? "text-red-500" : "")}>
              <Clock className="w-3 h-3" />
              <span>{text}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
} 