'use client';

import React from 'react';
import { TaskListView } from '@/components/projects/TaskListView';
import { DraggableTaskCard } from '@/components/projects/DraggableTaskCard';
import { MiniSchedulerCalendar } from '@/components/calendar/MiniSchedulerCalendar';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { useViewMode } from '@/app/context/ViewModeContext';
import { useProjects } from '@/hooks/useProjects';
import { Calendar, List, Plus, Clock, CheckCircle2, Filter, SortAsc } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTask } from '@/types/projects';

// Task with project info interface
interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

export default function ProjectsTasksPage() {
  const { isSchedulingMode, setIsSchedulingMode, isTodayMode, setIsTodayMode } = useViewMode();
  const { projects, updateTaskInProject, addTaskToProject } = useProjects();
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [quickAddTitle, setQuickAddTitle] = React.useState('');
  
  // Scheduling mode filters and sorting
  const [schedulingSort, setSchedulingSort] = React.useState<'priority' | 'dueDate' | 'title' | 'created'>('priority');
  const [schedulingFilter, setSchedulingFilter] = React.useState<{
    project: string;
    priority: string;
    status: string;
  }>({
    project: 'all',
    priority: 'all',
    status: 'all'
  });

  // Reset today mode when directly accessing tasks page
  React.useEffect(() => {
    if (isTodayMode) {
      setIsTodayMode(false);
    }
  }, [isTodayMode, setIsTodayMode]);

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

  // Filter tasks for Today Mode (due today or overdue)
  const todayTasks = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      // Include overdue and today's tasks
      return dueDateOnly <= today && task.status !== 'completed';
    }).sort((a, b) => {
      // Sort by due date (overdue first), then by priority
      const dateA = new Date(a.dueDate!);
      const dateB = new Date(b.dueDate!);
      const dateCompare = dateA.getTime() - dateB.getTime();
      
      if (dateCompare !== 0) return dateCompare;
      
      // Then by priority
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }, [allTasks]);

  // Filtered and sorted tasks for Scheduling Mode
  const schedulingTasks = React.useMemo(() => {
    let filtered = allTasks;
    
    // Apply filters
    if (schedulingFilter.project !== 'all') {
      filtered = filtered.filter(task => task.projectId === schedulingFilter.project);
    }
    
    if (schedulingFilter.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === schedulingFilter.priority);
    }
    
    if (schedulingFilter.status !== 'all') {
      filtered = filtered.filter(task => task.status === schedulingFilter.status);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (schedulingSort) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allTasks, schedulingFilter, schedulingSort]);

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

  // Handle reschedule to tomorrow
  const handleRescheduleToTomorrow = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      updateTaskInProject(task.projectId, taskId, { 
        dueDate: tomorrow.toISOString().split('T')[0]
      });
    }
  };

  // Today Mode View
  if (isTodayMode) {
    return (
      <AppLayout>
        <div className="container mx-auto px-6 py-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-light text-foreground tracking-tight">
                Today's Focus
              </h1>
              <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                {todayTasks.length} tasks
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowQuickAdd(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
              
              <Button
                onClick={() => setIsTodayMode(false)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                All Tasks
              </Button>
            </div>
          </div>

          <div className="max-w-2xl">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p>No overdue or due today tasks. Great work!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <div key={task.id} className="group">
                    <DraggableTaskCard
                      task={task}
                      onStatusChange={handleTaskStatusChange}
                    />
                    
                    {/* Quick actions on hover */}
                    <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRescheduleToTomorrow(task.id)}
                        className="text-xs h-7"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Tomorrow
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

  // Scheduling Mode View
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
                {schedulingTasks.length} tasks
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

          {/* Controls Panel */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <select
                value={schedulingSort}
                onChange={(e) => setSchedulingSort(e.target.value as any)}
                className="px-2 py-1 text-sm bg-background border border-border rounded"
              >
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
                <option value="created">Created</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={schedulingFilter.project}
                onChange={(e) => setSchedulingFilter(prev => ({ ...prev, project: e.target.value }))}
                className="px-2 py-1 text-sm bg-background border border-border rounded"
              >
                <option value="all">All Projects</option>
                {projects.filter(p => !p.isDeleted).map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            <select
              value={schedulingFilter.priority}
              onChange={(e) => setSchedulingFilter(prev => ({ ...prev, priority: e.target.value }))}
              className="px-2 py-1 text-sm bg-background border border-border rounded"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={schedulingFilter.status}
              onChange={(e) => setSchedulingFilter(prev => ({ ...prev, status: e.target.value }))}
              className="px-2 py-1 text-sm bg-background border border-border rounded"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-6 h-[calc(100vh-280px)]">
            {/* Tasks Column */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Drag tasks to schedule ({schedulingTasks.length})
                </h3>
                {schedulingTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No tasks match your filters
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedulingTasks.map(task => (
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
                tasks={schedulingTasks}
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

  // Default Task List View
  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="bg-muted px-3 py-1.5 rounded-full text-sm font-medium">
              {allTasks.length} tasks
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsSchedulingMode(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
          </div>
        </div>
        
        <TaskListView className="h-full" />
      </div>
    </AppLayout>
  );
} 