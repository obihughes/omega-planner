import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask, ProjectsStorageData } from '@/types';

const STORAGE_KEY = 'sunsama-projects';
const STORAGE_VERSION = '1.0.0';

// Helper to save to localStorage
const saveProjectsToStorage = (projects: Project[]) => {
  try {
    const data: ProjectsStorageData = {
      version: STORAGE_VERSION,
      projects: projects,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving projects:', error);
  }
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: ProjectsStorageData = JSON.parse(stored);
        if (data.version === STORAGE_VERSION) {
          const migratedProjects = data.projects.map(project => ({
            ...project,
            tasks: project.tasks.map((task, index) => ({
              ...task,
              order: task.order ?? index,
            })),
          }));
          setProjects(migratedProjects);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic state-safe update function
  const updateProjectsState = (updater: (prevProjects: Project[]) => Project[]) => {
    setProjects(prevProjects => {
      const updatedProjects = updater(prevProjects);
      saveProjectsToStorage(updatedProjects);
      return updatedProjects;
    });
  };

  const createProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'progress'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tasks: [],
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateProjectsState(prevProjects => [...prevProjects, newProject]);
    return newProject;
  }, []);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    updateProjectsState(prevProjects => 
      prevProjects.map(p => 
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  // Soft delete a project by setting `isDeleted: true`
  const deleteProject = useCallback((projectId: string) => {
    updateProjectsState(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, isDeleted: true, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const addTaskToProject = useCallback((projectId: string, taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    let newTask: ProjectTask | null = null;
    updateProjectsState(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          newTask = {
            ...taskData,
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: project.tasks.length,
          };
          const updatedTasks = [...project.tasks, newTask];
          const completedTasks = updatedTasks.filter(t => t.status === 'completed').length;
          const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
          return { ...project, tasks: updatedTasks, progress, updatedAt: new Date().toISOString() };
        }
        return project;
      })
    );
    return newTask;
  }, []);

  const updateTaskInProject = useCallback((projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    updateProjectsState(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          const updatedTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              const updatedTask = { ...task, ...updates, updatedAt: new Date().toISOString() };
              if (updates.status === 'completed' && task.status !== 'completed') {
                updatedTask.completedAt = new Date().toISOString();
              } else if (updates.status && updates.status !== 'completed' && task.status === 'completed') {
                updatedTask.completedAt = undefined;
              }
              return updatedTask;
            }
            return task;
          });
          const completedTasks = updatedTasks.filter(t => t.status === 'completed').length;
          const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
          return { ...project, tasks: updatedTasks, progress, updatedAt: new Date().toISOString() };
        }
        return project;
      })
    );
  }, []);

  const reorderTasksInProject = useCallback((projectId: string, activeId: string, overId: string) => {
    if (activeId === overId) return;
    updateProjectsState(prevProjects => {
      const projectIndex = prevProjects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) return prevProjects;

      const project = { ...prevProjects[projectIndex] };
      const activeTaskIndex = project.tasks.findIndex(t => t.id === activeId);
      const overTaskIndex = project.tasks.findIndex(t => t.id === overId);
      if (activeTaskIndex === -1 || overTaskIndex === -1) return prevProjects;

      const reorderedTasks = Array.from(project.tasks);
      const [movedTask] = reorderedTasks.splice(activeTaskIndex, 1);
      reorderedTasks.splice(overTaskIndex, 0, movedTask);
      
      project.tasks = reorderedTasks.map((task, index) => ({ ...task, order: index }));
      project.updatedAt = new Date().toISOString();

      const newProjects = [...prevProjects];
      newProjects[projectIndex] = project;
      return newProjects;
    });
  }, []);

  const deleteTaskFromProject = useCallback((projectId: string, taskId: string) => {
    updateProjectsState(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          const updatedTasks = project.tasks.filter(t => t.id !== taskId);
          const completedTasks = updatedTasks.filter(t => t.status === 'completed').length;
          const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
          return { ...project, tasks: updatedTasks, progress, updatedAt: new Date().toISOString() };
        }
        return project;
      })
    );
  }, []);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    addTaskToProject,
    updateTaskInProject,
    deleteTaskFromProject,
    reorderTasksInProject
  };
} 