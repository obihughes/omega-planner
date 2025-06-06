import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask, ProjectsStorageData } from '@/types';

const STORAGE_KEY = 'sunsama-projects';
const STORAGE_VERSION = '1.0.0';

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
          // --- Data Migration ---
          // Add 'order' property to tasks if it's missing
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

  // Save projects to localStorage
  const saveProjects = useCallback((updatedProjects: Project[]) => {
    try {
      const data: ProjectsStorageData = {
        version: STORAGE_VERSION,
        projects: updatedProjects,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }, []);

  // Create a new project
  const createProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'progress'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tasks: [],
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);
    return newProject;
  }, [projects, saveProjects]);

  // Update a project
  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    const updatedProjects = projects.map(project => 
      project.id === projectId 
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    );
    saveProjects(updatedProjects);
  }, [projects, saveProjects]);

  // Delete a project
  const deleteProject = useCallback((projectId: string) => {
    const updatedProjects = projects.filter(project => project.id !== projectId);
    saveProjects(updatedProjects);
  }, [projects, saveProjects]);

  // Add task to project
  const addTaskToProject = useCallback((projectId: string, taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    
    let newTask: ProjectTask | null = null;

    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        
        newTask = {
          ...taskData,
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: project.tasks.length, // Assign order at the end
        };

        const updatedTasks = [...project.tasks, newTask];
        const completedTasks = updatedTasks.filter(task => task.status === 'completed').length;
        const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
        
        return {
          ...project,
          tasks: updatedTasks,
          progress,
          updatedAt: new Date().toISOString()
        };
      }
      return project;
    });
    
    saveProjects(updatedProjects);
    return newTask;
  }, [projects, saveProjects]);

  // Update task in project
  const updateTaskInProject = useCallback((projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.map(task =>
          task.id === taskId 
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        );
        
        const completedTasks = updatedTasks.filter(task => task.status === 'completed').length;
        const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
        
        return {
          ...project,
          tasks: updatedTasks,
          progress,
          updatedAt: new Date().toISOString()
        };
      }
      return project;
    });
    
    saveProjects(updatedProjects);
  }, [projects, saveProjects]);

  // Reorder tasks in project
  const reorderTasksInProject = useCallback((projectId: string, activeId: string, overId: string) => {
    if (activeId === overId) return;

    setProjects(prevProjects => {
      const projectIndex = prevProjects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) return prevProjects;

      const projectToUpdate = { ...prevProjects[projectIndex] };
      const activeTaskIndex = projectToUpdate.tasks.findIndex(t => t.id === activeId);
      const overTaskIndex = projectToUpdate.tasks.findIndex(t => t.id === overId);

      if (activeTaskIndex === -1 || overTaskIndex === -1) return prevProjects;
      
      const updatedTasks = Array.from(projectToUpdate.tasks);
      const [movedTask] = updatedTasks.splice(activeTaskIndex, 1);
      updatedTasks.splice(overTaskIndex, 0, movedTask);

      const reorderedTasksWithUpdatedOrder = updatedTasks.map((task, index) => ({
        ...task,
        order: index,
      }));

      projectToUpdate.tasks = reorderedTasksWithUpdatedOrder;
      projectToUpdate.updatedAt = new Date().toISOString();

      const newProjects = [...prevProjects];
      newProjects[projectIndex] = projectToUpdate;
      
      saveProjects(newProjects);
      return newProjects;
    });

  }, [saveProjects]);

  // Delete task from project
  const deleteTaskFromProject = useCallback((projectId: string, taskId: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        const updatedTasks = project.tasks.filter(task => task.id !== taskId);
        const completedTasks = updatedTasks.filter(task => task.status === 'completed').length;
        const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
        
        return {
          ...project,
          tasks: updatedTasks,
          progress,
          updatedAt: new Date().toISOString()
        };
      }
      return project;
    });
    
    saveProjects(updatedProjects);
  }, [projects, saveProjects]);

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