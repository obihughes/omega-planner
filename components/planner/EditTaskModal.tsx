import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from 'react-dom';
import { Input, Button } from "@/components/ui"; // Assuming Button is also from ui
import { PinIcon, FolderPlus } from 'lucide-react';
import { Task, PinnedTask } from '../../types/planner'; // Adjusted path
import { ActiveModalTask } from '../../hooks/useModalManager'; // Adjusted path
import { TASK_COLORS, TIMELINE_START_HOUR, TIMELINE_END_HOUR, MIN_TASK_DURATION } from '../../lib/constants'; // Adjusted path
import { formatDuration } from "@/utils/formatters";

// Duration options (can be kept here or moved to constants)
const DURATION_OPTIONS = [
    { value: 0.25, label: '15 minutes' },
    { value: 0.5, label: '30 minutes' },
    { value: 0.75, label: '45 minutes' },
    { value: 1, label: '1 hour' },
    { value: 1.5, label: '1.5 hours' },
    { value: 2, label: '2 hours' },
    { value: 3, label: '3 hours' },
    { value: 4, label: '4 hours' },
    { value: 6, label: '6 hours' },
    { value: 8, label: '8 hours' }
];

export interface EditTaskModalProps {
  taskToEdit: ActiveModalTask; // The task object from activeEditModalTask
  onSave: (taskData: Partial<Task>) => void; // Simplified: useModalManager's saveTaskFromModal will know if it's new
  onClose: () => void;
  onColorChange: (taskId: string, color: string) => void; // For changing color live
  onPinTask?: (task: Task) => void;
  onMoveToPool?: (taskId: string) => void;
  pinnedTasks?: PinnedTask[]; // To check if already pinned
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  taskToEdit,
  onSave,
  onClose,
  onColorChange,
  onPinTask,
  onMoveToPool,
  pinnedTasks = [],
}) => {
  const [editingTaskName, setEditingTaskName] = useState(taskToEdit.name);
  const [editingStartHour, setEditingStartHour] = useState(taskToEdit.startHour);
  const [editingDuration, setEditingDuration] = useState(taskToEdit.duration);
  const [editingColor, setEditingColor] = useState(taskToEdit.color || TASK_COLORS[0]);
  const [editingNotes, setEditingNotes] = useState(taskToEdit.notes || '');
  
  const menuRef = useRef<HTMLDivElement>(null);

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
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
            <select
              id={`editStartHourInput-${taskToEdit.id}`}
              value={editingStartHour}
              onChange={(e) => setEditingStartHour(parseFloat(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              onClick={stopPropagation}
              onMouseDown={stopPropagation}
            >
              {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => { // +1 to include end hour if needed
                const hour = TIMELINE_START_HOUR + i * 0.25; // Allow quarter hours
                if (hour > TIMELINE_END_HOUR - MIN_TASK_DURATION) return null; // ensure min duration can be selected
                const period = hour < 12 ? 'AM' : (hour < 24 ? 'PM' : 'AM');
                let displayHour = Math.floor(hour) % 12;
                if (displayHour === 0) displayHour = 12; // Convert 0 to 12 for 12 AM/PM
                const minutes = (hour % 1) * 60;
                return (
                  <option key={hour} value={hour}>
                    {`${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`}
                  </option>
                );
              }).filter(Boolean)}
            </select>
          </div>

          <div>
            <label htmlFor={`editDurationInput-${taskToEdit.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration
            </label>
            <div 
              className="relative group"
              onWheel={(e) => {
                // e.preventDefault(); // Keep commented as per previous fix
                // e.stopPropagation();
                stopPropagation(e);
                const currentIndex = DURATION_OPTIONS.findIndex(opt => opt.value === editingDuration);
                if (e.deltaY > 0 && currentIndex < DURATION_OPTIONS.length - 1) {
                  setEditingDuration(DURATION_OPTIONS[currentIndex + 1].value);
                } else if (e.deltaY < 0 && currentIndex > 0) {
                  setEditingDuration(DURATION_OPTIONS[currentIndex - 1].value);
                }
              }}
            >
              <div 
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white cursor-pointer"
                onClick={stopPropagation}
                onMouseDown={stopPropagation}
              >
                {DURATION_OPTIONS.find(opt => opt.value === editingDuration)?.label || formatDuration(editingDuration)}
              </div>
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-48 overflow-y-auto">
                {DURATION_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${editingDuration === option.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                    onClick={() => setEditingDuration(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
          <div className="grid grid-cols-8 gap-0.5">
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

        {(onPinTask || onMoveToPool) && (
          <div className="flex gap-2">
            {onPinTask && !isTaskPinned && !taskToEdit.isNew && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => { stopPropagation(e); onPinTask(taskToEdit); }}
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
                onClick={(e) => { stopPropagation(e); if (onMoveToPool) onMoveToPool(taskToEdit.id); }}
              >
                <FolderPlus className="w-4 h-4" />
                Move to Pool
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor={`editNotesInput-${taskToEdit.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
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

        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdits}
            className="flex-1"
          >
            {taskToEdit.isNew ? 'Create Task' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}; 