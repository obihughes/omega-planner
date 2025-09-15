'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ClipboardList
} from 'lucide-react';
import { Task } from '@/types';
import { TASK_COLORS, DEFAULT_TASK_COLOR_INDEX } from '@/lib/constants';
import { formatDuration } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface TaskInboxViewProps {
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
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean }) => void;
  openViewNotesModal: (task: Task) => void;
}

export default function TaskInboxView({
  poolTasks,
  pinnedTasks,
  getPoolTasksForDate,
  getCombinedPoolTasks,
  addPoolTask,
  removePoolTask,
  removePoolTaskForDate,
  createPoolTask,
  createPoolTaskForDate,
  openEditModal,
  openViewNotesModal
}: TaskInboxViewProps) {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');

  // Get all inbox tasks (pool tasks + today's specific tasks)
  const allInboxTasks = useMemo(() => {
    return getCombinedPoolTasks();
  }, [getCombinedPoolTasks]);

  // Apply search filter
  const displayTasks = useMemo(() => {
    if (!searchTerm) return allInboxTasks;
    
    return allInboxTasks.filter(task => 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.notes && task.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allInboxTasks, searchTerm]);

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
      {/* Simplified Header - Everything on one line */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Title and stats */}
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Task Inbox</h2>
              <p className="text-sm text-muted-foreground">
                {totalTasks} tasks • {formatDuration(totalHours)}
              </p>
            </div>
          </div>

          {/* Right side - Search and Add button */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Add Task Button */}
            <Button onClick={() => {
              createPoolTask();
            }} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto">
        <TaskList tasks={displayTasks} onEdit={openEditModal} onDelete={handleDeleteTask} onViewNotes={openViewNotesModal} />
      </div>
    </div>
  );
}

// Task List Component
interface TaskListProps {
  tasks: Task[];
  onEdit: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean }) => void;
  onDelete: (task: Task) => void;
  onViewNotes: (task: Task) => void;
}

function TaskList({ tasks, onEdit, onDelete, onViewNotes }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Your inbox is empty</h3>
          <p className="text-sm text-muted-foreground">Create a new task to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="relative p-4 bg-card border border-border/40 hover:border-border transition-all duration-200 hover:shadow-sm group"
          >
            {/* Color indicator dot - only show if task has a color */}
            {task.color && (
              <div 
                className={cn("absolute top-3 left-3 w-3 h-3 rounded-full", task.color)}
              />
            )}
            
            {/* Task Content */}
            <div className={cn("space-y-3", task.color ? "pl-6" : "")}>
              <div className="pr-12">
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
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {new Date(task.poolDate).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewNotes(task);
                }}
                title="View Notes"
              >
                <ClipboardList className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(task, { isFromPool: true });
                }}
                title="Edit Task"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(task);
                }}
                title="Delete Task"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 