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
import { formatDueDate, normalizeDueDate } from '@/utils/dateUtils';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
  taskNumber: number;
  totalTasksInProject: number;
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
  const [isAnimating, setIsAnimating] = useState(false); // For checkbox bounce
  const [showConfetti, setShowConfetti] = useState(false); // For confetti background
  const [isDragging, setIsDragging] = useState(false); // For drag state
  const [isFadingOut, setIsFadingOut] = useState(false); // For fade-out animation
  const [pendingStatusChange, setPendingStatusChange] = useState<{ taskId: string; status: ProjectTask['status'] } | null>(null);
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState('');

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

  // Handle pending status changes after animation
  useEffect(() => {
    if (pendingStatusChange && !isFadingOut) {
      onStatusChange(pendingStatusChange.taskId, pendingStatusChange.status);
      setPendingStatusChange(null);
    }
  }, [pendingStatusChange, isFadingOut, onStatusChange]);

  const handleStatusToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    // Trigger exciting animation when completing a task
    if (newStatus === 'completed') {
      setIsAnimating(true);
      setShowConfetti(true);
      
      // Create confetti particles
      createConfettiParticles(e.currentTarget);
      
      // Start fade-out animation before changing status
      setIsFadingOut(true);
      setPendingStatusChange({ taskId: task.id, status: newStatus });
      
      // Reset animation states and complete fade-out
      setTimeout(() => {
        setIsAnimating(false);
        setShowConfetti(false);
        setIsFadingOut(false);
      }, 1200); // Extended duration for fade effect
    } else {
      // For uncompleting tasks, immediate change with fade-in
      setIsFadingOut(true);
      setPendingStatusChange({ taskId: task.id, status: newStatus });
      
      // Quick fade-in effect
      setTimeout(() => {
        setIsFadingOut(false);
      }, 300);
    }
  };

  // Inline due date editing
  const startEditingDueDate = () => {
    setIsEditingDueDate(true);
    setDueDateValue(task.dueDate || '');
  };

  const saveDueDate = () => {
    if (!onUpdateTask) {
      setIsEditingDueDate(false);
      return;
    }
    const normalized = normalizeDueDate(dueDateValue);
    onUpdateTask(task.id, { dueDate: normalized });
    setIsEditingDueDate(false);
  };

  const cancelDueDate = () => {
    setIsEditingDueDate(false);
    setDueDateValue('');
  };

  // Create confetti particles animation
  const createConfettiParticles = (button: HTMLElement) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle'; // Ensure you have CSS for this class
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

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden transition-all duration-700 ease-in-out",
        isDragging && "opacity-50",
        isFadingOut && "opacity-20 scale-95 transform",
        !isFadingOut && "opacity-100 scale-100"
      )}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Celebration background effect */}
      {showConfetti && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-blue-100/50 animate-fade-in-out pointer-events-none" />
      )}

      {/* Main single-line task row */}
      <div 
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg hover:bg-accent/20 transition-colors border border-transparent hover:border-border/30 relative z-10",
          isDragging && "bg-accent/30"
        )}
      >
        {/* Column 1: Status checkbox - Fixed width */}
        <div className="w-6 flex-shrink-0">
          <button
            onClick={handleStatusToggle}
            className={cn(
              "transition-all duration-300 relative",
              "hover:scale-110 active:scale-95",
              isAnimating && "animate-bounce"
            )}
            style={{
              transform: isAnimating ? 'scale(1.2)' : undefined,
              transition: 'transform 0.3s ease-in-out'
            }}
          >
            {task.status === 'completed' ? (
              <div className="relative">
                <CheckSquare2 className={cn(
                  "w-4 h-4 text-green-600 transition-all duration-300",
                  isAnimating && "drop-shadow-lg"
                )} />
                {/* Success ring animation */}
                {isAnimating && (
                  <div className="absolute inset-0 rounded border-2 border-green-400 animate-ping" />
                )}
              </div>
            ) : (
              <Square className="w-4 h-4 text-muted-foreground hover:text-green-500" />
            )}
          </button>
        </div>

        {/* Column 2: Priority & Project indicators - Fixed width */}
        <div className="w-8 flex-shrink-0 flex items-center gap-1">
          {/* Priority indicator */}
          {task.priority && task.priority !== 'medium' && (
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
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
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: task.projectColor }}
              title={task.projectName}
            />
          )}
        </div>

        {/* Column 3: Task Number - Fixed width */}
        <div className="w-12 flex-shrink-0">
          <span className="text-xs text-muted-foreground/60 font-mono">
            {task.taskNumber}/{task.totalTasksInProject}
          </span>
        </div>

        {/* Column 4: Task title - Fixed width for 60 chars */}
        <div className="w-96 flex-shrink-0">
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

        {/* Column 5: Project name - Fixed width */}
        {showProject && (
          <div className="w-32 flex-shrink-0">
            <span className="text-xs text-muted-foreground/60 truncate block">
              {task.projectName}
            </span>
          </div>
        )}

        {/* Column 6: Due date - Fixed width */}
        <div className="w-40 flex-shrink-0">
          {isEditingDueDate ? (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground/50" />
              <input
                type="date"
                value={dueDateValue}
                onChange={(e) => setDueDateValue(e.target.value)}
                onBlur={saveDueDate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveDueDate();
                  if (e.key === 'Escape') cancelDueDate();
                }}
                className="text-xs bg-transparent border border-primary rounded px-1 py-0.5 focus:outline-none"
                autoFocus
              />
            </div>
          ) : task.dueDate && dueInfo ? (
            <button
              type="button"
              onClick={startEditingDueDate}
              className="flex items-center gap-1 hover:opacity-90"
              title={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
            >
              <Clock className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground/70 truncate">
                {dueInfo.isOverdue ? new Date(task.dueDate).toLocaleDateString() : dueInfo.text}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startEditingDueDate}
              className="text-xs text-muted-foreground/60 hover:text-foreground px-2 py-0.5 border border-dashed border-border rounded"
              title="Add due date"
            >
              Add date
            </button>
          )}
        </div>

        {/* Column 7: Created date - Fixed width */}
        <div className="w-28 flex-shrink-0">
          {task.createdAt && (
            <div className="flex items-center gap-1" title={`Created: ${new Date(task.createdAt).toLocaleDateString()}`}>
              <Plus className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground/70 truncate">
                {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Column 8: Action buttons - Fixed width */}
        <div className="w-8 flex-shrink-0">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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