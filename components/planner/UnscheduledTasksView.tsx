'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Calendar,
  Clock,
  Trash2,
  CheckSquare,
  Square,
  MoreVertical,
  SortAsc,
  SortDesc,
  Filter
} from 'lucide-react';
import { Task } from '@/types';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { TASK_COLORS, DEFAULT_TASK_COLOR_INDEX } from '@/lib/constants';
import { formatDuration } from '@/utils/formatters';

type SortOption = 'name' | 'duration' | 'color' | 'created';

export default function UnscheduledTasksView() {
  const {
    poolTasks,
    poolTasksByDate,
    getPoolTasksForDate,
    getCombinedPoolTasks,
    addPoolTask,
    addPoolTaskForDate,
    removePoolTask,
    removePoolTaskForDate,
    openEditModal
  } = useDailyPlanner();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'today'>('all');

  // Get today's date key
  const todayKey = new Date().toISOString().split('T')[0];
  const todayTasks = getPoolTasksForDate(todayKey);

  // Combined tasks based on active tab
  const displayTasks = useMemo(() => {
    let tasks: Task[] = [];
    
    switch (activeTab) {
      case 'all':
        tasks = getCombinedPoolTasks();
        break;
      case 'general':
        tasks = poolTasks;
        break;
      case 'today':
        tasks = todayTasks;
        break;
    }

    // Apply search filter
    if (searchTerm) {
      tasks = tasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    tasks.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'color':
          aValue = a.color;
          bValue = b.color;
          break;
        case 'created':
        default:
          aValue = new Date(a.id).getTime();
          bValue = new Date(b.id).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return tasks;
  }, [activeTab, poolTasks, todayTasks, getCombinedPoolTasks, searchTerm, sortBy, sortOrder]);

  // Task selection handlers
  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const selectAllTasks = () => {
    setSelectedTasks(new Set(displayTasks.map(task => task.id)));
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  // Bulk operations
  const deleteSelectedTasks = () => {
    selectedTasks.forEach(taskId => {
      const task = displayTasks.find(t => t.id === taskId);
      if (task) {
        if (task.poolDate) {
          removePoolTaskForDate(task.poolDate, taskId);
        } else {
          removePoolTask(taskId);
        }
      }
    });
    clearSelection();
  };

  // Create new task
  const handleCreateTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: 'New Task',
      startHour: 9,
      duration: 1,
      baseDate: new Date().toISOString().split('T')[0],
      color: TASK_COLORS[0],
      notes: '',
      completed: false
    };

    if (activeTab === 'today') {
      addPoolTaskForDate(todayKey, newTask);
    } else {
      addPoolTask(newTask);
    }

    // Open edit modal for immediate editing
    openEditModal(newTask, { isNew: true });
  };

  const totalTasks = displayTasks.length;
  const totalHours = displayTasks.reduce((sum, task) => sum + task.duration, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Simplified Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Unscheduled Tasks</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {totalTasks} tasks • {formatDuration(totalHours)}
            </p>
          </div>
          <Button onClick={handleCreateTask} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Simplified Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
            >
              <option value="created">Recently Added</option>
              <option value="name">Name</option>
              <option value="duration">Duration</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>

          {selectedTasks.size > 0 && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
              <span className="text-sm text-muted-foreground">
                {selectedTasks.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedTasks}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="flex-1 px-6 pb-6">
          {/* Bulk Selection */}
          {displayTasks.length > 0 && (
            <div className="flex items-center gap-2 mb-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedTasks.size === displayTasks.length ? clearSelection : selectAllTasks}
                className="text-sm"
              >
                {selectedTasks.size === displayTasks.length ? (
                  <CheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                {selectedTasks.size === displayTasks.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}

          {/* Task Grid */}
          {displayTasks.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'today' 
                    ? "No tasks for today. Create one to get started!" 
                    : "No unscheduled tasks. Create one to get started!"
                  }
                </p>
                <Button onClick={handleCreateTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {displayTasks.map((task) => (
                <Card 
                  key={task.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-sm border ${
                    selectedTasks.has(task.id) 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'border-border hover:border-border/80'
                  } ${task.completed ? 'opacity-60' : ''}`}
                  onClick={() => toggleTaskSelection(task.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {selectedTasks.has(task.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: task.color }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(task);
                          }}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Task Name */}
                      <div className={`font-medium text-sm leading-tight ${
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {task.name}
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(task.duration)}
                        </div>
                        {task.poolDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.poolDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                      
                      {/* Notes (if any) */}
                      {task.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 