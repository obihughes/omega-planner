import React, { useMemo } from "react";
import { Edit3, Eye } from 'lucide-react';
import { formatTime } from '@/utils/formatters';
import { Task } from '../../types/planner';
import { TASK_COLORS } from '../../lib/constants';
import { cn } from '@/lib/utils';

export interface WeeklyTaskCardProps {
  task: Task;
  height: number;
  width?: number;
  onStartEdit: (task: Task, options?: { isNew?: boolean, isFromPool?: boolean }) => void;
  onViewNotes: (task: Task) => void;
  currentTime?: Date;
}

function truncateWithDot(text: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  if (text.length <= maxChars) return text;
  if (maxChars === 1) return '.';
  return `${text.slice(0, maxChars - 1)}.`;
}

function getWeeklyTextLayout(width: number) {
  if (width <= 35) {
    return {
      fontClass: 'text-[8px]',
      paddingClass: 'px-0.5',
      maxChars: Math.max(1, Math.floor((width - 4) / 4.2)),
    };
  }
  if (width <= 50) {
    return {
      fontClass: 'text-[9px]',
      paddingClass: 'px-0.5',
      maxChars: Math.max(2, Math.floor((width - 4) / 4.8)),
    };
  }
  if (width <= 70) {
    return {
      fontClass: 'text-[10px]',
      paddingClass: 'px-1',
      maxChars: Math.max(3, Math.floor((width - 8) / 5.2)),
    };
  }
  if (width <= 100) {
    return {
      fontClass: 'text-[11px]',
      paddingClass: 'px-1',
      maxChars: Math.max(4, Math.floor((width - 8) / 5.8)),
    };
  }
  return {
    fontClass: 'text-[13px]',
    paddingClass: 'px-1.5',
    maxChars: Math.max(6, Math.floor((width - 12) / 7)),
  };
}

export const WeeklyTaskCard: React.FC<WeeklyTaskCardProps> = ({
  task,
  height,
  width,
  onStartEdit,
  onViewNotes,
  currentTime,
}) => {
  const endTime = task.startHour + Number(task.duration);
  const color = task.color || TASK_COLORS[0];

  // Determine if we should show compact layout based on height 
  const isVeryCompact = height <= 50;
  const showDuration = task.duration > 0.5; // Only show duration for tasks longer than 30 minutes
  const isSquareFormat = height >= 50; // More square layout for weekly view
  const useSmallTimeFont = task.duration >= 1; // Use smaller font for 1+ hour tasks
  const textLayout = useMemo(
    () => (typeof width === 'number' ? getWeeklyTextLayout(width) : null),
    [width]
  );
  const displayName = useMemo(() => {
    if (!textLayout) return task.name;
    return truncateWithDot(task.name, textLayout.maxChars);
  }, [task.name, textLayout]);

  const timeLabel = `${formatTime(task.startHour)}${showDuration ? ` - ${formatTime(endTime)}` : ''}`;

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
      <div className={cn(
        'h-full relative',
        textLayout
          ? `flex items-center ${textLayout.paddingClass}`
          : isSquareFormat
            ? 'flex flex-col justify-center px-1.5 py-1'
            : `flex items-center ${isVeryCompact ? 'px-1' : 'px-2'}`
      )}>
        {/* Task Text */}
        <div className="flex-1 min-w-0" title={timeLabel}>
          <div 
            className={cn(
              'font-bold tracking-tight drop-shadow-sm whitespace-nowrap overflow-hidden',
              textLayout
                ? `${textLayout.fontClass} leading-none`
                : isSquareFormat
                  ? 'text-[13px] leading-snug text-center'
                  : isVeryCompact
                    ? 'text-xs leading-tight line-clamp-1'
                    : 'text-sm leading-tight line-clamp-1'
            )}
            title={task.name}
          >
            {displayName}
          </div>
          

        </div>

        {/* Action Buttons - Position based on format */}
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10",
          "absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-white/50 dark:bg-black/50 rounded backdrop-blur-[2px] px-0.5 py-0.5"
        )}>
          {task.notes && (
            <button
              onClick={handleViewClick}
              className="p-0.5 hover:bg-black/20 dark:hover:bg-white/20 rounded transition-colors"
              title="View notes"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={handleEditClick}
            className="p-0.5 hover:bg-black/20 dark:hover:bg-white/20 rounded transition-colors"
            title="Edit task"
          >
            <Edit3 className="w-3 h-3" />
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