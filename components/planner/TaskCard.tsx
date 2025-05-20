import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import { Input } from "@/components/ui";
import { Edit3, Copy, Pin } from 'lucide-react';

import { formatDuration, formatTime } from '@/utils/formatters';
import { Task } from '../../types/planner';
import { TASK_COLORS } from '../../lib/constants';

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
}

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
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskName, setEditingTaskName] = useState(task.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsEditing(false);
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

  const isCompressed = task.duration <= 0.5;
  const endTime = task.startHour + Number(task.duration);
  const color = task.color?.includes('dark:') 
    ? task.color 
    : `${task.color || 'bg-blue-200'} dark:bg-blue-500`;

  const handleSaveName = () => {
    if (editingTaskName.trim()) {
      onUpdateTask(task.id, { name: editingTaskName.trim() });
      setIsEditing(false);
      setEditingTaskId(null);
    }
  };

  const handleCancelEditMenu = () => {
    setIsEditing(false);
    setEditingTaskName(task.name);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditingTaskName(task.name);
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
                  title="Edit task (inline)"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
                
                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                  title="Copy task to timeline"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
                {onPinTask && (
                  <button
                    type="button"
                    className="h-3.5 w-3.5 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPinTask(task);}}
                    title="Pin task"
                  >
                    <Pin className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
            {isCompressed && (
              <div className="absolute bottom-0.5 right-0.5 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="h-3 w-3 p-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100/30 dark:hover:bg-gray-600/30 rounded-sm flex items-center justify-center"
                  onClick={handleEditClick}
                  title="Edit task (inline)"
                >
                  <span className="text-[7px]">✎</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && editingTaskId === task.id && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[1000] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-3 min-w-[250px]"
          style={{
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            maxHeight: '80vh', overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor={`editTaskNameInput-${task.id}`} className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Task Name
              </label>
              <Input 
                id={`editTaskNameInput-${task.id}`}
                type="text" 
                value={editingTaskName}
                onChange={(e) => setEditingTaskName(e.target.value)}
                className="h-7 px-2 text-sm min-w-0 dark:bg-gray-800 dark:text-white"
                autoFocus={true}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEditMenu();
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Color
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {TASK_COLORS.map(colorClass => (
                  <button
                    key={`color-button-${colorClass}-${task.id}`} type="button"
                    className={`w-6 h-6 rounded-full ${colorClass} hover:ring-2 ring-gray-400 transition-all ${task.color === colorClass ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onColorChange(task.id, colorClass); }}
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
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); setIsEditing(false); }}
                >
                  Copy Task
                </button>
                <button
                  type="button"
                  className="flex-1 h-8 px-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/50 text-sm font-medium transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveToPool(task.id); setIsEditing(false); }}
                >
                  Copy to Pool
                </button>
                <button
                  type="button"
                  className="flex-1 h-8 px-3 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-sm font-medium transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task.id); setIsEditing(false);}}
                >
                  Delete
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 h-8 px-3 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
                  onClick={handleCancelEditMenu}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 h-8 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm font-medium transition-colors"
                  onClick={handleSaveName}
                >
                  Save Name
                </button>
              </div>
                 <button
                    type="button"
                    className="w-full mt-1 h-8 px-3 bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-sm font-medium transition-colors"
                  onClick={() => {
                        onStartEdit(task); 
                      setIsEditing(false);
                  }}
                >
                    Open Full Edit Modal
                </button>
              </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
}; 