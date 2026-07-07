import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from 'react-dom';
import { Input } from "@/components/ui";
import { PinIcon, FolderPlus, Trash2 } from 'lucide-react';
import { Task, PinnedTask } from '@/types/planner';
import { formatTime } from '@/utils/formatters';
import { TASK_COLORS, TIMELINE_START_HOUR, TIMELINE_END_HOUR } from '@/lib/constants';

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

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  onSave: (taskData: Partial<Task>, isNew: boolean) => void;
  onDelete?: (taskId: string) => void;
  onPinTask?: (task: Task) => void;
  pinnedTasks?: PinnedTask[];
  onMoveToInbox?: (taskId: string) => void;
  initialDayOffset?: number;
  initialStartHour?: number;
  // TASK_COLORS is already imported globally from @/lib/constants
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  onSave,
  onDelete,
  onPinTask,
  pinnedTasks = [],
  onMoveToInbox,
  initialDayOffset = 0,
  initialStartHour = 9,
}) => {


  const isNewTask = !taskToEdit;
  const [taskName, setTaskName] = useState("");
  const [startHour, setStartHour] = useState(initialStartHour);
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState(TASK_COLORS[0]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate end time based on start time + duration
  const endHour = startHour + duration;

  // Helper function to set end time and automatically calculate duration
  const setEndTime = (newEndHour: number) => {
    const newDuration = Math.max(0.25, newEndHour - startHour); // Minimum 15 minutes
    setDuration(newDuration);
  };

  useEffect(() => {
    if (taskToEdit) {
      setTaskName(taskToEdit.name);
      setStartHour(taskToEdit.startHour);
      setDuration(taskToEdit.duration);
      setNotes(taskToEdit.notes || "");
      setColor(taskToEdit.color || TASK_COLORS[0]);
    } else {
      // Reset for new task, using initial values if provided
      setTaskName("");
      setStartHour(initialStartHour);
      setDuration(1); // Default duration
      setNotes("");
      setColor(TASK_COLORS[0]);
    }
  }, [taskToEdit, initialStartHour, isOpen]); // Depend on isOpen to reset form when reopened for new task

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (taskName.trim() === "") return; // Basic validation
    const taskData: Partial<Task> = {
      name: taskName.trim(),
      startHour: startHour,
      duration: duration,
      notes: notes.trim(),
      color: color,
      // dayOffset will be handled by the parent component for new tasks
      // for existing tasks, it's part of taskToEdit and shouldn't change here unless we add a day selector
      ...(isNewTask && { dayOffset: initialDayOffset })
    };
    onSave(taskData, isNewTask);
    onClose(); // Close modal after save
  };

  const handleDelete = () => {
    if (taskToEdit && onDelete) {
      onDelete(taskToEdit.id);
      onClose();
    }
  };

  const handlePin = () => {
    if (taskToEdit && onPinTask) {
      onPinTask(taskToEdit);
      // Pinning might close the modal or update UI, handled by parent
    }
  };

  const handleMoveToInbox = () => {
    if (taskToEdit && onMoveToInbox) {
      onMoveToInbox(taskToEdit.id);
      onClose(); 
    }
  };

  const isTaskPinned = taskToEdit ? pinnedTasks.some(
    pinnedTask => pinnedTask.originalId === taskToEdit.id
  ) : false;

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      ref={modalRef}
      className="fixed z-[1000] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-4 min-w-[300px] max-w-[400px]"
      style={{
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        maxHeight: '90vh', overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()} // Prevent click on modal content from closing it
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {isNewTask ? 'Create New Task' : 'Edit Task'}
        </h3>
        <div>
          <label htmlFor={`taskNameInput-${taskToEdit?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Task Name
          </label>
          <Input 
            id={`taskNameInput-${taskToEdit?.id || 'new'}`}
            type="text" 
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full text-sm"
            autoFocus={true}
            placeholder="Enter task name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>

        {/* Start Time */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label htmlFor={`startHourInput-${taskToEdit?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Time
            </label>
            <select
              id={`startHourInput-${taskToEdit?.id || 'new'}`}
              value={Math.floor(startHour)}
              onChange={(e) => {
                const newHour = parseInt(e.target.value, 10);
                const minutePart = startHour % 1;
                setStartHour(newHour + minutePart);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => {
                const hourVal = TIMELINE_START_HOUR + i;
                if (hourVal > TIMELINE_END_HOUR) return null;
                return (
                  <option key={hourVal} value={hourVal}>
                    {formatTime(hourVal)}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor={`startMinuteInput-${taskToEdit?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minute
            </label>
            <select
              id={`startMinuteInput-${taskToEdit?.id || 'new'}`}
              value={Math.round((startHour % 1) * 60)}
              onChange={(e) => {
                const newMinute = parseInt(e.target.value, 10);
                const hourPart = Math.floor(startHour);
                setStartHour(hourPart + newMinute / 60);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value={0}>00</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
            </select>
          </div>
        </div>

        {/* End Time */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label htmlFor={`endHourInput-${taskToEdit?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Time
            </label>
            <select
              id={`endHourInput-${taskToEdit?.id || 'new'}`}
              value={Math.floor(endHour)}
              onChange={(e) => {
                const newHour = parseInt(e.target.value, 10);
                const minutePart = endHour % 1;
                setEndTime(newHour + minutePart);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => {
                const hourVal = TIMELINE_START_HOUR + i;
                if (hourVal > TIMELINE_END_HOUR) return null;
                return (
                  <option key={hourVal} value={hourVal}>
                    {formatTime(hourVal)}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor={`endMinuteInput-${taskToEdit?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minute
            </label>
            <select
              id={`endMinuteInput-${taskToEdit?.id || 'new'}`}
              value={Math.round((endHour % 1) * 60)}
              onChange={(e) => {
                const newMinute = parseInt(e.target.value, 10);
                const hourPart = Math.floor(endHour);
                setEndTime(hourPart + newMinute / 60);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value={0}>00</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
            </select>
          </div>
        </div>

        {/* Duration (now calculated automatically but still shown for reference) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`durationInput-${taskToEdit?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration
            </label>
            <div 
              className="relative group"
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentIndex = DURATION_OPTIONS.findIndex(opt => opt.value === duration);
                if (e.deltaY > 0 && currentIndex < DURATION_OPTIONS.length - 1) {
                  setDuration(DURATION_OPTIONS[currentIndex + 1].value);
                } else if (e.deltaY < 0 && currentIndex > 0) {
                  setDuration(DURATION_OPTIONS[currentIndex - 1].value);
                }
                return false;
              }}
            >
              <div className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white cursor-pointer">
                {DURATION_OPTIONS.find(opt => opt.value === duration)?.label || `${duration} hour${duration !== 1 ? 's' : ''}`}
              </div>
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 max-h-48 overflow-y-auto">
                {DURATION_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${duration === option.value ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                    onClick={() => setDuration(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-12 gap-2">
            {TASK_COLORS.map(colorClass => (
              <button
                key={colorClass}
                type="button"
                className={`w-full aspect-square rounded ${colorClass} hover:ring-2 ring-gray-400 transition-all ${color === colorClass ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setColor(colorClass)}
                title={colorClass.split(' ')[0].replace('bg-', '').replace(/-\d+/, '')} // More robust title parsing
              />
            ))}
          </div>
        </div>
        
        {!isNewTask && (
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {onPinTask && !isTaskPinned && (
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={handlePin}
              >
                <PinIcon className="w-4 h-4" /> Pin
              </button>
            )}
            {onPinTask && isTaskPinned && (
              <div className="flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md cursor-not-allowed">
                <PinIcon className="w-4 h-4" /> Pinned
              </div>
            )}
            {onMoveToInbox && (
                <button
                type="button"
                className="flex items-center justify-center gap-1.5 flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={handleMoveToInbox}
                >
                <FolderPlus className="w-4 h-4" /> Inbox
                </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor={`notesInput-${taskToEdit?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            id={`notesInput-${taskToEdit?.id || 'new'}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
            placeholder="Add notes..."
          />
        </div>

        <div className={`flex gap-2 pt-2 ${!isNewTask ? '' : 'border-t border-gray-200 dark:border-gray-700'}`}>
          {!isNewTask && onDelete && (
            <button
            type="button"
            className="h-9 px-4 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-sm font-medium transition-colors"
            onClick={handleDelete}
            >
             Delete
            </button>
          )}
          <button
            type="button"
            className="flex-1 h-9 px-4 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors ${!isNewTask && onDelete ? '' : 'ml-auto'}"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 h-9 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm font-medium transition-colors"
            onClick={handleSave}
          >
            {isNewTask ? 'Create Task' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}; 