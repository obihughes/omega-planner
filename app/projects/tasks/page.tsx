'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TaskListView } from '@/components/projects/TaskListView';
import { CompactTaskCard } from '@/components/projects/CompactTaskCard';
import { DraggableTaskCard } from '@/components/projects/DraggableTaskCard';
import { MiniSchedulerCalendar } from '@/components/calendar/MiniSchedulerCalendar';
import { MonthlyTaskScheduler } from '@/components/projects/MonthlyTaskScheduler';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { useViewMode } from '@/app/context/ViewModeContext';
import { useProjects } from '@/hooks/useProjects';
import { Calendar, List, Plus, Clock, CheckCircle2, Filter, SortAsc, CheckSquare2, Square, Edit3, X, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectTask } from '@/types/projects';
import { getDateKey, getTodayDateKey, formatDueDate, dateFromDateKey, normalizeDueDate } from '@/utils/dateUtils';
import { ProjectTaskFormModal } from '@/components/modals/ProjectTaskFormModal';
import { ProjectFormModal } from '@/components/modals/ProjectFormModal';
import { Project } from '@/types/projects';

// Storage key for tasks view preferences
const TASKS_VIEW_PREFERENCES_KEY = 'omega-planner-tasks-view-preferences';

// Types for tasks view preferences
interface TasksViewPreferences {
  allTasksFilters: {
    search: string;
    project: string;
    status: string;
    dueDate: string;
  };
  allTasksGroupBy: 'none' | 'project' | 'status' | 'dueDate' | 'completedDate';
  allTasksSubGroupBy: string;
  allTasksSortBy: 'dueDate' | 'created' | 'completion' | 'title';
  sortOrder: 'asc' | 'desc';
  collapsedProjectGroups: string[]; // Array of collapsed project IDs
  // Multiple sort criteria - array of sort options applied in order
  multipleSorts: Array<{
    field: 'dueDate' | 'created' | 'completion' | 'title';
    order: 'asc' | 'desc';
  }>;
  useMultipleSort: boolean;
}

// Default preferences with 'today' as default dueDate filter
const defaultTasksPreferences: TasksViewPreferences = {
  allTasksFilters: {
    search: '',
    project: 'all',
    status: 'all',
    dueDate: 'today' // Default to today filter
  },
  allTasksGroupBy: 'none',
  allTasksSubGroupBy: 'all',
  allTasksSortBy: 'dueDate',
  sortOrder: 'desc',
  collapsedProjectGroups: [], // Empty array - will be populated with all project IDs when grouping by project
  multipleSorts: [
    { field: 'completion', order: 'asc' }, // Primary: completion status
    { field: 'title', order: 'asc' }       // Secondary: title alphabetically
  ],
  useMultipleSort: true
};

// Helper functions for localStorage
const loadTasksPreferences = (): TasksViewPreferences => {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return defaultTasksPreferences;
  }
  
  try {
    const stored = localStorage.getItem(TASKS_VIEW_PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure collapsedProjectGroups is always an array
      const cleanParsed = {
        ...parsed,
        collapsedProjectGroups: Array.isArray(parsed.collapsedProjectGroups) 
          ? parsed.collapsedProjectGroups 
          : []
      };
      return { ...defaultTasksPreferences, ...cleanParsed };
    }
  } catch (error) {
    console.error('Error loading tasks view preferences:', error);
  }
  return defaultTasksPreferences;
};

const saveTasksPreferences = (preferences: TasksViewPreferences) => {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(TASKS_VIEW_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving tasks view preferences:', error);
  }
};

// Task with project info interface
interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
  taskNumber: number;
  totalTasksInProject: number;
}

// Removed ViewMode type - all functionality will be in a single view

export default function ProjectsTasksPage() {
  const { isSchedulingMode, setIsSchedulingMode } = useViewMode();
  const { projects, folders, updateTaskInProject, addTaskToProject, updateProject, deleteProject } = useProjects();
  
  // Initialize with default preferences to prevent hydration mismatch
  const [preferences, setPreferences] = useState<TasksViewPreferences>(defaultTasksPreferences);
  const [isClient, setIsClient] = useState(false);
  
  // Today mode filters (retained for 'Today' button functionality)
  const [showCompleted, setShowCompleted] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in-progress' | 'blocked'>('all');
  
  // Edit modal state for today mode (now used for all tasks)
  const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Scheduling mode filters and sorting (will be integrated into All Tasks filters and sorting)
  const [schedulingSort, setSchedulingSort] = useState<'priority' | 'dueDate' | 'title' | 'created'>('priority');
  const [schedulingFilter, setSchedulingFilter] = useState<{
    project: string;
    priority: string;
    status: string;
  }>({
    project: 'all',
    priority: 'all',
    status: 'all'
  });

  // Extract persistent state from preferences
  const { allTasksFilters, allTasksGroupBy, allTasksSubGroupBy, allTasksSortBy, sortOrder, collapsedProjectGroups } = preferences;

  // Helper function to update preferences and save to localStorage
  const updatePreferences = useCallback((updates: Partial<TasksViewPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    saveTasksPreferences(newPreferences);
  }, [preferences]);

  // Load preferences on client side after mount to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const clientPreferences = loadTasksPreferences();
    setPreferences(clientPreferences);
  }, []);

  // Function to toggle project group collapse state
  const toggleProjectCollapse = useCallback((projectId: string) => {
    const isCurrentlyCollapsed = collapsedProjectGroups.includes(projectId);
    const newCollapsedGroups = isCurrentlyCollapsed
      ? collapsedProjectGroups.filter(id => id !== projectId)
      : [...collapsedProjectGroups, projectId];
    
    updatePreferences({
      collapsedProjectGroups: newCollapsedGroups
    });
  }, [collapsedProjectGroups, updatePreferences]);

  // Add task modal state
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Project edit modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Get all tasks with project info
  const allTasks = useMemo((): TaskWithProject[] => {
    return projects
      .filter(p => !p.isDeleted)
      .flatMap(project => 
        project.tasks.map((task, index) => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          taskNumber: index + 1, // 1-based indexing
          totalTasksInProject: project.tasks.length
        }))
      );
  }, [projects]);

  // Initialize collapsed state when switching to project grouping
  useEffect(() => {
    if (allTasksGroupBy === 'project' && isClient && allTasks.length > 0) {
      // Get all unique project IDs from current tasks
      const projectIdsSet = new Set<string>();
      allTasks.forEach(task => projectIdsSet.add(task.projectId));
      const projectIds = Array.from(projectIdsSet);
      
      // If no collapsed state exists yet, set all projects as collapsed by default
      if (collapsedProjectGroups.length === 0 && projectIds.length > 0) {
        updatePreferences({
          collapsedProjectGroups: projectIds // All projects collapsed by default
        });
      }
    }
  }, [allTasksGroupBy, isClient, allTasks, collapsedProjectGroups.length, updatePreferences]);

  // Ensure project filter remains valid if a project is archived/deleted or removed
  useEffect(() => {
    if (allTasksFilters.project && allTasksFilters.project !== 'all') {
      const exists = projects.some(p => !p.isDeleted && p.id === allTasksFilters.project);
      if (!exists) {
        updatePreferences({ allTasksFilters: { ...allTasksFilters, project: 'all' } });
      }
    }
  }, [projects, allTasksFilters.project]);

  // Filter tasks for Today Mode (rich functionality) - Retained for logic within main filter
  const todayTasks = useMemo(() => {
    const todayKey = getTodayDateKey();
    
    // Start with tasks due today
    let filteredTasks = allTasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDueDateKey = getDateKey(task.dueDate);
      // ONLY include tasks due today (not overdue tasks)
      return taskDueDateKey === todayKey;
    });

    // Optionally include tasks completed today
    if (showCompleted) {
      const completedTodayTasks = allTasks.filter(task => {
        if (task.status !== 'completed' || !task.completedAt) return false;
        
        const completedDateKey = getDateKey(task.completedAt);
        
        return completedDateKey === todayKey;
      });

      // Combine and deduplicate
      completedTodayTasks.forEach(task => {
        if (!filteredTasks.find(t => t.id === task.id)) {
          filteredTasks.push(task);
        }
      });
    } else {
      // Filter out completed tasks if not showing them
      filteredTasks = filteredTasks.filter(task => task.status !== 'completed');
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }

    // Apply status filter (only for non-completed tasks)
    if (statusFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.status === 'completed' || task.status === statusFilter
      );
    }

    const combinedTasks = filteredTasks;

    // Sort: incomplete tasks first (by due date, then priority), then completed tasks
    return combinedTasks.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      
      // Both completed or both incomplete - sort by due date first
      if (a.dueDate && b.dueDate) {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        const dateCompare = dateA.getTime() - dateB.getTime();
        if (dateCompare !== 0) return dateCompare;
      }
      
      // Then by priority
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }, [allTasks, showCompleted, priorityFilter, statusFilter]);

  // Separate incomplete and completed tasks for today view
  const incompleteTasks = todayTasks.filter(task => task.status !== 'completed');
  const completedTasks = todayTasks.filter(task => task.status === 'completed');

  // Filtered and grouped tasks for All Tasks view
  const filteredAllTasks = useMemo(() => {
    let filtered = allTasks;

    // Apply search filter
    if (allTasksFilters.search) {
      const searchTerm = allTasksFilters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.projectName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply project filter
    if (allTasksFilters.project !== 'all') {
      filtered = filtered.filter(task => task.projectId === allTasksFilters.project);
    }



    // Apply status filter
    if (allTasksFilters.status !== 'all') {
      filtered = filtered.filter(task => task.status === allTasksFilters.status);
    }

    // Apply due date filter (normalized via date utils)
    if (allTasksFilters.dueDate !== 'all') {
      const todayKey = getTodayDateKey();
      const today = dateFromDateKey(todayKey);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);

      filtered = filtered.filter(task => {
        const hasDue = !!task.dueDate;
        const dueKey = hasDue ? getDateKey(task.dueDate as string) : '';
        const dueDateOnly = hasDue ? dateFromDateKey(dueKey) : null;

        switch (allTasksFilters.dueDate) {
          case 'overdue':
            return hasDue ? dueKey < todayKey : false;
          case 'today':
            return hasDue ? dueKey === todayKey : false;
          case 'thisWeek':
            return hasDue ? (dueDateOnly!.getTime() >= today.getTime() && dueDateOnly!.getTime() <= weekFromNow.getTime()) : false;
          case 'none':
            return !hasDue;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allTasks, allTasksFilters]);

  // Sorting function with multiple criteria support
  const sortTasks = (tasks: TaskWithProject[], sortBy: typeof allTasksSortBy, order: typeof sortOrder) => {
    return [...tasks].sort((a, b) => {
      // Use multiple sorts if enabled, otherwise single sort
      const sortsToApply = preferences.useMultipleSort && preferences.multipleSorts && preferences.multipleSorts.length > 0 
        ? preferences.multipleSorts 
        : [{ field: sortBy, order: order }];
      
      for (const sort of sortsToApply) {
        let compareValue = 0;
        
        switch (sort.field) {
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) compareValue = 0;
            else if (!a.dueDate) compareValue = 1;
            else if (!b.dueDate) compareValue = -1;
            else compareValue = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            break;
          case 'created':
            compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'completion':
            const statusOrder = { 'completed': 1, 'blocked': 2, 'in-progress': 3, 'todo': 4 };
            compareValue = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
            break;
          case 'title':
            compareValue = a.title.localeCompare(b.title);
            break;
          default:
            compareValue = a.title.localeCompare(b.title);
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
  };

  // Grouped tasks for All Tasks view
  const groupedAllTasks = useMemo(() => {
    if (allTasksGroupBy === 'none') {
      return [{
        id: 'all',
        name: 'All Tasks',
        tasks: sortTasks(filteredAllTasks, allTasksSortBy, sortOrder)
      }];
    }

    // First, filter by subgrouping if selected
    let tasksToGroup = filteredAllTasks;
    if (allTasksSubGroupBy !== 'all') {
      switch (allTasksGroupBy) {
        case 'project':
          tasksToGroup = filteredAllTasks.filter(task => task.projectId === allTasksSubGroupBy);
          break;
        case 'status':
          tasksToGroup = filteredAllTasks.filter(task => task.status === allTasksSubGroupBy);
          break;

        case 'dueDate':
          // Handle due date filtering logic
          const todayKey = getTodayDateKey();
          const today = dateFromDateKey(todayKey);
          const weekFromNow = new Date(today);
          weekFromNow.setDate(today.getDate() + 7);
          tasksToGroup = filteredAllTasks.filter(task => {
            if (allTasksSubGroupBy === 'none') return !task.dueDate;
            const hasDue = !!task.dueDate;
            if (!hasDue) return false;
            const dueKey = getDateKey(task.dueDate as string);
            const dueDateOnly = dateFromDateKey(dueKey);
            if (allTasksSubGroupBy === 'overdue') return dueKey < todayKey;
            if (allTasksSubGroupBy === 'today') return dueKey === todayKey;
            if (allTasksSubGroupBy === 'thisWeek') return dueDateOnly.getTime() >= today.getTime() && dueDateOnly.getTime() <= weekFromNow.getTime();
            if (allTasksSubGroupBy === 'later') return dueDateOnly.getTime() > weekFromNow.getTime();
            return true;
          });
          break;
        case 'completedDate':
          // No subgroup filtering applied for completedDate grouping
          break;
      }
    }

    // Special grouping for completed tasks by completion date
    if (allTasksGroupBy === 'completedDate') {
      const groups = new Map<string, TaskWithProject[]>();
      tasksToGroup.forEach(task => {
        if (task.status === 'completed' && task.completedAt) {
          const key = getDateKey(task.completedAt);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(task);
        }
      });
      const todayKey2 = getTodayDateKey();
      const entries = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
      return entries.map(([dateKey, tasks]) => ({
        id: dateKey,
        name: dateKey === todayKey2 ? 'Completed Today' : dateFromDateKey(dateKey).toLocaleDateString(),
        tasks: sortTasks(tasks, allTasksSortBy, sortOrder)
      }));
    }

    // Group tasks
    const groups = new Map<string, TaskWithProject[]>();
    
    tasksToGroup.forEach(task => {
      let groupKey = '';
      let groupName = '';
      
      switch (allTasksGroupBy) {
        case 'project':
          groupKey = task.projectId;
          groupName = task.projectName;
          break;
        case 'status':
          groupKey = task.status;
          groupName = task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ');
          break;

        case 'dueDate':
          if (!task.dueDate) {
            groupKey = 'none';
            groupName = 'No Due Date';
          } else {
            const todayKey = getTodayDateKey();
            const today = dateFromDateKey(todayKey);
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);
            const dueKey = getDateKey(task.dueDate as string);
            const dueDateOnly = dateFromDateKey(dueKey);
            if (dueKey < todayKey) {
              groupKey = 'overdue';
              groupName = 'Overdue';
            } else if (dueKey === todayKey) {
              groupKey = 'today';
              groupName = 'Due Today';
            } else if (dueDateOnly.getTime() <= weekFromNow.getTime()) {
              groupKey = 'thisWeek';
              groupName = 'This Week';
            } else {
              groupKey = 'later';
              groupName = 'Later';
            }
          }
          break;

      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(task);
    });

    return Array.from(groups.entries()).map(([groupKey, tasks]) => ({
      id: groupKey,
      name: groupKey === 'none' ? 'No Due Date' : 
            groupKey === 'overdue' ? 'Overdue' :
            groupKey === 'today' ? 'Due Today' : // Reusing 'today' key for created date too
            groupKey === 'thisWeek' ? 'This Week' : 
            groupKey === 'thisMonth' ? 'This Month' : 
            groupKey === 'later' ? 'Later' :
            groupKey === 'older' ? 'Older' :
            tasks[0]?.projectName || tasks[0]?.status || groupKey,
      tasks: sortTasks(tasks, allTasksSortBy, sortOrder)
    }));
  }, [filteredAllTasks, allTasksGroupBy, allTasksSubGroupBy, allTasksSortBy, sortOrder]);

  // Get subgrouping options based on current grouping
  const getSubGroupingOptions = () => {
    switch (allTasksGroupBy) {
      case 'project':
        return [
          { value: 'all', label: 'All Projects' },
          ...projects.filter(p => !p.isDeleted).map(project => ({
            value: project.id,
            label: project.name
          }))
        ];
      case 'status':
        return [
          { value: 'all', label: 'All Statuses' },
          { value: 'todo', label: 'To Do' },
          { value: 'in-progress', label: 'In Progress' },
          { value: 'blocked', label: 'Blocked' },
          { value: 'completed', label: 'Completed' }
        ];

      case 'dueDate':
        return [
          { value: 'all', label: 'All Due Dates' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'today', label: 'Due Today' },
          { value: 'thisWeek', label: 'This Week' },
          { value: 'later', label: 'Later' },
          { value: 'none', label: 'No Due Date' }
        ];
      default:
        return [];
    }
  };

  // Filtered and sorted tasks for Scheduling Mode (will be removed as a separate view)
  const schedulingTasks = useMemo(() => {
    let filtered = allTasks;
    
    // Apply filters
    if (schedulingFilter.project !== 'all') {
      filtered = filtered.filter(task => task.projectId === schedulingFilter.project);
    }
    
    if (schedulingFilter.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === schedulingFilter.priority);
    }
    
    if (schedulingFilter.status !== 'all') {
      filtered = filtered.filter(task => task.status === schedulingFilter.status);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (schedulingSort) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [allTasks, schedulingFilter, schedulingSort]);

  // Handle task status change
  const handleTaskStatusChange = (taskId: string, status: 'todo' | 'in-progress' | 'completed' | 'blocked') => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      updateTaskInProject(task.projectId, taskId, { 
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
      });
    }
  };

  // Handle task scheduling via drag and drop (will be reused)
  const handleTaskSchedule = (date: Date, taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      try {
        updateTaskInProject(task.projectId, taskId, { 
          dueDate: date.toISOString().split('T')[0] // Format as YYYY-MM-DD
        });
        console.log(`Task "${task.title}" scheduled for ${date.toLocaleDateString()}`);
      } catch (error) {
        console.error('Failed to schedule task:', error);
      }
    }
  };



  // Handle edit task (used for all tasks now)
  const handleEditTask = (task: TaskWithProject) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // Handle save edited task
  const handleSaveEditedTask = (updatedTask: Partial<ProjectTask>, isNew: boolean) => {
    if (editingTask && !isNew) {
      updateTaskInProject(editingTask.projectId, editingTask.id, updatedTask);
      setIsEditModalOpen(false);
      setEditingTask(null);
    }
  };

  // Enhanced Today Task Card with animations (will be moved to CompactTaskCard)
  const TodayTaskCard = ({ task }: { task: TaskWithProject }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const handleStatusToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      
      // Trigger exciting animation when completing a task
      if (nextStatus === 'completed') {
        setIsAnimating(true);
        setShowConfetti(true);
        
        // Create confetti particles
        createConfettiParticles(e.currentTarget as HTMLElement);
        
        // Reset animation states
        setTimeout(() => {
          setIsAnimating(false);
          setShowConfetti(false);
        }, 1000);
      }
      
      handleTaskStatusChange(task.id, nextStatus);
    };

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

    const dueInfo = formatDueDate(task.dueDate);
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
        className={cn(
          "bg-card rounded-lg p-4 transition-all duration-200 group border-l-4 relative overflow-hidden",
          task.status === 'completed' 
            ? "opacity-60 bg-muted/30" 
            : "hover:bg-accent/20",
          task.priority === 'urgent' && "border-l-red-500",
          task.priority === 'high' && "border-l-orange-500", 
          task.priority === 'medium' && "border-l-blue-500",
          task.priority === 'low' && "border-l-gray-400",
          !task.priority && "border-l-gray-200",
          isAnimating && "animate-pulse"
        )}
      >
        {/* Celebration background effect */}
        {showConfetti && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-blue-100/50 animate-fade-in-out pointer-events-none" />
        )}
        
        <div className="flex items-center gap-4 relative z-10">
          {/* Animated Square Checkbox */}
          <button
            onClick={handleStatusToggle}
            className={cn(
              "flex-shrink-0 transition-all duration-300 relative",
              "hover:scale-110 active:scale-95",
              isAnimating && "animate-bounce"
            )}
            style={{
              transform: isAnimating ? 'scale(1.2)' : undefined,
              transition: 'transform 0.3s ease-in-out'
            }}
          >
            {task.status === 'completed' ? (
              <div className="relative">
                <CheckSquare2 className={cn(
                  "w-5 h-5 text-green-600 transition-all duration-300",
                  isAnimating && "drop-shadow-lg"
                )} />
                {/* Success ring animation */}
                {isAnimating && (
                  <div className="absolute inset-0 rounded border-2 border-green-400 animate-ping" />
                )}
              </div>
            ) : (
              <Square className={cn(
                "w-5 h-5 text-muted-foreground transition-all duration-200",
                "hover:text-green-500 hover:scale-105"
              )} />
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Title with project indicator inline */}
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.projectColor }}
              />
              <h4 className={cn(
                "font-medium text-sm text-foreground flex-1 line-clamp-2 transition-all duration-300",
                task.status === 'completed' && "line-through text-muted-foreground",
                isAnimating && "text-green-600"
              )}>
                {task.title}
              </h4>
            </div>

            {/* Description if exists */}
            {task.description && (
              <p className={cn(
                "text-xs text-muted-foreground mb-2 line-clamp-1 transition-all duration-300",
                task.status === 'completed' && "line-through"
              )}>
                {task.description}
              </p>
            )}

            {/* Due date and project name */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium">{task.projectName}</span>
              {dueInfo && (
                <>
                  <span>•</span>
                  <span className="font-medium text-muted-foreground" title={fullDueTitle}>
                    {dueInfo.text}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleEditTask(task)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-md hover:bg-accent transition-all flex-shrink-0"
              title="Edit task"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Persistent Header Component
  const TasksHeader = () => (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-light text-foreground tracking-tight">
              Tasks
            </h1>
            
            <span className="bg-muted px-3 py-1.5 rounded-full text-sm font-medium">
              {allTasks.length} total tasks
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddTaskModalOpen(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
            <Button
              onClick={() => setIsSchedulingMode(!isSchedulingMode)}
              size="sm"
              variant={isSchedulingMode ? 'secondary' : 'outline'}
              className="flex items-center gap-2"
              title={isSchedulingMode ? 'Switch to list view' : 'Open monthly scheduling'}
            >
              {isSchedulingMode ? 'List' : 'Schedule'}
            </Button>
          </div>
        </div>

        {/* Removed Persistent View Mode Tabs */}
        {/* 
        <div className="flex items-center bg-muted/30 rounded-lg p-1 w-fit">
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              viewMode === 'all' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4 mr-2 inline" />
            All Tasks
          </button>
          <button
            onClick={() => setViewMode('today')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              viewMode === 'today' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-4 h-4 mr-2 inline" />
            Today ({incompleteTasks.length})
          </button>
          <button
            onClick={() => setViewMode('scheduling')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              viewMode === 'scheduling' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-4 h-4 mr-2 inline" />
            Schedule
          </button>
        </div>
        */}
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Persistent Header */}
        <TasksHeader />

        {/* Content Area: List or Monthly Scheduling */}
        <div className="flex-1 overflow-hidden flex">
          <div className="container mx-auto px-6 py-6 h-full overflow-y-auto flex-1">
            {/* Filtering and Grouping Controls */}
            {!isSchedulingMode && (
            <div className="mb-6">
              {/* Filter Controls - Restructured into two clear rows */}
              <div className="p-4 bg-muted/20 rounded-lg space-y-4">
                
                {/* Row 1: Search, Grouping, Subgrouping, and Today Button */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={allTasksFilters.search}
                      onChange={(e) => updatePreferences({ 
                        allTasksFilters: { ...allTasksFilters, search: e.target.value }
                      })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Main Grouping */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Group by:</label>
                    <select
                      value={allTasksGroupBy}
                      onChange={(e) => {
                        updatePreferences({ 
                          allTasksGroupBy: e.target.value as any,
                          allTasksSubGroupBy: 'all' // Reset subgrouping when main grouping changes
                        });
                      }}
                      className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="none">None</option>
                      <option value="project">Project</option>
                      <option value="status">Status</option>
                      <option value="dueDate">Due Date</option>
                      <option value="completedDate">Done by day</option>
                    </select>
                  </div>

                  {/* Project Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Project:</label>
                    <select
                      value={allTasksFilters.project}
                      onChange={(e) => updatePreferences({ allTasksFilters: { ...allTasksFilters, project: e.target.value } })}
                      className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="all">All Projects</option>
                      {projects.filter(p => !p.isDeleted).map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subgrouping - Only show if main grouping is selected */}
                  {allTasksGroupBy !== 'none' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Then by:</label>
                      <select
                        value={allTasksSubGroupBy}
                        onChange={(e) => updatePreferences({ allTasksSubGroupBy: e.target.value })}
                        className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {getSubGroupingOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Today Button - Quick filter */}
                  <Button
                    onClick={() => {
                      updatePreferences({ 
                        allTasksFilters: { ...allTasksFilters, dueDate: 'today' }
                      });
                    }}
                    variant={allTasksFilters.dueDate === 'today' ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2 ml-auto"
                  >
                    <Clock className="w-4 h-4" />
                    Today
                  </Button>
                </div>

                {/* Row 2: Sorting Options */}
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="text-sm text-muted-foreground">Sort by:</label>
                  
                  {/* Due Date Sort */}
                  <Button
                    onClick={() => {
                      if (allTasksSortBy === 'dueDate') {
                        updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
                      } else {
                        updatePreferences({ 
                          allTasksSortBy: 'dueDate',
                          sortOrder: 'asc'
                        });
                      }
                    }}
                    variant={allTasksSortBy === 'dueDate' ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    Due Date
                    {allTasksSortBy === 'dueDate' && (
                      <span className="text-xs">({sortOrder === 'asc' ? 'Earliest' : 'Latest'})</span>
                    )}
                  </Button>

                  {/* Created Sort */}
                  <Button
                    onClick={() => {
                      if (allTasksSortBy === 'created') {
                        updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
                      } else {
                        updatePreferences({ 
                          allTasksSortBy: 'created',
                          sortOrder: 'desc'
                        });
                      }
                    }}
                    variant={allTasksSortBy === 'created' ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    Created
                    {allTasksSortBy === 'created' && (
                      <span className="text-xs">({sortOrder === 'desc' ? 'Newest' : 'Oldest'})</span>
                    )}
                  </Button>

                  {/* Completion Sort */}
                  <Button
                    onClick={() => {
                      if (allTasksSortBy === 'completion') {
                        updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
                      } else {
                        updatePreferences({ 
                          allTasksSortBy: 'completion',
                          sortOrder: 'desc'
                        });
                      }
                    }}
                    variant={allTasksSortBy === 'completion' ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    Completion
                    {allTasksSortBy === 'completion' && (
                      <span className="text-xs">({sortOrder === 'desc' ? 'Incomplete First' : 'Complete First'})</span>
                    )}
                  </Button>

                  {/* Title Sort */}
                  <Button
                    onClick={() => {
                      if (allTasksSortBy === 'title') {
                        updatePreferences({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
                      } else {
                        updatePreferences({ 
                          allTasksSortBy: 'title',
                          sortOrder: 'asc'
                        });
                      }
                    }}
                    variant={allTasksSortBy === 'title' ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    Title
                    {allTasksSortBy === 'title' && (
                      <span className="text-xs">({sortOrder === 'asc' ? 'A→Z' : 'Z→A'})</span>
                    )}
                  </Button>

                  {/* Multi-Sort Toggle & Indicator */}
                  <div className="flex items-center gap-2 border-l border-border/30 pl-4 ml-2">
                    <Button
                      onClick={() => {
                        updatePreferences({ useMultipleSort: !preferences.useMultipleSort });
                      }}
                      variant={preferences.useMultipleSort ? 'secondary' : 'outline'}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      Multi-Sort
                      {preferences.useMultipleSort && (
                        <span className="text-xs bg-primary/20 text-primary px-1 rounded">
                          {preferences.multipleSorts?.length || 2}
                        </span>
                      )}
                    </Button>
                    
                    {/* Show current multi-sort hierarchy */}
                    {preferences.useMultipleSort && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Order:</span>
                        {preferences.multipleSorts?.map((sort, index) => (
                          <span key={index} className="ml-1">
                            {index + 1}.{sort.field === 'completion' ? 'Status' : sort.field.charAt(0).toUpperCase() + sort.field.slice(1)}
                            {index < (preferences.multipleSorts?.length || 0) - 1 ? ' →' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>



                  {/* Clear Filters */}
                  {(allTasksFilters.search || allTasksFilters.dueDate !== 'all' || allTasksGroupBy !== 'none') && (
                    <button
                      onClick={() => {
                        updatePreferences({
                          allTasksFilters: { search: '', project: 'all', status: 'all', dueDate: 'all' }, // Reset to show all tasks
                          allTasksGroupBy: 'none',
                          allTasksSubGroupBy: 'all'
                        });
                      }}
                      className="p-2 text-muted-foreground hover:text-foreground ml-auto"
                      title="Clear all filters and grouping"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Task Count */}
                  <span className="text-sm text-muted-foreground">
                    {filteredAllTasks.length} of {allTasks.length} tasks
                  </span>
                </div>
              </div>
            </div>
            )}

            {/* Tasks List */}
            {!isSchedulingMode ? (
            <div className="max-w-5xl mx-auto space-y-6">
              {filteredAllTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {allTasks.length === 0 ? (
                    <>
                      <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                      <p>Create your first task to get started!</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">No tasks match your filters</h3>
                      <p>Try adjusting your search or filter criteria.</p>
                    </>
                  )}
                </div>
              ) : (
                groupedAllTasks.map(group => {
                  const isProjectGroup = allTasksGroupBy === 'project';
                  const isCollapsed = isProjectGroup && collapsedProjectGroups.includes(group.id);
                  
                  return (
                    <div key={group.id}>
                      {allTasksGroupBy !== 'none' && (
                        <div 
                          className={cn(
                            "flex items-center justify-between gap-2 mb-3",
                            isProjectGroup && "cursor-pointer hover:bg-accent/20 rounded-lg px-2 py-1 -mx-2 transition-colors"
                          )}
                          onClick={isProjectGroup ? () => toggleProjectCollapse(group.id) : undefined}
                        >
                          <div className="flex items-center gap-2">
                          {isProjectGroup && (
                            <div className="flex-shrink-0">
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          )}
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              {group.name}
                              <span className="text-sm font-normal text-muted-foreground">
                                ({group.tasks.length})
                              </span>
                            </h2>
                          </div>
                          {/* Add/Edit Project Buttons - Only for project groups */}
                          {isProjectGroup && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent group collapse/expand
                                  setEditingTask(null);
                                  setIsAddTaskModalOpen(true);
                                  // Pre-select the project by setting a temporary project ID
                                  (window as any).selectedProjectId = group.id;
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
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
                            </div>
                          )}
                        </div>
                      )}
                      {(!isProjectGroup || !isCollapsed) && (
                        <div className="space-y-2">
                          {group.tasks.map(task => (
                            <CompactTaskCard
                              key={task.id}
                              task={task}
                              onStatusChange={handleTaskStatusChange}
                              onUpdateTask={(taskId, updates) => {
                                updateTaskInProject(task.projectId, taskId, updates);
                              }}
                              showProject={allTasksGroupBy !== 'project'}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                <MonthlyTaskScheduler
                  tasks={allTasks}
                  onDateDrop={handleTaskSchedule}
                />
              </div>
            )}
          </div>

          {/* Scheduling Calendar Sidebar */}
          {!isSchedulingMode && (
            <div className="w-80 flex-shrink-0 border-l border-border/20 p-6 overflow-y-auto">
              <MiniSchedulerCalendar
                onDateDrop={handleTaskSchedule}
                tasks={allTasks}
                className="sticky top-0"
              />
            </div>
          )}
        </div>

        {/* Add Task Modal */}
        {isAddTaskModalOpen && (
          <ProjectTaskFormModal
            isOpen={isAddTaskModalOpen}
            onClose={() => setIsAddTaskModalOpen(false)}
            onSave={(taskData, isNew) => {
              if (isNew && taskData.title) {
                // Check if we have a pre-selected project from the "Add Task" button
                const selectedProjectId = (window as any).selectedProjectId;
                let targetProject;
                
                if (selectedProjectId) {
                  targetProject = projects.find(p => p.id === selectedProjectId && !p.isDeleted);
                  // Clear the selected project ID
                  delete (window as any).selectedProjectId;
                } else {
                  // Fallback to first available project
                  targetProject = projects.find(p => !p.isDeleted);
                }
                
                if (targetProject) {
                  const newTaskData = {
                    title: taskData.title,
                    description: taskData.description || '',
                    status: taskData.status || 'todo' as const,
                    priority: taskData.priority || 'medium' as const,
                    dueDate: taskData.dueDate,
                    startDate: taskData.startDate
                  };
                  addTaskToProject(targetProject.id, newTaskData);
                }
              }
              setIsAddTaskModalOpen(false);
            }}
          />
        )}

        {/* Edit Task Modal */}
        {isEditModalOpen && editingTask && (
          <ProjectTaskFormModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingTask(null);
            }}
            onSave={handleSaveEditedTask}
            taskToEdit={editingTask}
          />
        )}

        {/* Edit Project Modal */}
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
    </AppLayout>
  );
} 