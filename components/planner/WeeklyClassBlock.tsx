'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/formatters';

export interface WeeklyClassBlockProps {
  /** Class name, e.g. "Math 101" */
  name: string;
  /** Tailwind background class from the class schedule (e.g. "bg-blue-500") */
  color: string;
  /** Full class start hour (decimal), used for the time label */
  startHour: number;
  /** Full class end hour (decimal), used for the time label */
  endHour: number;
  /** Rendered width in px (already clipped to the AM/PM row) */
  width: number;
  /** Rendered height in px */
  height: number;
}

/**
 * Dulled, read-only class block drawn behind planner tasks on the Weekly View.
 * Non-interactive (`pointer-events-none`) so double-click-to-create and task
 * drag/resize on the timeline are unaffected.
 */
export const WeeklyClassBlock: React.FC<WeeklyClassBlockProps> = ({
  name,
  color,
  startHour,
  endHour,
  width,
  height,
}) => {
  return (
    <div
      className="relative h-full w-full rounded-md border border-dashed border-border/60 overflow-hidden pointer-events-none select-none"
      style={{ width: `${width}px`, height: `${height}px` }}
      title={`Class: ${name} (${formatTime(startHour)} - ${formatTime(endHour)})`}
      aria-hidden="true"
    >
      {/* Color layer is faded so the class reads as background context */}
      <div className={cn('absolute inset-0 opacity-35', color)} />
      <div className="relative flex flex-col justify-center h-full px-2 leading-tight">
        <span className="text-[11px] font-medium text-muted-foreground truncate">{name}</span>
        <span className="text-[10px] text-muted-foreground/80 truncate">
          {formatTime(startHour)} - {formatTime(endHour)}
        </span>
      </div>
    </div>
  );
};

export default WeeklyClassBlock;
