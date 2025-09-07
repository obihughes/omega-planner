'use client';

import React, { useMemo } from 'react';
import { Task } from '@/types/planner';
import { MemoizedTaskCard } from './TaskCard';
import {
    TIMELINE_START_HOUR,
    TIMELINE_END_HOUR,
    TIMELINE_SPLIT_HOUR_1,
    TIMELINE_SPLIT_HOUR_2,
    TIMELINE_SPLIT_HOUR_3,
    PIXELS_PER_HOUR,
    TASK_COLORS,
    DEFAULT_TASK_COLOR_INDEX
} from '@/lib/constants';
import { getDateKey } from '@/utils/dateUtils';
import { formatTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Clock, Calendar } from 'lucide-react';

interface MiniDailyTimelineProps {
  selectedDate: Date;
  tasksByDate: Map<string, Task[]>;
  onTaskClick: (task: Task, isScheduled: boolean) => void;
  onDeleteTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updatedFields: Partial<Task>) => void;
  openEditModal: (task?: Task, options?: { isFromPool?: boolean; initialDayOffset?: number; initialStartHour?: number; isNew?: boolean; targetDate?: Date }) => void;
}

export function MiniDailyTimeline({
  selectedDate,
  tasksByDate,
  onTaskClick,
  onDeleteTask,
  onUpdateTask,
  openEditModal
}: MiniDailyTimelineProps) {
  const dateKey = getDateKey(selectedDate);
  const tasksForDate = tasksByDate.get(dateKey) || [];
  
  // Separate scheduled and unscheduled tasks
  const scheduledTasks = tasksForDate.filter(t => t.startHour !== undefined && t.startHour > 0);
  const unscheduledTasks = tasksForDate.filter(t => t.startHour === undefined || t.startHour === 0);
  
  // Timeline periods configuration
  const periods = [
    { name: 'Morning', start: TIMELINE_START_HOUR, end: TIMELINE_SPLIT_HOUR_1, color: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Afternoon', start: TIMELINE_SPLIT_HOUR_1, end: TIMELINE_SPLIT_HOUR_2, color: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Evening', start: TIMELINE_SPLIT_HOUR_2, end: TIMELINE_END_HOUR, color: 'bg-purple-50 dark:bg-purple-900/20' }
  ];
  
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const currentHour = new Date().getHours();
  
  const handleDoubleClick = (hour: number) => {
    const newTask: Task = {
      id: `temp-new-task-${Date.now()}`,
      name: "New Task",
      startHour: hour,
      duration: 1,
      baseDate: dateKey,
      color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX],
      notes: "",
      completed: false,
    };
    openEditModal(newTask, { isNew: true, isFromPool: false, targetDate: selectedDate });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Daily Timeline
          </h3>
          {isToday && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Now: {formatTime(currentHour)}</span>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {scheduledTasks.length} scheduled • {unscheduledTasks.length} unscheduled
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Unscheduled Tasks Section */}
        {unscheduledTasks.length > 0 && (
          <div className="p-3 border-b border-border bg-orange-50/50 dark:bg-orange-900/10">
            <h4 className="text-xs font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Unscheduled ({unscheduledTasks.length})
            </h4>
            <div className="space-y-1">
              {unscheduledTasks.map(task => (
                <div
                  key={task.id}
                  className="p-2 bg-card border border-orange-200 dark:border-orange-800 rounded text-xs cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  onClick={() => onTaskClick(task, false)}
                >
                  <div className="font-medium">{task.name}</div>
                  <div className="text-muted-foreground">{task.duration}h</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Periods */}
        <div className="flex-1">
          {periods.map(period => {
            const periodTasks = scheduledTasks.filter(t => 
              t.startHour >= period.start && t.startHour < period.end
            );
            
            const hours = Array.from(
              { length: period.end - period.start }, 
              (_, i) => period.start + i
            );

            return (
              <div key={period.name} className={cn("border-b border-border", period.color)}>
                {/* Period Header */}
                <div className="p-2 border-b border-border/50">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {period.name} ({formatTime(period.start)} - {formatTime(period.end)})
                  </h4>
                </div>

                {/* Hours Grid */}
                <div className="relative">
                  {hours.map(hour => {
                    const hourTasks = periodTasks.filter(t => 
                      Math.floor(t.startHour) === hour
                    );
                    
                    const isCurrentHour = isToday && currentHour === hour;

                    return (
                      <div
                        key={hour}
                        className={cn(
                          "relative border-b border-border/30 min-h-[40px] p-2 cursor-pointer hover:bg-accent/30",
                          isCurrentHour && "bg-primary/10 border-primary/30"
                        )}
                        onDoubleClick={() => handleDoubleClick(hour)}
                        title={`Double-click to add task at ${formatTime(hour)}`}
                      >
                        {/* Hour Label */}
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-xs font-medium",
                            isCurrentHour ? "text-primary" : "text-muted-foreground"
                          )}>
                            {formatTime(hour)}
                          </span>
                          {isCurrentHour && (
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          )}
                        </div>

                        {/* Tasks for this hour */}
                        {hourTasks.length > 0 && (
                          <div className="space-y-1">
                            {hourTasks.map(task => (
                              <div
                                key={task.id}
                                className="p-1.5 bg-card border border-border rounded text-xs cursor-pointer hover:shadow-sm"
                                onClick={() => onTaskClick(task, true)}
                                style={{ 
                                  borderLeftColor: task.color || TASK_COLORS[DEFAULT_TASK_COLOR_INDEX],
                                  borderLeftWidth: '3px'
                                }}
                              >
                                <div className="font-medium line-clamp-1">{task.name}</div>
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-2 h-2" />
                                  <span>{formatTime(task.startHour)} • {task.duration}h</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Empty hour indicator */}
                        {hourTasks.length === 0 && (
                          <div className="text-xs text-muted-foreground/50 italic">
                            Available
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {scheduledTasks.length === 0 && unscheduledTasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <h4 className="font-medium mb-1">No tasks for this day</h4>
              <p className="text-xs">Double-click on a time slot to add a task</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
