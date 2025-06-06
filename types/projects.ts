/**
 * Project Management Types
 */

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
  
  /** Creation timestamp */
  createdAt: string;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Project progress (0-100) */
  progress: number;
}

export interface ProjectsStorageData {
  /** Version of the storage schema */
  version: string;
  
  /** Array of projects */
  projects: Project[];
  
  /** Timestamp of when the data was last updated */
  lastUpdated: string;
} 