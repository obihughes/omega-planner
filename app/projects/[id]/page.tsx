'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectTask } from '@/types';
import { TaskItem } from '@/components/projects/TaskItem';
import { AppLayout } from '@/components/ui/AppLayout';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ArrowLeft,
  Plus,
  Folder,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Edit,
} from 'lucide-react';

interface ProjectDetailPageProps {
  params: { id: string };
}

// Lazy load the modals to reduce initial bundle size
const ProjectTaskFormModal = lazy(() => import('@/components/modals/ProjectTaskFormModal').then(module => ({ default: module.ProjectTaskFormModal })));
const ProjectFormModal = lazy(() => import('@/components/modals/ProjectFormModal').then(module => ({ default: module.ProjectFormModal })));

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const { 
    projects, 
    loading, 
    addTaskToProject, 
    updateTaskInProject, 
    deleteTaskFromProject,
    reorderTasksInProject,
    updateProject
  } = useProjects();
  
  const [statusFilter, setStatusFilter] = useState<ProjectTask['status'] | 'all'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Task form modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  
  // Project form modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const project = projects.find(p => p.id === params.id);
  
  // Use project tasks directly instead of local state to avoid sync issues
  const tasks = project?.tasks || [];

  useEffect(() => {
    if (!loading && !project) {
      router.push('/projects');
    }
  }, [loading, project, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const taskInput = document.querySelector('input[placeholder*="Type task name"]') as HTMLInputElement;
        if (taskInput) {
          taskInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize expensive filtering and sorting operations
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter(task => statusFilter === 'all' || task.status === statusFilter)
      .sort((a, b) => a.order - b.order);
  }, [tasks, statusFilter]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleTaskStatusChange = useCallback((taskId: string, status: ProjectTask['status']) => {
    if (!project) return;
    
    // Update directly in the backend/localStorage - no local state needed
    updateTaskInProject(project.id, taskId, { status });
  }, [project, updateTaskInProject]);

  const handleEditTask = useCallback((task: ProjectTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!project) return;
    deleteTaskFromProject(project.id, taskId);
  }, [project, deleteTaskFromProject]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!project) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Update the backend directly
      reorderTasksInProject(project.id, active.id as string, over.id as string);
    }
  }, [project, reorderTasksInProject]);

  const handleAddTask = useCallback(() => {
    if (!project || !newTaskTitle.trim()) return;
    
    addTaskToProject(project.id, {
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium'
    });
    
    setNewTaskTitle('');
  }, [project, newTaskTitle, addTaskToProject]);

  const handleSaveTask = useCallback((taskData: Partial<ProjectTask>, isNew: boolean) => {
    if (!project) return;
    
    if (isNew) {
      addTaskToProject(project.id, taskData as Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>);
    } else if (editingTask) {
      updateTaskInProject(project.id, editingTask.id, taskData);
    }
  }, [project, editingTask, addTaskToProject, updateTaskInProject]);

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  }, []);

  // Project editing handlers
  const handleEditProject = useCallback(() => {
    setIsProjectModalOpen(true);
  }, []);

  const handleSaveProject = useCallback((projectData: Partial<Project>, isNew: boolean) => {
    if (!project || isNew) return; // We're only editing existing projects here
    
    updateProject(project.id, projectData);
  }, [project, updateProject]);

  const handleCloseProjectModal = useCallback(() => {
    setIsProjectModalOpen(false);
  }, []);

  // Early returns after all hooks are defined
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return null;
  }

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Circle className="w-5 h-5 text-blue-500" />;
      case 'on-hold':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'planning':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'cancelled':
        return <Circle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
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


  
  const completedTasks = tasks.filter(task => task.status === 'completed').length || 0;
  const totalTasks = tasks.length || 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 font-['Inter',sans-serif]">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-semibold text-foreground font-['Inter',sans-serif] tracking-tight text-center">
                {project.name}
              </h1>
              <button
                onClick={handleEditProject}
                className="p-2 hover:bg-accent transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                title="Edit project"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Edit</span>
              </button>
            </div>
            
            {/* Task Progress Circles - Similar to card design */}
            <div className="flex items-center justify-center space-x-3 my-6">
              <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                {completedTasks}/{totalTasks}
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {Array.from({ length: Math.min(totalTasks, 12) }, (_, i) => {
                  const isCompleted = i < completedTasks;
                  return (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                        isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                      }`}
                    />
                  );
                })}
                {totalTasks > 12 && (
                  <span className="text-sm text-muted-foreground ml-1 whitespace-nowrap font-medium">+{totalTasks - 12}</span>
                )}
              </div>
            </div>

            {/* Status Line - Similar to card design */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/30">
              <div className="flex items-center space-x-4">
                <span className="font-medium">
                  {project.progress}% complete
                </span>
                {project.endDate && (() => {
                  const { text, isOverdue } = formatTimeRemaining(project.endDate);
                  return (
                    <span className={`flex items-center space-x-1 ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                      <Clock className="w-3 h-3" />
                      <span>{text}</span>
                    </span>
                  );
                })()}
                <span className={`px-2 py-1 text-xs font-medium border rounded-full ml-auto ${
                  project.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' :
                  project.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700' :
                  project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' :
                  project.status === 'planning' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700' :
                  project.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700' :
                  'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700'
                }`}>
                  {project.status.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Task Input and Filters */}
        <div className="flex items-center space-x-3 mb-6">
           <div className="relative flex-1">
             <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Type task name and press Enter to add..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring font-['Inter',sans-serif]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  handleAddTask();
                } else if (e.key === 'Escape') {
                  setNewTaskTitle('');
                }
              }}
            />
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center space-x-2"
            title="Create detailed task"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectTask['status'] | 'all')}
            className="px-3 py-2 bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring font-['Inter',sans-serif]"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Tasks List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredAndSortedTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {filteredAndSortedTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  task={task}
                  taskIndex={index + 1}
                  totalTasks={filteredAndSortedTasks.length}
                  onStatusChange={handleTaskStatusChange}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {filteredAndSortedTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4 font-['Inter',sans-serif]">
              {tasks.length === 0 ? 'No tasks in this project yet.' : 'No tasks match your filters.'}
            </div>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <Suspense fallback={null}>
        {isTaskModalOpen && (
          <ProjectTaskFormModal
            isOpen={isTaskModalOpen}
            onClose={handleCloseTaskModal}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            taskToEdit={editingTask}
          />
        )}
      </Suspense>

      {/* Project Form Modal */}
      <Suspense fallback={null}>
        {isProjectModalOpen && (
          <ProjectFormModal
            isOpen={isProjectModalOpen}
            onClose={handleCloseProjectModal}
            onSave={handleSaveProject}
            project={project}
          />
        )}
      </Suspense>
    </AppLayout>
  );
} 