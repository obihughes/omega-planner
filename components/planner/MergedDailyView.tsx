'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Task, PinnedTask } from '@/types/planner';
import { SchedulingSidebar } from './SchedulingSidebar';
import { getCalendarDateForColumn, dateFromDateKey, getDateKey } from '@/utils/dateUtils';

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
  children: (options: { deleteMode: boolean }) => React.ReactNode;
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
    <div className="h-[calc(100vh-8rem)] min-h-[600px] flex bg-background overflow-hidden">
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

      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3">
        {children({ deleteMode })}
      </div>
    </div>
  );
}
