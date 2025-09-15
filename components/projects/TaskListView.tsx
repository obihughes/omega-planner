import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectTask } from '@/types/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Square, 
  CheckSquare, 
  CheckSquare2,
  Clock, 
  Calendar as CalendarIcon,
  Edit3,
  Trash2,
  Filter,
  SortAsc,
  SortDesc,
  FileText,
  X,
  Check,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDueDate as formatDueDateUtil, normalizeDueDate, dateFromDateKey } from '@/utils/dateUtils';

// Drag and drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProjectFormModal } from '@/components/modals/ProjectFormModal';

// Storage key for task list preferences
const TASK_LIST_PREFERENCES_KEY = 'omega-planner-task-list-preferences';

// Types for task list preferences
interface TaskListPreferences {
  groupBy: 'project' | 'status' | 'dueDate' | 'dateCreated' | 'none';
  filters: {
    dueDate: 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'future' | 'none';
    status: 'all' | 'todo' | 'in-progress' | 'completed' | 'blocked';
  };
  sortBy: 'title' | 'dueDate' | 'status' | 'created' | 'custom';
  sortOrder: 'asc' | 'desc';
  // Multiple sort criteria - array of sort options applied in order
  multipleSorts: Array<{
    field: 'title' | 'dueDate' | 'status' | 'created' | 'custom';
    order: 'asc' | 'desc';
  }>;
}

// Default preferences
const defaultPreferences: TaskListPreferences = {
  groupBy: 'project',
  filters: {
    dueDate: 'all',
    status: 'all'
  },
  sortBy: 'created',
  sortOrder: 'desc',
  multipleSorts: [
    { field: 'status', order: 'asc' },
    { field: 'title', order: 'asc' }
  ]
};

// Helper functions for localStorage
const loadPreferences = (): TaskListPreferences => {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }
  
  try {
    const stored = localStorage.getItem(TASK_LIST_PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle any missing fields
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load task list preferences:', error);
  }
  return defaultPreferences;
};

const savePreferences = (preferences: TaskListPreferences) => {
  try {
    localStorage.setItem(TASK_LIST_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save task list preferences:', error);
  }
};

// Extended task type with project info
interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface TaskListViewProps {
  className?: string;
}

// Sortable Task Item Component
function SortableTaskItem({ 
  task, 
  dueInfo, 
  editingTaskId, 
  editingField, 
  editingValue, 
  setEditingTaskId, 
  setEditingField, 
  setEditingValue, 
  editInputRef,
  celebratingTasks,
  isCustomOrderMode,
  onStatusToggle,
  onSaveEdit,
  onCancelEdit,
  onDeleteTask,
  getStatusIcon,
  formatDueDate
}: {
  task: TaskWithProject;
  dueInfo: any;
  editingTaskId: string | null;
  editingField: string | null;
  editingValue: string;
  setEditingTaskId: (id: string | null) => void;
  setEditingField: (field: 'title' | 'description' | 'dueDate' | null) => void;
  setEditingValue: (value: string) => void;
  editInputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  celebratingTasks: Set<string>;
  isCustomOrderMode: boolean;
  onStatusToggle: (task: TaskWithProject) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteTask: (task: TaskWithProject) => void;
  getStatusIcon: (status: ProjectTask['status'], isAnimating?: boolean) => React.ReactNode;
  formatDueDate: (dueDate: string | undefined) => any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !isCustomOrderMode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [shouldAutoOpenDatePicker, setShouldAutoOpenDatePicker] = React.useState(false);

  // Full date string for hover tooltip: Weekday DD/MM/YYYY
  const fullDueTitle = React.useMemo(() => {
    if (!task.dueDate) return undefined;
    const normalized = normalizeDueDate(task.dueDate);
    if (!normalized) return undefined;
    const d = dateFromDateKey(normalized);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${weekday} ${dd}/${mm}/${yyyy}`;
  }, [task.dueDate]);

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-colors duration-200 rounded-lg cursor-pointer border border-transparent hover:border-border/30",
        "p-3 hover:bg-accent/20 group", // Compact padding for single-line layout
        isDragging && "opacity-50 z-50"
      )}
      onClick={(e) => {
        // Only trigger due date editing if not clicking on other interactive elements
        const target = e.target as Element;
        if (
          !target.closest('button') && 
          !target.closest('input') && 
          !target.closest('textarea') &&
          editingTaskId !== task.id
        ) {
          setEditingTaskId(task.id);
          setEditingField('dueDate');
          setEditingValue(task.dueDate || '');
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle - Only show in custom order mode */}
        {isCustomOrderMode && (
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {/* Status Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusToggle(task);
          }}
          className="flex-shrink-0"
        >
          {getStatusIcon(task.status, celebratingTasks.has(task.id))}
        </button>

        {/* Task content - rest of the task item UI */}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {editingTaskId === task.id && editingField === 'title' ? (
              <input
                ref={editInputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                className="w-full bg-transparent border-b border-primary text-sm font-medium focus:outline-none"
                autoFocus
              />
            ) : (
              <span 
                className={cn(
                  "font-medium text-sm text-foreground cursor-pointer",
                  task.status === 'completed' && "line-through text-muted-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTaskId(task.id);
                  setEditingField('title');
                  setEditingValue(task.title);
                }}
              >
                {task.title}
              </span>
            )}
          </div>

          {/* Due date and actions */}
          <div className="flex items-center gap-2 ml-3">
            {/* Due date */}
            {editingTaskId === task.id && editingField === 'dueDate' ? (
              <input
                ref={(node) => {
                  (editInputRef as React.RefObject<HTMLInputElement>).current = node as HTMLInputElement | null;
                  if (node && shouldAutoOpenDatePicker) {
                    try { (node as any)?.showPicker?.(); } catch {}
                    setShouldAutoOpenDatePicker(false);
                  }
                }}
                type="date"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                className="text-xs bg-transparent border border-primary rounded px-1 py-0.5 focus:outline-none"
                autoFocus
              />
            ) : (
              task.dueDate && (
                <span 
                  className={cn(
                    "text-xs px-2 py-1 rounded-full cursor-pointer transition-colors",
                    dueInfo.className
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTaskId(task.id);
                    setEditingField('dueDate');
                    setEditingValue(task.dueDate || '');
                    setShouldAutoOpenDatePicker(true);
                  }}
                  title={fullDueTitle}
                >
                  {dueInfo.text}
                </span>
              )
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTaskId(task.id);
                  setEditingField('description');
                  setEditingValue(task.description || '');
                }}
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Description editing */}
      {editingTaskId === task.id && editingField === 'description' && (
        <div className="mt-2 ml-7">
          <textarea
            ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            placeholder="Add description..."
            className="w-full p-2 text-xs bg-accent/20 border border-border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            rows={2}
            autoFocus
          />
          <div className="text-xs text-muted-foreground mt-1">
            Press Ctrl+Enter to save, Escape to cancel
          </div>
        </div>
      )}
    </div>
  );
}

export function TaskListView({ className }: TaskListViewProps) {
  const { projects, folders, updateProject, deleteProject, updateTaskInProject, deleteTaskFromProject, addTaskToProject, createUnassignedTask, reorderTasksInProject } = useProjects();
  
  // Initialize with default preferences to prevent hydration mismatch
  const [preferences, setPreferences] = useState<TaskListPreferences>(defaultPreferences);
  const [isClient, setIsClient] = useState(false);
  
  // Local state (non-persistent)
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'description' | 'dueDate' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  // Drag and drop state
  const [activeTaskId, setActiveTaskId] = useState<UniqueIdentifier | null>(null);
  const [draggedTask, setDraggedTask] = useState<TaskWithProject | null>(null);
  // Project editing modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Extract persistent state from preferences
  const { groupBy, filters, sortBy, sortOrder } = preferences;
  
  // Check if we're in custom order mode
  const isCustomOrderMode = sortBy === 'custom' || 
    (preferences.multipleSorts && preferences.multipleSorts.some(s => s.field === 'custom'));
  
  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveTaskId(active.id);
    
    // Find the dragged task
    const task = allTasks.find(t => t.id === active.id);
    setDraggedTask(task || null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      // Find the tasks involved
      const activeTask = allTasks.find(t => t.id === active.id);
      const overTask = allTasks.find(t => t.id === over.id);
      
      if (activeTask && overTask && activeTask.projectId === overTask.projectId) {
        // Only reorder within the same project
        reorderTasksInProject(activeTask.projectId, active.id as string, over.id as string);
      }
    }
    
    setActiveTaskId(null);
    setDraggedTask(null);
  }, [reorderTasksInProject]);
  
  // Helper function to update preferences and save to localStorage
  const updatePreferences = useCallback((updates: Partial<TaskListPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  }, [preferences]);

  // Load preferences on client side after mount to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const clientPreferences = loadPreferences();
    setPreferences(clientPreferences);
  }, []);
  
  // Full task creation modal state
  const [isFullTaskModalOpen, setIsFullTaskModalOpen] = useState(false);
  const [fullTaskForm, setFullTaskForm] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'todo' as ProjectTask['status'],
    priority: 'medium' as ProjectTask['priority'],
    startDate: '',
    dueDate: '',
    estimatedHours: ''
  });
  
  // Animation state for checkbox celebrations
  const [celebratingTasks, setCelebratingTasks] = useState<Set<string>>(new Set());

  // Get all tasks with project info
  const allTasks = useMemo((): TaskWithProject[] => {
    return projects
      .filter(p => !p.isDeleted)
      .flatMap(project => 
        project.tasks.map(task => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color
        }))
      );
  }, [projects]);

  // Apply search and filters
  const filteredTasks = useMemo(() => {
    let filtered = allTasks;
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(lowercaseSearch) ||
        task.description?.toLowerCase().includes(lowercaseSearch) ||
        task.projectName.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    // Apply due date filter
    if (filters.dueDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      filtered = filtered.filter(task => {
        if (filters.dueDate === 'none') {
          return !task.dueDate;
        }
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        switch (filters.dueDate) {
          case 'today':
            return dueDateOnly.getTime() === today.getTime();
          case 'tomorrow':
            return dueDateOnly.getTime() === tomorrow.getTime();
          case 'thisWeek':
            return dueDateOnly >= today && dueDateOnly <= nextWeek;
          case 'future':
            return dueDateOnly > nextWeek;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting - use multiple sorts if enabled, otherwise single sort
    return filtered.sort((a, b) => {
      const sortsToApply = preferences.multipleSorts && preferences.multipleSorts.length > 0 
        ? preferences.multipleSorts 
        : [{ field: sortBy, order: sortOrder }];
      
      for (const sort of sortsToApply) {
        let compareValue = 0;
        
        switch (sort.field) {
          case 'title':
            compareValue = a.title.localeCompare(b.title);
            break;
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) compareValue = 0;
            else if (!a.dueDate) compareValue = 1;
            else if (!b.dueDate) compareValue = -1;
            else compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            break;
          case 'status':
            const statusOrder = { 'todo': 1, 'in-progress': 2, 'blocked': 3, 'completed': 4 };
            compareValue = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
            break;
          case 'custom':
            compareValue = (a.order || 0) - (b.order || 0);
            break;
          case 'created':
          default:
            compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
        }
        
        const finalCompareValue = sort.order === 'asc' ? compareValue : -compareValue;
        
        // If this sort criteria yields a non-zero result, return it
        // Otherwise, continue to the next sort criteria
        if (finalCompareValue !== 0) {
          return finalCompareValue;
        }
      }
      
      return 0; // All sort criteria yielded equal results
    });
  }, [allTasks, searchTerm, filters, sortBy, sortOrder, preferences.multipleSorts]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      // Return ungrouped flat list
      return [{
        id: 'all',
        title: 'All Tasks',
        color: '#6B7280',
        tasks: filteredTasks
      }];
    } else if (groupBy === 'project') {
      const grouped = new Map<string, TaskWithProject[]>();
      
      // Initialize with projects that have tasks
      filteredTasks.forEach(task => {
        if (!grouped.has(task.projectId)) {
          grouped.set(task.projectId, []);
        }
        grouped.get(task.projectId)!.push(task);
      });
      
      return Array.from(grouped.entries()).map(([projectId, tasks]) => {
        const project = projects.find(p => p.id === projectId)!;
        return {
          id: projectId,
          title: project.name,
          color: project.color,
          tasks: tasks.sort((a, b) => {
            // Sort by due date, then by title
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            return a.title.localeCompare(b.title);
          })
        };
      }).sort((a, b) => {
        // Sort projects by name
        return a.title.localeCompare(b.title);
      });
    } else {
      // Group by status
      const statusGroups = {
        'todo': { title: 'To Do', tasks: [] as TaskWithProject[] },
        'in-progress': { title: 'In Progress', tasks: [] as TaskWithProject[] },
        'completed': { title: 'Completed', tasks: [] as TaskWithProject[] },
        'blocked': { title: 'Blocked', tasks: [] as TaskWithProject[] }
      };
      
      filteredTasks.forEach(task => {
        statusGroups[task.status].tasks.push(task);
      });
      
      return Object.entries(statusGroups)
        .filter(([_, group]) => group.tasks.length > 0) // Only show groups with tasks
        .map(([status, group]) => ({
          id: status,
          title: group.title,
          color: '#6B7280', // Default gray
          tasks: group.tasks.sort((a, b) => {
            // Sort by due date, then by title
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            return a.title.localeCompare(b.title);
          })
        }));
    }
  }, [filteredTasks, groupBy, projects]);

  // Toggle project collapse
  const toggleProjectCollapse = (projectId: string) => {
    const newCollapsed = new Set(collapsedProjects);
    if (newCollapsed.has(projectId)) {
      newCollapsed.delete(projectId);
    } else {
      newCollapsed.add(projectId);
    }
    setCollapsedProjects(newCollapsed);
  };

  // Handle task status toggle with celebration
  const handleTaskStatusToggle = useCallback((task: TaskWithProject) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    if (newStatus === 'completed') {
      // Add celebration
      setCelebratingTasks(prev => new Set([...Array.from(prev), task.id]));
      // Remove celebration after animation
      setTimeout(() => {
        setCelebratingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
      }, 1000);
    }
    
    updateTaskInProject(task.projectId, task.id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    });
  }, [updateTaskInProject]);

  // Editing helpers
  const startEditing = (task: TaskWithProject, field: 'title' | 'description' | 'dueDate') => {
    setEditingTaskId(task.id);
    setEditingField(field);
    setEditingValue(field === 'dueDate' ? (task.dueDate || '') : (task[field] || ''));
    
    // Focus the input after a small delay to ensure it's rendered
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 10);
  };

  const saveEdit = useCallback(() => {
    if (!editingTaskId || !editingField) return;
    
    const task = allTasks.find(t => t.id === editingTaskId);
    if (!task) return;
    
    const trimmedValue = editingValue.trim();
    
    // Don't save if the value hasn't changed
    const currentValue = editingField === 'dueDate' ? task.dueDate : task[editingField];
    if (trimmedValue === (currentValue || '')) {
      cancelEdit();
      return;
    }
    
    // Update the task
    const updates: Partial<ProjectTask> = {};
    if (editingField === 'title') {
      if (!trimmedValue) return; // Title is required
      updates.title = trimmedValue;
    } else if (editingField === 'description') {
      updates.description = trimmedValue || undefined;
    } else if (editingField === 'dueDate') {
      updates.dueDate = trimmedValue || undefined;
    }
    
    updateTaskInProject(task.projectId, task.id, updates);
    cancelEdit();
  }, [editingTaskId, editingField, editingValue, allTasks, updateTaskInProject]);

  const cancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue('');
  }, []);

  const deleteTask = useCallback((task: TaskWithProject) => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      deleteTaskFromProject(task.projectId, task.id);
    }
  }, [deleteTaskFromProject]);

  // Quick add task
  const handleQuickAdd = useCallback(() => {
    if (!newTaskTitle.trim() || !newTaskProjectId) return;
    
    const taskData = {
      title: newTaskTitle.trim(),
      description: '',
      priority: 'medium' as const,
      status: 'todo' as const
    };
    
    if (newTaskProjectId === 'unassigned') {
      createUnassignedTask(taskData);
    } else {
      addTaskToProject(newTaskProjectId, taskData);
    }
    
    setNewTaskTitle('');
    setNewTaskProjectId('');
  }, [newTaskTitle, newTaskProjectId, addTaskToProject, createUnassignedTask]);

  const hasActiveFilters = filters.dueDate !== 'all' || filters.status !== 'all';

  // Full task creation handlers
  const openFullTaskModal = () => {
    setFullTaskForm({
      title: '',
      description: '',
      projectId: '',
      status: 'todo',
      priority: 'medium',
      startDate: '',
      dueDate: '',
      estimatedHours: ''
    });
    setIsFullTaskModalOpen(true);
  };

  const closeFullTaskModal = () => {
    setIsFullTaskModalOpen(false);
  };

  const handleFullTaskSubmit = () => {
    if (!fullTaskForm.title.trim()) return;

    const taskData = {
      title: fullTaskForm.title.trim(),
      description: fullTaskForm.description.trim() || undefined,
      priority: fullTaskForm.priority,
      status: fullTaskForm.status,
      startDate: fullTaskForm.startDate || undefined,
      dueDate: fullTaskForm.dueDate || undefined,
      estimatedHours: fullTaskForm.estimatedHours ? parseInt(fullTaskForm.estimatedHours) : undefined,
    };

    if (fullTaskForm.projectId && fullTaskForm.projectId !== 'unassigned') {
      addTaskToProject(fullTaskForm.projectId, taskData);
    } else {
      createUnassignedTask(taskData);
    }

    closeFullTaskModal();
  };

  // Get status icon
  const getStatusIcon = (status: ProjectTask['status'], isAnimating: boolean = false) => {
    if (status === 'completed') {
      return (
        <div className="relative">
          <CheckSquare2 className={cn(
            "w-4 h-4 text-green-600 transition-all duration-300",
            isAnimating && "drop-shadow-lg"
          )} />
          {/* Success ring animation */}
          {isAnimating && (
            <div className="absolute inset-0 rounded border-2 border-green-400 animate-ping" />
          )}
        </div>
      );
    } else {
      return (
        <Square className={cn(
          "w-4 h-4 text-muted-foreground transition-all duration-200",
          "hover:text-green-500 hover:scale-105"
        )} />
      );
    }
  };

  // Use the centralized formatDueDate utility function
  const formatDueDate = formatDueDateUtil;

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalTasks} total • {completedTasks} completed • {totalTasks - completedTasks} remaining
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={openFullTaskModal}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between px-6 pb-4 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          
          {/* Filter and sort controls */}
          <div className="flex items-center gap-2">
            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                onClick={() => updatePreferences({ 
                  filters: { dueDate: 'all', status: 'all' } 
                })}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
            
            {/* Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1 px-2">
                  <Filter className="w-4 h-4" />
                  {hasActiveFilters && <div className="w-2 h-2 bg-primary rounded-full" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Filters</h4>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                    <select
                      value={filters.dueDate}
                      onChange={(e) => updatePreferences({ filters: { ...filters, dueDate: e.target.value as any } })}
                      className="w-full px-2 py-1 text-xs bg-input border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="thisWeek">This Week</option>
                      <option value="future">Future</option>
                      <option value="none">No Due Date</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => updatePreferences({ filters: { ...filters, status: e.target.value as any } })}
                      className="w-full px-2 py-1 text-xs bg-input border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="all">All Status</option>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Controls */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1 px-2">
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  {preferences.multipleSorts && preferences.multipleSorts.length > 1 && (
                    <span className="text-xs ml-1 bg-primary/20 text-primary px-1 rounded">
                      {preferences.multipleSorts.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-3" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Sort</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updatePreferences({ 
                        multipleSorts: preferences.multipleSorts && preferences.multipleSorts.length > 1 
                          ? [preferences.multipleSorts[0]] 
                          : [{ field: sortBy, order: sortOrder }]
                      })}
                      className="text-xs h-6"
                    >
                      {preferences.multipleSorts && preferences.multipleSorts.length > 1 ? 'Single Sort' : 'Multi Sort'}
                    </Button>
                  </div>
                  
                  {/* Multi-sort criteria */}
                  {preferences.multipleSorts && preferences.multipleSorts.length > 0 ? (
                    <div className="space-y-2">
                      {preferences.multipleSorts.map((sort, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground w-4">{index + 1}.</span>
                          <select
                            value={sort.field}
                            onChange={(e) => {
                              const newSorts = [...preferences.multipleSorts];
                              newSorts[index] = { ...newSorts[index], field: e.target.value as any };
                              updatePreferences({ multipleSorts: newSorts });
                            }}
                            className="flex-1 px-1 py-0.5 bg-input border-border rounded text-xs"
                          >
                            <option value="created">Created</option>
                            <option value="title">Title</option>
                            <option value="dueDate">Due Date</option>
                            <option value="status">Status</option>
                            <option value="custom">Custom Order</option>
                          </select>
                          <select
                            value={sort.order}
                            onChange={(e) => {
                              const newSorts = [...preferences.multipleSorts];
                              newSorts[index] = { ...newSorts[index], order: e.target.value as any };
                              updatePreferences({ multipleSorts: newSorts });
                            }}
                            className="w-16 px-1 py-0.5 bg-input border-border rounded text-xs"
                          >
                            <option value="asc">↑</option>
                            <option value="desc">↓</option>
                          </select>
                          {preferences.multipleSorts.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newSorts = preferences.multipleSorts.filter((_, i) => i !== index);
                                updatePreferences({ multipleSorts: newSorts });
                              }}
                              className="w-6 h-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {preferences.multipleSorts.length < 4 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSorts = [...preferences.multipleSorts, { field: 'title' as const, order: 'asc' as const }];
                            updatePreferences({ multipleSorts: newSorts });
                          }}
                          className="w-full h-6 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Sort
                        </Button>
                      )}
                    </div>
                  ) : (
                    // Single sort fallback
                    <div className="space-y-1">
                      {[
                        { value: 'created', label: 'Created' },
                        { value: 'title', label: 'Title' },
                        { value: 'dueDate', label: 'Due Date' },
                        { value: 'status', label: 'Status' },
                        { value: 'custom', label: 'Custom Order' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updatePreferences({ sortBy: option.value as any })}
                          className={cn(
                            "w-full text-left px-2 py-1 text-xs rounded transition-colors",
                            sortBy === option.value
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                      <div className="border-t pt-2">
                        <button
                          onClick={() => updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                          className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors"
                        >
                          {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Group by selector */}
            <select
              value={groupBy}
              onChange={(e) => updatePreferences({ groupBy: e.target.value as 'project' | 'status' | 'dueDate' | 'dateCreated' | 'none' })}
              className="px-2 py-1.5 rounded-lg bg-input border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="none">No Grouping</option>
              <option value="project">By Project</option>
              <option value="status">By Status</option>
              <option value="dueDate">By Due Date</option>
              <option value="dateCreated">By Date Created</option>
            </select>
          </div>
        </div>

        {/* Compact Quick Add */}
        <div className="flex gap-2 mb-4 px-6">
          <select
            value={newTaskProjectId}
            onChange={(e) => setNewTaskProjectId(e.target.value)}
            className="px-2 py-1.5 rounded bg-input border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs min-w-0 flex-shrink-0"
          >
            <option value="">Project...</option>
            {projects.filter(p => !p.isDeleted).map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <Input
            type="text"
            placeholder="Add a task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd();
            }}
            className="flex-1 text-sm py-1.5"
          />
          <Button 
            onClick={handleQuickAdd}
            disabled={!newTaskTitle.trim() || !newTaskProjectId}
            size="sm"
            className="px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Task Groups */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto space-y-8 p-6">
          {groupedTasks.map(group => (
            <div key={group.id} className="bg-card rounded-lg border border-border/30">
              {/* Group Header - Only show for grouped views */}
              {groupBy !== 'none' && (
                <button
                  onClick={() => toggleProjectCollapse(group.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-accent/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    {collapsedProjects.has(group.id) ? (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium text-lg text-foreground">{group.title}</span>
                    {isCustomOrderMode && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Drag to reorder
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {group.tasks.filter(t => t.status === 'completed').length} of {group.tasks.length}
                    </span>
                    {/* Add Task Button - Only show for project groups */}
                    {groupBy === 'project' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent collapse/expand
                          setFullTaskForm({
                            title: '',
                            description: '',
                            projectId: group.id,
                            status: 'todo',
                            priority: 'medium',
                            startDate: '',
                            dueDate: '',
                            estimatedHours: ''
                          });
                          setIsFullTaskModalOpen(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                    {groupBy === 'project' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          const proj = projects.find(p => p.id === group.id) || null;
                          setEditingProject(proj);
                          setIsProjectModalOpen(!!proj);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                        title="Edit project"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </button>
              )}

              {/* Tasks */}
              {(groupBy === 'none' || !collapsedProjects.has(group.id)) && (
                <div className="p-2">
                  <SortableContext items={group.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {group.tasks.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No tasks found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {group.tasks.map(task => {
                          const dueInfo = formatDueDate(task.dueDate);
                          
                          return (
                            <SortableTaskItem
                              key={task.id}
                              task={task}
                              dueInfo={dueInfo}
                              editingTaskId={editingTaskId}
                              editingField={editingField}
                              editingValue={editingValue}
                              setEditingTaskId={setEditingTaskId}
                              setEditingField={setEditingField}
                              setEditingValue={setEditingValue}
                              editInputRef={editInputRef}
                              celebratingTasks={celebratingTasks}
                              isCustomOrderMode={isCustomOrderMode}
                              onStatusToggle={handleTaskStatusToggle}
                              onSaveEdit={saveEdit}
                              onCancelEdit={cancelEdit}
                              onDeleteTask={deleteTask}
                              getStatusIcon={getStatusIcon}
                              formatDueDate={formatDueDate}
                            />
                          );
                        })}
                      </div>
                    )}
                  </SortableContext>
                </div>
              )}
            </div>
          ))}
          
          {groupedTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No tasks match your search' : 'No tasks found'}
            </div>
          )}
        </div>
        
        {/* Drag Overlay */}
        <DragOverlay>
          {draggedTask ? (
            <div className="bg-card rounded-lg border border-border/30 shadow-lg opacity-90">
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  {getStatusIcon(draggedTask.status)}
                  <span className="font-medium text-sm">{draggedTask.title}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Full Task Creation Modal */}
      {isFullTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleFullTaskSubmit();
            }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Task Title *</label>
                <Input
                  type="text"
                  value={fullTaskForm.title}
                  onChange={(e) => setFullTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                  className="w-full"
                  autoFocus
                />
              </div>

              {/* Project and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Project</label>
                  <div className="relative">
                    {(() => {
                      const selected = projects.find(p => p.id === fullTaskForm.projectId);
                      return selected ? (
                        <span
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                          style={{ backgroundColor: selected.color }}
                        />
                      ) : null;
                    })()}
                    <select
                      value={fullTaskForm.projectId}
                      onChange={(e) => setFullTaskForm(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full p-2 pl-5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a project...</option>
                      {projects.filter(p => !p.isDeleted).map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                      <option value="unassigned">Unassigned</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select
                    value={fullTaskForm.status}
                    onChange={(e) => setFullTaskForm(prev => ({ ...prev, status: e.target.value as ProjectTask['status'] }))}
                    className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Priority and Estimated Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                  <select
                    value={fullTaskForm.priority}
                    onChange={(e) => setFullTaskForm(prev => ({ ...prev, priority: e.target.value as ProjectTask['priority'] }))}
                    className="w-full p-2 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Estimated Hours</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={fullTaskForm.estimatedHours}
                    onChange={(e) => setFullTaskForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    placeholder="Optional"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={fullTaskForm.startDate}
                    onChange={(e) => setFullTaskForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                  <Input
                    type="date"
                    value={fullTaskForm.dueDate}
                    onChange={(e) => setFullTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea
                  value={fullTaskForm.description}
                  onChange={(e) => setFullTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add task description..."
                  className="w-full p-2 border border-border rounded resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 mt-6">
              <span className="text-xs text-muted-foreground">Press Ctrl+Enter to save quickly</span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" type="button" onClick={closeFullTaskModal}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!fullTaskForm.title.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Task
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
      {/* Project Edit Modal */}
      {isProjectModalOpen && (
        <ProjectFormModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          project={editingProject}
          folders={folders}
          onSave={(projectData, isNew) => {
            if (!isNew && editingProject) {
              updateProject(editingProject.id, projectData);
            }
          }}
          onDelete={(projectId) => {
            deleteProject(projectId);
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}