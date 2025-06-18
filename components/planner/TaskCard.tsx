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
  onResizeStart: (edge: 'start' | 'end', e: React.MouseEvent<HTMLDivElement>) => void;
  onDragStart?: (task: Task, e: React.MouseEvent<HTMLDivElement>) => void;
  currentTime?: Date; // Optional prop to check if task is in the past
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  height,
  onStartEdit,
  onCopy,
  onViewNotes,
  onResizeStart,
  onDragStart,
  currentTime,
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

  // Check if task is in the past (only for today's tasks)
  const isPastTask = currentTime ? (() => {
    const taskDate = new Date(task.baseDate);
    const today = new Date();
    const isToday = taskDate.toDateString() === today.toDateString();
    
    if (!isToday) return false; // Only apply to today's tasks
    
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
    return endTime <= currentHour;
  })() : false;

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
          ${isCompressed ? 'p-1.5' : 'p-2'}
          rounded-md
          ${color}
          border border-border/40 dark:border-gray-700
          hover:ring-1 hover:ring-border/60 dark:hover:ring-gray-300
          transition-all duration-200
          ${isCompressed ? 'min-h-[24px]' : 'min-h-[32px]'}
          h-full max-h-full relative overflow-hidden
          ${isPastTask ? 'opacity-50' : ''}
        `}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      >
        <div 
          className="resize-handle absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize group-hover:bg-blue-500/20 active:bg-blue-500/30 z-30 transition-colors"
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart('start', e); }}
        />
        
        {/* Drag handle area - middle section that doesn't cover button areas */}
        <div 
          className={`absolute left-1.5 top-0 bottom-0 cursor-grab active:cursor-grabbing z-20 ${
            isCompressed ? 'right-8' : 'right-8'
          }`}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent browser default drag behavior
            // Don't stop propagation for drag - let it bubble up
            if (onDragStart) {
              onDragStart(task, e);
            }
          }}
          onMouseEnter={() => {
          }}
          onMouseLeave={() => {
          }}
        />
        
        <div className="flex flex-col min-w-0 flex-grow relative z-10 pointer-events-none">
          <div className="flex flex-row justify-between items-start min-w-0 draggable-area h-full gap-1 relative">
            <div className="flex-grow flex flex-col min-w-0 justify-between">
              <div>
                <div className={`
                  break-words
                  ${isCompressed ? 'text-sm writing-mode-vertical-lr transform h-full flex items-center justify-center overflow-hidden leading-tight' : 'text-base line-clamp-2 leading-tight'}
                  font-bold
                  cursor-grab active:cursor-grabbing
                `}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onClick={(e) => { 
                    e.stopPropagation();
                    if (e.detail === 2) {
                        onStartEdit(task, {isNew: false}); 
                    }
                }}
                onMouseDown={(e) => {
                  // Allow dragging from the task name
                  if (e.detail === 1 && onDragStart) {
                    e.preventDefault();
                    onDragStart(task, e);
                  }
                }}
                style={{ pointerEvents: 'auto' }}
                >
                  {task.name}
                </div>
              </div>
              {!isCompressed && (
                <div className="mt-2 cursor-grab active:cursor-grabbing" 
                     onMouseDown={(e) => {
                       if (onDragStart) {
                         e.preventDefault();
                         onDragStart(task, e);
                       }
                     }}
                     style={{ pointerEvents: 'auto' }}>
                  <div className="text-sm font-medium opacity-90 leading-tight">
                    {formatTime(task.startHour)} - {formatTime(endTime)}
                  </div>
                  <div className="text-xs font-semibold mt-1 opacity-90 leading-tight">
                    {formatDuration(task.duration)}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons for non-compressed view */}
            {!isCompressed && (
              <div className="flex flex-col items-end gap-1 flex-shrink-0 relative z-40" style={{ pointerEvents: 'auto' }}>
                <button
                  type="button"
                  className="h-4 w-4 p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-sm flex items-center justify-center transition-colors relative z-50"
                  onClick={handleEditClick}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Edit task"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                
                <button
                  type="button"
                  className="h-4 w-4 p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-sm flex items-center justify-center transition-colors relative z-50"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Copy task"
                >
                  <Copy className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  className="h-4 w-4 p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded-sm flex items-center justify-center transition-colors relative z-50"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewNotes(task); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="View task details"
                >
                  <Eye className="w-3 h-3" />
                </button>
              </div>
            )}
            {/* Buttons for compressed view - Conditional styling based on duration */}
            {isCompressed && (
              task.duration <= 0.25 ? (
                // Tighter styles for 15-min tasks - Triangular formation
                <div className="absolute bottom-1 right-1 flex flex-col items-center z-50" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                  <div className="flex justify-center"> {/* Centering for the top button */}
                    <button
                      type="button"
                      className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors relative z-50"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewNotes(task); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="View task"
                    >
                      <Eye className="w-2 h-2" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-0.5 mt-0.5"> {/* Bottom row with Copy and Edit */}
                    <button
                      type="button"
                      className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors relative z-50"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="Copy task"
                    >
                      <Copy className="w-2 h-2" />
                    </button>
                    <button
                      type="button"
                      className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors relative z-50"
                      onClick={handleEditClick}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="Edit task"
                    >
                      <Edit3 className="w-2 h-2" />
                    </button>
                  </div>
                </div>
              ) : (
                // Linear (vertical) for 30-min tasks
                <div className="absolute bottom-1 right-1 flex flex-col items-end space-y-0.5 z-50" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                  <button
                    type="button"
                    className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors relative z-50"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(task); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Copy task"
                  >
                    <Copy className="w-2 h-2" />
                  </button>
                  <button
                    type="button"
                    className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors relative z-50"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewNotes(task); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="View/Edit task"
                  >
                    <Eye className="w-2 h-2" />
                  </button>
                  <button
                    type="button"
                    className="h-3 w-3 p-0 text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-sm flex items-center justify-center transition-colors relative z-50"
                    onClick={handleEditClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Edit task"
                  >
                    <Edit3 className="w-2 h-2" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
        <div 
          className="resize-handle absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize group-hover:bg-blue-500/20 active:bg-blue-500/30 z-30 transition-colors"
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart('end', e); }}
        />
      </div>
    </>
  );
};

export const MemoizedTaskCard = React.memo(TaskCard); 