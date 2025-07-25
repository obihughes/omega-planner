'use client';

import React from 'react';
import { DraggableTaskCard } from '@/components/projects/DraggableTaskCard';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { Plus, CheckSquare2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTask } from '@/types/projects';
import { useMemo, useState } from 'react';
import { formatDueDate, getDateKey, getTodayDateKey } from '@/utils/dateUtils';
import { ProjectTaskFormModal } from '@/components/modals/ProjectTaskFormModal';
import { Edit3, Filter, SortAsc, X } from 'lucide-react';

// Task with project info interface
interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

export default function ProjectsTodayPage() {
  const { projects, updateTaskInProject, addTaskToProject } = useProjects();
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [quickAddTitle, setQuickAddTitle] = React.useState('');
  
  // Filtering state
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [priorityFilter, setPriorityFilter] = React.useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'todo' | 'in-progress' | 'blocked'>('all');
  
  // Edit modal state
  const [editingTask, setEditingTask] = React.useState<TaskWithProject | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Get all tasks with project info
  const allTasks = React.useMemo((): TaskWithProject[] => {
    return projects
      .filter(p => !p.isDeleted)
      .flatMap(project => 
        project.tasks.map(task => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        }))
      );
  }, [projects]);

  // Filter tasks for Today with filtering options
  const todayTasks = React.useMemo(() => {
    const todayKey = getTodayDateKey();
    

    
    // Start with tasks due today
    let filteredTasks = allTasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDueDateKey = getDateKey(task.dueDate);
      // ONLY include tasks due today (not overdue tasks)
      return taskDueDateKey === todayKey;
    });

    // Optionally include tasks completed today
    if (showCompleted) {
      const completedTodayTasks = allTasks.filter(task => {
        if (task.status !== 'completed' || !task.completedAt) return false;
        
        const completedDateKey = getDateKey(task.completedAt);
        
        return completedDateKey === todayKey;
      });

      // Combine and deduplicate
      completedTodayTasks.forEach(task => {
        if (!filteredTasks.find(t => t.id === task.id)) {
          filteredTasks.push(task);
        }
      });
    } else {
      // Filter out completed tasks if not showing them
      filteredTasks = filteredTasks.filter(task => task.status !== 'completed');
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }

    // Apply status filter (only for non-completed tasks)
    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.status === 'completed' || task.status === statusFilter
      );
    }

    const combinedTasks = filteredTasks;

    // Sort: incomplete tasks first (by due date, then priority), then completed tasks
    return combinedTasks.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Both completed or both incomplete - sort by due date first
      if (a.dueDate && b.dueDate) {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        const dateCompare = dateA.getTime() - dateB.getTime();
        if (dateCompare !== 0) return dateCompare;
      }
      
      // Then by priority
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }, [allTasks, showCompleted, priorityFilter, statusFilter]);

  // Separate incomplete and completed tasks
  const incompleteTasks = todayTasks.filter(task => task.status !== 'completed');
  const completedTasks = todayTasks.filter(task => task.status === 'completed');

  // Handle task status change
  const handleTaskStatusChange = (taskId: string, status: 'todo' | 'in-progress' | 'completed' | 'blocked') => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      updateTaskInProject(task.projectId, taskId, { 
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
      });
    }
  };

  // Handle edit task
  const handleEditTask = (task: TaskWithProject) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // Handle save edited task
  const handleSaveEditedTask = (updatedTask: Partial<ProjectTask>, isNew: boolean) => {
    if (editingTask && !isNew) {
      updateTaskInProject(editingTask.projectId, editingTask.id, updatedTask);
      setIsEditModalOpen(false);
      setEditingTask(null);
    }
  };

  // Handle quick add task
  const handleQuickAdd = () => {
    if (!quickAddTitle.trim()) return;
    
    // Add to first available project with today's due date
    const firstProject = projects.find(p => !p.isDeleted);
    if (firstProject) {
      const today = new Date().toISOString().split('T')[0];
      addTaskToProject(firstProject.id, {
        title: quickAddTitle.trim(),
        status: 'todo',
        priority: 'medium',
        dueDate: today
      });
    }
    
    setQuickAddTitle('');
    setShowQuickAdd(false);
  };

  // Custom task card with square checkbox and exciting animations
  const TodayTaskCard = ({ task }: { task: TaskWithProject }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const handleStatusToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      
      // Trigger exciting animation when completing a task
      if (nextStatus === 'completed') {
        setIsAnimating(true);
        setShowConfetti(true);
        
        // Create confetti particles
        createConfettiParticles(e.currentTarget as HTMLElement);
        
        // Reset animation states
        setTimeout(() => {
          setIsAnimating(false);
          setShowConfetti(false);
        }, 1000);
      }
      
      handleTaskStatusChange(task.id, nextStatus);
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

    // Use the centralized formatDueDate utility function

    const dueInfo = formatDueDate(task.dueDate);

    return (
      <div
        className={cn(
          "bg-card rounded-lg p-4 transition-all duration-200 group border-l-4 relative overflow-hidden",
          task.status === 'completed' 
            ? "opacity-60 bg-muted/30" 
            : "hover:bg-accent/20",
          task.priority === 'urgent' && "border-l-red-500",
          task.priority === 'high' && "border-l-orange-500", 
          task.priority === 'medium' && "border-l-blue-500",
          task.priority === 'low' && "border-l-gray-400",
          !task.priority && "border-l-gray-200",
          isAnimating && "animate-pulse"
        )}
      >
        {/* Celebration background effect */}
        {showConfetti && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-blue-100/50 animate-fade-in-out pointer-events-none" />
        )}
        
        <div className="flex items-center gap-4 relative z-10">
          {/* Animated Square Checkbox */}
          <button
            onClick={handleStatusToggle}
            className={cn(
              "flex-shrink-0 transition-all duration-300 relative",
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
                  "w-5 h-5 text-green-600 transition-all duration-300",
                  isAnimating && "drop-shadow-lg"
                )} />
                {/* Success ring animation */}
                {isAnimating && (
                  <div className="absolute inset-0 rounded border-2 border-green-400 animate-ping" />
                )}
              </div>
            ) : (
              <Square className={cn(
                "w-5 h-5 text-muted-foreground transition-all duration-200",
                "hover:text-green-500 hover:scale-105"
              )} />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Title with project indicator inline */}
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.projectColor }}
              />
              <h4 className={cn(
                "font-medium text-sm text-foreground flex-1 line-clamp-2 transition-all duration-300",
                task.status === 'completed' && "line-through text-muted-foreground",
                isAnimating && "text-green-600"
              )}>
                {task.title}
              </h4>
            </div>

            {/* Description if exists */}
            {task.description && (
              <p className={cn(
                "text-xs text-muted-foreground mb-2 line-clamp-1 transition-all duration-300",
                task.status === 'completed' && "line-through"
              )}>
                {task.description}
              </p>
            )}

            {/* Due date and project name */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium">{task.projectName}</span>
              {dueInfo && (
                <>
                  <span>•</span>
                  <span className={cn(
                    "font-medium",
                    dueInfo.isOverdue ? "text-red-600" : "text-muted-foreground"
                  )}>
                    {dueInfo.text}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleEditTask(task)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-accent transition-all flex-shrink-0"
              title="Edit task"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-light text-foreground tracking-tight">
              Today's Focus
            </h1>
            <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
              {incompleteTasks.length} pending • {completedTasks.length} completed
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filters */}
            <div className="flex items-center gap-2 mr-4">
              {/* Show Completed Toggle */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Show Completed</span>
              </label>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
              </select>

              {/* Clear Filters */}
              {(priorityFilter !== 'all' || statusFilter !== 'all' || showCompleted) && (
                <button
                  onClick={() => {
                    setPriorityFilter('all');
                    setStatusFilter('all');
                    setShowCompleted(false);
                  }}
                  className="p-1 text-xs text-muted-foreground hover:text-foreground"
                  title="Clear filters"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <Button
              onClick={() => setShowQuickAdd(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Incomplete Tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-3 mb-8">
              {incompleteTasks.map(task => (
                <TodayTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground border-t pt-4">
                Completed Today ({completedTasks.length})
              </h3>
              {completedTasks.map(task => (
                <TodayTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {incompleteTasks.length === 0 && completedTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p>No tasks due today. Great work!</p>
            </div>
          )}
        </div>

        {/* Quick Add Modal */}
        {showQuickAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Add Task for Today</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAdd();
                    if (e.key === 'Escape') {
                      setShowQuickAdd(false);
                      setQuickAddTitle('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                
                <div className="flex items-center justify-end gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickAddTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleQuickAdd}
                    disabled={!quickAddTitle.trim()}
                  >
                    Add Task
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <ProjectTaskFormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingTask(null);
            }}
            onSave={handleSaveEditedTask}
            taskToEdit={editingTask}
          />
        )}
      </div>
    </AppLayout>
  );
} 