import React from "react";
import { Edit3, Eye } from 'lucide-react';
import { formatTime } from '@/utils/formatters';
import { Task } from '../../types/planner';
import { TASK_COLORS } from '../../lib/constants';
import { cn } from '@/lib/utils';

export interface WeeklyTaskCardProps {
  task: Task;
  height: number;
  onStartEdit: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean }) => void;
  onViewNotes: (task: Task) => void;
  currentTime?: Date;
}

export const WeeklyTaskCard: React.FC<WeeklyTaskCardProps> = ({
  task,
  height,
  onStartEdit,
  onViewNotes,
  currentTime,
}) => {
  const endTime = (task.startHour || 9) + Number(task.duration || 1);
  const color = task.color || TASK_COLORS[0];

  // Determine if we should show compact layout based on height 
  const isVeryCompact = height <= 50;
  const showDuration = task.duration > 0.5; // Only show duration for tasks longer than 30 minutes
  const isSquareFormat = height >= 50; // More square layout for weekly view
  const useSmallTimeFont = task.duration >= 1; // Use smaller font for 1+ hour tasks

  const timeLabel = `${formatTime(task.startHour || 9)}${showDuration ? ` - ${formatTime(endTime)}` : ''}`;

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartEdit(task, {isNew: false});
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewNotes(task);
  };

  return (
    <div 
      className={`
        relative
        ${color}
        border border-border/30
        hover:border-border/80
        hover:shadow-md
        transition-all duration-200
        h-full w-full
        overflow-hidden
        group
        cursor-pointer
        font-medium
        shadow-sm
        rounded-md
        ring-1 ring-black/0 dark:ring-white/0
      `}
      style={{ 
        height: `${height}px`,
        minHeight: `${height}px`,
        maxHeight: `${height}px`
      }}
      onClick={handleViewClick}
    >
      {/* Content Container */}
      <div className={`h-full ${isSquareFormat ? 'flex flex-col justify-center px-1.5 py-1' : `flex items-center ${isVeryCompact ? 'px-1' : 'px-2'}`} relative`}>
        {/* Task Text */}
        <div className="flex-1 min-w-0" title={timeLabel}>
          <div 
            className={`
              font-bold 
              ${isSquareFormat ? 'text-[13px]' : isVeryCompact ? 'text-xs' : 'text-sm'} 
              ${isSquareFormat ? 'leading-snug text-center' : 'leading-tight line-clamp-1'}
              tracking-tight
              drop-shadow-sm
            `}
            title={task.name}
          >
            {task.name}
          </div>
          

        </div>

        {/* Action Buttons - Position based on format */}
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity gap-1",
          isSquareFormat 
            ? "absolute top-1 right-1 flex" 
            : "flex items-center ml-1"
        )}>
          {task.notes && (
            <button
              onClick={handleViewClick}
              className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
              title="View notes"
            >
              <Eye className={isSquareFormat ? "w-3 h-3" : "w-3 h-3"} />
            </button>
          )}
          <button
            onClick={handleEditClick}
            className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
            title="Edit task"
          >
            <Edit3 className={isSquareFormat ? "w-3 h-3" : "w-3 h-3"} />
          </button>
        </div>
      </div>

      {/* Optional: Duration bar at bottom for visual reference */}
      {showDuration && task.duration > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20 dark:bg-white/20" />
      )}
    </div>
  );
};

export const MemoizedWeeklyTaskCard = React.memo(WeeklyTaskCard);
export default WeeklyTaskCard;