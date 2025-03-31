"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
// Assuming lucide-react is installed or using text/emoji
// import { Trash2, Pencil, Check, X } from 'lucide-react'; 

// Define Task interface
interface Task {
  id: number;
  name: string;
  duration: number;
  startHour: number;
  dayOffset: number;
  color: string; // Add color property
}

let taskIdCounter = 5; // Start after initial tasks
const TASK_BASE_TOP = 2; // Base vertical position for tasks
const TASK_HEIGHT = 70; // Increased from 50 to accommodate larger buttons
const TIMELINE_START_HOUR = 5; // Start at 5 AM instead of 8 AM
const TIMELINE_END_HOUR = 29; // End at 5 AM next day (24 + 5)
const TIMELINE_SPLIT_HOUR = 17; // Split at 5 PM instead of 2 PM
const MIN_TASK_DURATION = 0.25;
const TIMELINE_HEADER_HEIGHT_PX = 32; // Corresponds to h-8

// Available task colors
const TASK_COLORS = [
  "bg-blue-100", "bg-green-100", "bg-yellow-100", "bg-red-100", 
  "bg-purple-100", "bg-pink-100", "bg-indigo-100", "bg-orange-100"
];

// Adjust the pixels per hour to increase width
const PIXELS_PER_HOUR = 150; // Slightly reduced from 160
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

export default function DailyPlanner() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "Review notes", duration: 1, startHour: 9, dayOffset: -1, color: "bg-blue-100" },
    { id: 2, name: "Team sync", duration: 2, startHour: 10, dayOffset: -1, color: "bg-green-100" },
    { id: 3, name: "Plan goals", duration: 1, startHour: 13, dayOffset: -1, color: "bg-yellow-100" },
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
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<string>("");
  
  // State for color selection
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (resizingTask) handleMouseMoveResize(e);
      else if (draggingTask) handleMouseMoveDrag(e);
    };
    const handleWindowMouseUp = () => handleMouseUp();
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') cancelCopy(); };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener('keydown', handleEsc);
    return () => { 
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener('keydown', handleEsc);
     };
  }, [resizingTask, draggingTask, tasks]);

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
      taskIdToIgnore: number,
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
      const startHour = 9; // Default start at 9 AM instead of 8 AM
      const duration = 1;
      // Default color - rotating through the colors
      const colorIndex = taskIdCounter % TASK_COLORS.length;
      const color = TASK_COLORS[colorIndex];
      
      if (hasConflict(-1, topDay, startHour, duration)) {
          alert("Time slot from 9:00 AM is already occupied. Please clear it first.");
          return;
      }
      const newTask: Task = { 
        id: taskIdCounter++, 
        name: taskInput, 
        duration, 
        startHour, 
        dayOffset: topDay,
        color 
      };
      setTasks(currentTasks => [...currentTasks, newTask]);
      setTaskInput("");
    }
  };

  // --- Copy Functions ---
  const handleInitiateCopy = (taskToCopy: Task) => {
      setResizingTask(null); 
      setDraggingTask(null);
      const targetOffset = taskToCopy.dayOffset === topDay ? bottomDay : topDay;
      setCopyingTaskData(taskToCopy);
      setTargetCopyDayOffset(targetOffset);
  };

  const handleTimelineClick = (dayOffsetClicked: number, e: React.MouseEvent<HTMLDivElement>) => {
      // Prevent event bubbling - this is crucial to avoid multiple copies
      e.stopPropagation();
      
      if (!copyingTaskData || dayOffsetClicked !== targetCopyDayOffset) {
          if (copyingTaskData && dayOffsetClicked !== targetCopyDayOffset) {
               cancelCopy();
          }
          return;
      }

      // --- Calculate drop time ---
      const timelineRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - timelineRect.left;
      
      // Get the right start hour based on which half of the day we're in
      const isSecondHalf = timelineRect.width < (TIMELINE_END_HOUR - TIMELINE_SPLIT_HOUR) * PIXELS_PER_HOUR * 1.3; // Rough check
      const baseStartHour = isSecondHalf ? TIMELINE_SPLIT_HOUR : TIMELINE_START_HOUR;
      
      const clickedHourRaw = (clickX / PIXELS_PER_HOUR) + baseStartHour;
      // Snap to nearest 15 minutes (0.25 hours)
      const snappedHour = Math.round(clickedHourRaw * 4) / 4;
      
      // Clamp within bounds of the timeline section
      const endHour = isSecondHalf ? TIMELINE_END_HOUR : TIMELINE_SPLIT_HOUR;
      const finalStartHour = Math.max(baseStartHour, Math.min(endHour - copyingTaskData.duration, snappedHour));
      // --- End Calculate drop time ---

      if (hasConflict(-1, targetCopyDayOffset, finalStartHour, copyingTaskData.duration)) {
           alert("Time slot is already occupied. Cannot copy task here.");
           return; // Don't cancel copy mode to allow trying different times
      }

      const copiedTask: Task = {
        ...copyingTaskData,
        id: taskIdCounter++,
        dayOffset: targetCopyDayOffset,
        startHour: finalStartHour,
      };
      
      setTasks(currentTasks => [...currentTasks, copiedTask]);
      cancelCopy(); // Cancel copy mode after successful copy
  };

  const cancelCopy = () => {
      setCopyingTaskData(null);
      setTargetCopyDayOffset(null);
  };
  // --- End Copy Functions ---

  // --- Color Selection Functions ---
  // Handle color change
  const handleColorChange = (taskId: number, newColor: string) => {
    setTasks(currentTasks => currentTasks.map(task => 
      task.id === taskId ? { ...task, color: newColor } : task
    ));
    setShowColorPicker(null); // Close color picker after selection
  };

  // Toggle color picker
  const toggleColorPicker = (e: React.MouseEvent, taskId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setShowColorPicker(current => current === taskId ? null : taskId);
  };
  // --- End Color Selection Functions ---

  // --- Edit/Delete Functions ---
    // Delete Task
    const handleDeleteTask = (taskIdToDelete: number) => {
      console.log("Delete task called with ID:", taskIdToDelete);
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskIdToDelete));
    };

    // Edit Task Name (Inline)
    const handleStartEdit = (task: Task) => {
        console.log("Start edit called for task:", task.id);
        setEditingTaskId(task.id);
        setEditingTaskName(task.name);
        setCopyingTaskData(null); // Cancel other interactions
        setTargetCopyDayOffset(null);
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
    const isInSecondHalf = initialTask.startHour >= TIMELINE_SPLIT_HOUR;
    const sectionStartHour = isInSecondHalf ? TIMELINE_SPLIT_HOUR : TIMELINE_START_HOUR;
    const sectionEndHour = isInSecondHalf ? TIMELINE_END_HOUR : TIMELINE_SPLIT_HOUR;

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

    // Check for conflict *before* updating state
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
    e.stopPropagation();
    cancelCopy();
    setResizingTask(null);
    const task = tasks[taskIndex];
    if (task) {
        // Store initial task state when drag starts
        setDraggingTask({ index: taskIndex, startX: e.clientX, initialTask: { ...task } });
    }
  };

  const handleMouseMoveDrag = (e: MouseEvent) => {
    if (!draggingTask) return;
    // Use initialTask from state captured on drag start
    const { index, startX, initialTask } = draggingTask;

    const deltaX = e.clientX - startX;
    const deltaMinutes = Math.round(deltaX / PIXELS_PER_MINUTE / 15) * 15;
    const deltaHours = deltaMinutes / 60;

    const tryStartHour = initialTask.startHour + deltaHours;
    
    // Determine which section the task belongs to (first or second half of day)
    const isInSecondHalf = initialTask.startHour >= TIMELINE_SPLIT_HOUR || 
                           (initialTask.startHour + initialTask.duration > TIMELINE_SPLIT_HOUR && initialTask.startHour + deltaHours >= TIMELINE_SPLIT_HOUR);
    
    const sectionStartHour = isInSecondHalf ? TIMELINE_SPLIT_HOUR : TIMELINE_START_HOUR;
    const sectionEndHour = isInSecondHalf ? TIMELINE_END_HOUR : TIMELINE_SPLIT_HOUR;
    
    // Clamp within timeline boundaries
    const potentialNewStartHour = Math.max(sectionStartHour, Math.min(sectionEndHour - initialTask.duration, tryStartHour));

    // Check for conflict *before* updating state
    if (!hasConflict(initialTask.id, initialTask.dayOffset, potentialNewStartHour, initialTask.duration)) {
        setTasks(currentTasks => currentTasks.map((task, i) =>
            i === index
            ? { ...task, startHour: parseFloat(potentialNewStartHour.toFixed(3)) }
            : task
        ));
    } else {
         console.log("Drag conflict detected");
    }
    // No startX update needed here, delta is always from initial startX
  };
  // --- End Drag Functions ---

  const handleMouseUp = () => {
    setDraggingTask(null);
    setResizingTask(null);
  };

  // --- Formatting & Labels ---
  const getDateLabel = (offset: number, withPrefix = false): string => {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

      date.setHours(0,0,0,0); // Compare dates only

      const prefix = date.getTime() === today.getTime() ? "Today" : date.getTime() === tomorrow.getTime() ? "Tomorrow" : date.getTime() === yesterday.getTime() ? "Yesterday" : null;
      const formatted = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      return withPrefix && prefix ? `${prefix} - ${formatted}` : formatted;
  };

  const formatTime = (hour: number): string => {
      // Handle hours beyond midnight (24+)
      const adjustedHour = hour >= 24 ? hour - 24 : hour;
      
      const totalMinutes = Math.round(adjustedHour * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      
      // Add "(+1)" indicator for next day times
      const nextDayIndicator = hour >= 24 ? " (+1)" : "";
      
      return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}${nextDayIndicator}`;
  };

  const formatDuration = (duration: number): string => {
      const totalMinutes = Math.round(duration * 60);
      const hrs = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hrs > 0 ? hrs + 'h ' : ''}${mins > 0 ? mins + 'm' : ''}`.trim() || '0m'; // Handle 0 duration
  };
  // --- End Formatting ---

  // --- Rendering Logic ---
  const renderTimeline = (isSecondHalf: boolean) => {
    const startHour = isSecondHalf ? TIMELINE_SPLIT_HOUR : TIMELINE_START_HOUR;
    const endHour = isSecondHalf ? TIMELINE_END_HOUR : TIMELINE_SPLIT_HOUR;
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    
    return (
      <div className="flex h-8 border-b border-gray-300 sticky top-0 bg-white z-30">
        {timelineHours.map((hour) => (
          <div key={hour} className="flex-none text-xs text-gray-500 pt-1 pl-1 border-l border-gray-200" style={{ width: `${PIXELS_PER_HOUR}px` }}>
            {formatTime(hour)}
          </div>
        ))}
         {/* Add final hour line */}
         <div className="flex-none border-l border-gray-200" style={{ width: `0px` }}></div>
      </div>
    );
  };

  const colors = ["bg-blue-100", "bg-green-100", "bg-yellow-100", "bg-red-100", "bg-purple-100", "bg-pink-100", "bg-indigo-100"];

  const renderColumn = (dayOffset: number, isSecondHalf: boolean = false) => {
    const isTopDay = dayOffset === topDay;
    const startHour = isSecondHalf ? TIMELINE_SPLIT_HOUR : TIMELINE_START_HOUR;
    const endHour = isSecondHalf ? TIMELINE_END_HOUR : TIMELINE_SPLIT_HOUR;
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    
    // Filter tasks for this time period
    const tasksToRender = tasks.filter(t => 
      t.dayOffset === dayOffset && 
      ((t.startHour >= startHour && t.startHour < endHour) || 
       (t.startHour < startHour && t.startHour + t.duration > startHour))
    );
    
    // Increased column height from 130 to 150 to accommodate taller tasks
    const columnHeight = 150; 
    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;

    return (
      // Column container with click handler for copy placement
      <div
        className={`w-full transition-colors duration-200 relative ${
            isTargetCopyDay ? 'bg-blue-50 ring-1 ring-blue-300' : ''
        }`}
        onClick={(e) => handleTimelineClick(dayOffset, e)}
      >
          {/* Optional overlay to indicate clickable area for copy? */}
          {isTargetCopyDay && <div className="absolute inset-0 bg-blue-500/5 text-center pt-10 text-blue-600 font-medium z-40 pointer-events-none">Click to place copied task</div>}

        {/* Add Task Input (only on Top Day morning section) */}
        {isTopDay && !isSecondHalf && (
          <div className="flex gap-2 mb-4 relative z-10"> {/* Ensure input is clickable */}
            <Input 
              value={taskInput} 
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
              placeholder="Add a new task" 
            />
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Add button clicked");
                handleAddTask();
              }}
            >Add</button>
          </div>
        )}
        
        {/* Timeline & Task Area Container */}
        <div className="relative border border-gray-200 rounded-md overflow-x-auto" 
             style={{ 
               width: `${PIXELS_PER_HOUR * (endHour - startHour) + 1}px`, 
               height: `${columnHeight + 40}px` 
             }}
        > 
           {renderTimeline(isSecondHalf)}
           {/* Task Area - Positioned relative to timeline */}
           <div
              className={`relative h-full pt-8 ${isTargetCopyDay ? 'bg-blue-50 ring-1 ring-blue-300 cursor-copy' : ''}`}
              onClick={(e) => handleTimelineClick(dayOffset, e)}
          >
             {/* Optional overlay when copying */} 
             {isTargetCopyDay && <div className="absolute inset-0 top-8 bg-blue-500/5 flex items-center justify-center text-blue-600 font-medium z-40 pointer-events-none"><p className="bg-white p-2 rounded shadow">Click time to place copied task</p></div>}

            {/* Grid Lines - Adjust top position */}
            {timelineHours.map((hour) => (
                <div key={`grid-${hour}-${dayOffset}`} className="absolute top-0 bottom-0 border-l border-gray-200" 
                     style={{ left: `${(hour - startHour) * PIXELS_PER_HOUR}px`, top: `${TIMELINE_HEADER_HEIGHT_PX}px`}} />
            ))}
            <div key={`grid-end-${dayOffset}`} className="absolute top-0 bottom-0 border-l border-gray-200" 
                 style={{ left: `${(endHour - startHour) * PIXELS_PER_HOUR}px`, top: `${TIMELINE_HEADER_HEIGHT_PX}px` }}></div>

            {/* Render Tasks with Layout */}
            {tasksToRender.map((task) => {
              const originalIndex = tasks.findIndex((t) => t.id === task.id);
              if (originalIndex === -1) return null; // Should not happen if state is consistent

              const color = task.color || colors[task.id % colors.length]; // Use task.color if available, fallback to index-based
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
              const zIndex = isEditing ? 110 : (isBeingDragged || isBeingResized ? 100 : 20);
              
              // Only render tasks that are visible in this time section
              if (renderWidth <= 0 || renderLeft < -renderWidth || renderLeft > (endHour - startHour) * PIXELS_PER_HOUR) {
                return null;
              }

              return (
                <Card
                  key={task.id}
                  onMouseDown={(e) => {
                      // Only start drag if click isn't on a button, input or resize handle
                      const target = e.target as HTMLElement;
                      const isButton = target.tagName === 'BUTTON' || 
                                     target.closest('button') ||
                                     target.tagName === 'INPUT' ||
                                     target.classList.contains('cursor-ew-resize');
                      
                      // Prevent starting drag/resize when editing, copying, or clicking buttons
                      if (!isEditing && !isBeingCopied && !isButton) {
                          handleDragStart(originalIndex, e);
                      }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute select-none transition-transform duration-100 ease-out hover:shadow-md ${color} ${
                      isBeingDragged || isBeingResized ? 'opacity-80 shadow-lg scale-[1.01]' : 'shadow-sm'
                  } ${ isBeingCopied ? 'ring-2 ring-offset-1 ring-blue-500' : '' }`}
                  style={{
                      left: `${renderLeft}px`,
                      width: `${renderWidth}px`,
                      top: `${renderTop}px`,
                      height: `${renderHeight}px`,
                      zIndex: zIndex,
                      cursor: isBeingDragged ? 'grabbing' : (isBeingCopied ? 'default' : 'grab')
                  }}
                >
                  <CardContent className="p-1 px-2 text-xs h-full flex flex-col justify-between relative overflow-hidden">
                    {/* Top Section: Name (or Edit Input) */} 
                    <div> 
                         {isEditing ? (
                            <div className="flex gap-1 items-center mb-1"> {/* Input + Save/Cancel */} 
                                <Input 
                                    type="text" 
                                    value={editingTaskName}
                                    onChange={(e) => setEditingTaskName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveEdit();
                                        } else if (e.key === 'Escape') {
                                            handleCancelEdit();
                                        }
                                    }}
                                    className="h-6 px-1 text-sm flex-grow" 
                                    autoFocus
                                    onClick={e => e.stopPropagation()} 
                                    onMouseDown={e => e.stopPropagation()} 
                                />
                                <button
                                    type="button"
                                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 flex-shrink-0"
                                    onClick={(e)=>{
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log("Save button clicked");
                                        handleSaveEdit();
                                    }}
                                    title="Save (Enter)"
                                >✓</button>
                                <button
                                    type="button"
                                    className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 flex-shrink-0"
                                    onClick={(e)=>{
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log("Cancel button clicked");
                                        handleCancelEdit();
                                    }}
                                    title="Cancel (Esc)"
                                >×</button>
                            </div>
                        ) : (
                            <span className="font-semibold text-sm leading-tight block truncate mb-0.5" title={task.name}>{task.name}</span>
                        )}
                        {/* Time Range (always visible) */} 
                         <span className="text-[11px] text-gray-600 block">
                             {formatTime(task.startHour)} - {formatTime(task.startHour + task.duration)}
                         </span>
                    </div>

                    {/* Bottom Section: Duration & Action Buttons */} 
                    <div className="flex justify-between items-center mt-auto pt-1"> {/* Pushes to bottom */} 
                        <span className="text-[11px] text-gray-500">{formatDuration(task.duration)}</span>
                        {/* Action Buttons Group */} 
                        <div className={`flex items-center gap-1 ${isEditing ? 'opacity-0 pointer-events-none' : ''}`}> {/* Hide actions when editing */} 
                            {/* Edit Button */} 
                            {!isEditing && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 p-0 hover:bg-gray-100"
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation(); 
                                        console.log("Edit button clicked for task:", task.id);
                                        handleStartEdit(task); 
                                    }}
                                    title="Edit Task Name"
                                    disabled={isBeingCopied || !!draggingTask || !!resizingTask}
                                >
                                    <span className="text-gray-600 hover:text-gray-900">✏️</span>
                                </Button>
                            )}
                            {/* Color Button */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 p-0 hover:bg-gray-100"
                                onClick={(e) => toggleColorPicker(e, task.id)}
                                title="Change Color"
                                disabled={isBeingCopied || !!draggingTask || !!resizingTask}
                            >
                                <span className="text-gray-600 hover:text-gray-900">🎨</span>
                            </Button>
                            {/* Delete Button */} 
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 p-0 hover:bg-red-100"
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    console.log("Delete button clicked for task:", task.id);
                                    handleDeleteTask(task.id); 
                                }}
                                title="Delete Task"
                                disabled={isBeingCopied || !!draggingTask || !!resizingTask}
                            >
                                <span className="text-red-500 hover:text-red-700">🗑️</span>
                            </Button>
                            {/* Copy Button */} 
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-7 px-2 hover:bg-blue-100"
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    console.log("Copy button clicked for task:", task.id);
                                    handleInitiateCopy(task); 
                                }}
                                title={isBeingCopied ? 'Cancel Copy (Esc)' : `Copy to ${task.dayOffset === topDay ? 'Bottom' : 'Top'} Day`}
                                disabled={isEditing || !!draggingTask || !!resizingTask}
                            >
                                <span className={isBeingCopied ? "text-red-500" : "text-blue-500"}>
                                    {isBeingCopied ? '❌' : '📋'}
                                </span>
                                <span className="ml-1 text-xs">{isBeingCopied ? 'Cancel' : 'Copy'}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Resizing Handles (Hide if editing) */} 
                    { !isEditing && ( 
                         <> 
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-blue-200/40 z-30"
                              onMouseDown={(e) => {
                                e.stopPropagation(); 
                                handleResizeStart(originalIndex, 'left', e);
                              }}
                            ></div>
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-blue-200/40 z-30"
                              onMouseDown={(e) => {
                                e.stopPropagation(); 
                                handleResizeStart(originalIndex, 'right', e);
                              }}
                            ></div>
                         </> 
                     )} 

                     {/* Color Picker Popup */}
                     {showColorPicker === task.id && (
                         <div 
                             className="absolute bottom-full right-0 mb-1 bg-white p-1 rounded shadow-lg flex flex-wrap gap-1 w-24 z-50"
                             onClick={e => e.stopPropagation()}
                         >
                             {TASK_COLORS.map(colorClass => (
                                 <button
                                     key={colorClass}
                                     type="button"
                                     className={`w-5 h-5 rounded-full ${colorClass} hover:ring-2 ring-gray-400`}
                                     onClick={(e) => {
                                         e.preventDefault();
                                         e.stopPropagation();
                                         handleColorChange(task.id, colorClass);
                                     }}
                                     title={colorClass.replace('bg-', '').replace('-100', '')}
                                 />
                             ))}
                         </div>
                     )}
                  </CardContent>
                </Card>
              );
            })}
         </div> {/* End Task Area */}
      </div> {/* End Timeline & Task Area Container */}
    </div> // End Column Div
  );
};

return (
  // Main container with vertical flex and scroll
  <div className="flex flex-col gap-8 p-4 overflow-x-auto">
     {/* Today's Schedule */}
     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
       <div className="flex flex-col mb-4">
         <h2 className="text-xl font-bold mb-3">{getDateLabel(topDay, true)}</h2>
         
         {/* Day Navigation Buttons */}
         <div className="flex flex-wrap gap-2">
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeCurrentDayOffset(topDay - 7)}
           >← 1 Week</button>
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeCurrentDayOffset(topDay - 1)}
           >← 1 Day</button>
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeCurrentDayOffset(0)}
           >Today</button>
           <button 
             type="button" 
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeCurrentDayOffset(topDay + 1)}
           >1 Day →</button>
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeCurrentDayOffset(topDay + 7)}
           >1 Week →</button>
         </div>
       </div>
       
       <div className="flex flex-col gap-6">
         <div className="bg-gray-50 rounded-lg p-4">
           <h3 className="text-lg font-medium text-gray-700 mb-3">Morning/Afternoon (5AM-5PM)</h3>
           {renderColumn(topDay, false)}
         </div>
         <div className="bg-gray-50 rounded-lg p-4">
           <h3 className="text-lg font-medium text-gray-700 mb-3">Evening/Night (5PM-5AM)</h3>
           {renderColumn(topDay, true)}
         </div>
       </div>
     </div>
     
     {/* Tomorrow's Schedule */}
     <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
       <div className="flex flex-col mb-4">
         <h2 className="text-xl font-bold mb-3">{getDateLabel(bottomDay, true)}</h2>
         
         {/* Day Navigation Buttons */}
         <div className="flex flex-wrap gap-2">
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeLeftDayOffset(bottomDay - 7)}
           >← 1 Week</button>
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeLeftDayOffset(bottomDay - 1)}
           >← 1 Day</button>
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeLeftDayOffset(0)}
           >Today</button>
           <button 
             type="button" 
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeLeftDayOffset(bottomDay + 1)}
           >1 Day →</button>
           <button 
             type="button"
             className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap"
             onClick={() => setSafeLeftDayOffset(bottomDay + 7)}
           >1 Week →</button>
         </div>
       </div>
       
       <div className="flex flex-col gap-6">
         <div className="bg-gray-50 rounded-lg p-4">
           <h3 className="text-lg font-medium text-gray-700 mb-3">Morning/Afternoon (5AM-5PM)</h3>
           {renderColumn(bottomDay, false)}
         </div>
         <div className="bg-gray-50 rounded-lg p-4">
           <h3 className="text-lg font-medium text-gray-700 mb-3">Evening/Night (5PM-5AM)</h3>
           {renderColumn(bottomDay, true)}
         </div>
       </div>
     </div>
  </div>
);
} 