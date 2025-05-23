import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from 'react-dom';
import { Input, Button } from "@/components/ui"; // Assuming Button is also from ui
import { PinIcon, FolderPlus, Trash2, X as XIcon, ChevronDownIcon } from 'lucide-react';
import { Task, PinnedTask } from '../../types/planner'; // Adjusted path
import { ActiveModalTask } from '../../hooks/useModalManager'; // Adjusted path
import { TASK_COLORS, TIMELINE_START_HOUR, TIMELINE_END_HOUR, MIN_TASK_DURATION, DURATION_OPTIONS } from '../../lib/constants'; // Adjusted path
import { formatDuration } from "@/utils/formatters";
import CustomTimePicker from '../primitives/CustomTimePicker'; // Import the new component

export interface EditTaskModalProps {
  taskToEdit: ActiveModalTask; // The task object from activeEditModalTask
  onSave: (taskData: Partial<Task>) => void; // Simplified: useModalManager's saveTaskFromModal will know if it's new
  onClose: () => void;
  onColorChange: (taskId: string, color: string) => void; // For changing color live
  onDelete?: (taskId: string) => void; // Add onDelete prop
  onPinTask?: (task: Task) => void;
  onMoveToPool?: (taskId: string) => void;
  pinnedTasks?: PinnedTask[]; // To check if already pinned
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  taskToEdit,
  onSave,
  onClose,
  onColorChange,
  onDelete, // Destructure onDelete
  onPinTask,
  onMoveToPool,
  pinnedTasks = [],
}) => {
  const [editingTaskName, setEditingTaskName] = useState(taskToEdit.name);
  const [editingStartHour, setEditingStartHour] = useState(taskToEdit.startHour);
  const [editingDuration, setEditingDuration] = useState(taskToEdit.duration);
  const [editingColor, setEditingColor] = useState(taskToEdit.color || TASK_COLORS[0]);
  const [editingNotes, setEditingNotes] = useState(taskToEdit.notes || '');
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const durationControlRef = useRef<HTMLDivElement>(null); // Ref for the duration control wrapper
  const durationDropdownRef = useRef<HTMLDivElement>(null); // Ref for the duration dropdown itself

  // Initialize form fields when taskToEdit changes (e.g., when modal opens for a different task)
  useEffect(() => {
    setEditingTaskName(taskToEdit.name || (taskToEdit.isNew ? "New Task" : ""));
    setEditingStartHour(taskToEdit.startHour);
    setEditingDuration(taskToEdit.duration);
    setEditingColor(taskToEdit.color || TASK_COLORS[0]);
    setEditingNotes(taskToEdit.notes || '');
  }, [taskToEdit]);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close main modal
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
      // Close duration dropdown if open and click is outside of it and its toggle
      if (isDurationDropdownOpen && 
          durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node) &&
          durationControlRef.current && !durationControlRef.current.contains(event.target as Node)) {
        setIsDurationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isDurationDropdownOpen]); // Added isDurationDropdownOpen to dependencies

  const isTaskPinned = pinnedTasks.some(
    pinnedTask => pinnedTask.originalId === taskToEdit.id || pinnedTask.id === taskToEdit.id
  );

  const handleSaveEdits = () => {
    if (editingTaskName.trim()) {
      const updatedFields: Partial<Task> = {
        name: editingTaskName.trim(),
        startHour: editingStartHour,
        duration: editingDuration,
        color: editingColor,
        notes: editingNotes.trim(),
        // baseDate will be part of taskToEdit if it's a new task, or preserved for existing.
        // id is also part of taskToEdit.
        // saveTaskFromModal in useModalManager will handle the rest.
      };
      // If it's a new task, ensure baseDate is passed through
      if (taskToEdit.isNew) {
        updatedFields.baseDate = taskToEdit.baseDate;
        updatedFields.id = taskToEdit.id; // Pass the temporary ID for new tasks
      }
      onSave(updatedFields);
      // onClose(); // onSave in useModalManager will call closeEditModal
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && taskToEdit.id && !taskToEdit.isNew) { // Only allow delete for existing tasks
      onDelete(taskToEdit.id);
      onClose(); // Close modal after delete
    }
  };

  const handleLiveColorChange = (color: string) => {
    setEditingColor(color);
    // For existing tasks, we can call onColorChange to update the hook immediately
    // For new tasks (taskToEdit.isNew), onColorChange might not work if ID is temporary
    // However, the color picker in TaskCard was directly calling onColorChange.
    // Let's assume onColorChange can handle temporary IDs or this will be managed by save.
    if (!taskToEdit.isNew && taskToEdit.id) {
        onColorChange(taskToEdit.id, color);
    }
  }

  // Prevent click propagation for inputs etc.
  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  return ReactDOM.createPortal(
    <div 
      ref={menuRef}
      className="fixed z-[1000] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-4 min-w-[300px] max-w-[400px]"
      style={{
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        maxHeight: '90vh', overflowY: 'auto'
      }}
      onClick={stopPropagation} // Prevent modal closing when clicking inside
    >
      <div className="space-y-3">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors z-10"
          aria-label="Close modal"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 dark:text-white pt-1 pr-8">
          {taskToEdit.isNew ? 'Create New Task' : 'Edit Task'}
        </h2>

        <div>
          <label htmlFor={`editTaskNameInput-${taskToEdit.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task Name
          </label>
          <Input 
            id={`editTaskNameInput-${taskToEdit.id}`}
            type="text" 
            value={editingTaskName}
            onChange={(e) => setEditingTaskName(e.target.value)}
            className="w-full text-sm"
            autoFocus={true}
            onClick={stopPropagation}
            onMouseDown={stopPropagation}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdits();
              if (e.key === 'Escape') handleCancel();
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`editStartHourInput-${taskToEdit.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <CustomTimePicker 
              value={editingStartHour}
              onChange={setEditingStartHour}
              minHour={TIMELINE_START_HOUR}
              maxHour={TIMELINE_END_HOUR - MIN_TASK_DURATION}
            />
          </div>

          <div>
            <label htmlFor={`editDurationInput-${taskToEdit.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration
            </label>
            <div 
              ref={durationControlRef}
              className="relative"
              // REMOVED onWheel handler from here
            >
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white cursor-pointer flex justify-between items-center"
                onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                // onMouseDown={stopPropagation} // This can likely be removed too if not specifically needed for focus quirks
              >
                <span>{DURATION_OPTIONS.find(opt => opt.value === editingDuration)?.label || formatDuration(editingDuration)}</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isDurationDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDurationDropdownOpen && (
                <div 
                  ref={durationDropdownRef}
                  className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
                  // Add onWheel to the dropdown list itself if scroll sensitivity becomes an issue on the list items
                  // For now, individual items are clicked.
                >
                  {DURATION_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${editingDuration === option.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                      onClick={() => {
                        setEditingDuration(option.value);
                        setIsDurationDropdownOpen(false);
                      }}
                    >
                      {option.label} 
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label> */}
          <div className="grid grid-cols-8 gap-1">
            {TASK_COLORS.map(colorClass => (
              <button
                key={`color-button-${colorClass}-${taskToEdit.id}`}
                type="button"
                className={`w-8 h-8 rounded-md ${colorClass} hover:ring-2 ring-gray-400 transition-all ${editingColor === colorClass ? 'ring-2 ring-blue-500' : ''}`}
                onClick={(e) => { stopPropagation(e); handleLiveColorChange(colorClass); }}
                title={colorClass.split(' ')[0].replace('bg-', '').replace('-200', '')}
              />
            ))}
          </div>
        </div>

        {(onPinTask || onMoveToPool || (onDelete && !taskToEdit.isNew)) && (
          <div className="flex gap-2 pt-2">
            {onPinTask && !isTaskPinned && !taskToEdit.isNew && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => { stopPropagation(e); if (taskToEdit) onPinTask(taskToEdit); }}
              >
                <PinIcon className="w-4 h-4" />
                Pin Task
              </button>
            )}
            {onPinTask && isTaskPinned && !taskToEdit.isNew && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md cursor-not-allowed">
                <PinIcon className="w-4 h-4" />
                Already Pinned
              </div>
            )}
            {onMoveToPool && !taskToEdit.isFromPool && !taskToEdit.isNew && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => { stopPropagation(e); if (onMoveToPool && taskToEdit.id) onMoveToPool(taskToEdit.id); }}
              >
                <FolderPlus className="w-4 h-4" />
                Move to Pool
              </button>
            )}
            {onDelete && !taskToEdit.isNew && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                onClick={(e) => { stopPropagation(e); handleDelete();}}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}

        <div>
          <textarea
            id={`editNotesInput-${taskToEdit.id}`}
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
            placeholder="Add notes..."
            onClick={stopPropagation}
            onMouseDown={stopPropagation}
          />
        </div>

        <div className="flex justify-end items-center pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveEdits}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold"
            >
              {taskToEdit.isNew ? 'Create Task' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}; 