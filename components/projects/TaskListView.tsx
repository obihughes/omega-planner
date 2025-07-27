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
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDueDate as formatDueDateUtil } from '@/utils/dateUtils';

// Storage key for task list preferences
const TASK_LIST_PREFERENCES_KEY = 'omega-planner-task-list-preferences';

// Types for task list preferences
interface TaskListPreferences {
  groupBy: 'project' | 'status' | 'dueDate' | 'dateCreated' | 'none';
  filters: {
    priority: 'all' | 'urgent' | 'high' | 'medium' | 'low';
    dueDate: 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'future' | 'none';
    status: 'all' | 'todo' | 'in-progress' | 'completed' | 'blocked';
  };
  sortBy: 'title' | 'dueDate' | 'priority' | 'status' | 'created';
  sortOrder: 'asc' | 'desc';
}

// Default preferences
const defaultPreferences: TaskListPreferences = {
  groupBy: 'project',
  filters: {
    priority: 'all',
    dueDate: 'all',
    status: 'all'
  },
  sortBy: 'created',
  sortOrder: 'desc'
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
      // Merge with defaults to ensure all properties exist
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.error('Error loading task list preferences:', error);
  }
  return defaultPreferences;
};

const savePreferences = (preferences: TaskListPreferences) => {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(TASK_LIST_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving task list preferences:', error);
  }
};

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface TaskListViewProps {
  className?: string;
}

export function TaskListView({ className }: TaskListViewProps) {
  const { projects, updateTaskInProject, deleteTaskFromProject, addTaskToProject, createUnassignedTask } = useProjects();
  
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
  
  // Extract persistent state from preferences
  const { groupBy, filters, sortBy, sortOrder } = preferences;
  
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
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
    projectId: '',
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
    
    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
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
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) compareValue = 0;
          else if (!a.dueDate) compareValue = 1;
          else if (!b.dueDate) compareValue = -1;
          else compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          compareValue = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        case 'status':
          const statusOrder = { 'todo': 1, 'in-progress': 2, 'blocked': 3, 'completed': 4 };
          compareValue = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        case 'created':
        default:
          compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [allTasks, searchTerm, filters, sortBy, sortOrder]);

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
            // Apply the same sorting logic as in filteredTasks
            let compareValue = 0;
            
            switch (sortBy) {
              case 'title':
                compareValue = a.title.localeCompare(b.title);
                break;
              case 'dueDate':
                if (!a.dueDate && !b.dueDate) compareValue = 0;
                else if (!a.dueDate) compareValue = 1;
                else if (!b.dueDate) compareValue = -1;
                else compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                break;
              case 'priority':
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                compareValue = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                break;
              case 'status':
                const statusOrder = { 'todo': 1, 'in-progress': 2, 'blocked': 3, 'completed': 4 };
                compareValue = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                break;
              case 'created':
              default:
                compareValue = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                break;
            }
            
            return sortOrder === 'asc' ? compareValue : -compareValue;
          })
        };
      });
    } else if (groupBy === 'dueDate') {
      // Group by due date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const dueDateGroups = {

        'today': { title: 'Due Today', tasks: [] as TaskWithProject[], color: '#F59E0B' },
        'tomorrow': { title: 'Due Tomorrow', tasks: [] as TaskWithProject[], color: '#3B82F6' },
        'thisWeek': { title: 'This Week', tasks: [] as TaskWithProject[], color: '#8B5CF6' },
        'later': { title: 'Later', tasks: [] as TaskWithProject[], color: '#6B7280' },
        'noDueDate': { title: 'No Due Date', tasks: [] as TaskWithProject[], color: '#6B7280' }
      };
      
      filteredTasks.forEach(task => {
        if (!task.dueDate) {
          dueDateGroups.noDueDate.tasks.push(task);
          return;
        }
        
        const dueDate = new Date(task.dueDate);
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        if (dueDateOnly.getTime() === today.getTime()) {
          dueDateGroups.today.tasks.push(task);
        } else if (dueDateOnly.getTime() === tomorrow.getTime()) {
          dueDateGroups.tomorrow.tasks.push(task);
        } else if (dueDateOnly <= nextWeek) {
          dueDateGroups.thisWeek.tasks.push(task);
        } else {
          dueDateGroups.later.tasks.push(task);
        }
      });
      
      return Object.entries(dueDateGroups)
        .filter(([_, group]) => group.tasks.length > 0)
        .map(([key, group]) => ({
          id: key,
          title: group.title,
          color: group.color,
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
    } else if (groupBy === 'dateCreated') {
      // Group by date created
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);
      const thisMonth = new Date(today);
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      
      const dateCreatedGroups = {
        'today': { title: 'Created Today', tasks: [] as TaskWithProject[], color: '#10B981' },
        'yesterday': { title: 'Created Yesterday', tasks: [] as TaskWithProject[], color: '#3B82F6' },
        'thisWeek': { title: 'This Week', tasks: [] as TaskWithProject[], color: '#8B5CF6' },
        'thisMonth': { title: 'This Month', tasks: [] as TaskWithProject[], color: '#F59E0B' },
        'older': { title: 'Older', tasks: [] as TaskWithProject[], color: '#6B7280' }
      };
      
      filteredTasks.forEach(task => {
        const createdDate = new Date(task.createdAt);
        const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        
        if (createdDateOnly.getTime() === today.getTime()) {
          dateCreatedGroups.today.tasks.push(task);
        } else if (createdDateOnly.getTime() === yesterday.getTime()) {
          dateCreatedGroups.yesterday.tasks.push(task);
        } else if (createdDateOnly >= thisWeek) {
          dateCreatedGroups.thisWeek.tasks.push(task);
        } else if (createdDateOnly >= thisMonth) {
          dateCreatedGroups.thisMonth.tasks.push(task);
        } else {
          dateCreatedGroups.older.tasks.push(task);
        }
      });
      
      return Object.entries(dateCreatedGroups)
        .filter(([_, group]) => group.tasks.length > 0)
        .map(([key, group]) => ({
          id: key,
          title: group.title,
          color: group.color,
          tasks: group.tasks.sort((a, b) => {
            // Sort by creation date (newest first), then by title
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            if (dateB.getTime() !== dateA.getTime()) {
              return dateB.getTime() - dateA.getTime();
            }
            return a.title.localeCompare(b.title);
          })
        }));
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
  }, [filteredTasks, groupBy, projects, sortBy, sortOrder]);

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
  const handleTaskToggle = useCallback((task: TaskWithProject) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    // Add celebration animation for completion
    if (newStatus === 'completed') {
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

  // Create confetti particles animation
  const createConfettiParticles = (button: HTMLElement) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${centerX}px;
        top: ${centerY}px;
        transform-origin: center;
      `;

      document.body.appendChild(particle);

      const angle = (i / 12) * Math.PI * 2;
      const velocity = 100 + Math.random() * 100;
      const gravity = 500;
      const life = 800 + Math.random() * 400;

      let startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = elapsed / life;

        if (progress >= 1) {
          particle.remove();
          return;
        }

        const x = centerX + Math.cos(angle) * velocity * (elapsed / 1000);
        const y = centerY + Math.sin(angle) * velocity * (elapsed / 1000) + 0.5 * gravity * Math.pow(elapsed / 1000, 2);
        const opacity = 1 - progress;
        const scale = 1 - progress * 0.5;

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = opacity.toString();
        particle.style.transform = `scale(${scale})`;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
  };

  // Handle quick add task
  const handleQuickAdd = () => {
    if (!newTaskTitle.trim() || !newTaskProjectId) return;
    
    addTaskToProject(newTaskProjectId, {
      title: newTaskTitle.trim(),
      status: 'todo',
      priority: 'medium'
    });
    
    setNewTaskTitle('');
  };

  // Inline editing functions
  const startEditing = (task: TaskWithProject, field: 'title' | 'description' | 'dueDate') => {
    setEditingTaskId(task.id);
    setEditingField(field);
    setEditingValue(
      field === 'title' ? task.title :
      field === 'description' ? (task.description || '') :
      field === 'dueDate' ? (task.dueDate || '') : ''
    );
  };

  const saveEdit = () => {
    if (!editingTaskId || !editingField) return;
    
    const task = filteredTasks.find(t => t.id === editingTaskId);
    if (!task) return;
    
    const updates: Partial<ProjectTask> = {};
    
    if (editingField === 'title') {
      updates.title = editingValue.trim() || task.title;
    } else if (editingField === 'description') {
      updates.description = editingValue.trim();
    } else if (editingField === 'dueDate') {
      updates.dueDate = editingValue || undefined;
    }
    
    updateTaskInProject(task.projectId, task.id, updates);
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue('');
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current instanceof HTMLInputElement) {
        editInputRef.current.select();
      }
    }
  }, [editingTaskId, editingField]);

  // Reset filters function
    const resetFilters = () => {
    updatePreferences({
      filters: {
        priority: 'all',
        dueDate: 'all', 
        status: 'all'
      }
    });
  };

  const hasActiveFilters = filters.priority !== 'all' || filters.dueDate !== 'all' || filters.status !== 'all';

  // Full task creation handlers
  const openFullTaskModal = () => {
    setFullTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      projectId: '',
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
      dueDate: fullTaskForm.dueDate || undefined,
      estimatedHours: fullTaskForm.estimatedHours ? parseInt(fullTaskForm.estimatedHours) : undefined,
      status: 'todo' as const
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
      {/* Simplified Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button 
            onClick={openFullTaskModal}
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Compact Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-40 text-sm"
            />
          </div>

          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 px-2">
                <Filter className="w-4 h-4" />
                {isClient && hasActiveFilters && (
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filters</h4>
                  {isClient && hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="h-auto p-1 text-xs">
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <select
                    value={filters.priority}
                                            onChange={(e) => updatePreferences({ filters: { ...filters, priority: e.target.value as any } })}
                    className="w-full px-2 py-1 text-xs bg-input border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
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
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-3" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Sort</h4>
                <div className="space-y-1">
                  {[
                    { value: 'created', label: 'Created' },
                    { value: 'title', label: 'Title' },
                    { value: 'dueDate', label: 'Due Date' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'status', label: 'Status' }
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
                </div>
                <div className="border-t pt-2">
                  <button
                    onClick={() => updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors"
                  >
                    {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
                  </button>
                </div>
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
      <div className="flex gap-2 mb-4">
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

      {/* Task Groups */}
      <div className="flex-1 overflow-y-auto space-y-8">
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
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {group.tasks.filter(t => t.status === 'completed').length} of {group.tasks.length}
                  </span>
                </div>
              </button>
            )}

            {/* Tasks */}
            {(groupBy === 'none' || !collapsedProjects.has(group.id)) && (
              <div className="p-2">
                {group.tasks.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No tasks found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.tasks.map(task => {
                      const dueInfo = formatDueDate(task.dueDate);
                      
                      return (
                        <div 
                            key={task.id} 
                            className={cn(
                              "transition-colors duration-200 rounded-lg cursor-pointer border border-transparent hover:border-border/30",
                              "p-3 hover:bg-accent/20 group" // Compact padding for single-line layout
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
                                startEditing(task, 'dueDate');
                              }
                            }}
                            title="Click to edit due date • Click title to edit name"
                          >
                            {/* Single-line compact layout */}
                            <div className="flex items-center gap-3 min-h-[28px]">
                              {/* Status toggle with celebration */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  
                                  // Trigger confetti for completed tasks
                                  const newStatus = task.status === 'completed' ? 'todo' : 'completed';
                                  if (newStatus === 'completed') {
                                    createConfettiParticles(e.currentTarget as HTMLElement);
                                  }
                                  
                                  handleTaskToggle(task);
                                }}
                                className={cn(
                                  "flex-shrink-0 transition-all duration-300 relative",
                                  "hover:scale-110 active:scale-95",
                                  celebratingTasks.has(task.id) && "animate-bounce"
                                )}
                                style={{
                                  transform: celebratingTasks.has(task.id) ? 'scale(1.2)' : undefined,
                                  transition: 'transform 0.3s ease-in-out'
                                }}
                              >
                                {getStatusIcon(task.status, celebratingTasks.has(task.id))}
                                
                                {/* Celebration effect */}
                                {celebratingTasks.has(task.id) && (
                                  <div className="absolute -inset-2 pointer-events-none">
                                    <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping"></div>
                                    <div className="absolute inset-1 rounded-full bg-green-300 opacity-30 animate-ping animation-delay-75"></div>
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                                      <span className="text-lg animate-bounce">🎉</span>
                                    </div>
                                  </div>
                                )}
                              </button>
                            
                              {/* Priority indicator - compact */}
                              {task.priority && task.priority !== 'medium' && (
                                <div 
                                  className={cn(
                                    "w-2 h-2 rounded-full flex-shrink-0",
                                    task.priority === 'urgent' && "bg-red-500 animate-pulse",
                                    task.priority === 'high' && "bg-orange-500",
                                    task.priority === 'low' && "bg-gray-400"
                                  )}
                                  title={`${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority`}
                                />
                              )}

                              {/* Project indicator (when not grouped by project) */}
                              {groupBy !== 'project' && (
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: task.projectColor }}
                                  title={task.projectName}
                                />
                              )}

                              {/* Title - Editable and takes available space */}
                                {editingTaskId === task.id && editingField === 'title' ? (
                                  <input
                                    ref={editInputRef as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit();
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                    className="w-full bg-transparent border-none outline-none focus:bg-accent/50 rounded px-1 -mx-1 font-medium text-sm"
                                  />
                                ) : (
                                  <h3 
                                    className={cn(
                                      "cursor-pointer hover:bg-accent/20 rounded px-1 -mx-1 transition-colors select-none font-medium text-sm truncate",
                                      task.status === 'completed' 
                                        ? "line-through text-muted-foreground/70" 
                                        : "text-foreground"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(task, 'title');
                                    }}
                                    title={`${task.title}${task.description ? ` • ${task.description}` : ''}`}
                                  >
                                    {task.title}
                                  </h3>
                                )}
                                  
                                  {/* Project name (when not grouped by project) - Subtle and smaller */}
                                  {groupBy !== 'project' && (
                                    <div className="flex items-center gap-2 mt-1.5 mb-1">
                                      <div 
                                        className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: task.projectColor }}
                                      />
                                      <span className="text-sm font-medium text-muted-foreground/80 tracking-tight truncate">
                                        {task.projectName}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Description - Editable and Subtle */}
                                  {(task.description || editingTaskId === task.id && editingField === 'description') && (
                                    editingTaskId === task.id && editingField === 'description' ? (
                                      <textarea
                                        ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onBlur={saveEdit}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                                          if (e.key === 'Escape') cancelEdit();
                                        }}
                                        placeholder="Add description..."
                                        className="w-full text-sm text-muted-foreground/70 mt-2 bg-transparent border-none outline-none focus:bg-accent/50 rounded px-1 -mx-1 resize-none leading-relaxed font-light"
                                        rows={2}
                                      />
                                    ) : (
                                      <p 
                                        className="text-sm text-muted-foreground/70 mt-2 cursor-pointer hover:bg-accent/20 rounded px-1 -mx-1 transition-colors line-clamp-2 leading-relaxed font-light"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditing(task, 'description');
                                        }}
                                        title="Click to edit description"
                                      >
                                        {task.description}
                                      </p>
                                    )
                                  )}
                                  
                                  {/* Due date - Editable and Compact */}
                                  {(dueInfo || editingTaskId === task.id && editingField === 'dueDate') && (
                                    editingTaskId === task.id && editingField === 'dueDate' ? (
                                      <div className="flex items-center gap-2 mt-3">
                                        <Clock className="w-4 h-4 text-muted-foreground/70" />
                                        <input
                                          ref={editInputRef as React.RefObject<HTMLInputElement>}
                                          type="date"
                                          value={editingValue}
                                          onChange={(e) => setEditingValue(e.target.value)}
                                          onBlur={saveEdit}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit();
                                            if (e.key === 'Escape') cancelEdit();
                                          }}
                                          className="text-sm font-medium bg-accent/30 border border-border rounded-lg px-2 py-1 outline-none focus:bg-accent/50 focus:ring-2 focus:ring-primary/20 tracking-tight"
                                        />
                                      </div>
                                    ) : dueInfo && (
                                      <div className="flex items-center gap-2 mt-3">
                                        <Clock className="w-4 h-4 text-muted-foreground/70" />
                                        <span className={cn(
                                          "text-sm font-medium tracking-tight",
                                          dueInfo.isOverdue 
                                            ? "text-red-600 bg-red-50 px-2 py-1 rounded-full" 
                                            : "text-muted-foreground/80"
                                        )}>
                                          {dueInfo.text}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                                
                                {/* Priority indicator */}
                                {task.priority === 'urgent' && (
                                  <div className="flex items-center gap-1 mt-1 flex-shrink-0">
                                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse" />
                                    <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Urgent</span>
                                  </div>
                                )}
                                {task.priority === 'high' && (
                                  <div className="flex items-center gap-1 mt-1 flex-shrink-0">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full shadow-md" />
                                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">High</span>
                                  </div>
                              
                              {/* Project name (when not grouped by project) - compact */}
                              {groupBy !== 'project' && (
                                <span className="text-xs text-muted-foreground/60 truncate max-w-[100px] flex-shrink-0">
                                  {task.projectName}
                                </span>
                              )}

                              {/* Due date - compact */}
                              {(dueInfo || editingTaskId === task.id && editingField === 'dueDate') && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {editingTaskId === task.id && editingField === 'dueDate' ? (
                                    <input
                                      ref={editInputRef as React.RefObject<HTMLInputElement>}
                                      type="date"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onBlur={saveEdit}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit();
                                        if (e.key === 'Escape') cancelEdit();
                                      }}
                                      className="text-xs bg-accent/30 border border-border rounded px-2 py-1 outline-none focus:bg-accent/50 focus:ring-1 focus:ring-primary/20 w-[110px]"
                                    />
                                  ) : dueInfo && (
                                    <>
                                      <Clock className="w-3 h-3 text-muted-foreground/50" />
                                      <span className={cn(
                                        "text-xs font-medium",
                                        dueInfo.isOverdue 
                                          ? "text-red-600" 
                                          : "text-muted-foreground/70"
                                      )}>
                                        {dueInfo.text}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Action buttons - visible on hover */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {/* Description indicator/editor */}
                                {task.description && editingTaskId !== task.id ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(task, 'description');
                                    }}
                                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                                    title="Edit description"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </button>
                                ) : !task.description && editingTaskId !== task.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(task, 'description');
                                    }}
                                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                                    title="Add description"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Description editing area - appears below when editing */}
                            {editingTaskId === task.id && editingField === 'description' && (
                              <div className="mt-2 pl-8">
                                <textarea
                                  ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  placeholder="Add description..."
                                  className="w-full text-sm text-muted-foreground bg-accent/20 border border-border rounded px-2 py-1 outline-none focus:bg-accent/30 resize-none"
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* Full Task Creation Modal */}
      {isFullTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Task Title *
                </label>
                <Input
                  type="text"
                  value={fullTaskForm.title}
                  onChange={(e) => setFullTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={fullTaskForm.description}
                  onChange={(e) => setFullTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Project Assignment */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Project
                </label>
                <select
                  value={fullTaskForm.projectId}
                  onChange={(e) => setFullTaskForm(prev => ({ ...prev, projectId: e.target.value }))}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {projects.filter(p => !p.isDeleted && p.id !== 'unassigned').map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority and Due Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Priority
                  </label>
                  <select
                    value={fullTaskForm.priority}
                    onChange={(e) => setFullTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={fullTaskForm.dueDate}
                    onChange={(e) => setFullTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Estimated Hours
                </label>
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

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={closeFullTaskModal}>
                Cancel
              </Button>
              <Button 
                onClick={handleFullTaskSubmit}
                disabled={!fullTaskForm.title.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 