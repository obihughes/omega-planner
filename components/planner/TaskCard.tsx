import React, { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import { Edit3, Copy, Eye } from 'lucide-react';

import { formatDuration, formatTime } from '@/utils/formatters';
import { Task } from '../../types/planner';
import { TASK_COLORS } from '../../lib/constants';

export interface TaskCardProps {
  task: Task;
  height: number;
  onStartEdit: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean }) => void;
  onCopy: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  height,
  onStartEdit,
  onCopy,
}) => {
  const [isViewing, setIsViewing] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewRef.current && !viewRef.current.contains(event.target as Node)) {
        setIsViewing(false);
      }
    };
    if (isViewing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isViewing]);

  const isCompressed = task.duration <= 0.5;
  const endTime = task.startHour + Number(task.duration);
  const color = task.color || TASK_COLORS[0];

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartEdit(task, {isNew: false});
  };

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
                      onStartEdit(task, {isNew: false}); 
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

export const MemoizedTaskCard = React.memo(TaskCard); 