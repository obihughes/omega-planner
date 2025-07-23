import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Clock, 
  Calendar as CalendarIcon,
  Edit3,
  Trash2,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface TaskListViewProps {
  className?: string;
}

export function TaskListView({ className }: TaskListViewProps) {
  const { projects, updateTaskInProject, deleteTaskFromProject, addTaskToProject } = useProjects();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'project' | 'status' | 'none'>('project');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'description' | 'dueDate' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  // Filtering and sorting state
  const [filters, setFilters] = useState({
    priority: 'all' as 'all' | 'urgent' | 'high' | 'medium' | 'low',
    dueDate: 'all' as 'all' | 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'future' | 'none',
    status: 'all' as 'all' | 'todo' | 'in-progress' | 'completed' | 'blocked'
  });
  const [sortBy, setSortBy] = useState<'title' | 'dueDate' | 'priority' | 'status' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
          case 'overdue':
            return dueDateOnly < today && task.status !== 'completed';
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
          tasks: tasks.sort((a, b) => a.order - b.order)
        };
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

  // Handle task status toggle
  const handleTaskToggle = (task: TaskWithProject) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTaskInProject(task.projectId, task.id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    });
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
    setFilters({
      priority: 'all',
      dueDate: 'all',
      status: 'all'
    });
  };

  const hasActiveFilters = filters.priority !== 'all' || filters.dueDate !== 'all' || filters.status !== 'all';

  // Get status icon
  const getStatusIcon = (status: ProjectTask['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="relative w-4 h-4">
            <CheckSquare className="w-4 h-4 text-green-600" />
            <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 stroke-[3]" />
          </div>
        );
      case 'in-progress':
        return <Square className="w-4 h-4 text-blue-500" />;
      case 'blocked':
        return <Square className="w-4 h-4 text-red-500" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  // Format due date
  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', isOverdue: true };
    if (diffDays === 0) return { text: 'Today', isOverdue: false };
    if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false };
    if (diffDays <= 7) return { text: `${diffDays} days`, isOverdue: false };
    
    return { text: due.toLocaleDateString(), isOverdue: false };
  };

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-foreground">All Tasks</h2>
          <span className="bg-muted px-2 py-1 rounded-full text-xs font-medium text-muted-foreground">
            {completedTasks}/{totalTasks}
          </span>
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
                {hasActiveFilters && (
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filters</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="h-auto p-1 text-xs">
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
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
                    onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value as any }))}
                    className="w-full px-2 py-1 text-xs bg-input border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Dates</option>
                    <option value="overdue">Overdue</option>
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
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
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
                      onClick={() => setSortBy(option.value as any)}
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
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
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
            onChange={(e) => setGroupBy(e.target.value as 'project' | 'status' | 'none')}
            className="px-2 py-1.5 rounded-lg bg-input border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
          >
            <option value="none">No Grouping</option>
            <option value="project">By Project</option>
            <option value="status">By Status</option>
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
      <div className="flex-1 overflow-y-auto space-y-4">
        {groupedTasks.map(group => (
          <div key={group.id} className="bg-card border border-border rounded-lg">
            {/* Group Header - Only show for grouped views */}
            {groupBy !== 'none' && (
              <button
                onClick={() => toggleProjectCollapse(group.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsedProjects.has(group.id) ? (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )}
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="font-medium text-sm text-foreground">{group.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {group.tasks.filter(t => t.status === 'completed').length}/{group.tasks.length}
                </span>
              </button>
            )}

            {/* Tasks */}
            {(groupBy === 'none' || !collapsedProjects.has(group.id)) && (
              <div className={groupBy !== 'none' ? "border-t border-border" : ""}>
                {group.tasks.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No tasks found
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {group.tasks.map(task => {
                      const dueInfo = formatDueDate(task.dueDate);
                      
                      return (
                        <div key={task.id} className="p-3 hover:bg-accent/30 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Status toggle */}
                            <button
                              onClick={() => handleTaskToggle(task)}
                              className="mt-1 flex-shrink-0 hover:scale-110 transition-transform"
                            >
                              {getStatusIcon(task.status)}
                            </button>
                            
                            {/* Task content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {/* Title - Editable and Prominent */}
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
                                      className="w-full font-semibold text-base bg-transparent border-none outline-none focus:bg-accent/50 rounded px-1 -mx-1"
                                    />
                                  ) : (
                                    <h3 
                                      className={cn(
                                        "font-semibold text-base cursor-pointer hover:bg-accent/20 rounded px-1 -mx-1 transition-colors leading-tight",
                                        task.status === 'completed' 
                                          ? "line-through text-muted-foreground" 
                                          : "text-foreground"
                                      )}
                                      onClick={() => startEditing(task, 'title')}
                                      title="Click to edit title"
                                    >
                                      {task.title}
                                    </h3>
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
                                        className="w-full text-xs text-muted-foreground mt-1 bg-transparent border-none outline-none focus:bg-accent/50 rounded px-1 -mx-1 resize-none"
                                        rows={1}
                                      />
                                    ) : (
                                      <p 
                                        className="text-xs text-muted-foreground mt-0.5 cursor-pointer hover:bg-accent/20 rounded px-1 -mx-1 transition-colors line-clamp-2"
                                        onClick={() => startEditing(task, 'description')}
                                        title="Click to edit description"
                                      >
                                        {task.description}
                                      </p>
                                    )
                                  )}
                                  
                                  {/* Project name (when grouped by status) */}
                                  {groupBy === 'status' && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div 
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: task.projectColor }}
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {task.projectName}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Due date - Editable and Compact */}
                                  {(dueInfo || editingTaskId === task.id && editingField === 'dueDate') && (
                                    editingTaskId === task.id && editingField === 'dueDate' ? (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
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
                                          className="text-xs bg-transparent border-none outline-none focus:bg-accent/50 rounded px-1 -mx-1"
                                        />
                                      </div>
                                    ) : dueInfo && (
                                      <div 
                                        className="flex items-center gap-1 mt-1 cursor-pointer hover:bg-accent/20 rounded px-1 -mx-1 transition-colors"
                                        onClick={() => startEditing(task, 'dueDate')}
                                        title="Click to edit due date"
                                      >
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className={cn(
                                          "text-xs font-medium",
                                          dueInfo.isOverdue 
                                            ? "text-red-500" 
                                            : "text-muted-foreground"
                                        )}>
                                          {dueInfo.text}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                                
                                {/* Priority indicator */}
                                {task.priority === 'urgent' && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                                )}
                                {task.priority === 'high' && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1 flex-shrink-0" />
                                )}
                              </div>
                            </div>
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
    </div>
  );
} 