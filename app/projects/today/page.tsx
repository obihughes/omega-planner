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

  // Filter tasks for Today (due today or overdue, plus completed today)
  const todayTasks = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const dueTasks = allTasks.filter(task => {
      if (!task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      // Include overdue and today's tasks
      return dueDateOnly <= today;
    });

    // Also include tasks completed today
    const completedTodayTasks = allTasks.filter(task => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      
      const completedDate = new Date(task.completedAt);
      const completedDateOnly = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
      
      return completedDateOnly.getTime() === today.getTime();
    });

    // Combine and deduplicate
    const combinedTasks = [...dueTasks];
    completedTodayTasks.forEach(task => {
      if (!combinedTasks.find(t => t.id === task.id)) {
        combinedTasks.push(task);
      }
    });

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
  }, [allTasks]);

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

    const formatDueDate = (dueDate?: string) => {
      if (!dueDate) return null;
      
      const now = new Date();
      const due = new Date(dueDate);
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { text: 'Overdue', isOverdue: true };
      if (diffDays === 0) return { text: 'Today', isOverdue: false };
      if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false };
      
      return { text: due.toLocaleDateString(), isOverdue: false };
    };

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
          
          <Button
            onClick={() => setShowQuickAdd(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
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
      </div>
    </AppLayout>
  );
} 