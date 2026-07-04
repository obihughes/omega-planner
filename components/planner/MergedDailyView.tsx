'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Task, PinnedTask } from '@/types/planner';
import { SchedulingSidebar } from './SchedulingSidebar';
import { getCalendarDateForColumn, dateFromDateKey, getDateKey } from '@/utils/dateUtils';
import { PIXELS_PER_HOUR, TIMELINE_COLUMN_HEIGHT } from '@/lib/constants';

/** Each timeline period (night/morning/afternoon/evening) spans 6 hours */
const PERIOD_HOURS = 6;
const MIN_PIXELS_PER_HOUR = 40;
const MIN_COLUMN_HEIGHT_PX = 72;

export interface MergedDailyViewRenderOptions {
  deleteMode: boolean;
  pixelsPerHour: number;
  columnHeightPx: number;
}

export interface MergedDailyViewProps {
  poolTasks: Task[];
  scheduledTasks: Map<string, Task[]>;
  pinnedTasks: PinnedTask[];
  topDayOffset: number;
  setTopDayOffset: (offset: number) => void;
  onAssignTask: (task: Task, date: Date, startHour?: number) => void;
  onUnassignTask: (task: Task) => void;
  onRescheduleTask: (task: Task, newDate: Date) => void;
  onDeleteTask: (task: Task) => void;
  getPoolTasksForDate: (dateKey: string) => Task[];
  openEditModal: (
    task?: Task,
    options?: {
      isFromPool?: boolean;
      initialDayOffset?: number;
      initialStartHour?: number;
      isNew?: boolean;
      targetDate?: Date;
    }
  ) => void;
  onDropFromPool?: (task: Task, targetDate: Date, startHour: number) => void;
  savedDays: Array<{ id: string; name: string; dateKey: string; createdAt: string }>;
  applySavedDay: (savedDayId: string, targetDateKey: string, replace: boolean) => void;
  children: (options: MergedDailyViewRenderOptions) => React.ReactNode;
}

export function MergedDailyView({
  poolTasks,
  scheduledTasks,
  pinnedTasks,
  topDayOffset,
  setTopDayOffset,
  onAssignTask,
  onUnassignTask,
  onRescheduleTask,
  onDeleteTask,
  getPoolTasksForDate,
  openEditModal,
  onDropFromPool,
  savedDays,
  applySavedDay,
  children,
}: MergedDailyViewProps) {
  const [deleteMode, setDeleteMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [timelineScale, setTimelineScale] = useState({
    pixelsPerHour: PIXELS_PER_HOUR,
    columnHeightPx: TIMELINE_COLUMN_HEIGHT,
  });

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const updateScale = () => {
      const availableWidth = contentEl.clientWidth;
      if (availableWidth <= 0) return;

      const rawPixelsPerHour = Math.floor(availableWidth / PERIOD_HOURS);
      const pixelsPerHour = Math.max(
        MIN_PIXELS_PER_HOUR,
        Math.min(PIXELS_PER_HOUR, rawPixelsPerHour)
      );
      const scale = pixelsPerHour / PIXELS_PER_HOUR;
      const columnHeightPx = Math.max(
        MIN_COLUMN_HEIGHT_PX,
        Math.round(TIMELINE_COLUMN_HEIGHT * scale)
      );

      setTimelineScale((prev) =>
        prev.pixelsPerHour === pixelsPerHour && prev.columnHeightPx === columnHeightPx
          ? prev
          : { pixelsPerHour, columnHeightPx }
      );
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, []);

  const selectedDate = useMemo(
    () => dateFromDateKey(getCalendarDateForColumn(topDayOffset)),
    [topDayOffset]
  );

  const handleSelectedDateChange = useCallback(
    (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);
      const dayOffset = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setTopDayOffset(dayOffset);
    },
    [setTopDayOffset]
  );

  const handleClearDay = useCallback(() => {
    const key = getDateKey(selectedDate);
    const tasks = scheduledTasks.get(key) || [];
    tasks.forEach((task) => onDeleteTask(task));
  }, [selectedDate, scheduledTasks, onDeleteTask]);

  const handleApplySavedDay = useCallback(
    (savedDayId: string, replace: boolean) => {
      applySavedDay(savedDayId, getCalendarDateForColumn(topDayOffset), replace);
    },
    [applySavedDay, topDayOffset]
  );

  return (
    <div className="flex flex-1 min-h-0 bg-background overflow-hidden">
      <SchedulingSidebar
        poolTasks={poolTasks}
        scheduledTasks={scheduledTasks}
        pinnedTasks={pinnedTasks}
        selectedDate={selectedDate}
        onSelectedDateChange={handleSelectedDateChange}
        onAssignTask={onAssignTask}
        onUnassignTask={onUnassignTask}
        onRescheduleTask={onRescheduleTask}
        onDeleteTask={onDeleteTask}
        getPoolTasksForDate={getPoolTasksForDate}
        openEditModal={openEditModal}
        onDropFromPool={onDropFromPool}
        deleteMode={deleteMode}
        onDeleteModeChange={setDeleteMode}
        onClearDay={handleClearDay}
        savedDays={savedDays}
        onApplySavedDay={handleApplySavedDay}
      />

      <div
        ref={contentRef}
        className="flex-1 min-h-0 min-w-0 overflow-y-scroll overflow-x-hidden pl-3 pt-3 pb-3 pr-0 scrollbar-overlay"
      >
        {children({ deleteMode, ...timelineScale })}
      </div>
    </div>
  );
}
