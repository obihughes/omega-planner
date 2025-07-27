'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProjectTask } from '@/types/projects';
import { 
  Square, 
  CheckSquare2, 
  Clock, 
  FileText, 
  Plus, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDueDate } from '@/utils/dateUtils';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface CompactTaskCardProps {
  task: TaskWithProject;
  onStatusChange: (taskId: string, status: ProjectTask['status']) => void;
  onUpdateTask?: (taskId: string, updates: Partial<ProjectTask>) => void;
  showProject?: boolean;
}

export function CompactTaskCard({ 
  task, 
  onStatusChange, 
  onUpdateTask,
  showProject = true 
}: CompactTaskCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const dueInfo = formatDueDate(task.dueDate);

  // Handle title editing
  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setEditingValue(task.title);
  };

  const saveTitle = () => {
    if (onUpdateTask && editingValue.trim() && editingValue.trim() !== task.title) {
      onUpdateTask(task.id, { title: editingValue.trim() });
    }
    setIsEditingTitle(false);
    setEditingValue('');
  };

  const cancelTitleEdit = () => {
    setIsEditingTitle(false);
    setEditingValue('');
  };

  // Handle description editing
  const startEditingDescription = () => {
    setIsEditingDescription(true);
    setEditingValue(task.description || '');
  };

  const saveDescription = () => {
    if (onUpdateTask) {
      onUpdateTask(task.id, { description: editingValue.trim() });
    }
    setIsEditingDescription(false);
    setEditingValue('');
  };

  const cancelDescriptionEdit = () => {
    setIsEditingDescription(false);
    setEditingValue('');
  };

  // Auto-focus inputs
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
    }
  }, [isEditingDescription]);

  const handleStatusToggle = () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    onStatusChange(task.id, newStatus);
  };

  return (
    <div className="group">
      {/* Main single-line task row */}
      <div 
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/20 transition-colors border border-transparent hover:border-border/30"
      >
        {/* Status checkbox */}
        <button
          onClick={handleStatusToggle}
          className="flex-shrink-0 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          {task.status === 'completed' ? (
            <CheckSquare2 className="w-4 h-4 text-green-600" />
          ) : (
            <Square className="w-4 h-4 text-muted-foreground hover:text-green-500" />
          )}
        </button>

        {/* Priority indicator */}
        {task.priority && task.priority !== 'medium' && (
          <div 
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              task.priority === 'urgent' && "bg-red-500 animate-pulse",
              task.priority === 'high' && "bg-orange-500",
              task.priority === 'low' && "bg-gray-400"
            )}
            title={`${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority`}
          />
        )}

        {/* Project indicator */}
        {showProject && (
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: task.projectColor }}
            title={task.projectName}
          />
        )}

        {/* Task title - editable with 60 char limit */}
        <div className="flex-shrink-0 w-80">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') cancelTitleEdit();
              }}
              maxLength={60}
              className="w-full bg-transparent border-none outline-none focus:bg-accent/50 rounded px-1 -mx-1 font-medium text-sm"
            />
          ) : (
            <h3 
              className={cn(
                "cursor-pointer hover:bg-accent/20 rounded px-1 -mx-1 transition-colors font-medium text-sm truncate",
                task.status === 'completed' 
                  ? "line-through text-muted-foreground/70" 
                  : "text-foreground"
              )}
              onClick={startEditingTitle}
              title={`${task.title}${task.description ? ` • ${task.description}` : ''}`}
            >
              {task.title.length > 60 ? task.title.substring(0, 60) + '...' : task.title}
            </h3>
          )}
        </div>

        {/* Project name (compact) */}
        {showProject && (
          <span className="text-xs text-muted-foreground/60 truncate max-w-[100px] flex-shrink-0">
            {task.projectName}
          </span>
        )}

        {/* Due date */}
        {dueInfo && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3 text-muted-foreground/50" />
            <span className={cn(
              "text-xs font-medium",
              dueInfo.isOverdue 
                ? "text-red-600" 
                : "text-muted-foreground/70"
            )}>
              {dueInfo.text}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {/* Description button */}
          {task.description ? (
            <button
              onClick={startEditingDescription}
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
              title="Edit description"
            >
              <FileText className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={startEditingDescription}
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
              title="Add description"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Description editing area */}
      {isEditingDescription && (
        <div className="mt-2 ml-8 mr-4">
          <div className="flex items-start gap-2">
            <textarea
              ref={descriptionTextareaRef}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) saveDescription();
                if (e.key === 'Escape') cancelDescriptionEdit();
              }}
              placeholder="Add description..."
              className="flex-1 text-sm text-muted-foreground bg-accent/20 border border-border rounded px-2 py-1 outline-none focus:bg-accent/30 resize-none"
              rows={2}
            />
            <div className="flex gap-1">
              <button
                onClick={saveDescription}
                className="p-1 hover:bg-accent rounded text-green-600 hover:text-green-700"
                title="Save"
              >
                <CheckSquare2 className="w-3 h-3" />
              </button>
              <button
                onClick={cancelDescriptionEdit}
                className="p-1 hover:bg-accent rounded text-red-600 hover:text-red-700"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 