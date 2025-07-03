import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Task } from '../../types/planner';
import { Input, Button } from "@/components/ui";
import { CopyPlus, Trash2, Edit3, Pin, PinOff, GripVertical, X as XIcon, ChevronDownIcon, Eye } from 'lucide-react';
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
  openEditModal: (task: Task, isFromPool?: boolean) => void;
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
  const [newPoolTaskColor, setNewPoolTaskColor] = useState<string>(APP_TASK_COLORS[0]);
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
    setNewPoolTaskColor(APP_TASK_COLORS[0]);
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

        <div className="flex space-x-2 p-2 pr-14 overflow-x-auto">
          {poolTasks.length === 0 ? (
            <div className="text-muted-foreground text-sm p-2 text-center w-full">
              No unscheduled tasks.
            </div>
          ) : (
            poolTasks.map(task => (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStartPoolItem(e, task)}
                className={cn(
                  "p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing group transition-all duration-150",
                  "flex flex-col justify-between text-left flex-shrink-0 w-60 h-20",
                  "border border-border/50 bg-card hover:shadow-md hover:border-border",
                  "dark:border-border dark:bg-card dark:hover:border-border/80"
                )}
                style={{ 
                  backgroundColor: task.color + '15', 
                  borderLeftColor: task.color,
                  borderLeftWidth: '3px'
                }}
                onClick={() => openEditModal(task, true)}
              >
                <div className="flex-grow">
                  <p className="font-medium text-sm leading-tight break-words text-foreground truncate">
                    {task.name || "Untitled Task"}
                  </p>
                </div>
                <div className="mt-1.5 flex items-center text-muted-foreground">
                  <span className="text-xs"> 
                    {formatDuration(task.duration)}
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      className={cn(
                        "h-5 w-5 rounded flex items-center justify-center transition-colors",
                        "bg-background/80 hover:bg-background text-foreground hover:text-primary",
                        "border border-border/50 hover:border-border"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        const poolTask = poolTasks.find(t => t.id === task.id);
                        if (poolTask) {
                          // Call onAddTaskToTimeline to copy to schedule
                          onAddTaskToTimeline(poolTask, topDayOffset); 
                        }
                      }}
                      title="Copy to Schedule"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "h-5 w-5 rounded flex items-center justify-center transition-colors",
                        "bg-background/80 hover:bg-background text-foreground hover:text-primary",
                        "border border-border/50 hover:border-border"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setViewingPoolTask(task);
                      }}
                      title="View Notes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "h-5 w-5 rounded flex items-center justify-center transition-colors",
                        "bg-background/80 hover:bg-background text-foreground hover:text-primary",
                        "border border-border/50 hover:border-border"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        openEditModal(task, true);
                      }}
                      title="Edit Pool Task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
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
              <label htmlFor="newPoolTaskNameInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name</label>
              <Input
                id="newPoolTaskNameInput"
                type="text"
                value={newPoolTaskName}
                onChange={(e) => setNewPoolTaskName(e.target.value)}
                className="w-full text-sm"
                placeholder="Enter task name"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newPoolTaskDurationSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                  <select
                    id="newPoolTaskDurationSelect"
                    value={newPoolTaskDuration}
                    onChange={(e) => setNewPoolTaskDuration(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    {APP_DURATION_OPTIONS.map((opt: { value: number; label: string }) => (
                        <option key={`pool-dur-${opt.value}`} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                 {/* Placeholder for potential second item in grid if needed */}
                <div></div>
            </div>

            <div>
              <div className="grid grid-cols-8 gap-1">
                {APP_TASK_COLORS.map((color) => (
                  <button
                    key={`pool-color-${color}`}
                    type="button"
                    className={`w-8 h-8 rounded-md ${color} hover:ring-2 ring-gray-400 transition-all ${newPoolTaskColor === color ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setNewPoolTaskColor(color)}
                    title={color.split(' ')[0].replace('bg-', '').replace('-200', '').replace('-300', '')}
                  />
                ))}
              </div>
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
              {viewingPoolTask.name}
            </h3>

            {viewingPoolTask.notes && viewingPoolTask.notes.trim() !== "" && (
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