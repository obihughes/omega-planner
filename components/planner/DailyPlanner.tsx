"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Edit3, Copy, Pin, CopyPlus, Trash2, PinOff } from 'lucide-react'; // Added Lucide icons

import { formatDuration, formatTime } from '@/utils/formatters';
import TaskStorage from '@/utils/storage';
import { Task, PinnedTask } from '../../types/planner'; // Removed StorageData from this import
import { TaskPoolSidebar } from './TaskPoolSidebar'; // IMPORT New Component
import { PinnedTasksSidebar } from './PinnedTasksSidebar'; // IMPORT New Component

// Style constants
let taskIdCounter = 5;
const TASK_BASE_TOP = 2;
const TASK_HEIGHT = 60; // Increased from 48
const TIMELINE_START_HOUR = 4;
const TIMELINE_END_HOUR = 25;
const TIMELINE_SPLIT_HOUR_1 = 11;
const TIMELINE_SPLIT_HOUR_2 = 18;
const MIN_TASK_DURATION = 0.25;
const TIMELINE_HEADER_HEIGHT_PX = 28;
const GRID_LINE_STYLE = "border-l-2 border-gray-400 z-10";

// Available task colors - 24 options arranged in a gradient
const TASK_COLORS = [
  // Row 1: Reds -> Yellows
  "bg-red-300 dark:bg-red-700",
  "bg-red-200 dark:bg-red-600",     // Lighter Red
  "bg-rose-300 dark:bg-rose-700",
  "bg-pink-300 dark:bg-pink-700",
  "bg-orange-300 dark:bg-orange-700",
  "bg-amber-300 dark:bg-amber-700",
  "bg-yellow-300 dark:bg-yellow-700", 
  "bg-yellow-200 dark:bg-yellow-500", // Lighter Yellow
  // Row 2: Greens -> Blues
  "bg-lime-300 dark:bg-lime-700",
  "bg-green-300 dark:bg-green-700",
  "bg-green-200 dark:bg-green-600",   // Lighter Green
  "bg-emerald-300 dark:bg-emerald-700",
  "bg-teal-300 dark:bg-teal-700",
  "bg-cyan-300 dark:bg-cyan-700",
  "bg-sky-300 dark:bg-sky-700",
  "bg-blue-300 dark:bg-blue-700",
  // Row 3: Blues -> Purples -> Greys
  "bg-blue-200 dark:bg-blue-600",    // Lighter Blue
  "bg-indigo-300 dark:bg-indigo-700",
  "bg-violet-300 dark:bg-violet-700",
  "bg-purple-300 dark:bg-purple-700",
  "bg-fuchsia-300 dark:bg-fuchsia-700",
  "bg-gray-300 dark:bg-gray-600",    // Grey 1
  "bg-slate-300 dark:bg-slate-600",   // Grey 2
  "bg-stone-300 dark:bg-stone-600",   // Grey 3 (Brownish)
];

// Adjust the pixels per hour to increase width and prevent cutoff
const PIXELS_PER_HOUR = 140; // Adjusted to 70
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

interface TaskCardProps {
  task: Task;
  height: number;
  onStartEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onCopy: (task: Task) => void;
  onColorChange: (taskId: string, color: string) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  onMoveToPool: (taskId: string) => void;
  onPinTask?: (task: Task) => void; // Optional for now, will be used by timeline tasks
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
  onMoveToPool,
  onPinTask,
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
  const isCompressed = task.duration <= 0.5; // Changed from 0.25 to 0.5

  // Calculate end time for display
  const endTime = task.startHour + Number(task.duration);
  
  // Ensure the task color has dark mode variant with stronger contrast
  const color = task.color?.includes('dark:') 
    ? task.color 
    : `${task.color || 'bg-blue-200'} dark:bg-blue-500`;

  const handleSave = () => {
    if (editingTaskName.trim()) {
      onStartEdit(task);
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
    
    // Calculate menu dimensions
    const menuHeight = 300;
    const menuWidth = 250;
    
    // Get viewport dimensions and scroll position
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    
    // Position the menu at the center of the screen
    const top = scrollY + (viewportHeight / 2) - (menuHeight / 2);
    const left = scrollX + (viewportWidth / 2) - (menuWidth / 2);
    
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
          flex flex-col p-0.5 rounded-sm
          ${color}
          hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-300
          transition-all duration-200
          ${isCompressed ? 'min-h-[24px]' : ''}
          h-full relative
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full min-w-0">
          {/* Task Content Area - MODIFIED for better internal layout */}
          <div className="flex flex-row justify-between items-start min-w-0 draggable-area h-full gap-1">
            {/* Task Name and Time (Left, Growable) */}
            <div className="flex-grow flex flex-col min-w-0">
              <div className={`
                dark:text-white break-words
                ${isCompressed ? 'text-[8px] writing-mode-vertical-lr transform h-full flex items-center justify-center overflow-hidden leading-tight' : 'text-[11px] line-clamp-2'} 
                font-bold
              `}>
                {task.name}
              </div>
              {!isCompressed && (
                <>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 font-medium mt-px">
                    {formatTime(task.startHour)} - {formatTime(endTime)}
                  </div>
                  <div className="text-[8px] text-gray-700 dark:text-gray-200 font-semibold mt-px mb-0.5">
                    {formatDuration(task.duration)}
                  </div>
                </>
              )}
            </div>

            {/* Action buttons (Right, Fixed Size) - only if not compressed */}
            {!isCompressed && (
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0"> {/* Reduced gap, added flex-shrink-0 */}
                {/* Edit button */}
                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={handleEditClick}
                  title="Edit task"
                >
                  <Edit3 className="w-2.5 h-2.5" /> {/* Replaced emoji with Lucide icon */}
                </button>
                
                {/* Copy button */}
                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCopy(task);
                  }}
                  title="Copy task"
                >
                  <Copy className="w-2.5 h-2.5" /> {/* Replaced emoji with Lucide icon */}
                </button>
                {/* Pin button - only show if onPinTask is provided (i.e., for timeline tasks) */}
                {onPinTask && (
                  <button
                    type="button"
                    className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPinTask(task);
                    }}
                    title="Pin task"
                  >
                    <Pin className="w-2.5 h-2.5" /> {/* Replaced emoji with Lucide icon */}
                  </button>
                )}
              </div>
            )}

            {/* Edit button for compressed tasks - still needs to be positioned if layout changes */}
            {isCompressed && (
              <div className="absolute bottom-0.5 right-0.5 flex justify-end" onClick={(e) => e.stopPropagation()}> {/* Kept absolute for now due to vertical text complexity */}
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
          className="fixed z-[1000] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-3 min-w-[250px]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="editTaskNameInput" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Task Name
              </label>
              <Input 
                id="editTaskNameInput"
                type="text" 
                value={editingTaskName}
                onChange={(e) => setEditingTaskName(e.target.value)}
                className="h-7 px-2 text-sm min-w-0 dark:bg-gray-800 dark:text-white"
                autoFocus={true}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <div className="grid grid-cols-8 gap-1.5">
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
                  className="flex-1 h-8 px-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/50 text-sm font-medium transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMoveToPool(task.id);
                    setIsEditing(false);
                    setMenuPosition(null);
                  }}
                >
                  Copy to Pool
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
                  className="flex-1 h-8 px-3 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
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
                      onStartEdit(updatedTask);
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
import { useTheme } from "next-themes";
import { format, addDays } from "date-fns";

// Add these constants at the top with other constants
const STORAGE_KEY = 'daily-planner-tasks';
const STORAGE_VERSION = '1.0';

// Custom hook to skip effect on first render
function useEffectSkipFirstRender(fn: () => (void | (() => void)), deps: React.DependencyList) {
  const isFirstRender = useRef(true); // Renamed for clarity

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // This cleanup runs when the component unmounts OR when StrictMode unmounts this effect instance.
      return () => {
        // If the effect is re-mounted (e.g. by StrictMode, or a real unmount/remount),
        // we want it to be considered a "first render" again for that new instance's perspective.
        isFirstRender.current = true;
      };
    }
    // This part executes for actual dependency changes after the true initial mount sequence (including StrictMode's phases).
    return fn(); // Execute the provided function and return its potential cleanup.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function DailyPlanner() {
  // Add the today constant
  const today = new Date();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState<string>("");
  const [resizingTask, setResizingTask] = useState<{ index: number; direction: 'left' | 'right'; startX: number; initialTask: Task } | null>(null);
  const [draggingTask, setDraggingTask] = useState<{ index: number; startX: number; initialTask: Task } | null>(null);
  
  // State for tracking the current day offsets
  const [topDayOffset, setTopDayOffset] = useState<number>(0);
  const [bottomDayOffset, setBottomDayOffset] = useState<number>(1);

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
  const [newTaskColor, setNewTaskColor] = useState<string>("bg-sky-600 dark:bg-sky-700"); // Changed default task color to blue
  const [newTaskSection, setNewTaskSection] = useState<string>("morning");

  // Task counter for generating unique IDs
  const [taskIdCounter, setTaskIdCounter] = useState<number>(1);

  // First, add a new state for the task pool
  const [poolTasks, setPoolTasks] = useState<Task[]>([]);

  // State for the new pool task form
  // const [showPoolTaskForm, setShowPoolTaskForm] = useState<boolean>(false);
  // const [newPoolTaskName, setNewPoolTaskName] = useState<string>("");
  // const [newPoolTaskDuration, setNewPoolTaskDuration] = useState<number>(1); // Default duration 1h
  // const [newPoolTaskColor, setNewPoolTaskColor] = useState<string>(TASK_COLORS[0]); // Default to first color

  // State for Pinned Tasks
  const [pinnedTasks, setPinnedTasks] = useState<PinnedTask[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSidebarTab, setActiveSidebarTab] = useState<'pool' | 'pinned'>('pinned');

  const initialLoadComplete = useRef(false); // Flag to prevent initial saves

  // Effect to update currentTime every minute for countdowns
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timerId);
  }, []);

  // Then add functions to handle moving tasks to/from the pool
  // Add these with the other task action functions

  // Add task to pool
  const copyTaskToPool = useCallback((taskId: string) => {
    const taskToCopy = tasks.find(t => t.id === taskId);
    if (taskToCopy) {
      // Add to pool with a new ID
      setPoolTasks(prev => [...prev, {...taskToCopy, id: String(taskIdCounter)}]);
      setTaskIdCounter(prev => prev + 1);
      // Don't remove from schedule - just copy
    }
  }, [tasks, taskIdCounter]);

  // Move task from pool to schedule
  const moveTaskFromPool = useCallback((poolTaskId: string, targetDayOffset: number, startHour: number) => {
    const taskToMove = poolTasks.find(t => t.id === poolTaskId);
    if (taskToMove) {
      // Add to schedule with the new day and time
      setTasks(prev => [...prev, {
        ...taskToMove,
        id: String(taskIdCounter),
        dayOffset: targetDayOffset,
        startHour
      }]);
      setTaskIdCounter(prev => prev + 1);
      // Remove from pool
      setPoolTasks(prev => prev.filter(t => t.id !== poolTaskId));
    }
  }, [poolTasks, taskIdCounter]);

  // Remove the old day switching logic and replace with simpler version
  const getDateLabel = (offset: number, withPrefix = false): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return format(date, 'EEEE, MMMM d');
  };

  // --- Day Switching Logic ---
  const getOrderedDayOffsets = (): [number, number] => {
    // Simply return the top and bottom day offsets
    return [topDayOffset, bottomDayOffset];
  };

  // No need for these functions anymore as we're using topDayOffset and bottomDayOffset directly
  // const [topDay, bottomDay] = getOrderedDayOffsets();

  const ensureDifferentDay = (newOffset: number, otherOffset: number): number => {
      // Simple check: if they are the same, subtract 1. Add more complex logic if needed.
      return newOffset === otherOffset ? newOffset - 1 : newOffset;
  }

  // Replace these functions with simpler versions that use topDayOffset and bottomDayOffset
  const setSafeTopDayOffset = (offset: number) => {
      const newTopOffset = ensureDifferentDay(offset, bottomDayOffset);
      setTopDayOffset(newTopOffset);
      // Adjust bottomDayOffset if it becomes the same as the new topDayOffset
      if (newTopOffset === bottomDayOffset) {
          setBottomDayOffset(ensureDifferentDay(bottomDayOffset - 1, newTopOffset));
      }
  };

  const setSafeBottomDayOffset = (offset: number) => {
      const newBottomOffset = ensureDifferentDay(offset, topDayOffset);
      setBottomDayOffset(newBottomOffset);
      // Adjust topDayOffset if it becomes the same as the new bottomDayOffset
      if (newBottomOffset === topDayOffset) {
          setTopDayOffset(ensureDifferentDay(topDayOffset - 1, newBottomOffset));
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
      if (hasConflict("new-task", topDayOffset, startHour, duration)) {
        alert("Time slot from 9:00 AM is already occupied. Please clear it first.");
        return;
      }

      const newTask: Task = { 
        id: taskIdCounter.toString(), 
        name: taskInput, 
        duration, 
        startHour,
        dayOffset: topDayOffset,
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

      // See if this was a pool task and remove it if so
      // FOR "COPY" BEHAVIOR, WE NO LONGER REMOVE IT FROM THE POOL
      /*
      const poolTaskIndex = poolTasks.findIndex(t => 
        t.name === copyingTaskData.name && 
        t.duration === copyingTaskData.duration && 
        t.color === copyingTaskData.color
      );
      if (poolTaskIndex >= 0) {
        setPoolTasks(prev => prev.filter((_, i) => i !== poolTaskIndex));
      }
      */
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
    setNewTaskColor("bg-sky-600 dark:bg-sky-700"); // Changed default task color to blue
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
    const handleStartEdit = (updatedTask: Task) => {
        setTasks(currentTasks => currentTasks.map(task =>
          task.id === updatedTask.id
          ? updatedTask
          : task
        ));
        
        setEditingTaskId(null);
        setEditingTaskName("");
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
        console.log(`🔄 Resizing task ${initialTask.id}: New StartH: ${potentialNewStartHour.toFixed(3)}, New Dur: ${potentialNewDuration.toFixed(3)}`); // ADDED LOG
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
  // REMOVED local formatDuration function, as it's imported from @/utils/formatters
  // const formatDuration = (duration: number): string => {
  //   const totalMinutes = Math.round(duration * 60);
  //   const hrs = Math.floor(totalMinutes / 60);
  //   const mins = totalMinutes % 60;
  //   if (hrs === 0) return `${mins}m`;
  //   if (mins === 0) return `${hrs}h`;
  //   return `${hrs}h${mins}m`;
  // };
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
      <div className="flex h-8 border-b border-neutral-700 dark:border-neutral-800 sticky top-0 bg-neutral-900 dark:bg-neutral-900 z-20"> {/* Changed background and dark border */}
        {timelineHours.map((hour) => (
          <div key={hour} className="flex-none text-xs text-neutral-300 pt-1 pl-0.5 border-l border-neutral-700 dark:border-neutral-700" style={{ width: `${PIXELS_PER_HOUR}px`, boxSizing: 'border-box' }}> {/* Changed text and border color */}
            {formatTime(hour)}
          </div>
        ))}
         {/* Add final hour line */}
         <div className="flex-none border-l-2 border-neutral-700 dark:border-neutral-700" style={{ width: `2px`, boxSizing: 'border-box' }}></div> {/* Changed border color */}
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
      (
        // Task starts in this section
        (t.startHour >= startHour && t.startHour < endHour) || 
        // Task starts before but ends in this section
        (t.startHour < startHour && t.startHour + t.duration > startHour) ||
        // Task starts in this section but ends after
        (t.startHour >= startHour && t.startHour < endHour && t.startHour + t.duration > endHour) ||
        // Task spans across the entire section
        (t.startHour < startHour && t.startHour + t.duration > endHour)
      )
    );
    
    const columnHeight = 100; // Increased from 90
    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;

    // Calculate current time marker position if it's today
    let currentTimeMarker = null;
    if (dayOffset === 0) {
      const now = currentTime; // Use the state variable that updates every minute
      const currentHourFloat = now.getHours() + now.getMinutes() / 60;
      
      // Check if current time is within this column's period
      if (currentHourFloat >= startHour && currentHourFloat < endHour) {
        const markerLeft = (currentHourFloat - startHour) * PIXELS_PER_HOUR;
        currentTimeMarker = (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[120] pointer-events-none" // z-30 should be above grid lines (z-10) but below task cards (z-40+)
            style={{ left: `${markerLeft}px` }}
            title={`Current time: ${formatTime(currentHourFloat)}`}
          />
        );
      }
    }

    return (
      <div className={`w-full transition-colors duration-200 relative ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
        <div 
          className={`relative border border-gray-200 dark:border-neutral-800 rounded-md ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50 dark:bg-blue-900/30' : ''}`}
          style={{ 
            width: `${PIXELS_PER_HOUR * 7 + 6}px`,
            minWidth: `${PIXELS_PER_HOUR * 7 + 6}px`,
            maxWidth: '100%',
            height: `${columnHeight}px`,
            overflow: 'hidden'
          }}
          data-section={period}
          data-day-offset={dayOffset}
          onDoubleClick={handleTimelineClick}
        > 
          {/* This renders the hour labels */}
          {renderTimeline(period)}
          <div
            className={`relative h-full bg-neutral-900 ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/30 cursor-copy' : 'cursor-pointer'}`} /* Changed bg-slate-800 to bg-neutral-900 */
            onDoubleClick={handleTimelineClick}
            data-section={period} // Keep these for event handling
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

            {/* Current Time Marker - Renders if today and within this period */}
            {currentTimeMarker}
            
            {/* Grid lines for each hour - update z-index */}
            {Array.from({ length: endHour - startHour + 1 }, (_, i) => (
              <div 
                key={`grid-${i}-${dayOffset}`} 
                className={`border-l-2 border-neutral-700 dark:border-neutral-700 z-10`}  /* Updated grid line colors */
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

              // Determine if task is in the past for today
              let isPastTask = false;
              if (task.dayOffset === 0) {
                const now = currentTime;
                const currentHourFloat = now.getHours() + now.getMinutes() / 60;
                if ((task.startHour + task.duration) < currentHourFloat) {
                  isPastTask = true;
                }
              }

              // Calculate position (relative to the padded task area)
              // Adjust left position based on the startHour of this half
              const renderLeft = (task.startHour - startHour) * PIXELS_PER_HOUR;
              
              // Handle tasks that start before this section but continue into it
              const adjustedStartHour = Math.max(task.startHour, startHour);
              const adjustedEndHour = Math.min(task.startHour + task.duration, endHour);
              const visibleDuration = adjustedEndHour - adjustedStartHour;
              
              // Calculate the visible width of the task in this section
              const renderWidth = Math.max(PIXELS_PER_MINUTE * 15, visibleDuration * PIXELS_PER_HOUR);
              
              // Adjust the left position for tasks that start before this section
              const adjustedLeft = task.startHour < startHour ? 0 : renderLeft;
              
              const renderTop = TASK_BASE_TOP; // Position from the top of the padded container
              const renderHeight = TASK_HEIGHT;
              const zIndex = isEditing ? 110 : (isBeingDragged || isBeingResized ? 100 : 40);
              
              // Only render tasks that are visible in this time section
              if (renderWidth <= 0 || adjustedLeft < -renderWidth || adjustedLeft > (endHour - startHour) * PIXELS_PER_HOUR) {
                return null;
              }

              const taskCardBaseClassName = `absolute select-none transition-transform duration-100 ease-out hover:shadow-md group ${color} ${isBeingDragged || isBeingResized ? 'opacity-95 shadow-lg scale-[1.01] ring-1 ring-white' : 'shadow-sm'} ${isBeingCopied ? 'ring-2 ring-offset-1 ring-blue-500' : ''} ${isPastTask ? 'filter saturate-50 brightness-75' : ''}`;

              const taskStyleObj: React.CSSProperties = {
                left: `${adjustedLeft}px`,
                width: `${renderWidth}px`,
                top: `${renderTop}px`,
                height: `${renderHeight}px`,
                zIndex: zIndex,
                cursor: isBeingDragged ? 'grabbing' : (isBeingCopied ? 'default' : 'grab'),
              };

              // Check if task continues from previous section or into next section
              if (task.startHour < startHour) { // `startHour` is the start of the current rendering section
                taskStyleObj.borderLeftStyle = 'dashed';
              }
              if ((task.startHour + task.duration) > endHour) { // `endHour` is the end of the current rendering section
                taskStyleObj.borderRightStyle = 'dashed';
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
                  className={taskCardBaseClassName} // Use the preserved base className
                  style={taskStyleObj} // Use the modified style object
                >
                  <CardContent className="p-0.5 px-1.5 text-xs h-full flex flex-col justify-between relative overflow-hidden draggable-area">
                    <TaskCard
                      task={task}
                      height={renderHeight}
                      onStartEdit={handleStartEdit}
                      onDelete={handleDeleteTask}
                      onCopy={handleInitiateCopy}
                      onColorChange={handleColorChange}
                      editingTaskId={editingTaskId}
                      setEditingTaskId={setEditingTaskId}
                      onMoveToPool={copyTaskToPool}
                      onPinTask={handlePinTask} // Pass the pin handler
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
    setNewTaskColor("bg-sky-600 dark:bg-sky-700"); // Changed default task color to blue
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

  // Add useEffect to handle click outside the droppable areas when in copy mode
  useEffect(() => {
    const handleClickOutsideDroppableArea = (event: MouseEvent) => {
      // Only proceed if we're in copy mode
      if (!copyingTaskData) return;
      
      // Check if click was inside a droppable timeline area
      const isInsideTimeline = !!event.target && 
        (document.querySelectorAll('[data-section]').length > 0) &&
        Array.from(document.querySelectorAll('[data-section]')).some(el => 
          el.contains(event.target as Node)
        );
      
      // If the click was outside any timeline section, cancel copy mode
      if (!isInsideTimeline) {
        cancelCopy();
      }
    };
    
    // Add event listener if in copy mode
    if (copyingTaskData) {
      document.addEventListener('click', handleClickOutsideDroppableArea);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleClickOutsideDroppableArea);
    };
  }, [copyingTaskData, cancelCopy]);

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
    console.log('🔄 Loading data from storage...');
    const savedRegularTasksResult = TaskStorage.load();
    const savedPoolTasksResult = TaskStorage.loadPoolTasks();
    const savedPinnedTasksResult = TaskStorage.loadPinnedTasks();

    let currentMaxId = 0;
    const allLoadedTasksForIdCalc: Task[] = [];

    // Populate tasks for ID calculation, ensuring they are not null
    if (savedRegularTasksResult) {
      allLoadedTasksForIdCalc.push(...savedRegularTasksResult);
    }
    if (savedPoolTasksResult) {
      allLoadedTasksForIdCalc.push(...savedPoolTasksResult);
    }
    if (savedPinnedTasksResult) {
        savedPinnedTasksResult.forEach(pt => {
             allLoadedTasksForIdCalc.push(pt as Task);
        });
    }

    allLoadedTasksForIdCalc.forEach(task => {
      if (task && task.id) {
        const numId = parseInt(task.id);
        if (!isNaN(numId) && numId > currentMaxId) {
          currentMaxId = numId;
        }
      }
    });

    // Always load from storage, or use empty arrays if storage is null/empty.
    // Default tasks are no longer loaded.
    console.log('✅ Attempting to load from storage or initializing empty...');
    
    const regularTasksToSet = savedRegularTasksResult || [];
    const poolTasksToSet = savedPoolTasksResult || [];
    const pinnedTasksToSet = savedPinnedTasksResult || [];
    
    setTasks(regularTasksToSet);
    setPoolTasks(poolTasksToSet);
    setPinnedTasks(pinnedTasksToSet);
    
    // Recalculate currentMaxId one last time based on the actual tasks being set
    // This is important if any of the *_savedResults were null and are now empty arrays.
    currentMaxId = 0; 
    const finalTasksForIdCalc: Task[] = [...regularTasksToSet, ...poolTasksToSet];
    pinnedTasksToSet.forEach(pt => finalTasksForIdCalc.push(pt as Task));

    finalTasksForIdCalc.forEach(task => {
      if (task && task.id) {
        const numId = parseInt(task.id);
        if (!isNaN(numId) && numId > currentMaxId) {
          currentMaxId = numId;
        }
      }
    });

    // Initialize taskIdCounter. If no tasks loaded (currentMaxId is 0), start counter at 1.
    setTaskIdCounter(currentMaxId > 0 ? currentMaxId + 1 : 1);
    console.log(`📊 Tasks processed. Initial Task counter to: ${currentMaxId > 0 ? currentMaxId + 1 : 1}`);
    
  }, []);

  // Save tasks whenever they change - using custom hook
  useEffectSkipFirstRender(() => {
    console.log('💾 Saving tasks:', tasks);
    TaskStorage.save(tasks);
  }, [tasks]);

  // Add a new effect for saving pool tasks - using custom hook
  useEffectSkipFirstRender(() => {
    console.log('💾 Saving pool tasks:', poolTasks);
    TaskStorage.savePoolTasks(poolTasks);
  }, [poolTasks]);

  // Save pinned tasks whenever they change - using custom hook
  useEffectSkipFirstRender(() => {
    console.log('💾 Saving pinned tasks:', pinnedTasks);
    TaskStorage.savePinnedTasks(pinnedTasks);
  }, [pinnedTasks]);

  // Add click outside functionality to close the Task Pool dropdown
  const taskPoolRef = useRef<HTMLDivElement>(null);
  // const taskPoolButtonRef = useRef<HTMLButtonElement>(null); // Button ref no longer needed

  // useEffect for hiding task pool on outside click is commented out as it's a permanent panel
  /*
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        taskPoolRef.current && 
        !taskPoolRef.current.contains(event.target as Node) &&
        taskPoolButtonRef.current && // This ref would be null now
        !taskPoolButtonRef.current.contains(event.target as Node)
      ) {
        // Close the task pool dropdown
        document.getElementById('task-pool')?.classList.add('hidden');
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // taskPoolButtonRef removed from dependencies
  */

  // 1. Add a new clone function after the existing task functions (around line 425)
  // Clone bottom day tasks to top day
  const [showCloneConfirmation, setShowCloneConfirmation] = useState<boolean>(false);
  const [cloneConflictStrategy, setCloneConflictStrategy] = useState<'skip' | 'replace' | 'adjust'>('skip');

  // 2. Update the cloneBottomToTop function to handle conflicts based on the selected strategy around line 425
  // Clone bottom day tasks to top day
  const cloneBottomToTop = useCallback(() => {
    const bottomDayTasksToClone = tasks.filter(task => task.dayOffset === bottomDayOffset);
    if (bottomDayTasksToClone.length === 0) {
      alert("No tasks on the selected day to clone.");
      setShowCloneConfirmation(false);
      return;
    }

    let nextId = taskIdCounter;
    const newClonedTasks: Task[] = [];
    const tasksToReplaceDetails: Array<{startHour: number, duration: number}> = [];

    for (const task of bottomDayTasksToClone) {
      let taskMayBeAdded = true;
      let currentStartHour = task.startHour;
      // Store original timing for 'replace' strategy
      tasksToReplaceDetails.push({startHour: task.startHour, duration: task.duration});


      if (hasConflict("clone-check", topDayOffset, task.startHour, task.duration)) {
        if (cloneConflictStrategy === 'skip') {
          taskMayBeAdded = false;
        } else if (cloneConflictStrategy === 'adjust') {
          let adjusted = false;
          let sectionStart, sectionEnd;
          if (task.startHour < TIMELINE_SPLIT_HOUR_1) { sectionStart = TIMELINE_START_HOUR; sectionEnd = TIMELINE_SPLIT_HOUR_1; }
          else if (task.startHour < TIMELINE_SPLIT_HOUR_2) { sectionStart = TIMELINE_SPLIT_HOUR_1; sectionEnd = TIMELINE_SPLIT_HOUR_2; }
          else { sectionStart = TIMELINE_SPLIT_HOUR_2; sectionEnd = TIMELINE_END_HOUR; }

          for (let h = sectionStart; h <= sectionEnd - task.duration; h += 0.25) { // Check in 15min increments
            if (!hasConflict("clone-adjust-check", topDayOffset, h, task.duration)) {
              currentStartHour = h;
              adjusted = true;
              break;
            }
          }
          if (!adjusted) taskMayBeAdded = false; // Could not adjust
        }
        // For 'replace', conflict is handled by filtering tasks state later
      }

      if (taskMayBeAdded) {
        newClonedTasks.push({
          ...task,
          id: String(nextId++),
          dayOffset: topDayOffset,
          startHour: currentStartHour,
        });
      }
    }

    if (newClonedTasks.length > 0) {
      if (cloneConflictStrategy === 'replace') {
        // Remove tasks from topDayOffset that would overlap with ANY of the tasks being cloned (based on their original times)
        const tasksToKeep = tasks.filter(existingTask => {
          if (existingTask.dayOffset !== topDayOffset) return true; // Keep tasks not on the target day

          // Check if this existing task overlaps with any of the tasks intended to be cloned
          const overlaps = bottomDayTasksToClone.some(cloningTask =>
            (cloningTask.startHour < (existingTask.startHour + existingTask.duration)) &&
            ((cloningTask.startHour + cloningTask.duration) > existingTask.startHour)
          );
          return !overlaps; // Keep if no overlap
        });
        setTasks([...tasksToKeep, ...newClonedTasks]);
      } else {
        setTasks(prev => [...prev, ...newClonedTasks]);
      }
      setTaskIdCounter(nextId); // Update global counter
    }
    setShowCloneConfirmation(false);
  }, [tasks, bottomDayOffset, topDayOffset, taskIdCounter, cloneConflictStrategy, hasConflict, TIMELINE_SPLIT_HOUR_1, TIMELINE_SPLIT_HOUR_2, TIMELINE_START_HOUR, TIMELINE_END_HOUR]); // Added relevant constants to dependency array

  // 3. Add a function to open the confirmation dialog
  const openCloneConfirmation = () => {
    // Get all tasks from bottom day
    const bottomDayTasks = tasks.filter(task => task.dayOffset === bottomDayOffset);
    
    if (bottomDayTasks.length === 0) {
      // No tasks to clone, show alert
      alert("No tasks to clone from this day.");
      return;
    }
    
    setShowCloneConfirmation(true);
  };

  // 4. Update the Clone button to open the confirmation dialog instead of directly cloning around line 1390
  {/* Add Clone Button */}
  <button
    type="button"
    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
    onClick={openCloneConfirmation}
    title="Clone tasks from tomorrow to today"
  >
    <span>↑</span>
    <span>Clone to Today</span>
  </button>

  // 5. Add the confirmation dialog to the JSX, near the other modals around line 1600
  {/* Clone Confirmation Modal */}
  {showCloneConfirmation && (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-2 dark:text-white">Clone Tasks</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This will copy all tasks from {getDateLabel(bottomDayOffset)} to {getDateLabel(topDayOffset)}.
        </p>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How should we handle time conflicts?
          </h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="conflictStrategy"
                value="skip"
                checked={cloneConflictStrategy === 'skip'}
                onChange={() => setCloneConflictStrategy('skip')}
                className="mr-2"
              />
              <div>
                <div className="text-gray-800 dark:text-white font-medium">Skip conflicting tasks</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Only clone tasks that don't overlap with existing ones</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="conflictStrategy"
                value="replace"
                checked={cloneConflictStrategy === 'replace'}
                onChange={() => setCloneConflictStrategy('replace')}
                className="mr-2"
              />
              <div>
                <div className="text-gray-800 dark:text-white font-medium">Replace existing tasks</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Remove any existing tasks that conflict with new ones</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="conflictStrategy"
                value="adjust"
                checked={cloneConflictStrategy === 'adjust'}
                onChange={() => setCloneConflictStrategy('adjust')}
                className="mr-2"
              />
              <div>
                <div className="text-gray-800 dark:text-white font-medium">Adjust timing</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Try to find alternate times for conflicting tasks</div>
              </div>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setShowCloneConfirmation(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            onClick={cloneBottomToTop}
          >
            Clone Tasks
          </button>
        </div>
      </div>
    </div>
  )}

  // MODIFIED function to handle adding tasks directly to the pool
  // This will be called by TaskPoolSidebar
  const handleActualAddPoolTask = useCallback((taskData: { name: string; duration: number; color: string }) => {
    const newTask: Task = {
      id: String(taskIdCounter),
      name: taskData.name,
      duration: taskData.duration,
      color: taskData.color,
      startHour: 0, // Placeholder for pool tasks
      dayOffset: 0, // Placeholder for pool tasks
    };
    setPoolTasks(prevTasks => [...prevTasks, newTask]);
    setTaskIdCounter(prev => prev + 1);
  }, [taskIdCounter]);

  // Function to handle pinning a task
  const handlePinTask = useCallback((taskToPin: Task) => {
    setPinnedTasks(prevPinnedTasks => {
      // Check if this specific task instance (by original ID) is already pinned
      if (prevPinnedTasks.some(pt => pt.originalId === taskToPin.id)) {
        // Optional: Unpin if already pinned, or just do nothing
        // For now, let's unpin if clicked again
        return prevPinnedTasks.filter(pt => pt.originalId !== taskToPin.id);
      }

      const today = new Date();
      const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Start with today at 00:00:00
      targetDate.setDate(targetDate.getDate() + taskToPin.dayOffset);
      
      const dueHour = taskToPin.startHour + taskToPin.duration;
      targetDate.setHours(Math.floor(dueHour), (dueHour % 1) * 60, 0, 0);

      const newPinnedTask: PinnedTask = {
        ...taskToPin,
        dueDate: targetDate,
        originalId: taskToPin.id,
        pinnedId: `pinned-${String(taskIdCounter)}`, // Create a new unique ID for the pinned entry
      };
      setTaskIdCounter(prev => prev + 1); // Increment counter for the new pinnedId
      return [...prevPinnedTasks, newPinnedTask];
    });
  }, [taskIdCounter]);

  // Function to handle unpinning a task
  const handleUnpinTask = useCallback((pinnedIdToUnpin: string) => {
    setPinnedTasks(prevPinnedTasks => prevPinnedTasks.filter(pt => pt.pinnedId !== pinnedIdToUnpin));
  }, []);

  // Function to format time remaining for pinned tasks
  const formatTimeRemaining = (dueDate: Date): string => {
    const now = new Date();
    let diffMs = dueDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Due!";

    // Round to nearest 15 minutes (900,000 ms)
    const fifteenMinMs = 15 * 60 * 1000;
    diffMs = Math.round(diffMs / fifteenMinMs) * fifteenMinMs;

    if (diffMs === 0) return "Due in <15m"; // If rounded to 0, but was positive

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    diffMs -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    diffMs -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diffMs / (1000 * 60));

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.length > 0 ? `Due in: ${parts.join(' ')}` : "Due in <15m";
  };

  // Update the return statement to remove ThemeProvider
  return (
    <div className="min-h-screen p-4 bg-transparent text-white transition-colors"> {/* Changed bg-neutral-900 to bg-transparent */}
      <div className="max-w-7xl mx-auto">
        

        {/* Main layout: Task Pool | Timeline Container | Pinned Tasks */}
        <div className="flex gap-4">
          {/* Combined Sidebar: Task Pool & Pinned Tasks - MOVED TO THE RIGHT */}
          <div 
            className="w-52 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col sticky top-4 h-[calc(100vh-3rem-env(safe-area-inset-bottom))] overflow-hidden"
          >
            {/* Tab Switcher */}
            <div className="flex border-b border-neutral-700">
              <button
                type="button"
                className={`flex-1 p-2 text-sm font-medium text-center transition-colors focus:outline-none ${
                  activeSidebarTab === 'pool' 
                    ? 'bg-neutral-700 text-white' 
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                }`}
                onClick={() => setActiveSidebarTab('pool')}
              >
                Task Pool
              </button>
              <button
                type="button"
                className={`flex-1 p-2 text-sm font-medium text-center transition-colors focus:outline-none ${
                  activeSidebarTab === 'pinned' 
                    ? 'bg-neutral-700 text-white' 
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                }`}
                onClick={() => setActiveSidebarTab('pinned')}
              >
                Pinned Tasks
              </button>
            </div>

            {/* Conditional Content Area */}
            {activeSidebarTab === 'pool' && (
              <TaskPoolSidebar
                poolTasks={poolTasks}
                TASK_COLORS={TASK_COLORS}
                activeTab={activeSidebarTab} // Or simply rely on parent's conditional rendering
                topDayOffset={topDayOffset}
                setPoolTasks={setPoolTasks}
                setCopyingTaskData={setCopyingTaskData}
                setTargetCopyDayOffset={setTargetCopyDayOffset}
                onActualAddPoolTask={handleActualAddPoolTask}
                formatDuration={formatDuration} // Ensure formatDuration is available in this scope (it is, via import)
              />
            )}

            {activeSidebarTab === 'pinned' && (
              <PinnedTasksSidebar
                pinnedTasks={pinnedTasks}
                onUnpinTask={handleUnpinTask}
                formatTimeRemaining={formatTimeRemaining}
              />
            )}
          </div>

          {/* Right Column: Timeline Container - MOVED TO THE LEFT */}
          <div className="flex-1 space-y-4 min-w-0"> 
            {/* Today's Schedule - top navigation will be moved inside here */}
            <div className="bg-neutral-900 p-3 rounded-lg shadow-sm border border-neutral-800 overflow-auto"> {/* Changed overflow-hidden to overflow-auto */}
              {/* MOVED Top Navigation Controls HERE */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    onClick={() => setSafeTopDayOffset(topDayOffset - 1)}
                    title="Previous day"
                  >
                    ◀
                  </button>
                  <span className="text-white font-medium w-[250px] text-center">
                    {getDateLabel(topDayOffset)}
                  </span>
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    onClick={() => setSafeTopDayOffset(topDayOffset + 1)}
                    title="Next day"
                  >
                    ▶
                  </button>
                </div>
                
                <div className="flex items-center justify-end space-x-4">
                  <button
                    type="button"
                    className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors" // This is the Add New Task button, should be solid neutral
                    onClick={() => setShowTaskForm(true)}
                  >
                    <span>+</span>
                    <span>Add New Task</span>
                  </button>
                </div>
              </div>

              {/* Original content of Today's Schedule panel starts here */}
              <div className="flex flex-col gap-px"> {/* MODIFIED gap-1 to gap-px */}
                <div
                  className={`bg-neutral-800/70 rounded-lg p-1 relative transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`}  // Changed background, hover
                  data-section="morning"
                  data-day-offset={topDayOffset}
                  onDoubleClick={handleTimelineClick}
                  title="Double-click to add task"
                >
                  <div className="text-xs text-neutral-200 font-medium mb-1">Morning</div> {/* Changed text color */}
                  {renderColumn(topDayOffset, 'morning')}
                </div>
                <div
                  className={`bg-neutral-800/70 rounded-lg p-1 relative transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`}  // Changed background, hover
                  data-section="afternoon"
                  data-day-offset={topDayOffset}
                  onDoubleClick={handleTimelineClick}
                  title="Double-click to add task"
                >
                  <div className="text-xs text-neutral-200 font-medium mb-1">Afternoon</div> {/* Changed text color */}
                  {renderColumn(topDayOffset, 'afternoon')}
                </div>
                <div
                  className={`bg-neutral-800/70 rounded-lg p-1 relative transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`}  // Changed background, hover
                  data-section="evening"
                  data-day-offset={topDayOffset}
                  onDoubleClick={handleTimelineClick}
                  title="Double-click to add task"
                >
                  <div className="text-xs text-neutral-200 font-medium mb-1">Evening</div> {/* Changed text color */}
                  {renderColumn(topDayOffset, 'evening')}
                </div>
              </div>
            </div>

            {/* Tomorrow's Schedule */}
            <div className="bg-neutral-900 p-3 rounded-lg shadow-sm border border-neutral-800 overflow-auto"> {/* Changed overflow-hidden to overflow-auto */}
              <div className="flex items-center justify-between mb-4"> {/* This is the main flex container for the header line */}
                {/* Date Navigation controls on the left */}
                <div className="flex items-center space-x-2"> {/* Group for Prev Week, Prev Day, Date, Next Day, Next Week */}
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    onClick={() => setSafeBottomDayOffset(bottomDayOffset - 7)}
                    title="Previous week"
                  >
                    ◀◀
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    onClick={() => setSafeBottomDayOffset(bottomDayOffset - 1)}
                    title="Previous day"
                  >
                    ◀
                  </button>
                  {/* Date display - styled like the top one */}
                  <span className="text-white font-medium w-[250px] text-center"> {/* Changed from px-3 */}
                    {getDateLabel(bottomDayOffset)}
                  </span>
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    onClick={() => setSafeBottomDayOffset(bottomDayOffset + 1)}
                    title="Next day"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
                    onClick={() => setSafeBottomDayOffset(bottomDayOffset + 7)}
                    title="Next week"
                  >
                    ▶▶
                  </button>
                </div>

                {/* Clone Button on the right */}
                <button
                  type="button"
                  className="border border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200" // THIS is the Clone to Today button, outline style
                  onClick={openCloneConfirmation}
                  title="Clone tasks from tomorrow to today"
                >
                  <span>↑</span>
                  <span>Clone to Today</span>
                </button>
              </div>
              
              <div className="flex flex-col gap-px"> {/* MODIFIED gap-1 to gap-px */}
                <div
                  className={`bg-neutral-800/70 rounded-lg p-1 relative transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} // Changed background, hover
                  data-section="bottom_morning"
                  data-day-offset={bottomDayOffset}
                  onDoubleClick={handleTimelineClick}
                  title="Double-click to add task"
                >
                  <div className="text-xs text-neutral-200 font-medium mb-1">Morning</div> {/* Changed text color */}
                  {renderColumn(bottomDayOffset, 'morning')}
                </div>
                <div
                  className={`bg-neutral-800/70 rounded-lg p-1 relative transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} // Changed background, hover
                  data-section="bottom_afternoon"
                  data-day-offset={bottomDayOffset}
                  onDoubleClick={handleTimelineClick}
                  title="Double-click to add task"
                >
                  <div className="text-xs text-neutral-200 font-medium mb-1">Afternoon</div> {/* Changed text color */}
                  {renderColumn(bottomDayOffset, 'afternoon')}
                </div>
                <div
                  className={`bg-neutral-800/70 rounded-lg p-1 relative transition-colors duration-200 ${copyingTaskData ? 'ring-2 ring-blue-400 dark:ring-blue-500 cursor-copy' : 'cursor-pointer'}`} // Changed background, hover
                  data-section="bottom_evening"
                  data-day-offset={bottomDayOffset}
                  onDoubleClick={handleTimelineClick}
                  title="Double-click to add task"
                >
                  <div className="text-xs text-neutral-200 font-medium mb-1">Evening</div> {/* Changed text color */}
                  {renderColumn(bottomDayOffset, 'evening')}
                </div>
              </div>
            </div>

            {/* Task Form Modal */}
            {showTaskForm && (
              <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Create New Task</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newTaskNameInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name</label>
                      <input
                        id="newTaskNameInput"
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter task name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newTaskSectionSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Period</label>
                      <select
                        id="newTaskSectionSelect"
                        value={newTaskSection}
                        onChange={(e) => setNewTaskSection(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                        <label htmlFor="newTaskHourSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Hour</label>
                        <select
                          id="newTaskHourSelect"
                          value={newTaskHour}
                          onChange={(e) => setNewTaskHour(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i}:00</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="newTaskDurationSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                        <select
                          id="newTaskDurationSelect"
                          value={newTaskDuration}
                          onChange={(e) => setNewTaskDuration(parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
                      <div className="grid grid-cols-8 gap-1.5">
                        {TASK_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-6 h-6 rounded-full ${color} ${newTaskColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                            onClick={() => setNewTaskColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6 gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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

            {/* Clone Confirmation Modal */}
            {showCloneConfirmation && (
              <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-md w-full">
                  <h3 className="text-xl font-bold mb-2 dark:text-white">Clone Tasks</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    This will copy all tasks from {getDateLabel(bottomDayOffset)} to {getDateLabel(topDayOffset)}.
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      How should we handle time conflicts?
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="conflictStrategy"
                          value="skip"
                          checked={cloneConflictStrategy === 'skip'}
                          onChange={() => setCloneConflictStrategy('skip')}
                          className="mr-2"
                        />
                        <div>
                          <div className="text-gray-800 dark:text-white font-medium">Skip conflicting tasks</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Only clone tasks that don't overlap with existing ones</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="conflictStrategy"
                          value="replace"
                          checked={cloneConflictStrategy === 'replace'}
                          onChange={() => setCloneConflictStrategy('replace')}
                          className="mr-2"
                        />
                        <div>
                          <div className="text-gray-800 dark:text-white font-medium">Replace existing tasks</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Remove any existing tasks that conflict with new ones</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="conflictStrategy"
                          value="adjust"
                          checked={cloneConflictStrategy === 'adjust'}
                          onChange={() => setCloneConflictStrategy('adjust')}
                          className="mr-2"
                        />
                        <div>
                          <div className="text-gray-800 dark:text-white font-medium">Adjust timing</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Try to find alternate times for conflicting tasks</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setShowCloneConfirmation(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                      onClick={cloneBottomToTop}
                    >
                      Clone Tasks
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* New Pool Task Form Modal - REMOVED, now inside TaskPoolSidebar */}

          </div>

          {/* Far Right Column: Pinned Tasks Section - THIS ENTIRE DIV BLOCK IS REMOVED */}
          {/* <div className="w-52 bg-neutral-900 rounded-lg shadow-sm border border-neutral-800 flex flex-col sticky top-4 h-[calc(100vh-3rem-env(safe-area-inset-bottom))] overflow-hidden"> ... </div> */}

        </div>
      </div>
    </div>
  );
}