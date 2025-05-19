import React, { useState, useCallback } from 'react';
import { Task } from '../../types/planner';
import { Input } from "@/components/ui";
import { CopyPlus, Trash2, Edit3 } from 'lucide-react';

// Imported from DailyPlanner's constants, or pass as prop
// For now, let's assume TASK_COLORS is passed as a prop.
// const TASK_COLORS = [ ... ]; 

interface TaskPoolSidebarProps {
  poolTasks: Task[];
  TASK_COLORS: string[]; // For the add form color picker
  activeTab: 'pool' | 'pinned'; // To control rendering, though parent will likely do this
  topDayOffset: number;
  
  // Functions from parent to interact with parent state
  setPoolTasks: (setter: (prevTasks: Task[]) => Task[]) => void;
  setCopyingTaskData: (task: Task | null) => void;
  setTargetCopyDayOffset: (offset: number | null) => void;
  
  // Function to handle the actual adding of task to parent's state
  // Parent will assign ID and use its taskIdCounter
  onActualAddPoolTask: (taskData: { name: string; duration: number; color: string }) => void;
  
  // Utility functions
  formatDuration: (duration: number) => string;
  onDeletePoolTask?: (taskId: string) => void;
  onClearPool?: () => void;
  openEditModal: (task: Task, isFromPool?: boolean) => void;
}

export const TaskPoolSidebar: React.FC<TaskPoolSidebarProps> = ({
  poolTasks,
  TASK_COLORS,
  activeTab, // This component might not need to know the activeTab if parent only renders it when it's the pool tab
  topDayOffset,
  setPoolTasks,
  setCopyingTaskData,
  setTargetCopyDayOffset,
  onActualAddPoolTask,
  formatDuration,
  onDeletePoolTask,
  onClearPool,
  openEditModal,
}) => {
  const [showPoolTaskForm, setShowPoolTaskForm] = useState<boolean>(false);
  const [newPoolTaskName, setNewPoolTaskName] = useState<string>("");
  const [newPoolTaskDuration, setNewPoolTaskDuration] = useState<number>(1); // Default duration 1h
  const [newPoolTaskColor, setNewPoolTaskColor] = useState<string>(TASK_COLORS[0] || "bg-gray-300 dark:bg-gray-600"); // Default to first color or a fallback

  const handleAddPoolTaskSubmit = useCallback(() => {
    if (newPoolTaskName.trim() === "") return;
    onActualAddPoolTask({
      name: newPoolTaskName.trim(),
      duration: newPoolTaskDuration,
      color: newPoolTaskColor,
    });
    // Reset form
    setNewPoolTaskName("");
    setNewPoolTaskDuration(1);
    setNewPoolTaskColor(TASK_COLORS[0] || "bg-gray-300 dark:bg-gray-600");
    setShowPoolTaskForm(false);
  }, [
    newPoolTaskName, 
    newPoolTaskDuration, 
    newPoolTaskColor, 
    onActualAddPoolTask, 
    TASK_COLORS
  ]);
  
  // If the parent controls rendering based on activeTab, this check might be redundant
  // if (activeTab !== 'pool') {
  //   return null; 
  // }

  return (
    <>
      {/* Task Pool Content (previously inside conditional block in DailyPlanner) */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Task Pool Header */}
        <div className="p-2 border-b border-neutral-800 flex justify-end items-center">
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800/50 transition-colors"
            onClick={() => setShowPoolTaskForm(true)}
            title="Add new task to pool"
          >
            + Add
          </button>
        </div>
        {/* Task Pool List Area */}
        <div className="flex-grow overflow-y-auto p-1">
          {poolTasks.length === 0 ? (
            <div className="text-slate-400 text-xs p-2 text-center">
              No unscheduled tasks.
              <br />Move tasks here to save for later.
            </div>
          ) : (
            <div className="grid gap-1">
              {poolTasks.map(task => (
                <div 
                  key={task.id}
                  className={`${task.color || 'bg-blue-600'} opacity-60 hover:opacity-80 px-1.5 py-1 rounded text-white text-[11px] relative group transition-all duration-150`}
                >
                  <div className="font-medium line-clamp-2 pr-6">{task.name}</div>
                  <div className="text-[9px] opacity-80">{formatDuration(task.duration)}</div>
                  <div className="absolute top-1 right-1 flex space-x-0.5">
                    <button
                      type="button"
                      className="h-5 w-5 rounded bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                      onClick={() => {
                        const poolTask = poolTasks.find(t => t.id === task.id);
                        if (poolTask) {
                          setCopyingTaskData({...poolTask});
                          setTargetCopyDayOffset(topDayOffset);
                        }
                      }}
                      title="Copy to Schedule"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="h-5 w-5 rounded bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                      onClick={() => {
                        setPoolTasks(prev => prev.filter(t => t.id !== task.id));
                      }}
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="h-5 w-5 rounded bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                      onClick={() => openEditModal(task, true)}
                      title="Edit Pool Task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Task Pool Footer */}
        <div className="p-1 border-t border-slate-800 flex justify-between items-center text-[10px]">
          <button
            type="button"
            className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            onClick={() => setShowPoolTaskForm(true)}
            title="Add new task to pool"
          >
            Add Task
          </button>
          <button
            type="button"
            className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            onClick={() => setPoolTasks(() => [])} // Clears all pool tasks - FIXED LINTER ERROR
            disabled={poolTasks.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* New Pool Task Form Modal */}
      {showPoolTaskForm && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-[130]">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Add Task to Pool</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="newPoolTaskNameInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name</label>
                <Input
                  id="newPoolTaskNameInput"
                  type="text"
                  value={newPoolTaskName}
                  onChange={(e) => setNewPoolTaskName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter task name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div> {/* Duration Input Column */}
                  <label htmlFor="newPoolTaskDurationSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                  <select
                    id="newPoolTaskDurationSelect"
                    value={newPoolTaskDuration}
                    onChange={(e) => setNewPoolTaskDuration(parseFloat(e.target.value))}
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
                <div> {/* Placeholder for another input if needed, or adjust grid-cols */} </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {TASK_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-6 h-6 rounded-full ${color} ${newPoolTaskColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                      onClick={() => setNewPoolTaskColor(color)}
                      title={color.split(' ')[0].replace('bg-', '').replace('-200', '').replace('-300', '')}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 gap-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setShowPoolTaskForm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                onClick={handleAddPoolTaskSubmit}
              >
                Add to Pool
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 