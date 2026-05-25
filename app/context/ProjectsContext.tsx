'use client';

import { createContext, useContext } from 'react';
import { Project, ProjectTask, SubTask, ProjectFolder, ProjectSeries } from '@/types';

export interface ProjectsContextType {
  projects: Project[];
  folders: ProjectFolder[];
  loading: boolean;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'progress' | 'order' | 'series'>) => Project;
  cloneProject: (sourceProject: Project) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  permanentlyDeleteProject: (projectId: string) => void;
  reorderProjects: (activeId: string, overId: string) => void;
  addTaskToProject: (projectId: string, taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => ProjectTask | null;
  addTaskSeriesToProject: (
    projectId: string,
    baseTitle: string,
    count: number,
    options?: Partial<Pick<ProjectTask, 'status' | 'priority' | 'startDate' | 'dueDate'>>
  ) => ProjectTask[];
  addProjectSeries: (
    projectId: string,
    seriesData: Omit<ProjectSeries, 'id' | 'createdAt' | 'updatedAt'>,
    taskOptions?: Partial<Pick<ProjectTask, 'status' | 'priority' | 'startDate' | 'dueDate'>>
  ) => void;
  updateProjectSeries: (projectId: string, seriesId: string, updates: Partial<ProjectSeries>) => void;
  deleteProjectSeries: (projectId: string, seriesId: string) => void;
  updateTaskInProject: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void;
  deleteTaskFromProject: (projectId: string, taskId: string) => void;
  reorderTasksInProject: (projectId: string, activeId: string, overId: string) => void;
  addSubtaskToTask: (projectId: string, taskId: string, subtaskData: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateSubtaskInTask: (projectId: string, taskId: string, subtaskId: string, updates: Partial<SubTask>) => void;
  deleteSubtaskFromTask: (projectId: string, taskId: string, subtaskId: string) => void;
  addTaskSeries: (projectId: string, taskId: string, seriesData: Omit<ProjectSeries, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskSeries: (projectId: string, taskId: string, seriesId: string, updates: Partial<ProjectSeries>) => void;
  deleteTaskSeries: (projectId: string, taskId: string, seriesId: string) => void;
  getAllProjectTasks: () => (ProjectTask & {
    projectId: string;
    projectName: string;
    projectColor: string;
    projectStatus: Project['status'];
  })[];
  getTaskStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    blocked: number;
    overdue: number;
  };
  createUnassignedTask: (taskData: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => ProjectTask | null;
  createFolder: (folderData: Omit<ProjectFolder, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => ProjectFolder;
  updateFolder: (folderId: string, updates: Partial<ProjectFolder>) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  moveProjectToFolder: (projectId: string, folderId: string | undefined) => void;
  getProjectsInFolder: (folderId: string | undefined) => Project[];
}

export const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function useProjectsContext() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider');
  }
  return context;
}
