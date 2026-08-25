'use client';

import { CalendarData } from '@/types/calendar';
import { useDailyPlanner } from '@/hooks/useDailyPlannerState';
import { MonthlyTimelineView } from '@/components/calendar/MonthlyTimelineView';

export function TimelineViewWrapper({ calendarData }: { calendarData: CalendarData }) {
  const {
    tasksByDate,
    poolTasks,
    pinnedTasks,
    getPoolTasksForDate,
    openEditModal,
    createPoolTask,
    handleDeleteTask,
    handleAssignTask,
    handleUnassignTask,
    handleRescheduleTask,
    handleUpdateTask,
    isClient
  } = useDailyPlanner();

  if (!isClient) return null;

  return (
    <div className="flex-1 min-h-0 h-full">
      <MonthlyTimelineView
        calendarData={calendarData}
        poolTasks={poolTasks}
        scheduledTasks={tasksByDate}
        pinnedTasks={pinnedTasks}
        onAssignTask={handleAssignTask}
        onUnassignTask={handleUnassignTask}
        onRescheduleTask={handleRescheduleTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={(task) => handleDeleteTask(task.id)}
        getPoolTasksForDate={getPoolTasksForDate}
        openEditModal={openEditModal}
        createPoolTask={createPoolTask}
        onNavigateToDaily={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}
