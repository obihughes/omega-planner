'use client';

import React, { useState, useMemo } from 'react';
import { ProjectTask, SubTask } from '@/types';
import { 
  Circle, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  id: string;
  task: ProjectTask;
  taskIndex: number;
  totalTasks: number;
  onStatusChange: (taskId: string, status: ProjectTask['status']) => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
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
    <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md group">
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
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  
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
    const colorClass = getTaskCircleColor();
    
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className={cn("w-5 h-5", colorClass)} />;
      case 'in-progress':
        return <Clock className={cn("w-5 h-5", colorClass)} />;
      case 'blocked':
        return <Minus className={cn("w-5 h-5", colorClass)} />;
      default:
        return <Circle className={cn("w-5 h-5", colorClass)} />;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border border-border/40 bg-card/60 backdrop-blur-sm p-4 group",
        "hover:shadow-md hover:border-primary/30 transition-all duration-200",
        "font-['Inter',sans-serif]",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
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
          onClick={() => {
            const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
            onStatusChange(task.id, nextStatus);
          }}
          className="flex-shrink-0 hover:scale-105 transition-transform mt-0.5"
        >
          {getStatusIcon()}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium text-foreground mb-1 break-words leading-snug",
                task.status === 'completed' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              
              {task.description && (
                <p className="text-sm text-muted-foreground break-words leading-relaxed">
                  {task.description}
                </p>
              )}
              
              {/* Subtask Progress Indicator */}
              {subtaskStats.total > 0 && (
                <div className="flex items-center gap-2 mt-2">
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

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
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