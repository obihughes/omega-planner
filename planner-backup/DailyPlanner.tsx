"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";
// Assuming lucide-react is installed or using text/emoji
// import { Trash2, Pencil, Check, X } from 'lucide-react'; 

import { formatDuration, formatTime } from '@/utils/formatters';
import TaskStorage from '@/utils/storage';

// Define Task interface
interface Task {
  id: string;
  name: string;
  startHour: number;
  duration: number;
  dayOffset: number;
  color?: string;
}

// Style constants
let taskIdCounter = 5;
const TASK_BASE_TOP = 2;
const TASK_HEIGHT = 56;
const TIMELINE_START_HOUR = 4;
const TIMELINE_END_HOUR = 25;
const TIMELINE_SPLIT_HOUR_1 = 11;
const TIMELINE_SPLIT_HOUR_2 = 18;
const MIN_TASK_DURATION = 0.25;
const TIMELINE_HEADER_HEIGHT_PX = 28;
const GRID_LINE_STYLE = "border-l-2 border-gray-400 z-10";

// Available task colors - Update for dark mode support with higher contrast
const TASK_COLORS = [
  "bg-rose-200 dark:bg-rose-500",
  "bg-amber-200 dark:bg-amber-500",
  "bg-lime-200 dark:bg-lime-500",
  "bg-emerald-200 dark:bg-emerald-500", 
  "bg-cyan-200 dark:bg-cyan-500",
  "bg-violet-200 dark:bg-violet-500",
  "bg-fuchsia-200 dark:bg-fuchsia-500",
  "bg-slate-200 dark:bg-slate-500"
];

// Adjust the pixels per hour to increase width and prevent cutoff
const PIXELS_PER_HOUR = 142; // Making this divisible by 7 for even display
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

interface TaskCardProps {
  task: Task;
  height: number;
  onStartEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onCopy: (task: Task) => void;
  onColorChange: (taskId: string, color: string) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  height,
  onStartEdit,
  onDelete,
  onCopy,
  onColorChange,
  editingTaskId,
  setEditingTaskId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskName, setEditingTaskName] = useState(task.name);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Add effect to handle clicking outside the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setMenuPosition(null);
        setEditingTaskId(null);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, setEditingTaskId]);

  // Determine if this is a compressed task (15 mins or less)
  const isCompressed = task.duration <= 0.25;

  // Calculate end time for display
  const endTime = task.startHour + Number(task.duration);
  
  // Format duration for display
  const formatTaskDuration = (duration: number): string => {
    const totalMinutes = Math.round(duration * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h${mins}m`;
  };
  
  // Ensure the task color has dark mode variant with stronger contrast
  const color = task.color?.includes('dark:') 
    ? task.color 
    : `${task.color || 'bg-blue-200'} dark:bg-blue-500`;

  const handleSave = () => {
    if (editingTaskName.trim()) {
      onStartEdit(task.id);
      setIsEditing(false);
      setMenuPosition(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingTaskName(task.name);
    setMenuPosition(null);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close any other open edit menus
    setEditingTaskId(task.id);
    
    // Get the button's position
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    // Calculate menu dimensions
    const menuHeight = 300; // Approximate height of the menu
    const menuWidth = 250; // Width of the menu
    
    // Calculate available space below and above the button
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Position the menu
    let top: number;
    if (spaceBelow >= menuHeight) {
      // If there's enough space below, show below
      top = rect.bottom + window.scrollY + 4;
    } else if (spaceAbove >= menuHeight) {
      // If there's enough space above, show above
      top = rect.top + window.scrollY - menuHeight - 4;
    } else {
      // If there's not enough space either way, show below but adjust to fit
      top = window.innerHeight - menuHeight - 10;
    }
    
    // Calculate left position
    let left = rect.left + window.scrollX - menuWidth + rect.width;
    // Ensure menu doesn't go off the right edge
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }
    // Ensure menu doesn't go off the left edge
    if (left < 0) {
      left = 10;
    }
    
    setMenuPosition({ top, left });
    setIsEditing(true);
  };

  // Add effect to close menu when another task is being edited
  useEffect(() => {
    if (editingTaskId !== task.id) {
      setIsEditing(false);
      setMenuPosition(null);
    }
  }, [editingTaskId, task.id]);

  return (
    <>
      <div 
        className={`
          flex flex-col p-1 rounded-sm
          ${color}
          hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-300
          transition-all duration-200
          ${isCompressed ? 'min-h-[24px]' : ''}
          h-full relative
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full min-w-0">
          {/* Task Content Area */}
          <div className="flex flex-col justify-between min-w-0 draggable-area h-full">
            {/* Task Name and Time */}
            <div className="min-w-0 flex-grow">
              <div className={`
                dark:text-white break-words
                ${isCompressed ? 'text-[8px] writing-mode-vertical-lr transform h-full flex items-center justify-center' : 'text-xs line-clamp-2'}
                font-bold
              `}>
                {task.name}
              </div>
              {!isCompressed && (
                <>
                  <div className="text-[10px] text-gray-700 dark:text-gray-200 font-medium mt-0.5">
                    {formatTime(task.startHour)} - {formatTime(endTime)}
                  </div>
                  <div className="text-[9px] text-gray-700 dark:text-gray-200 font-semibold mt-0.5">
                    {formatTaskDuration(task.duration)}
                  </div>
                </>
              )}
            </div>

            {/* Action buttons - show for all tasks except compressed ones */}
            {!isCompressed && (
              <div className="absolute top-1 right-1 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                {/* Copy button */}
                <button
                  type="button"
                  className="h-4 w-4 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCopy(task);
                  }}
                  title="Copy task"
                >
                  <span className="text-[9px]">📋</span>
                </button>
                
                {/* Edit button */}
                <button
                  type="button"
                  className="h-4 w-4 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={handleEditClick}
                  title="Edit task"
                >
                  <span className="text-[9px]">✎</span>
                </button>
              </div>
            )}

            {/* Edit button for compressed tasks - at the bottom */}
            {isCompressed && (
              <div className="flex justify-end mt-auto" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="h-3 w-3 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={handleEditClick}
                  title="Edit task"
                >
                  <span className="text-[7px]">✎</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Edit Menu */}
      {isEditing && menuPosition && (
        <div 
          ref={menuRef}
          className="fixed z-[200] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[250px]"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Task Name
              </label>
              <Input 
                type="text" 
                value={editingTaskName}
                onChange={(e) => setEditingTaskName(e.target.value)}
                className="h-7 px-2 text-sm min-w-0 dark:bg-gray-700 dark:text-white"
                autoFocus={true}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TASK_COLORS.map(colorClass => (
                  <button
                    key={colorClass}
                    type="button"
                    className={`w-6 h-6 rounded-full ${colorClass} hover:ring-2 ring-gray-400 transition-all ${task.color === colorClass ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onColorChange(task.id, colorClass);
                    }}
                    title={colorClass.split(' ')[0].replace('bg-', '').replace('-200', '')}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 h-8 px-3 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 text-sm font-medium transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCopy(task);
                    setIsEditing(false);
                    setMenuPosition(null);
                  }}
                >
                  Copy Task
                </button>
                <button
                  type="button"
                  className="flex-1 h-8 px-3 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-sm font-medium transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  Delete
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 h-8 px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 h-8 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm font-medium transition-colors"
                  onClick={() => {
                    if (editingTaskName.trim()) {
                      const updatedTask = { ...task, name: editingTaskName.trim() };
                      onStartEdit(updatedTask.id);
                      setIsEditing(false);
                      setMenuPosition(null);
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Add dark mode context and hooks at the top of the file
import { ThemeProvider, useTheme } from "next-themes";
import { format, addDays } from "date-fns";

// Add these constants at the top with other constants
const STORAGE_KEY = 'daily-planner-tasks';
const STORAGE_VERSION = '1.0';

// Add a type for the storage data
interface StorageData {
  version: string;
  tasks: Task[];
}

export default function DailyPlanner() {
  // Add the today constant
  const today = new Date();
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", name: "Review notes", duration: 1, startHour: 9, dayOffset: -1, color: "bg-blue-200 dark:bg-blue-600" },
    { id: "2", name: "Team sync", duration: 2, startHour: 10, dayOffset: -1, color: "bg-green-200 dark:bg-green-600" },
    { id: "3", name: "Plan goals", duration: 1, startHour: 13, dayOffset: -1, color: "bg-yellow-200 dark:bg-yellow-600" },
  ]);
  const [taskInput, setTaskInput] = useState<string>("");
  const [resizingTask, setResizingTask] = useState<{ index: number; direction: 'left' | 'right'; startX: number; initialTask: Task } | null>(null);
  const [draggingTask, setDraggingTask] = useState<{ index: number; startX: number; initialTask: Task } | null>(null);
  const [currentDayOffset, setCurrentDayOffset] = useState<number>(0);
  const [leftDayOffset, setLeftDayOffset] = useState<number>(-1);

  // State for copy mode
  const [copyingTaskData, setCopyingTaskData] = useState<Task | null>(null);
  const [targetCopyDayOffset, setTargetCopyDayOffset] = useState<number | null>(null);

  // State for inline editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<string>("");
  
  // State for color selection
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // State for task form
  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);
  const [newTaskName, setNewTaskName] = useState<string>("");
  const [newTaskHour, setNewTaskHour] = useState<number>(9);
  const [newTaskDuration, setNewTaskDuration] = useState<number>(1);
  const [newTaskColor, setNewTaskColor] = useState<string>("bg-blue-200 dark:bg-blue-600");
  const [newTaskSection, setNewTaskSection] = useState<string>("morning");

  // Task counter for generating unique IDs
  const [taskIdCounter, setTaskIdCounter] = useState(4);

  // Update the state management for independent navigation
  const [topDayOffset, setTopDayOffset] = useState<number>(0);
  const [bottomDayOffset, setBottomDayOffset] = useState<number>(1);

  // Remove the old day switching logic and replace with simpler version
  const getDateLabel = (offset: number, withPrefix = false): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return format(date, 'EEEE, MMMM d');
  };

  // --- Day Switching Logic ---
  const getOrderedDayOffsets = (): [number, number] => {
    const today = 0;
    const tomorrow = 1;
    if ([today, tomorrow].includes(currentDayOffset)) {
      return [currentDayOffset, leftDayOffset];
    } else if ([today, tomorrow].includes(leftDayOffset)) {
      return [leftDayOffset, currentDayOffset];
    }
    return [currentDayOffset, leftDayOffset];
  };

  const [topDay, bottomDay] = getOrderedDayOffsets();

  const ensureDifferentDay = (newOffset: number, otherOffset: number): number => {
      // Simple check: if they are the same, subtract 1. Add more complex logic if needed.
      return newOffset === otherOffset ? newOffset - 1 : newOffset;
  }

  const setSafeLeftDayOffset = (offset: number) => {
      const newLeftOffset = ensureDifferentDay(offset, currentDayOffset);
      setLeftDayOffset(newLeftOffset);
  };

  const setSafeCurrentDayOffset = (offset: number) => {
      const newCurrentOffset = ensureDifferentDay(offset, leftDayOffset);
      setCurrentDayOffset(newCurrentOffset);
      // Adjust leftDayOffset if it becomes the same as the new currentDayOffset
      if (newCurrentOffset === leftDayOffset) {
          setLeftDayOffset(ensureDifferentDay(leftDayOffset - 1, newCurrentOffset));
      }
  };
  // --- End Day Switching ---

  // --- Conflict Detection ---
  const hasConflict = (
      taskIdToIgnore: string,
      dayOffset: number,
      checkStartHour: number,
      checkDuration: number
  ): boolean => {
      const checkEndHour = checkStartHour + checkDuration;
      // Use a small epsilon to prevent floating point issues at the boundary
      const epsilon = 0.001;
      return tasks.some(task =>
          task.id !== taskIdToIgnore &&
          task.dayOffset === dayOffset &&
          (checkStartHour + epsilon) < (task.startHour + task.duration) && 
          (checkEndHour - epsilon) > task.startHour
      );
  };
  // --- End Conflict Detection ---

  // --- Task Actions (DEFINED INSIDE COMPONENT) ---
  const handleAddTask = () => {
    if (taskInput.trim()) {
      const duration = 1; // Default duration
      const startHour = 9; // Default start time
      const colorIndex = Math.floor(Math.random() * TASK_COLORS.length);
      const color = TASK_COLORS[colorIndex];
      
      // Use "new-task" instead of "1" for conflict check
      if (hasConflict("new-task", topDay, startHour, duration)) {
        alert("Time slot from 9:00 AM is already occupied. Please clear it first.");
        return;
      }

      const newTask: Task = { 
        id: taskIdCounter.toString(), 
        name: taskInput, 
        duration, 
        startHour,
        dayOffset: topDay,
        color
      };
      
      setTasks(currentTasks => [...currentTasks, newTask]);
      setTaskInput("");
      setTaskIdCounter(prev => prev + 1);
    }
  };

  // --- Copy Functions ---
  const handleInitiateCopy = useCallback((taskToCopy: Task) => {
    // Create a proper deep copy
    setCopyingTaskData({...taskToCopy});
    // Default to the same day as the task being copied
    setTargetCopyDayOffset(taskToCopy.dayOffset);
  }, []);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle double clicks for task creation
    if (e.detail !== 2) return;
    
    // Don't create task if target is not the timeline
    if (e.target !== e.currentTarget) return;
    
    const section = e.currentTarget.getAttribute('data-section');
    const dayOffsetAttr = e.currentTarget.getAttribute('data-day-offset');
    const dayOffset = dayOffsetAttr ? parseInt(dayOffsetAttr) : null;
    
    if (!section || dayOffset === null) return;

    // If in copy mode, handle the copy operation
    if (copyingTaskData) {
      // Get rect of current timeline section
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      
      // Calculate position based on click
      const relativePosition = clickX / width;
      
      // Set start hour based on section and click position
      let baseHour: number;
      const actualSection = section.replace('bottom_', '');
      if (actualSection === 'morning') baseHour = 4;
      else if (actualSection === 'afternoon') baseHour = 11;
      else baseHour = 18;
      
      const hoursInView = 7; // 7 hours in each section
      const clickedHourOffset = Math.floor(relativePosition * hoursInView);
      const newHour = baseHour + clickedHourOffset;
      
      // Create the copied task with a new ID and the target day offset
      const newTask: Task = {
        ...copyingTaskData,
        id: String(taskIdCounter),
        startHour: newHour,
        dayOffset: dayOffset
      };
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      setTaskIdCounter(prev => prev + 1);
      setCopyingTaskData(null);
      setTargetCopyDayOffset(null);
      return;
    }
    
    // Otherwise, handle creating a new task
    setNewTaskSection(section);
    
    // Set start hour based on section and click position
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    // Calculate position based on click
    const relativePosition = clickX / width;
    
    // Set start hour based on section and click position
    let baseHour: number;
    const actualSection = section.replace('bottom_', '');
    if (actualSection === 'morning') baseHour = 4;
    else if (actualSection === 'afternoon') baseHour = 11;
    else baseHour = 18;
    
    const hoursInView = 7; // 7 hours in each section
    const clickedHourOffset = Math.floor(relativePosition * hoursInView);
    const newHour = baseHour + clickedHourOffset;
    
    setNewTaskHour(newHour);
    setNewTaskName("New Task");
    setNewTaskDuration(1);
    setShowTaskForm(true);
  }, [copyingTaskData, taskIdCounter, tasks]);

  const cancelCopy = () => {
      setCopyingTaskData(null);
      setTargetCopyDayOffset(null);
  };
  // --- End Copy Functions ---

  // --- Color Selection Functions ---
  // Handle color change
  const handleColorChange = (taskId: string, newColor: string) => {
    setTasks(currentTasks => currentTasks.map(task => 
      task.id === taskId ? { ...task, color: newColor } : task
    ));
    setShowColorPicker(null); // Close color picker after selection
  };

  // Toggle color picker
  const toggleColorPicker = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowColorPicker(current => current === taskId ? null : taskId);
  };
  // --- End Color Selection Functions ---

  // --- Edit/Delete Functions ---
    // Delete Task
    const handleDeleteTask = (taskIdToDelete: string) => {
      console.log("Delete task called with ID:", taskIdToDelete);
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskIdToDelete));
    };

    // Edit Task Name (Inline)
    const handleStartEdit = (taskId: string) => {
        const taskToEdit = tasks.find(t => t.id === taskId);
        if (!taskToEdit) return;
        
        setTasks(currentTasks => currentTasks.map(task =>
          task.id === taskId
          ? { ...task, name: editingTaskName.trim() || task.name }
          : task
        ));
        
        setEditingTaskId(null);
        setEditingTaskName("");
        setCopyingTaskData(null);
        setDraggingTask(null);
        setResizingTask(null);
    };

    const handleCancelEdit = () => {
        console.log("Cancel edit called");
        setEditingTaskId(null);
        setEditingTaskName("");
    };

    const handleSaveEdit = () => {
        console.log("Save edit called for task ID:", editingTaskId);
        if (!editingTaskId) return;
        setTasks(currentTasks => currentTasks.map(task =>
            task.id === editingTaskId
            ? { ...task, name: editingTaskName.trim() || "Untitled Task" } // Ensure name isn't empty
            : task
        ));
        handleCancelEdit(); // Exit edit mode
    };

    // Handle Enter/Escape key in edit input
    const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSaveEdit();
        } else if (event.key === 'Escape') {
            handleCancelEdit();
        }
    };
  // --- End Edit/Delete Functions ---

  // --- Resize Functions ---
  const handleResizeStart = (taskIndex: number, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    cancelCopy();
    setDraggingTask(null);
    const task = tasks[taskIndex];
    if (task) {
        // Store initial task state when resize starts
        setResizingTask({ index: taskIndex, direction, startX: e.clientX, initialTask: { ...task } });
    }
  };

  const handleMouseMoveResize = (e: MouseEvent) => {
    if (!resizingTask) return;
    // Use initialTask from the state captured on resize start
    const { index, direction, startX, initialTask } = resizingTask;

    const deltaX = e.clientX - startX;
    const deltaMinutes = Math.round(deltaX / PIXELS_PER_MINUTE / 15) * 15;
    const deltaHours = deltaMinutes / 60;

    let potentialNewStartHour = initialTask.startHour;
    let potentialNewDuration = initialTask.duration;
    
    // Determine which section the task belongs to (first or second half of day)
    const isInSecondHalf = initialTask.startHour >= TIMELINE_SPLIT_HOUR_2;
    const sectionStartHour = isInSecondHalf ? TIMELINE_SPLIT_HOUR_2 : TIMELINE_START_HOUR;
    const sectionEndHour = isInSecondHalf ? TIMELINE_END_HOUR : TIMELINE_SPLIT_HOUR_2;

    if (direction === 'right') {
        potentialNewDuration = Math.max(0.25, Math.min(sectionEndHour - initialTask.startHour, initialTask.duration + deltaHours));
    } else { // left
        const tryStart = initialTask.startHour + deltaHours;
        const tryDuration = initialTask.duration - deltaHours;
        if (tryStart >= sectionStartHour && tryDuration >= 0.25) {
             potentialNewStartHour = tryStart;
             potentialNewDuration = tryDuration;
        } else if (tryStart < sectionStartHour) { // Hit start boundary
             potentialNewDuration = initialTask.duration + (initialTask.startHour - sectionStartHour);
             potentialNewStartHour = sectionStartHour;
        } else { // Duration hit minimum boundary
             potentialNewStartHour = initialTask.startHour + (initialTask.duration - 0.25);
             potentialNewDuration = 0.25;
        }
    }

    // Check for conflict *before* updating state using the actual task ID
    if (!hasConflict(initialTask.id, initialTask.dayOffset, potentialNewStartHour, potentialNewDuration)) {
        // Update state only if no conflict
        setTasks(currentTasks => currentTasks.map((task, i) =>
            i === index
            ? { ...task, startHour: parseFloat(potentialNewStartHour.toFixed(3)), duration: parseFloat(potentialNewDuration.toFixed(3)) }
            : task
        ));
    } else {
        console.log("Resize conflict detected");
    }
    // No startX update needed here, delta is always from initial startX
  };
  // --- End Resize Functions ---

  // --- Drag Functions ---
  const handleDragStart = (taskIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any active interactions
    cancelCopy();
    setResizingTask(null);
    setEditingTaskId(null);
    
    const task = tasks[taskIndex];
    if (task) {
      // Store initial task state and cursor position when drag starts
      setDraggingTask({ 
        index: taskIndex, 
        startX: e.clientX, 
        initialTask: { ...task } 
      });
      
      // Change cursor during drag
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseMoveDrag = useCallback((e: MouseEvent) => {
    if (!draggingTask) return;
    
    e.preventDefault();
    
    // Use initialTask from state captured on drag start
    const { index, startX, initialTask } = draggingTask;

    const deltaX = e.clientX - startX;
    const deltaMinutes = Math.round(deltaX / PIXELS_PER_MINUTE / 15) * 15;
    const deltaHours = deltaMinutes / 60;

    // Calculate new start hour with the delta
    const tryStartHour = initialTask.startHour + deltaHours;
    
    // Determine which section this task belongs to
    let sectionStartHour, sectionEndHour;
    if (tryStartHour < TIMELINE_SPLIT_HOUR_1) {
      sectionStartHour = TIMELINE_START_HOUR;
      sectionEndHour = TIMELINE_SPLIT_HOUR_1;
    } else if (tryStartHour < TIMELINE_SPLIT_HOUR_2) {
      sectionStartHour = TIMELINE_SPLIT_HOUR_1;
      sectionEndHour = TIMELINE_SPLIT_HOUR_2;
    } else {
      sectionStartHour = TIMELINE_SPLIT_HOUR_2;
      sectionEndHour = TIMELINE_END_HOUR;
    }
    
    // Clamp to ensure task stays within timeline boundaries
    const potentialNewStartHour = Math.max(
      sectionStartHour, 
      Math.min(sectionEndHour - initialTask.duration, tryStartHour)
    );

    // Check for conflicts before updating
    if (!hasConflict(initialTask.id, initialTask.dayOffset, potentialNewStartHour, initialTask.duration)) {
      setTasks(currentTasks => currentTasks.map((task, i) =>
        i === index
        ? { ...task, startHour: parseFloat(potentialNewStartHour.toFixed(3)) }
        : task
      ));
    }
  }, [draggingTask, hasConflict]);

  const handleMouseUp = useCallback(() => {
    if (draggingTask || resizingTask) {
      document.body.style.cursor = '';
      setDraggingTask(null);
      setResizingTask(null);
    }
  }, [draggingTask, resizingTask]);
  // --- End Drag Functions ---

  // --- Formatting & Labels ---
  const formatDuration = (duration: number): string => {
    const totalMinutes = Math.round(duration * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h${mins}m`;
  };
  // --- End Formatting ---

  // --- Rendering Logic ---
  const renderTimeline = (period: 'morning' | 'afternoon' | 'evening') => {
    let startHour, endHour;
    switch (period) {
      case 'morning':
        startHour = TIMELINE_START_HOUR;
        endHour = TIMELINE_SPLIT_HOUR_1;
        break;
      case 'afternoon':
        startHour = TIMELINE_SPLIT_HOUR_1;
        endHour = TIMELINE_SPLIT_HOUR_2;
        break;
      case 'evening':
        startHour = TIMELINE_SPLIT_HOUR_2;
        endHour = TIMELINE_END_HOUR;
        break;
    }
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    
    return (
      <div className="flex h-8 border-b border-gray-300 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-20">
        {timelineHours.map((hour) => (
          <div key={hour} className="flex-none text-xs text-gray-500 dark:text-gray-400 pt-1 pl-1 border-l border-gray-200 dark:border-gray-700" style={{ width: `${PIXELS_PER_HOUR}px` }}>
            {formatTime(hour)}
          </div>
        ))}
         {/* Add final hour line */}
         <div className="flex-none border-l border-gray-200 dark:border-gray-700" style={{ width: `0px` }}></div>
      </div>
    );
  };

  // Update colors array with dark variants
  const colors = [
    "bg-blue-100/90 dark:bg-blue-800/90", 
    "bg-green-100/90 dark:bg-green-800/90", 
    "bg-yellow-100/90 dark:bg-yellow-800/90", 
    "bg-red-100/90 dark:bg-red-800/90",
    "bg-purple-100/90 dark:bg-purple-800/90", 
    "bg-pink-100/90 dark:bg-pink-800/90", 
    "bg-indigo-100/90 dark:bg-indigo-800/90"
  ];

  const renderColumn = (dayOffset: number, period: 'morning' | 'afternoon' | 'evening') => {
    // Determine the time range for this column
    let startHour, endHour;
    switch (period) {
      case 'morning':
        startHour = TIMELINE_START_HOUR;
        endHour = TIMELINE_SPLIT_HOUR_1;
        break;
      case 'afternoon':
        startHour = TIMELINE_SPLIT_HOUR_1;
        endHour = TIMELINE_SPLIT_HOUR_2;
        break;
      case 'evening':
        startHour = TIMELINE_SPLIT_HOUR_2;
        endHour = TIMELINE_END_HOUR;
        break;
    }
    
    // Filter tasks for this time period
    const tasksToRender = tasks.filter(t => 
      t.dayOffset === dayOffset && 
      ((t.startHour >= startHour && t.startHour < endHour) || 
       (t.startHour < startHour && t.startHour + t.duration > startHour))
    );
    
    const columnHeight = 90;
    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;

    return (
      <div className={`w-full transition-colors duration-200 relative ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
        <div 
          className={`relative border border-gray-200 dark:border-gray-700 rounded-md ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50 dark:bg-blue-900/30' : ''}`}
          style={{ 
            width: `${PIXELS_PER_HOUR * 7 + 5}px`, // Fix exactly 7 hours width plus padding
            maxWidth: '100%',
            height: `${columnHeight}px`,
            overflow: 'hidden'
          }}
          data-section={period}
          data-day-offset={dayOffset}
          onDoubleClick={handleTimelineClick}
        > 
          {renderTimeline(period)}
          <div
            className={`relative h-full ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/30 cursor-copy' : 'cursor-pointer'}`}
            onDoubleClick={handleTimelineClick}
            data-section={period}
            data-day-offset={dayOffset}
            data-testid="timeline"
          >
            {/* Add a visual indicator for copy target */}
            {isTargetCopyDay && (
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 bg-blue-100/30 dark:bg-blue-800/30 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-300 font-bold text-lg">
                  Double-click to paste task
                </div>
              </div>
            )}

            {/* Grid lines for each hour - update z-index */}
            {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
              <div 
                key={`grid-${i}-${dayOffset}`} 
                className={`border-l-2 border-gray-400 dark:border-gray-700 z-10`} 
                style={{ 
                  left: `${i * PIXELS_PER_HOUR}px`, 
                  height: '100%',
                  top: 0,
                  borderLeftStyle: 'dashed',
                  position: 'absolute'
                }} 
              />
            ))}
            
            {/* Tasks - update z-index to be higher than grid lines */}
            {tasksToRender.map((task) => {
              const originalIndex = tasks.findIndex((t) => t.id === task.id);
              if (originalIndex === -1) return null;

              // Get a numeric index for the task based on its position in the array
              const taskColorIndex = parseInt(task.id) || originalIndex;
              const color = task.color || colors[taskColorIndex % colors.length];
              
              const isBeingDragged = draggingTask?.index === originalIndex;
              const isBeingResized = resizingTask?.index === originalIndex;
              const isBeingCopied = copyingTaskData?.id === task.id;
              const isEditing = editingTaskId === task.id;

              // Calculate position (relative to the padded task area)
              // Adjust left position based on the startHour of this half
              const renderLeft = (task.startHour - startHour) * PIXELS_PER_HOUR;
              
              // Handle tasks that start before this section but continue into it
              const adjustedStartHour = Math.max(task.startHour, startHour);
              const adjustedEndHour = Math.min(task.startHour + task.duration, endHour);
              const visibleDuration = adjustedEndHour - adjustedStartHour;
              
              const renderWidth = Math.max(PIXELS_PER_MINUTE * 15, visibleDuration * PIXELS_PER_HOUR);
              const renderTop = TASK_BASE_TOP; // Position from the top of the padded container
              const renderHeight = TASK_HEIGHT;
              const zIndex = isEditing ? 110 : (isBeingDragged || isBeingResized ? 100 : 40);
              
              // Only render tasks that are visible in this time section
              if (renderWidth <= 0 || renderLeft < -renderWidth || renderLeft > (endHour - startHour) * PIXELS_PER_HOUR) {
                return null;
              }

              return (
                <Card
                  key={task.id}
                  onMouseDown={(e) => {
                    // Only start drag if click is on the draggable area
                    const target = e.target as HTMLElement;
                    const isButton = target.tagName === 'BUTTON' || 
                                   target.closest('button') ||
                                   target.tagName === 'INPUT' ||
                                   target.closest('.resize-handle');
                    const isDraggableArea = target.classList.contains('draggable-area') ||
                                           target.closest('.draggable-area');
                    
                    // Prevent starting drag/resize when editing, copying, or clicking buttons
                    if (!isEditing && !isBeingCopied && !isButton && isDraggableArea) {
                      handleDragStart(originalIndex, e);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute select-none transition-transform duration-100 ease-out hover:shadow-md group ${
                    color
                  } ${
                    isBeingDragged || isBeingResized ? 'opacity-95 shadow-lg scale-[1.01] ring-1 ring-white' : 'shadow-sm'
                  } ${ isBeingCopied ? 'ring-2 ring-offset-1 ring-blue-500' : '' }`}
                  style={{
                    left: `${renderLeft}px`,
                    width: `${renderWidth}px`,
                    top: `${renderTop}px`,
                    height: `${renderHeight}px`,
                    zIndex: isEditing ? 110 : (isBeingDragged || isBeingResized ? 100 : 40),
                    cursor: isBeingDragged ? 'grabbing' : (isBeingCopied ? 'default' : 'grab')
                  }}
                >
                  <CardContent className="p-1 px-2 text-xs h-full flex flex-col justify-between relative overflow-hidden draggable-area">
                    <TaskCard
                      task={task}
                      height={renderHeight}
                      onStartEdit={handleStartEdit}
                      onDelete={handleDeleteTask}
                      onCopy={handleInitiateCopy}
                      onColorChange={handleColorChange}
                      editingTaskId={editingTaskId}
                      setEditingTaskId={setEditingTaskId}
                    />

                    {/* Resizing Handles - Only show borders on hover/drag */}
                    {!isEditing && (
                      <>
                        <div
                          className="resize-handle absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-200/50 active:bg-blue-300/50 z-30"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(originalIndex, 'left', e);
                          }}
                        >
                          <div className={`absolute inset-y-0 right-0 w-0.5 ${isBeingDragged || isBeingResized ? 'bg-white' : 'bg-transparent group-hover:bg-gray-300/50'}`}></div>
                        </div>
                        <div
                          className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-200/50 active:bg-blue-300/50 z-30"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleResizeStart(originalIndex, 'right', e);
                          }}
                        >
                          <div className={`absolute inset-y-0 left-0 w-0.5 ${isBeingDragged || isBeingResized ? 'bg-white' : 'bg-transparent group-hover:bg-gray-300/50'}`}></div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Task creation
  const addTask = useCallback(() => {
    if (newTaskName.trim() === "") return;
    
    // Determine which day offset to use based on the section
    const dayOffset = newTaskSection.includes('bottom_') 
      ? bottomDayOffset 
      : topDayOffset;
    
    // Remove the 'bottom_' prefix if it exists
    const section = newTaskSection.replace('bottom_', '');
    
    // Set the start hour based on the section
    let startHour = newTaskHour;
    if (section === 'morning') startHour = Math.max(4, Math.min(startHour, 10));
    else if (section === 'afternoon') startHour = Math.max(11, Math.min(startHour, 17));
    else startHour = Math.max(18, Math.min(startHour, 24));
    
    const newTask: Task = {
      id: String(taskIdCounter),
      name: newTaskName,
      startHour,
      duration: newTaskDuration,
      color: newTaskColor,
      dayOffset,
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    setTaskIdCounter(prev => prev + 1);
    
    // Reset form
    setNewTaskName("");
    setNewTaskHour(9);
    setNewTaskDuration(1);
    setNewTaskColor("bg-blue-200 dark:bg-blue-600");
    setShowTaskForm(false);
  }, [taskIdCounter, newTaskName, newTaskHour, newTaskDuration, newTaskColor, topDayOffset, bottomDayOffset, newTaskSection]);

  // Fix the task resize handle
  // Add useEffect to ensure all cursor and state resets happen properly
  useEffect(() => {
    // Reset cursor when not dragging or resizing
    if (!draggingTask && !resizingTask) {
      document.body.style.cursor = '';
    }
    
    // When a task is being resized, change the cursor
    if (resizingTask) {
      document.body.style.cursor = 'ew-resize';
    }
    
    // When a task is being dragged, change the cursor
    if (draggingTask) {
      document.body.style.cursor = 'grabbing';
    }
  }, [draggingTask, resizingTask]);

  // Add event listeners useEffect after all function definitions
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (resizingTask) handleMouseMoveResize(e);
      if (draggingTask) handleMouseMoveDrag(e);
    };
    
    const handleWindowMouseUp = () => {
      handleMouseUp();
    };
    
    const handleEsc = (event: KeyboardEvent) => { 
      if (event.key === 'Escape') {
        cancelCopy();
        setEditingTaskId(null);
        setDraggingTask(null);
        setResizingTask(null);
      }
    };

    // Add all event listeners
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener('keydown', handleEsc);
    
    // Clean up all event listeners on unmount
    return () => { 
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [draggingTask, resizingTask, handleMouseMoveDrag, handleMouseMoveResize, handleMouseUp, cancelCopy]);

  // Load tasks when component mounts
  useEffect(() => {
    const savedTasks = TaskStorage.load();
    if (savedTasks.length > 0) {
      setTasks(savedTasks);
      // Update task ID counter based on loaded tasks
      const maxId = Math.max(...savedTasks.map(t => parseInt(t.id) || 0));
      setTaskIdCounter(maxId + 1);
    }
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    TaskStorage.save(tasks);
  }, [tasks]);

  // Update the return statement to remove ThemeProvider
  return (
    <div className="min-h-screen p-4 bg-gray-900 transition-colors">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Top Day Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              onClick={() => setTopDayOffset(prev => prev - 1)}
              title="Previous day"
            >
              ◀
            </button>
            <span className="text-white font-medium px-3">
              {getDateLabel(topDayOffset)}
            </span>
            <button
              type="button"
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              onClick={() => setTopDayOffset(prev => prev + 1)}
              title="Next day"
            >
              ▶
            </button>
          </div>
          
          <div className="flex items-center justify-end space-x-4">
            <DarkModeToggle />
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => setShowTaskForm(true)}
            >
              <span>+</span>
              <span>Add New Task</span>
            </button>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">
              {getDateLabel(topDayOffset)}
            </h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <div 
              className={`bg-blue-950/30 rounded-lg p-2 relative hover:bg-blue-900/40 transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} 
              data-section="morning" 
              data-day-offset={topDayOffset}
              onDoubleClick={handleTimelineClick}
              title="Double-click to add task"
            >
              <div className="text-xs text-blue-200 font-medium mb-1">Morning</div>
              {renderColumn(topDayOffset, 'morning')}
            </div>
            <div 
              className={`bg-indigo-950/30 rounded-lg p-2 relative hover:bg-indigo-900/40 transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} 
              data-section="afternoon" 
              data-day-offset={topDayOffset}
              onDoubleClick={handleTimelineClick}
              title="Double-click to add task"
            >
              <div className="text-xs text-indigo-200 font-medium mb-1">Afternoon</div>
              {renderColumn(topDayOffset, 'afternoon')}
            </div>
            <div 
              className={`bg-purple-950/30 rounded-lg p-2 relative hover:bg-purple-900/40 transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} 
              data-section="evening" 
              data-day-offset={topDayOffset}
              onDoubleClick={handleTimelineClick}
              title="Double-click to add task"
            >
              <div className="text-xs text-purple-200 font-medium mb-1">Evening</div>
              {renderColumn(topDayOffset, 'evening')}
            </div>
          </div>
        </div>

        {/* Bottom Navigation Controls - Extended version */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                onClick={() => setBottomDayOffset(prev => prev - 7)}
                title="Previous week"
              >
                ◀◀
              </button>
              <button
                type="button"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                onClick={() => setBottomDayOffset(prev => prev - 1)}
                title="Previous day"
              >
                ◀
              </button>
            </div>
            <span className="text-white font-medium">
              {getDateLabel(bottomDayOffset)}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                onClick={() => setBottomDayOffset(prev => prev + 1)}
                title="Next day"
              >
                ▶
              </button>
              <button
                type="button"
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                onClick={() => setBottomDayOffset(prev => prev + 7)}
                title="Next week"
              >
                ▶▶
              </button>
            </div>
          </div>
        </div>

        {/* Tomorrow's Schedule */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">
              {getDateLabel(bottomDayOffset)}
            </h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <div 
              className={`bg-blue-950/30 rounded-lg p-2 relative hover:bg-blue-900/40 transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} 
              data-section="bottom_morning" 
              data-day-offset={bottomDayOffset}
              onDoubleClick={handleTimelineClick}
              title="Double-click to add task"
            >
              <div className="text-xs text-blue-200 font-medium mb-1">Morning</div>
              {renderColumn(bottomDayOffset, 'morning')}
            </div>
            <div 
              className={`bg-indigo-950/30 rounded-lg p-2 relative hover:bg-indigo-900/40 transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} 
              data-section="bottom_afternoon" 
              data-day-offset={bottomDayOffset}
              onDoubleClick={handleTimelineClick}
              title="Double-click to add task"
            >
              <div className="text-xs text-indigo-200 font-medium mb-1">Afternoon</div>
              {renderColumn(bottomDayOffset, 'afternoon')}
            </div>
            <div 
              className={`bg-purple-950/30 rounded-lg p-2 relative hover:bg-purple-900/40 transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} 
              data-section="bottom_evening" 
              data-day-offset={bottomDayOffset}
              onDoubleClick={handleTimelineClick}
              title="Double-click to add task"
            >
              <div className="text-xs text-purple-200 font-medium mb-1">Evening</div>
              {renderColumn(bottomDayOffset, 'evening')}
            </div>
          </div>
        </div>

        {/* Task Form Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Create New Task</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name</label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter task name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Period</label>
                  <select
                    value={newTaskSection}
                    onChange={(e) => setNewTaskSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="morning">Today - Morning</option>
                    <option value="afternoon">Today - Afternoon</option>
                    <option value="evening">Today - Evening</option>
                    <option value="bottom_morning">Tomorrow - Morning</option>
                    <option value="bottom_afternoon">Tomorrow - Afternoon</option>
                    <option value="bottom_evening">Tomorrow - Evening</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Hour</label>
                    <select
                      value={newTaskHour}
                      onChange={(e) => setNewTaskHour(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i}:00</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                    <select
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="0.25">15m</option>
                      <option value="0.5">30m</option>
                      <option value="0.75">45m</option>
                      <option value="1">1h</option>
                      <option value="1.5">1h30m</option>
                      <option value="2">2h</option>
                      <option value="3">3h</option>
                      <option value="4">4h</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "bg-blue-200 dark:bg-blue-600", 
                      "bg-green-200 dark:bg-green-600", 
                      "bg-yellow-200 dark:bg-yellow-600", 
                      "bg-red-200 dark:bg-red-600",
                      "bg-pink-200 dark:bg-pink-600", 
                      "bg-purple-200 dark:bg-purple-600", 
                      "bg-indigo-200 dark:bg-indigo-600",
                      "bg-gray-200 dark:bg-gray-600"
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full ${color} ${newTaskColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                        onClick={() => setNewTaskColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setShowTaskForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  onClick={addTask}
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Update DarkModeToggle component to prevent hydration errors
const DarkModeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // When component mounts, set mounted to true
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = theme === 'dark';
  
  const toggleTheme = () => {
    // Force a proper theme change
    setTheme(isDark ? 'light' : 'dark');
    
    // Apply class directly to html element for immediate feedback
    if (isDark) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };
  
  // Only render the icon after client-side hydration is complete
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        <span className="text-lg opacity-0">•</span>
      </button>
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <span className="text-yellow-300 text-lg">☀️</span>
      ) : (
        <span className="text-blue-700 text-lg">🌙</span>
      )}
    </button>
  );
}; 