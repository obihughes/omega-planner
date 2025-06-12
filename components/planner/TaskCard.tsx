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
  onViewNotes: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  height,
  onStartEdit,
  onCopy,
  onViewNotes,
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
          border border-border/40 dark:border-gray-700
          hover:ring-1 hover:ring-border/60 dark:hover:ring-gray-300
          transition-all duration-200
          ${isCompressed ? 'min-h-[24px]' : ''}
          h-full max-h-full relative overflow-hidden
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 flex-grow">
          <div className="flex flex-row justify-between items-start min-w-0 draggable-area h-full gap-1 relative">
            <div className="flex-grow flex flex-col min-w-0 justify-between">
              <div>
                <div className={`
                  text-foreground break-words
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
              </div>
              {!isCompressed && (
                <div className="mt-1">
                  <div className="text-[9px] text-muted-foreground font-medium">
                    {formatTime(task.startHour)} - {formatTime(endTime)}
                  </div>
                  <div className="text-[8px] text-muted-foreground font-semibold mt-px mb-0.5">
                    {formatDuration(task.duration)}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons for non-compressed view */}
            {!isCompressed && (
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                  onClick={handleEditClick}
                  title="Edit task"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
                
                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                  title="Copy task"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>

                <button
                  type="button"
                  className="h-3.5 w-3.5 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewNotes(task); }}
                  title="View task details"
                >
                  <Eye className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            {/* Buttons for compressed view - Conditional styling based on duration */}
            {isCompressed && (
              task.duration <= 0.25 ? (
                // Tighter styles for 15-min tasks - Triangular formation
                <div className="absolute bottom-px right-0 flex flex-col items-center z-10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center"> {/* Centering for the top button */}
                    <button
                      type="button"
                      className="h-2.5 w-2.5 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewNotes(task); }}
                      title="View task"
                    >
                      <Eye className="w-1.5 h-1.5" /> {/* Adjusted icon size */}
                    </button>
                  </div>
                  <div className="flex items-center space-x-px mt-px"> {/* Bottom row with Copy and Edit, added small top margin */}
                    <button
                      type="button"
                      className="h-2.5 w-2.5 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                      title="Copy task"
                    >
                      <Copy className="w-1.5 h-1.5" /> {/* Adjusted icon size */}
                    </button>
                    <button
                      type="button"
                      className="h-2.5 w-2.5 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                      onClick={handleEditClick}
                      title="Edit task"
                    >
                      <Edit3 className="w-1.5 h-1.5" /> {/* Adjusted icon size */}
                    </button>
                  </div>
                </div>
              ) : (
                // Slightly larger styles for 30-min tasks - Reverting to horizontal row
                <div className="absolute bottom-0.5 right-0.5 flex items-center space-x-0.5 p-0.5 z-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                    title="Copy task"
                  >
                    <Copy className="w-1.5 h-1.5" />
                  </button>
                  <button
                    type="button"
                    className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewNotes(task); }}
                    title="View/Edit task"
                  >
                    <Eye className="w-1.5 h-1.5" />
                  </button>
                  <button
                    type="button"
                    className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors"
                    onClick={handleEditClick}
                    title="Edit task"
                  >
                    <Edit3 className="w-1.5 h-1.5" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const MemoizedTaskCard = React.memo(TaskCard); 