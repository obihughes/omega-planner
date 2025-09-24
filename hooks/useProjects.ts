import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask, SubTask, ProjectsStorageData, ProjectFolder } from '@/types';

const STORAGE_KEY = 'omega-planner-projects';
const STORAGE_VERSION = '1.0.0';

// Helper to save to localStorage
const saveProjectsToStorage = (projects: Project[], folders: ProjectFolder[]) => {
  try {
    const data: ProjectsStorageData = {
      version: STORAGE_VERSION,
      projects: projects,
      folders: folders,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving projects:', error);
  }
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects and folders from localStorage
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
          
          const migratedFolders = (data.folders || []).map((folder, index) => ({
            ...folder,
            order: folder.order ?? index,
            isExpanded: folder.isExpanded ?? true,
          }));
          setFolders(migratedFolders);
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generic state-safe update function for projects
  const updateProjectsState = (updater: (prevProjects: Project[]) => Project[]) => {
    setProjects(prevProjects => {
      const updatedProjects = updater(prevProjects);
      // Need to get current folders state to save properly
      setFolders(currentFolders => {
        saveProjectsToStorage(updatedProjects, currentFolders);
        return currentFolders;
      });
      return updatedProjects;
    });
  };

  // Generic state-safe update function for folders
  const updateFoldersState = (updater: (prevFolders: ProjectFolder[]) => ProjectFolder[]) => {
    setFolders(prevFolders => {
      const updatedFolders = updater(prevFolders);
      // Need to get current projects state to save properly
      setProjects(currentProjects => {
        saveProjectsToStorage(currentProjects, updatedFolders);
        return currentProjects;
      });
      return updatedFolders;
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

  const cloneProject = useCallback((sourceProject: Project) => {
    const clonedTasks = sourceProject.tasks.map((task, index) => ({
      ...task,
      id: `task-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      order: index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const clonedProject: Project = {
      ...sourceProject,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${sourceProject.name} (Copy)`,
      tasks: clonedTasks,
      progress: sourceProject.tasks.length > 0 ? Math.round((clonedTasks.filter(t => t.status === 'completed').length / clonedTasks.length) * 100) : 0,
      order: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateProjectsState(prevProjects => [...prevProjects, clonedProject]);
    return clonedProject;
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

  const addTaskSeriesToProject = useCallback((
    projectId: string,
    baseTitle: string,
    count: number,
    options?: Partial<Pick<ProjectTask, 'status' | 'priority' | 'startDate' | 'dueDate'>>
  ) => {
    if (!baseTitle || count <= 0) return [] as ProjectTask[];

    const createdTasks: ProjectTask[] = [];
    const nowIso = new Date().toISOString();

    updateProjectsState(prevProjects =>
      prevProjects.map(project => {
        if (project.id !== projectId) return project;

        const startingOrder = project.tasks.length;
        const newTasks: ProjectTask[] = Array.from({ length: count }).map((_, i) => ({
          id: `task-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          title: `${baseTitle}_${i + 1}`,
          description: '',
          status: options?.status ?? 'todo',
          priority: options?.priority ?? 'medium',
          startDate: options?.startDate,
          dueDate: options?.dueDate,
          createdAt: nowIso,
          updatedAt: nowIso,
          order: startingOrder + i,
        }));

        createdTasks.push(...newTasks);

        const updatedTasks = [...project.tasks, ...newTasks];
        const completedTasks = updatedTasks.filter(t => t.status === 'completed').length;
        const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;

        return { ...project, tasks: updatedTasks, progress, updatedAt: nowIso };
      })
    );

    return createdTasks;
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

  // Get all tasks from all active projects with project metadata
  const getAllProjectTasks = useCallback(() => {
    return projects
      .filter(p => !p.isDeleted)
      .flatMap(project => 
        project.tasks.map(task => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          projectStatus: project.status
        }))
      );
  }, [projects]);

  // Get task statistics
  const getTaskStats = useCallback(() => {
    const allTasks = getAllProjectTasks();
    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      blocked: allTasks.filter(t => t.status === 'blocked').length,
      overdue: allTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date() && t.status !== 'completed';
      }).length
    };
  }, [getAllProjectTasks]);

  // Create unassigned task (no project)
  const createUnassignedTask = useCallback((taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    // We'll store unassigned tasks as a special "Unassigned" project
    let unassignedProject = projects.find(p => p.id === 'unassigned');
    
    if (!unassignedProject) {
      // Create the unassigned project if it doesn't exist
      unassignedProject = {
        id: 'unassigned',
        name: 'Unassigned',
        description: 'Tasks without a project',
        status: 'active',
        color: '#6B7280',
        tasks: [],
        progress: 0,
        order: -1, // Put it first
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setProjects(prevProjects => {
        const updatedProjects = [unassignedProject!, ...prevProjects];
        saveProjectsToStorage(updatedProjects, folders);
        return updatedProjects;
      });
    }
    
    return addTaskToProject('unassigned', taskData);
  }, [projects, addTaskToProject]);

  // Folder management functions
  const createFolder = useCallback((folderData: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const newFolder: ProjectFolder = {
      ...folderData,
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: Date.now(),
      isExpanded: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateFoldersState(prevFolders => [...prevFolders, newFolder]);
    return newFolder;
  }, []);

  const updateFolder = useCallback((folderId: string, updates: Partial<ProjectFolder>) => {
    updateFoldersState(prevFolders => 
      prevFolders.map(f => 
        f.id === folderId ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
      )
    );
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    // Move projects from this folder to "All Projects" (remove folderId)
    updateProjectsState(prevProjects =>
      prevProjects.map(p =>
        p.folderId === folderId ? { ...p, folderId: undefined, updatedAt: new Date().toISOString() } : p
      )
    );
    
    // Remove the folder
    updateFoldersState(prevFolders =>
      prevFolders.filter(f => f.id !== folderId)
    );
  }, []);

  const toggleFolder = useCallback((folderId: string) => {
    updateFoldersState(prevFolders => 
      prevFolders.map(f => 
        f.id === folderId ? { ...f, isExpanded: !f.isExpanded, updatedAt: new Date().toISOString() } : f
      )
    );
  }, []);

  const moveProjectToFolder = useCallback((projectId: string, folderId: string | undefined) => {
    updateProjectsState(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, folderId, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const getProjectsInFolder = useCallback((folderId: string | undefined) => {
    return projects.filter(p => !p.isDeleted && p.folderId === folderId);
  }, [projects]);

  return {
    projects,
    folders,
    loading,
    createProject,
    cloneProject,
    updateProject,
    deleteProject,
    restoreProject,
    permanentlyDeleteProject,
    reorderProjects,
    addTaskToProject,
    addTaskSeriesToProject,
    updateTaskInProject,
    deleteTaskFromProject,
    reorderTasksInProject,
    addSubtaskToTask,
    updateSubtaskInTask,
    deleteSubtaskFromTask,
    getAllProjectTasks,
    getTaskStats,
    createUnassignedTask,
    // Folder functions
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolder,
    moveProjectToFolder,
    getProjectsInFolder
  };
} 