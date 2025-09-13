'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProjectTask, SubTask } from '@/types';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Minus, 
  Circle,
  CheckSquare2,
  Square,
  Edit,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDueDate, normalizeDueDate, dateFromDateKey } from '@/utils/dateUtils';

interface TaskItemProps {
  id: string;
  task: ProjectTask;
  taskIndex: number;
  totalTasks: number;
  onStatusChange: (taskId: string, status: ProjectTask['status']) => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<ProjectTask>) => void;
  onAddSubtask?: (taskId: string, subtask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  onUpdateSubtask?: (taskId: string, subtaskId: string, updates: Partial<SubTask>) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
}

// SubTask Item Component
interface SubTaskItemProps {
  subtask: SubTask;
  onStatusChange: (status: SubTask['status']) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SubTaskItem({ subtask, onStatusChange, onEdit, onDelete }: SubTaskItemProps) {
  const getStatusIcon = (status: SubTask['status']) => {
    switch (status) {
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

  return (
    <div className="flex items-center gap-2 p-1.5 bg-muted/20 rounded-md group">
      <button
        onClick={() => {
          const nextStatus = subtask.status === 'completed' ? 'todo' : 'completed';
          onStatusChange(nextStatus);
        }}
        className="flex-shrink-0 hover:scale-105 transition-transform"
      >
        {getStatusIcon(subtask.status)}
      </button>
      
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm",
          subtask.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {subtask.title}
        </span>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 hover:bg-accent rounded"
          title="Edit subtask"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-accent rounded text-destructive"
          title="Delete subtask"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function TaskItem({ 
  id, 
  task, 
  taskIndex, 
  totalTasks, 
  onStatusChange, 
  onEdit, 
  onDelete,
  onUpdateTask,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showAddSubtask, setShowAddSubtask] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  // Inline editing state
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editingValue, setEditingValue] = React.useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  // Description inline editing
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [editingDescription, setEditingDescription] = React.useState('');
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Due date inline editing
  const [isEditingDueDate, setIsEditingDueDate] = React.useState(false);
  const [editingDueDate, setEditingDueDate] = React.useState('');
  const dueInputRef = useRef<HTMLInputElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate subtask progress
  const subtaskStats = useMemo(() => {
    const subtasks = task.subtasks || [];
    const completed = subtasks.filter(st => st.status === 'completed').length;
    const total = subtasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { completed, total, percentage };
  }, [task.subtasks]);

  // Get dynamic task circle color based on subtask completion
  const getTaskCircleColor = () => {
    if (task.status === 'completed') return 'text-green-500';
    if (task.status === 'blocked') return 'text-red-500';
    if (task.status === 'in-progress') {
      if (subtaskStats.total === 0) return 'text-blue-500';
      if (subtaskStats.percentage >= 75) return 'text-green-400';
      if (subtaskStats.percentage >= 50) return 'text-yellow-500';
      if (subtaskStats.percentage >= 25) return 'text-orange-500';
      return 'text-blue-500';
    }
    
    // For 'todo' status
    if (subtaskStats.total === 0) return 'text-muted-foreground';
    if (subtaskStats.percentage >= 75) return 'text-green-300';
    if (subtaskStats.percentage >= 50) return 'text-yellow-400';
    if (subtaskStats.percentage >= 25) return 'text-orange-400';
    return 'text-muted-foreground';
  };

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

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !onAddSubtask) return;
    
    onAddSubtask(task.id, {
      title: newSubtaskTitle.trim(),
      status: 'todo'
    });
    
    setNewSubtaskTitle('');
    setShowAddSubtask(false);
  };

  const handleSubtaskStatusChange = (subtaskId: string, status: SubTask['status']) => {
    if (!onUpdateSubtask) return;
    onUpdateSubtask(task.id, subtaskId, { status });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!onDeleteSubtask) return;
    onDeleteSubtask(task.id, subtaskId);
  };

  // Inline editing functions
  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setEditingValue(task.title);
  };

  const saveEditTitle = () => {
    if (onUpdateTask && editingValue.trim() && editingValue.trim() !== task.title) {
      onUpdateTask(task.id, { title: editingValue.trim() });
    }
    setIsEditingTitle(false);
    setEditingValue('');
  };

  const cancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingValue('');
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Focus description when editing starts
  useEffect(() => {
    if (isEditingDescription && descTextareaRef.current) {
      descTextareaRef.current.focus();
      descTextareaRef.current.select();
    }
  }, [isEditingDescription]);

  // Focus due date when editing starts
  useEffect(() => {
    if (isEditingDueDate && dueInputRef.current) {
      dueInputRef.current.focus();
    }
  }, [isEditingDueDate]);

  // Due date formatted info
  const dueInfo = useMemo(() => formatDueDate(task.dueDate || undefined), [task.dueDate]);

  // Full date string for hover tooltip: Weekday DD/MM/YYYY
  const fullDueHoverTitle = useMemo(() => {
    if (!task.dueDate) return undefined;
    const normalized = normalizeDueDate(task.dueDate);
    if (!normalized) return undefined;
    const d = dateFromDateKey(normalized);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${weekday} ${dd}/${mm}/${yyyy}`;
  }, [task.dueDate]);

  // Description editing handlers
  const startEditingDescription = () => {
    setIsEditingDescription(true);
    setEditingDescription(task.description || '');
  };

  const saveEditDescription = () => {
    if (!onUpdateTask) {
      setIsEditingDescription(false);
      return;
    }
    const trimmed = editingDescription.trim();
    const newValue = trimmed === '' ? undefined : trimmed;
    if (newValue !== (task.description || undefined)) {
      onUpdateTask(task.id, { description: newValue });
    }
    setIsEditingDescription(false);
  };

  const cancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditingDescription('');
  };

  // Due date editing handlers
  const startEditingDueDate = () => {
    setIsEditingDueDate(true);
    setEditingDueDate(normalizeDueDate(task.dueDate) || '');
  };

  const saveEditDueDate = () => {
    if (!onUpdateTask) {
      setIsEditingDueDate(false);
      return;
    }
    const normalized = normalizeDueDate(editingDueDate) || undefined;
    if (normalized !== (normalizeDueDate(task.dueDate) || undefined)) {
      onUpdateTask(task.id, { dueDate: normalized });
    }
    setIsEditingDueDate(false);
  };

  const clearDueDate = () => {
    if (onUpdateTask) onUpdateTask(task.id, { dueDate: undefined });
  };

  // Create confetti particles animation
  const createConfettiParticles = (button: HTMLElement) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${centerX}px;
        top: ${centerY}px;
        transform-origin: center;
      `;

      document.body.appendChild(particle);

      const angle = (i / 12) * Math.PI * 2;
      const velocity = 100 + Math.random() * 100;
      const gravity = 500;
      const life = 800 + Math.random() * 400;

      let startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = elapsed / life;

        if (progress >= 1) {
          particle.remove();
          return;
        }

        const x = centerX + Math.cos(angle) * velocity * (elapsed / 1000);
        const y = centerY + Math.sin(angle) * velocity * (elapsed / 1000) + 0.5 * gravity * Math.pow(elapsed / 1000, 2);
        const opacity = 1 - progress;
        const scale = 1 - progress * 0.5;

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = opacity.toString();
        particle.style.transform = `scale(${scale})`;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border border-border/40 bg-card/60 backdrop-blur-sm p-3 group",
        "hover:shadow-md hover:border-primary/30 transition-all duration-200",
        "font-['Inter',sans-serif]",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div 
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent transition-opacity flex-shrink-0 mt-0.5"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Status Toggle */}
        <button
          onClick={(e) => {
            const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
            
            // Trigger exciting animation when completing a task
            if (nextStatus === 'completed') {
              setIsAnimating(true);
              
              // Create confetti particles
              createConfettiParticles(e.currentTarget as HTMLElement);
              
              // Reset animation state
              setTimeout(() => {
                setIsAnimating(false);
              }, 1000);
            }
            
            onStatusChange(task.id, nextStatus);
          }}
          className={cn(
            "flex-shrink-0 transition-all duration-300 relative mt-0.5",
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
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={saveEditTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditTitle();
                    if (e.key === 'Escape') cancelEditTitle();
                  }}
                  ref={editInputRef}
                  className="w-full font-medium text-foreground mb-1 bg-transparent border-none outline-none focus:bg-accent/50 rounded px-1 -mx-1 leading-snug"
                />
              ) : (
                <h4 
                  className={cn(
                    "font-medium text-foreground mb-0.5 break-words leading-snug cursor-pointer hover:bg-accent/20 rounded px-1 -mx-1 transition-colors",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}
                  onClick={startEditingTitle}
                  title="Click to edit task name"
                >
                  {task.title}
                </h4>
              )}
              
              {/* Description display / editing */}
              {isEditingDescription ? (
                <div className="mt-1">
                  <textarea
                    ref={descTextareaRef}
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    onBlur={saveEditDescription}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEditDescription();
                      if (e.key === 'Escape') cancelEditDescription();
                    }}
                    placeholder="Add description..."
                    className="w-full text-sm bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    rows={2}
                  />
                  <div className="text-xs text-muted-foreground mt-1">Press Ctrl+Enter to save, Escape to cancel</div>
                </div>
              ) : (
                <p
                  className={cn(
                    "text-sm break-words leading-snug",
                    task.description ? "text-muted-foreground" : "text-muted-foreground/70 italic cursor-text hover:text-foreground/80"
                  )}
                  onClick={startEditingDescription}
                  title={task.description ? "Click to edit description" : "Click to add description"}
                >
                  {task.description ? task.description : 'Add description...'}
                </p>
              )}
              
              {/* Subtask Progress Indicator */}
              {subtaskStats.total > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{subtaskStats.completed}/{subtaskStats.total} subtasks</span>
                  </div>
                  <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${subtaskStats.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(subtaskStats.percentage)}%
                  </span>
                </div>
              )}
            </div>

            {/* Due date (always visible) and actions (on hover) */}
            <div className="flex items-center gap-2 ml-4">
              {/* Due Date Chip / Editor (always visible) */}
              {isEditingDueDate ? (
                <input
                  ref={dueInputRef}
                  type="date"
                  value={editingDueDate}
                  onChange={(e) => setEditingDueDate(e.target.value)}
                  onBlur={saveEditDueDate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditDueDate();
                    if (e.key === 'Escape') setIsEditingDueDate(false);
                  }}
                  className="text-xs bg-transparent border border-primary rounded px-1 py-0.5 focus:outline-none"
                />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditingDueDate();
                  }}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border",
                    dueInfo?.isOverdue ? "border-red-500 text-red-600 bg-red-50" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  )}
                  title={task.dueDate ? (fullDueHoverTitle || "Click to edit due date") : "Click to set due date"}
                >
                  {task.dueDate ? (dueInfo?.text || 'Due date') : 'Add due date'}
                </button>
              )}

              {/* Action buttons (hidden until hover) */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {task.dueDate && !isEditingDueDate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearDueDate(); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Clear due date"
                  >
                    ×
                  </button>
                )}

                {/* Expand/Collapse Subtasks */}
                {(task.subtasks && task.subtasks.length > 0) && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    title={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
                
                {/* Add Subtask */}
                <button
                  onClick={() => setShowAddSubtask(!showAddSubtask)}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                  title="Add subtask"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onEdit(task)}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                  title="Edit task"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-2 hover:bg-accent rounded-md transition-colors text-destructive"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Subtask Input */}
      {showAddSubtask && (
        <div className="mt-4 ml-12 flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter subtask title..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubtask();
              if (e.key === 'Escape') {
                setShowAddSubtask(false);
                setNewSubtaskTitle('');
              }
            }}
            className="flex-1 px-3 py-2 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          <button
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowAddSubtask(false);
              setNewSubtaskTitle('');
            }}
            className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Subtasks List */}
      {isExpanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-4 ml-12 space-y-2">
          {task.subtasks.map((subtask) => (
            <SubTaskItem
              key={subtask.id}
              subtask={subtask}
              onStatusChange={(status) => handleSubtaskStatusChange(subtask.id, status)}
              onEdit={() => {
                // TODO: Implement subtask editing modal
                console.log('Edit subtask:', subtask);
              }}
              onDelete={() => handleDeleteSubtask(subtask.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 