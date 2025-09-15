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

export interface TaskInboxSidebarProps {
  inboxTasks: Task[];
  TASK_COLORS: string[]; // For the add form color picker
  activeTab: 'inbox' | 'pinned'; // To control rendering, though parent will likely do this
  topDayOffset: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Function to handle the actual adding of task to parent's state
  // Parent will assign ID and use its taskIdCounter
  onActualAddInboxTask: (taskData: { name: string; duration: number; color: string }) => void;
  
  // Utility functions
  onDeleteInboxTask?: (taskId: string) => void;
  onClearInbox?: () => void;
  openEditModal: (task: Task, options?: { isNew?: boolean, isFromInbox?: boolean, isPinned?: boolean }) => void;
  onAddTaskToTimeline: (task: Task, dayOffset: number) => void;
}

export const TaskInboxSidebar: React.FC<TaskInboxSidebarProps> = ({
  inboxTasks,
  TASK_COLORS,
  activeTab, // This component might not need to know the activeTab if parent only renders it when it's the inbox tab
  topDayOffset,
  isOpen,
  setIsOpen,
  onActualAddInboxTask,
  onDeleteInboxTask,
  onClearInbox,
  openEditModal,
  onAddTaskToTimeline,
}) => {
  const [showInboxTaskForm, setShowInboxTaskForm] = useState<boolean>(false);
  const [newInboxTaskName, setNewInboxTaskName] = useState<string>("");
  const [newInboxTaskDuration, setNewInboxTaskDuration] = useState<number>(1); // Default duration 1h
  const [newInboxTaskColor, setNewInboxTaskColor] = useState<string>('');
  const [viewingInboxTask, setViewingInboxTask] = useState<Task | null>(null);

  const inboxFormMenuRef = useRef<HTMLDivElement>(null);
  const viewInboxTaskModalRef = useRef<HTMLDivElement>(null); // Ref for the view modal

  // Handle clicks outside the add inbox task form to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showInboxTaskForm && inboxFormMenuRef.current && !inboxFormMenuRef.current.contains(event.target as Node)) {
        setShowInboxTaskForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInboxTaskForm]);

  // Handle clicks outside the view inbox task modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewingInboxTask && viewInboxTaskModalRef.current && !viewInboxTaskModalRef.current.contains(event.target as Node)) {
        setViewingInboxTask(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [viewingInboxTask]);

  if (!isOpen) {
    return null;
  }

  const handleAddInboxTaskSubmit = useCallback(() => {
    if (newInboxTaskName.trim() === "") return;
    onActualAddInboxTask({
      name: newInboxTaskName.trim(),
      duration: newInboxTaskDuration,
      color: newInboxTaskColor,
    });
    setNewInboxTaskName("");
    setNewInboxTaskDuration(1);
    setNewInboxTaskColor('');
    setShowInboxTaskForm(false);
  }, [
    newInboxTaskName, 
    newInboxTaskDuration, 
    newInboxTaskColor, 
    onActualAddInboxTask,
  ]);
  
  // If the parent controls rendering based on activeTab, this check might be redundant
  // if (activeTab !== 'inbox') {
  //   return null; 
  // }

  const handleDragStartInboxItem = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData('task', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'copy';
    // Call onAddTaskToTimeline here if drag is directly to timeline from inbox
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
          onClick={() => setShowInboxTaskForm(true)}
          className="absolute top-2 right-2 z-10"
          title="Add task to inbox"
        >
          <CopyPlus className="w-4 h-4" />
        </Button>

        <div className="p-2 flex space-x-3 overflow-x-auto overflow-y-hidden flex-grow">
          {inboxTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center pt-4 w-full">No tasks in inbox.</p>
          ) : (
            inboxTasks.map(task => (
              <div 
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStartInboxItem(e, task)}
                className={cn(
                  "relative p-3 bg-transparent border border-border/50 hover:shadow-md transition-all duration-150 group flex-shrink-0 w-48 h-24 cursor-grab active:cursor-grabbing"
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
                          {task.completed ? 'Completed' : 'In Inbox'}
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
                        setViewingInboxTask(task);
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
                        openEditModal(task, { isFromInbox: true });
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
                        const inboxTask = inboxTasks.find(t => t.id === task.id);
                        if (inboxTask && onAddTaskToTimeline) {
                          onAddTaskToTimeline(inboxTask, topDayOffset);
                        }
                      }}
                      title="Add to Timeline"
                    >
                      <CopyPlus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      className="h-5 w-5 rounded bg-accent/50 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onDeleteInboxTask) {
                          onDeleteInboxTask(task.id);
                        }
                      }}
                      title="Delete Task"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Task Form */}
      {showInboxTaskForm && (
        <div ref={inboxFormMenuRef} className="absolute inset-x-2 top-2 bg-card border border-border rounded-lg shadow-lg p-4 z-20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Add Task to Inbox</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowInboxTaskForm(false)}
              className="h-6 w-6"
            >
              <XIcon className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Task name"
              value={newInboxTaskName}
              onChange={(e) => setNewInboxTaskName(e.target.value)}
              className="text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddInboxTaskSubmit();
                if (e.key === 'Escape') setShowInboxTaskForm(false);
              }}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Duration</label>
                <select
                  value={newInboxTaskDuration}
                  onChange={(e) => setNewInboxTaskDuration(parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-input text-foreground"
                >
                  {APP_DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Color</label>
                <div className="grid grid-cols-4 gap-1">
                  {TASK_COLORS.slice(0, 8).map(colorClass => (
                    <button
                      key={colorClass}
                      type="button"
                      className={`w-6 h-6 rounded ${colorClass} hover:ring-1 ring-border transition-all ${newInboxTaskColor === colorClass ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setNewInboxTaskColor(colorClass)}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddInboxTaskSubmit}
                className="flex-1"
                disabled={!newInboxTaskName.trim()}
              >
                Add Task
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInboxTaskForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {viewingInboxTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingInboxTask(null)}>
          <div ref={viewInboxTaskModalRef} className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">{viewingInboxTask.name}</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setViewingInboxTask(null)}
                className="h-6 w-6"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(viewingInboxTask.duration)}</span>
              </div>
              
              {viewingInboxTask.color && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className={cn("w-4 h-4 rounded", viewingInboxTask.color)} />
                  <span>Colored task</span>
                </div>
              )}
              
              {viewingInboxTask.notes && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingInboxTask.notes}</p>
                </div>
              )}
              
              {!viewingInboxTask.notes && (
                <p className="text-sm text-muted-foreground italic">No notes for this task.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 