'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Calendar,
  Clock,
  Trash2,
  Edit3
} from 'lucide-react';
import { Task } from '@/types';
import { TASK_COLORS, DEFAULT_TASK_COLOR_INDEX } from '@/lib/constants';
import { formatDuration } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface UnscheduledTasksViewProps {
  poolTasks: Task[];
  pinnedTasks: Task[];
  getPoolTasksForDate: (dateKey: string) => Task[];
  getCombinedPoolTasks: () => Task[];
  addPoolTask: (task: Task) => void;
  removePoolTask: (taskId: string) => void;
  removePoolTaskForDate: (dateKey: string, taskId: string) => void;
  
  // New context-aware modal functions
  createPoolTask: (date?: Date) => void;
  createPoolTaskForDate: (date: Date) => void;
  editTask: (task: Task) => void;
}

export default function UnscheduledTasksView({
  poolTasks,
  pinnedTasks,
  getPoolTasksForDate,
  getCombinedPoolTasks,
  addPoolTask,
  removePoolTask,
  removePoolTaskForDate,
  createPoolTask,
  createPoolTaskForDate,
  editTask
}: UnscheduledTasksViewProps) {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'today'>('all');

  // Get today's date key
  const todayKey = new Date().toISOString().split('T')[0];
  const todayTasks = getPoolTasksForDate(todayKey);

  // Display tasks based on active tab
  const displayTasks = useMemo(() => {
    let tasks: Task[] = [];
    
    switch (activeTab) {
      case 'all':
        tasks = getCombinedPoolTasks();
        break;
      case 'pinned':
        tasks = pinnedTasks;
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

    return tasks;
  }, [activeTab, poolTasks, pinnedTasks, todayTasks, getCombinedPoolTasks, searchTerm]);

  // Create new task - use appropriate context-aware function based on tab
  const handleCreateTask = () => {
    switch (activeTab) {
      case 'all':
        createPoolTask(); // General pool task
        break;
      case 'today':
        createPoolTaskForDate(new Date()); // Today's date-specific pool task
        break;
      case 'pinned':
        // For pinned tab, create a general pool task (pinning happens after creation)
        createPoolTask();
        break;
      default:
        createPoolTask();
    }
  };

  // Delete task
  const handleDeleteTask = (task: Task) => {
    if (task.poolDate) {
      removePoolTaskForDate(task.poolDate, task.id);
    } else {
      removePoolTask(task.id);
    }
  };

  const totalTasks = displayTasks.length;
  const totalHours = displayTasks.reduce((sum, task) => sum + task.duration, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
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

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'pinned' | 'today')} className="flex-1 flex flex-col">
        <div className="px-6 py-3 border-b border-border">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Tasks ({getCombinedPoolTasks().length})</TabsTrigger>
            <TabsTrigger value="pinned">Pinned ({pinnedTasks.length})</TabsTrigger>
            <TabsTrigger value="today">Today ({todayTasks.length})</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="all" className="h-full m-0">
            <TaskList tasks={displayTasks} onEdit={editTask} onDelete={handleDeleteTask} />
          </TabsContent>
          
          <TabsContent value="pinned" className="h-full m-0">
            <TaskList tasks={displayTasks} onEdit={editTask} onDelete={handleDeleteTask} />
          </TabsContent>
          
          <TabsContent value="today" className="h-full m-0">
            <TaskList tasks={displayTasks} onEdit={editTask} onDelete={handleDeleteTask} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Task List Component
interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
          <p className="text-sm text-muted-foreground">Create a new task to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid gap-3 auto-fit-250">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="relative p-3 rounded-md bg-card border border-border/40 hover:border-border transition-all duration-200 hover:shadow-sm group"
          >
            {/* Color indicator dot */}
            {task.color && <div 
              className={cn("absolute top-2 left-2 w-2.5 h-2.5 rounded-full", task.color)}
            />}
            
            {/* Task Content */}
            <div className="space-y-2 pl-6">
              <div className="pr-16">
                <h3 className="font-medium text-sm leading-tight text-foreground">{task.name}</h3>
                {task.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(task.duration)}
                </div>
                {task.poolDate && (
                  <div className="text-xs bg-muted px-2 py-0.5 rounded">
                    {new Date(task.poolDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                className="p-1 rounded bg-accent hover:bg-accent/80 transition-colors"
                title="Edit task"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              
              <button
                onClick={() => onDelete(task)}
                className="p-1 rounded bg-accent hover:bg-accent/80 transition-colors text-destructive"
                title="Delete task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 