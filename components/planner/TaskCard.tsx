import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from 'react-dom';
import { Input } from "@/components/ui";
import { Edit3, Copy, Eye, PinIcon, FolderPlus } from 'lucide-react';

import { formatDuration, formatTime } from '@/utils/formatters';
import { Task, PinnedTask } from '../../types/planner';
import { TASK_COLORS } from '../../lib/constants';
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR, MIN_TASK_DURATION } from '../../lib/constants';

export interface TaskCardProps {
  task: Task;
  height: number;
  onStartEdit: (task: Task) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Omit<Task, 'id'>>) => void;
  onDelete: (taskId: string) => void;
  onCopy: (task: Task) => void;
  onColorChange: (taskId: string, color: string) => void;
  editingTaskId: string | null;
  setEditingTaskId: (id: string | null) => void;
  onMoveToPool: (taskId: string) => void;
  onPinTask?: (task: Task) => void;
  pinnedTasks?: PinnedTask[];
}

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

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  height,
  onStartEdit,
  onUpdateTask,
  onDelete,
  onCopy,
  onColorChange,
  editingTaskId,
  setEditingTaskId,
  onMoveToPool,
  onPinTask,
  pinnedTasks = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editingTaskName, setEditingTaskName] = useState(task.name);
  const [editingStartHour, setEditingStartHour] = useState(task.startHour);
  const [editingDuration, setEditingDuration] = useState(task.duration);
  const [editingNotes, setEditingNotes] = useState(task.notes || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setEditingTaskId(null);
      }
      if (viewRef.current && !viewRef.current.contains(event.target as Node)) {
        setIsViewing(false);
      }
    };
    if (isEditing || isViewing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, isViewing, setEditingTaskId]);

  const isCompressed = task.duration <= 0.5;
  const endTime = task.startHour + Number(task.duration);
  const color = task.color || TASK_COLORS[0];

  const isTaskPinned = pinnedTasks.some(
    pinnedTask => pinnedTask.originalId === task.id
  );

  const handleSaveEdits = () => {
    if (editingTaskName.trim()) {
      onUpdateTask(task.id, {
        name: editingTaskName.trim(),
        startHour: editingStartHour,
        duration: editingDuration,
        notes: editingNotes.trim(),
      });
      setIsEditing(false);
      setEditingTaskId(null);
    }
  };

  const handleCancelEditMenu = () => {
    setIsEditing(false);
    setEditingTaskName(task.name);
    setEditingStartHour(task.startHour);
    setEditingDuration(task.duration);
    setEditingNotes(task.notes || '');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditingTaskName(task.name);
    setEditingStartHour(task.startHour);
    setEditingDuration(task.duration);
    setEditingNotes(task.notes || '');
    setIsEditing(true);
  };

  useEffect(() => {
    if (editingTaskId !== task.id) {
      setIsEditing(false);
    }
  }, [editingTaskId, task.id]);

  return (
    <>
      <div 
        className={`
          flex flex-col 
          p-1.5
          rounded-md
          ${color}
          hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-300
          transition-all duration-200
          ${isCompressed ? 'min-h-[24px]' : ''}
          h-full max-h-full relative
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 flex-grow">
          <div className="flex flex-row justify-between items-start min-w-0 draggable-area h-full gap-1 px-1.5">
            <div className="flex-grow flex flex-col min-w-0">
              <div className={`
                dark:text-white break-words
                ${isCompressed ? 'text-[8px] writing-mode-vertical-lr transform h-full flex items-center justify-center overflow-hidden leading-tight' : 'text-xs line-clamp-2'}
                font-bold
              `}
              onClick={(e) => { 
                  if (e.detail === 2) {
                      onStartEdit(task); 
                  }
              }}
              >
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

            {!isCompressed && (
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={handleEditClick}
                  title="Edit task"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
                
                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                  title="Copy task"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>

                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setIsViewing(true);
                  }}
                  title="View task details"
                >
                  <Eye className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            {isCompressed && (
              <div className="absolute bottom-0.5 right-0.5 flex justify-end" onClick={(e) => e.stopPropagation()}>
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

      {/* Edit Popup */}
      {isEditing && editingTaskId === task.id && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[1000] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-4 min-w-[300px] max-w-[400px]"
          style={{
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            maxHeight: '90vh', overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor={`editTaskNameInput-${task.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Name
              </label>
              <Input 
                id={`editTaskNameInput-${task.id}`}
                type="text" 
                value={editingTaskName}
                onChange={(e) => setEditingTaskName(e.target.value)}
                className="w-full text-sm"
                autoFocus={true}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdits();
                  if (e.key === 'Escape') handleCancelEditMenu();
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={`editStartHourInput-${task.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <select
                  id={`editStartHourInput-${task.id}`}
                  value={editingStartHour}
                  onChange={(e) => setEditingStartHour(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  {Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR }, (_, i) => {
                    const hour = TIMELINE_START_HOUR + i;
                    const period = hour < 12 ? 'AM' : 'PM';
                    const displayHour = hour % 12 || 12;
                    return (
                      <option key={hour} value={hour}>
                        {`${displayHour}:00 ${period}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor={`editDurationInput-${task.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <div 
                  className="relative group"
                  onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentIndex = DURATION_OPTIONS.findIndex(opt => opt.value === editingDuration);
                    if (e.deltaY > 0 && currentIndex < DURATION_OPTIONS.length - 1) {
                      setEditingDuration(DURATION_OPTIONS[currentIndex + 1].value);
                    } else if (e.deltaY < 0 && currentIndex > 0) {
                      setEditingDuration(DURATION_OPTIONS[currentIndex - 1].value);
                    }
                    return false;
                  }}
                >
                  <div className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white cursor-pointer">
                    {DURATION_OPTIONS.find(opt => opt.value === editingDuration)?.label}
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
              <div className="grid grid-cols-8 gap-0.5">
                {TASK_COLORS.map(colorClass => (
                  <button
                    key={`color-button-${colorClass}-${task.id}`}
                    type="button"
                    className={`w-8 h-8 rounded-md ${colorClass} hover:ring-2 ring-gray-400 transition-all ${task.color === colorClass ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onColorChange(task.id, colorClass); }}
                    title={colorClass.split(' ')[0].replace('bg-', '').replace('-200', '')}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {onPinTask && !isTaskPinned && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPinTask(task); }}
                >
                  <PinIcon className="w-4 h-4" />
                  Pin Task
                </button>
              )}
              {onPinTask && isTaskPinned && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md cursor-not-allowed">
                  <PinIcon className="w-4 h-4" />
                  Already Pinned
                </div>
              )}
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveToPool(task.id); }}
              >
                <FolderPlus className="w-4 h-4" />
                Move to Pool
              </button>
            </div>

            <div>
              <label htmlFor={`editNotesInput-${task.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id={`editNotesInput-${task.id}`}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                placeholder="Add notes..."
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="flex-1 h-9 px-4 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                onClick={handleCancelEditMenu}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 h-9 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm font-medium transition-colors"
                onClick={handleSaveEdits}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Popup */}
      {isViewing && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={viewRef}
          className="fixed z-[1000] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-3 max-w-[260px]"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">
              {task.name}
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span>{formatTime(task.startHour)} - {formatTime(task.startHour + task.duration)}</span>
              <span>•</span>
              <span>{formatDuration(task.duration)}</span>
            </div>

            {task.notes && (
              <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {task.notes}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                onClick={() => setIsViewing(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}; 