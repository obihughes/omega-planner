'use client';

import React from 'react';
import { TaskListView } from '@/components/projects/TaskListView';
import { DraggableTaskCard } from '@/components/projects/DraggableTaskCard';
import { MiniSchedulerCalendar } from '@/components/calendar/MiniSchedulerCalendar';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { useViewMode } from '@/app/context/ViewModeContext';
import { useProjects } from '@/hooks/useProjects';
import { Calendar, List, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTask } from '@/types/projects';

// Task with project info interface
interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

export default function ProjectsTasksPage() {
  const { isSchedulingMode, setIsSchedulingMode } = useViewMode();
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

  // Handle task scheduling via drag and drop
  const handleTaskSchedule = (date: Date, taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      try {
        updateTaskInProject(task.projectId, taskId, { 
          dueDate: date.toISOString().split('T')[0] // Format as YYYY-MM-DD
        });
        // Could add toast notification here for success feedback
        console.log(`Task "${task.title}" scheduled for ${date.toLocaleDateString()}`);
      } catch (error) {
        console.error('Failed to schedule task:', error);
      }
    }
  };

  // Handle quick add task
  const handleQuickAdd = () => {
    if (!quickAddTitle.trim()) return;
    
    // Add to first available project or create unassigned
    const firstProject = projects.find(p => !p.isDeleted);
    if (firstProject) {
      addTaskToProject(firstProject.id, {
        title: quickAddTitle.trim(),
        status: 'todo',
        priority: 'medium'
      });
    }
    
    setQuickAddTitle('');
    setShowQuickAdd(false);
  };

  if (isSchedulingMode) {
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-light text-foreground tracking-tight">
                Scheduling Mode
              </h1>
              <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                {allTasks.length} tasks
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowQuickAdd(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Quick Add
              </Button>
              
              <Button
                onClick={() => setIsSchedulingMode(false)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Exit Scheduling
              </Button>
            </div>
          </div>

          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Tasks Column */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Drag tasks to schedule
                </h3>
                {allTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No tasks found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allTasks.map(task => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleTaskStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Sidebar */}
            <div className="w-80 flex-shrink-0">
              <MiniSchedulerCalendar
                onDateDrop={handleTaskSchedule}
                                 tasks={allTasks}
                className="sticky top-0"
              />
            </div>
          </div>

          {/* Quick Add Modal */}
          {showQuickAdd && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Add Task</h3>
                
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

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-light text-foreground tracking-tight">Tasks</h1>
          
          <Button
            onClick={() => setIsSchedulingMode(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Scheduling Mode
          </Button>
        </div>
        
        <TaskListView className="h-full" />
      </div>
    </AppLayout>
  );
} 