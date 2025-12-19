/**
 * Project Management Types
 */

export interface SubTask {
  /** Unique identifier for the subtask */
  id: string;
  
  /** Subtask title */
  title: string;
  
  /** Subtask description */
  description?: string;
  
  /** Subtask status */
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  
  /** Due date */
  dueDate?: string;
  
  /** Completion timestamp */
  completedAt?: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Display order for the subtask within a task */
  order: number;
}

export interface ProjectTask {
  /** Unique identifier for the task */
  id: string;
  
  /** Task title */
  title: string;
  
  /** Task description */
  description?: string;
  
  /** Task status */
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  /** Start date - when the task should begin */
  startDate?: string;
  
  /** Due date */
  dueDate?: string;
  
  /** Completion timestamp - when the task was marked as completed */
  completedAt?: string;
  
  /** Assigned to (for future use) */
  assignedTo?: string;
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Estimated hours to complete */
  estimatedHours?: number;
  
  /** Actual hours spent */
  actualHours?: number;

  /** Display order for the task within a project */
  order: number;
  
  /** Subtasks for hierarchical task management */
  subtasks?: SubTask[];

  /** ID of the series this task belongs to */
  seriesId?: string;

  /** Index of this task within the series generation (0-based) */
  seriesIndex?: number;
}

export interface ProjectFolder {
  /** Unique identifier for the folder */
  id: string;
  
  /** Folder name */
  name: string;
  
  /** Folder description */
  description?: string;
  
  /** Folder color for visual identification */
  color: string;
  
  /** Folder icon */
  icon?: string;
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Display order for the folder */
  order: number;
  
  /** Whether the folder is expanded in the UI */
  isExpanded?: boolean;
}

export type SeriesSegmentType = 'text' | 'number' | 'letter';

export interface SeriesSegment {
  id: string;
  type: SeriesSegmentType;
  /** For text type */
  value?: string;
  /** For number/letter type */
  start?: number | string;
  /** For number/letter type */
  end?: number | string;
  /** Step for number ranges */
  step?: number;
}

export interface ProjectSeries {
  id: string;
  name: string;
  segments: SeriesSegment[];
  /** Indices of generated items to exclude */
  excludedIndices?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  /** Unique identifier for the project */
  id: string;
  
  /** Project name */
  name: string;
  
  /** Project description */
  description?: string;
  
  /** Project status */
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  
  /** Project color for visual identification */
  color: string;
  
  /** Project icon */
  icon?: string;
  
  /** Start date */
  startDate?: string;
  
  /** Target end date */
  endDate?: string;
  
  /** Project tasks */
  tasks: ProjectTask[];
  
  /** Project series definitions */
  series?: ProjectSeries[];
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Project progress (0-100) */
  progress: number;

  /** Display order for the project */
  order: number;

  /** Soft delete flag */
  isDeleted?: boolean;
  
  /** Folder ID that this project belongs to */
  folderId?: string;
}

export interface ProjectsStorageData {
  /** Version of the storage schema */
  version: string;
  
  /** Array of projects */
  projects: Project[];
  
  /** Array of project folders */
  folders: ProjectFolder[];
  
  /** Timestamp of when the data was last updated */
  lastUpdated: string;
}
