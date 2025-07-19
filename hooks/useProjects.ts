import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask, SubTask, ProjectsStorageData } from '@/types';

const STORAGE_KEY = 'omega-planner-projects';
const STORAGE_VERSION = '1.0.0';

// Helper to save to localStorage
const saveProjectsToStorage = (projects: Project[]) => {
  try {
    const data: ProjectsStorageData = {
      version: STORAGE_VERSION,
      projects: projects,
      folders: [], // Initialize empty folders array for now
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
          const migratedProjects = data.projects.map((project, index) => ({
            ...project,
            order: project.order ?? index, // Ensure order exists
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

  const createProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'progress' | 'order'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tasks: [],
      progress: 0,
      order: Date.now(), // Use timestamp for initial ordering
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

  // Restore a deleted project
  const restoreProject = useCallback((projectId: string) => {
    updateProjectsState(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, isDeleted: false, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  // Permanently delete a project
  const permanentlyDeleteProject = useCallback((projectId: string) => {
    updateProjectsState(prevProjects =>
      prevProjects.filter(p => p.id !== projectId)
    );
  }, []);

  // Reorder projects
  const reorderProjects = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    
    updateProjectsState(prevProjects => {
      const activeIndex = prevProjects.findIndex(p => p.id === activeId);
      const overIndex = prevProjects.findIndex(p => p.id === overId);
      
      if (activeIndex === -1 || overIndex === -1) return prevProjects;

      const reorderedProjects = Array.from(prevProjects);
      const [movedProject] = reorderedProjects.splice(activeIndex, 1);
      reorderedProjects.splice(overIndex, 0, movedProject);
      
      // Update order values based on new positions
      return reorderedProjects.map((project, index) => ({
        ...project,
        order: index,
        updatedAt: new Date().toISOString()
      }));
    });
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

  // Subtask management functions
  const addSubtaskToTask = useCallback((projectId: string, taskId: string, subtaskData: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    updateProjectsState(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          const updatedTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              const currentSubtasks = task.subtasks || [];
              const newSubtask: SubTask = {
                id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                ...subtaskData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                order: currentSubtasks.length
              };
              return { 
                ...task, 
                subtasks: [...currentSubtasks, newSubtask],
                updatedAt: new Date().toISOString()
              };
            }
            return task;
          });
          return { ...project, tasks: updatedTasks, updatedAt: new Date().toISOString() };
        }
        return project;
      })
    );
  }, []);

  const updateSubtaskInTask = useCallback((projectId: string, taskId: string, subtaskId: string, updates: Partial<SubTask>) => {
    updateProjectsState(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          const updatedTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              const updatedSubtasks = (task.subtasks || []).map(subtask => {
                if (subtask.id === subtaskId) {
                  const updatedSubtask = { 
                    ...subtask, 
                    ...updates, 
                    updatedAt: new Date().toISOString()
                  };
                  if (updates.status === 'completed' && !subtask.completedAt) {
                    updatedSubtask.completedAt = new Date().toISOString();
                  } else if (updates.status !== 'completed') {
                    updatedSubtask.completedAt = undefined;
                  }
                  return updatedSubtask;
                }
                return subtask;
              });
              return { 
                ...task, 
                subtasks: updatedSubtasks,
                updatedAt: new Date().toISOString()
              };
            }
            return task;
          });
          return { ...project, tasks: updatedTasks, updatedAt: new Date().toISOString() };
        }
        return project;
      })
    );
  }, []);

  const deleteSubtaskFromTask = useCallback((projectId: string, taskId: string, subtaskId: string) => {
    updateProjectsState(prevProjects => 
      prevProjects.map(project => {
        if (project.id === projectId) {
          const updatedTasks = project.tasks.map(task => {
            if (task.id === taskId) {
              const updatedSubtasks = (task.subtasks || []).filter(subtask => subtask.id !== subtaskId);
              return { 
                ...task, 
                subtasks: updatedSubtasks,
                updatedAt: new Date().toISOString()
              };
            }
            return task;
          });
          return { ...project, tasks: updatedTasks, updatedAt: new Date().toISOString() };
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
    restoreProject,
    permanentlyDeleteProject,
    reorderProjects,
    addTaskToProject,
    updateTaskInProject,
    deleteTaskFromProject,
    reorderTasksInProject,
    addSubtaskToTask,
    updateSubtaskInTask,
    deleteSubtaskFromTask
  };
} 