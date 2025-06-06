'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectTask } from '@/types';
import { TaskItem } from '@/components/projects/TaskItem';
import { Navigation } from '@/components/ui/Navigation';
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
} from 'lucide-react';

interface ProjectDetailPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const { 
    projects, 
    loading, 
    addTaskToProject, 
    updateTaskInProject, 
    deleteTaskFromProject,
    reorderTasksInProject 
  } = useProjects();
  
  const [statusFilter, setStatusFilter] = useState<ProjectTask['status'] | 'all'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const project = projects.find(p => p.id === params.id);
  
  // Local state for tasks to enable smooth D&D updates
  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  useEffect(() => {
    if (project?.tasks) {
      setTasks(project.tasks);
    }
  }, [project?.tasks]);

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
    updateTaskInProject(project.id, taskId, { status });
    setTasks(current => current.map(t => t.id === taskId ? {...t, status} : t));
  }, [project, updateTaskInProject]);

  const handleEditTask = useCallback((task: ProjectTask) => {
    console.log('Edit task:', task.id);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    if (!project) return;
    deleteTaskFromProject(project.id, taskId);
    setTasks(current => current.filter(t => t.id !== taskId));
  }, [project, deleteTaskFromProject]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!project) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Update the backend
        reorderTasksInProject(project.id, active.id as string, over.id as string);
        
        return newOrder;
      });
    }
  }, [project, reorderTasksInProject]);

  const handleAddTask = useCallback(() => {
    if (!project || !newTaskTitle.trim()) return;
    
    const addedTask = addTaskToProject(project.id, {
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium'
    });
    if(addedTask) {
      setTasks(current => [...current, addedTask]);
    }
    setNewTaskTitle('');
  }, [project, newTaskTitle, addTaskToProject]);

  // Early returns after all hooks are defined
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </div>
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
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < -1) return { text: `Overdue by ${Math.abs(diffDays)} days`, isOverdue: true };
    if (diffDays === -1) return { text: `Overdue by 1 day`, isOverdue: true };
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  };


  
  const completedTasks = tasks.filter(task => task.status === 'completed').length || 0;
  const totalTasks = tasks.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: project.color + '20', color: project.color }}
          >
            <Folder className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-2">
                {getStatusIcon(project.status)}
                <span className="text-sm text-muted-foreground capitalize">
                  {project.status.replace('-', ' ')}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {completedTasks}/{totalTasks} tasks completed
              </span>
            </div>
            {project.endDate && (() => {
              const { text, isOverdue } = formatTimeRemaining(project.endDate);
              return (
                <div className={`flex items-center space-x-2 text-sm mt-1 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                  <Clock className="w-4 h-4" />
                  <span>{text}</span>
                </div>
              );
            })()}
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
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  handleAddTask();
                } else if (e.key === 'Escape') {
                  setNewTaskTitle('');
                }
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectTask['status'] | 'all')}
            className="px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
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
            <div className="text-muted-foreground mb-4">
              {tasks.length === 0 ? 'No tasks in this project yet.' : 'No tasks match your filters.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 