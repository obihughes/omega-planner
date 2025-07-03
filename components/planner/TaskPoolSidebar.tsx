import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Task } from '../../types/planner';
import { Input, Button } from "@/components/ui";
import { CopyPlus, Trash2, Edit3, Pin, PinOff, GripVertical, X as XIcon, ChevronDownIcon, Eye, Clock } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';
import { DURATION_OPTIONS as APP_DURATION_OPTIONS, TASK_COLORS as APP_TASK_COLORS } from '../../lib/constants';
import { cn } from '@/lib/utils';

// Imported from DailyPlanner's constants, or pass as prop
// For now, let's assume TASK_COLORS is passed as a prop.
// const TASK_COLORS = [ ... ]; 

export interface TaskPoolSidebarProps {
  poolTasks: Task[];
  TASK_COLORS: string[]; // For the add form color picker
  activeTab: 'pool' | 'pinned'; // To control rendering, though parent will likely do this
  topDayOffset: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Function to handle the actual adding of task to parent's state
  // Parent will assign ID and use its taskIdCounter
  onActualAddPoolTask: (taskData: { name: string; duration: number; color: string }) => void;
  
  // Utility functions
  onDeletePoolTask?: (taskId: string) => void;
  onClearPool?: () => void;
  openEditModal: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean, isPinned?: boolean }) => void;
  onAddTaskToTimeline: (task: Task, dayOffset: number) => void;
}

export const TaskPoolSidebar: React.FC<TaskPoolSidebarProps> = ({
  poolTasks,
  TASK_COLORS,
  activeTab, // This component might not need to know the activeTab if parent only renders it when it's the pool tab
  topDayOffset,
  isOpen,
  setIsOpen,
  onActualAddPoolTask,
  onDeletePoolTask,
  onClearPool,
  openEditModal,
  onAddTaskToTimeline,
}) => {
  const [showPoolTaskForm, setShowPoolTaskForm] = useState<boolean>(false);
  const [newPoolTaskName, setNewPoolTaskName] = useState<string>("");
  const [newPoolTaskDuration, setNewPoolTaskDuration] = useState<number>(1); // Default duration 1h
  const [newPoolTaskColor, setNewPoolTaskColor] = useState<string>('');
  const [viewingPoolTask, setViewingPoolTask] = useState<Task | null>(null);

  const poolFormMenuRef = useRef<HTMLDivElement>(null);
  const viewPoolTaskModalRef = useRef<HTMLDivElement>(null); // Ref for the view modal

  // Handle clicks outside the add pool task form to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPoolTaskForm && poolFormMenuRef.current && !poolFormMenuRef.current.contains(event.target as Node)) {
        setShowPoolTaskForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPoolTaskForm]);

  // Handle clicks outside the view pool task modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewingPoolTask && viewPoolTaskModalRef.current && !viewPoolTaskModalRef.current.contains(event.target as Node)) {
        setViewingPoolTask(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [viewingPoolTask]);

  if (!isOpen) {
    return null;
  }

  const handleAddPoolTaskSubmit = useCallback(() => {
    if (newPoolTaskName.trim() === "") return;
    onActualAddPoolTask({
      name: newPoolTaskName.trim(),
      duration: newPoolTaskDuration,
      color: newPoolTaskColor,
    });
    setNewPoolTaskName("");
    setNewPoolTaskDuration(1);
    setNewPoolTaskColor('');
    setShowPoolTaskForm(false);
  }, [
    newPoolTaskName, 
    newPoolTaskDuration, 
    newPoolTaskColor, 
    onActualAddPoolTask,
  ]);
  
  // If the parent controls rendering based on activeTab, this check might be redundant
  // if (activeTab !== 'pool') {
  //   return null; 
  // }

  const handleDragStartPoolItem = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData('task', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'copy';
    // Call onAddTaskToTimeline here if drag is directly to timeline from pool
    // This might be complex depending on how drop is handled on the timeline side
    // For now, let's assume a click-to-add or a different drag mechanism for adding to timeline
  };

  return (
    <div className="flex flex-col h-full bg-card text-foreground p-0">
      <div className="relative flex-grow">
        {/* Floating add button */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setShowPoolTaskForm(true)}
          className="absolute top-2 right-2 z-10"
          title="Add task to pool"
        >
          <CopyPlus className="w-4 h-4" />
        </Button>

        <div className="p-2 flex space-x-3 overflow-x-auto overflow-y-hidden flex-grow">
          {poolTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center pt-4 w-full">No unscheduled tasks.</p>
          ) : (
            poolTasks.map(task => (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStartPoolItem(e, task)}
                className={cn(
                  "relative p-3 rounded-lg bg-transparent border border-border/50 hover:shadow-md transition-all duration-150 group flex-shrink-0 w-48 h-24 cursor-grab active:cursor-grabbing"
                )}
              >
                <div className="flex items-start justify-between gap-3 h-full">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Color status dot */}
                    {task.color && <div 
                      className={cn("w-3 h-3 rounded-full flex-shrink-0 mt-1", task.color)}
                    />}
                    
                    <div className="flex-1 min-w-0">
                      {/* Task name */}
                      <p className="font-medium text-sm text-foreground truncate leading-tight mb-2">
                        {task.name || "Untitled Task"}
                      </p>
                      
                      {/* Duration */}
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{formatDuration(task.duration)}</span>
                      </div>
                      
                      {/* Status */}
                      <div className="text-xs">
                        <span className="text-muted-foreground">
                          {task.completed ? 'Completed' : 'Unscheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons - stacked vertically (smaller for 4 buttons) */}
                  <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setViewingPoolTask(task);
                      }}
                      title="View Notes"
                    >
                      <Eye className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(task, { isFromPool: true });
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
                        const poolTask = poolTasks.find(t => t.id === task.id);
                        if (poolTask) {
                          onAddTaskToTimeline(poolTask, topDayOffset); 
                        }
                      }}
                      title="Copy to Schedule"
                    >
                      <CopyPlus className="w-2.5 h-2.5" />
                    </button>
                    {onDeletePoolTask && (
                      <button
                        type="button"
                        className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeletePoolTask(task.id);
                        }}
                        title="Delete Task"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPoolTaskForm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-[1000] p-4">
          <div 
            ref={poolFormMenuRef}
            className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-4 min-w-[300px] max-w-[400px] w-full space-y-3"
          >
            <button 
              type="button"
              onClick={() => setShowPoolTaskForm(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
              aria-label="Close form"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-white pt-1 pr-8">Add Task to Pool</h3>
            
            <div>
              <label htmlFor="new-pool-task-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task Name
              </label>
              <Input
                id="new-pool-task-name"
                type="text"
                value={newPoolTaskName}
                onChange={(e) => setNewPoolTaskName(e.target.value)}
                placeholder="e.g., 'Draft project brief'"
                className="mt-1 w-full"
                autoFocus
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center",
                    !newPoolTaskColor && "border-blue-500 scale-110"
                  )}
                  onClick={() => setNewPoolTaskColor('')}
                  title="No color"
                >
                  <XIcon className="w-4 h-4 text-gray-500" />
                </button>
                {TASK_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all",
                      newPoolTaskColor === color ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.split(' ')[0] }} // Use only bg color for display
                    onClick={() => setNewPoolTaskColor(color)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="new-pool-task-duration" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration
              </label>
              <select
                id="new-pool-task-duration"
                value={newPoolTaskDuration}
                onChange={(e) => setNewPoolTaskDuration(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {APP_DURATION_OPTIONS.map((opt: { value: number; label: string }) => (
                    <option key={`pool-dur-${opt.value}`} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={handleAddPoolTaskSubmit}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold"
                >
                  Add to Pool
                </Button>
            </div>
          </div>
        </div>
      )}

      {viewingPoolTask && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-[1001] p-4">
          <div 
            ref={viewPoolTaskModalRef}
            className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-4 min-w-[300px] max-w-[400px] w-full space-y-3"
            onDoubleClick={() => setViewingPoolTask(null)} // Double click to close
          >
            <button 
              type="button"
              onClick={() => setViewingPoolTask(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
              aria-label="Close notes view"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-800 dark:text-white pt-1 pr-8 line-clamp-2">
              {viewingPoolTask?.name}
            </h3>

            {viewingPoolTask?.notes && viewingPoolTask.notes.trim() !== "" && (
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                {viewingPoolTask.notes}
              </div>
            )}

            <div className="flex justify-end items-center pt-2 border-t border-gray-200 dark:border-gray-700 mt-3">
                <Button 
                  variant="outline"
                  onClick={() => setViewingPoolTask(null)}
                >
                  Close
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 