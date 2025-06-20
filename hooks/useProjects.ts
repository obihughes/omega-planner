import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectTask } from '@/types';
import { supabase } from '@/lib/supabaseClient';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects from Supabase
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_deleted', false)
        .order('order', { ascending: true });

      if (error) {
        throw error;
      }

      // Note: Tasks are not stored in the projects table in this new schema.
      // We will need to handle tasks separately. For now, initialize as empty.
      const projectsWithEmptyTasks = data.map(p => ({ ...p, tasks: [], progress: 0 }));
      setProjects(projectsWithEmptyTasks);

    } catch (error) {
      console.error('Error loading projects from Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'progress' | 'order'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, order: projects.length }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newProjectWithEmptyTasks = { ...data, tasks: [], progress: 0 };
      setProjects(prevProjects => [...prevProjects, newProjectWithEmptyTasks]);
      return newProjectWithEmptyTasks;

    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }, [projects.length]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      setProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === projectId ? { ...p, ...data, tasks: p.tasks } : p // preserve tasks
        )
      );
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }, []);

  // Restore a deleted project (example, not fully implemented in UI yet)
  const restoreProject = useCallback(async (projectId: string) => {
    // This would require fetching deleted projects first.
    // For now, it's a placeholder for future functionality.
    console.log('Restoring project:', projectId);
  }, []);

  // Permanently delete a project
  const permanentlyDeleteProject = useCallback(async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      // No need to update state, as it should already be filtered out by `deleteProject`
    } catch (error) {
      console.error('Error permanently deleting project:', error);
    }
  }, []);

  // Reorder projects
  const reorderProjects = useCallback(async (activeId: string, overId: string) => {
    if (activeId === overId) return;
    
    const originalProjects = [...projects];
    const activeIndex = projects.findIndex(p => p.id === activeId);
    const overIndex = projects.findIndex(p => p.id === overId);
    
    if (activeIndex === -1 || overIndex === -1) return;

    const reordered = Array.from(projects);
    const [movedProject] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, movedProject);
    
    const updatedProjectsWithOrder = reordered.map((project, index) => ({
      ...project,
      order: index,
    }));
    
    setProjects(updatedProjectsWithOrder);

    try {
      const updates = updatedProjectsWithOrder.map(p => ({
        id: p.id,
        order: p.order,
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('projects').upsert(updates);
      if (error) throw error;

    } catch (error) {
      console.error('Error reordering projects:', error);
      setProjects(originalProjects); // Revert on error
    }
  }, [projects]);

  // --- Task-related functions are now more complex ---
  // --- They will need their own `tasks` table in Supabase ---
  // --- For now, they will only manipulate local state ---

  const addTaskToProject = useCallback((projectId: string, taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const newTask: ProjectTask = {
      ...taskData,
      id: `task-local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0 // Will need to be managed properly later
    };
    
    setProjects(prevProjects => 
      prevProjects.map(p => {
        if (p.id === projectId) {
          return { ...p, tasks: [...p.tasks, newTask] };
        }
        return p;
      })
    );
    console.warn("Task created locally. To persist, create a 'tasks' table in Supabase.");
    return newTask;
  }, []);

  const updateTaskInProject = useCallback((projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    setProjects(prevProjects => 
      prevProjects.map(p => {
        if (p.id === projectId) {
          const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
          return { ...p, tasks: updatedTasks };
        }
        return p;
      })
    );
    console.warn("Task updated locally. To persist, create a 'tasks' table in Supabase.");
  }, []);

  const reorderTasksInProject = useCallback((projectId: string, activeId: string, overId: string) => {
    console.warn("Task reordering is local-only until a 'tasks' table is created in Supabase.");
    if (activeId === overId) return;

    setProjects(prevProjects => {
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
      
      const newProjects = [...prevProjects];
      newProjects[projectIndex] = project;
      return newProjects;
    });
  }, []);

  // This function would be removed or refactored once tasks are in their own table
  const getProjectById = useCallback((projectId: string) => {
    return projects.find(p => p.id === projectId);
  }, [projects]);


  return {
    projects: projects.filter(p => !p.isDeleted),
    allProjects: projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    restoreProject,
    permanentlyDeleteProject,
    reorderProjects,
    addTaskToProject,
    updateTaskInProject,
    reorderTasksInProject,
    getProjectById
  };
} 