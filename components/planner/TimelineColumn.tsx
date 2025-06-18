"use client";

import React from 'react';
import { Task } from '../../types/planner';
import { MemoizedTaskCard } from './TaskCard';
import {
    TIMELINE_START_HOUR,
    TIMELINE_END_HOUR,
    TIMELINE_SPLIT_HOUR_1,
    TIMELINE_SPLIT_HOUR_2,
    PIXELS_PER_HOUR,
    TIMELINE_COLUMN_HEIGHT,
    GRID_LINE_STYLE,
    DEFAULT_TASK_COLOR_INDEX,
    TASK_COLORS
} from '../../lib/constants';
import { getCalendarDateForColumn, getDateWithoutTime, isSameCalendarDate, getDateKey } from '../../utils/dateUtils';
import { formatTime } from '@/utils/formatters';

interface TimelineColumnProps {
    dayOffset: number;
    period: 'morning' | 'afternoon' | 'evening';
    tasksByDate: Map<string, Task[]>;
    draggingTask: any;
    resizingTask: any;
    copyingTaskData: any;
    targetCopyDayOffset: number | null;
    currentTimeForMarker: Date;
    handleDropCopy: (targetDate: Date, startHour: number) => void;
    openEditModal: (task: Task, options: { isNew: boolean; isFromPool: boolean }) => void;
    setTargetCopyDayOffset: (offset: number | null) => void;
    lastDoubleClickTimestampRef: React.MutableRefObject<number>;
    handleDragStart: (task: Task, e: React.MouseEvent) => void;
}

export const TimelineColumn: React.FC<TimelineColumnProps> = ({
    dayOffset,
    period,
    tasksByDate,
    draggingTask,
    resizingTask,
    copyingTaskData,
    targetCopyDayOffset,
    currentTimeForMarker,
    handleDropCopy,
    openEditModal,
    setTargetCopyDayOffset,
    lastDoubleClickTimestampRef,
    handleDragStart
}) => {
    let startHour, endHour;
    switch (period) {
        case 'morning': startHour = TIMELINE_START_HOUR; endHour = TIMELINE_SPLIT_HOUR_1; break;
        case 'afternoon': startHour = TIMELINE_SPLIT_HOUR_1; endHour = TIMELINE_SPLIT_HOUR_2; break;
        case 'evening': startHour = TIMELINE_SPLIT_HOUR_2; endHour = TIMELINE_END_HOUR; break;
    }

    const columnCalendarDate = getCalendarDateForColumn(dayOffset);
    const dateKey = getDateKey(columnCalendarDate);
    const tasksForThisColumnDate = tasksByDate.get(dateKey) || [];

    const tasksToRender = tasksForThisColumnDate.filter(t => {
        if (draggingTask && draggingTask.task.id === t.id) {
            const draggingTaskTargetDate = getDateWithoutTime(draggingTask.task.baseDate);
            return isSameCalendarDate(draggingTaskTargetDate, columnCalendarDate);
        }
        return true;
    }).filter(t => {
        const taskToConsider = (draggingTask && draggingTask.task.id === t.id) ? draggingTask.task : t;
        return (
            (taskToConsider.startHour >= startHour && taskToConsider.startHour < endHour) ||
            (taskToConsider.startHour < startHour && taskToConsider.startHour + taskToConsider.duration > startHour)
        );
    });

    const columnHeight = TIMELINE_COLUMN_HEIGHT;
    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;

    let currentTimeMarker = null;
    if (dayOffset === 0) {
        const now = currentTimeForMarker;
        const currentHourFloat = now.getHours() + now.getMinutes() / 60;
        if (currentHourFloat >= startHour && currentHourFloat < endHour) {
            const markerLeft = (currentHourFloat - startHour) * PIXELS_PER_HOUR;
            currentTimeMarker = (
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[120] pointer-events-none"
                    style={{ left: `${markerLeft}px` }}
                    title={`Current time: ${formatTime(currentHourFloat)}`}
                >
                    <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '6px solid #ef4444' }} />
                </div>
            );
        }
    }

    const handleTimelineSingleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!copyingTaskData) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        const hourInBlock = (clickXrelative / PIXELS_PER_HOUR);
        const calculatedNewStartHour = startHour + hourInBlock;
        const snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;
        const targetDate = getCalendarDateForColumn(dayOffset);
        handleDropCopy(targetDate, snappedNewStartHour);
    };

    const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.detail !== 2 || copyingTaskData) return;
        
        const now = Date.now();
        if (now - lastDoubleClickTimestampRef.current < 2000) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        const hourInBlock = (clickXrelative / PIXELS_PER_HOUR);
        const calculatedNewStartHour = startHour + hourInBlock;
        let snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;
        snappedNewStartHour = Math.max(TIMELINE_START_HOUR, Math.min(snappedNewStartHour, TIMELINE_END_HOUR - 1));
        
        const targetDate = getCalendarDateForColumn(dayOffset);
        const newTaskDefaults: Task = {
            id: `temp-new-task-${now}`,
            name: "New Task",
            startHour: snappedNewStartHour,
            duration: 1,
            baseDate: targetDate.toISOString(),
            color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX],
            notes: "",
            completed: false,
        };
        openEditModal(newTaskDefaults, { isNew: true, isFromPool: false });
        lastDoubleClickTimestampRef.current = now;
    };

    const renderTimelineHeader = () => {
        const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
        return (
            <div className="flex h-8 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-card z-20">
                {timelineHours.map((hour) => (
                    <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground pt-1 pl-0.5 border-l border-gray-200 dark:border-gray-700" style={{ width: `${PIXELS_PER_HOUR}px` }}>
                        {formatTime(hour)}
                    </div>
                ))}
                <div key={`timeline-end-marker-${period}`} className="flex-none border-l-2 border-gray-200 dark:border-gray-700" style={{ width: `2px` }}></div>
            </div>
        );
    };

    return (
        <div className={`w-full transition-colors duration-200 relative ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
            <div
                className={`relative border border-gray-200 dark:border-gray-700 rounded-md`}
                style={{ width: `${PIXELS_PER_HOUR * (endHour - startHour)}px`, minWidth: '100%', height: `${columnHeight}px`, overflow: 'hidden' }}
                data-section-period={period}
                data-day-offset={dayOffset}
                onClick={handleTimelineSingleClick}
                onDoubleClick={handleTimelineDoubleClick}
                onMouseEnter={() => setTargetCopyDayOffset(copyingTaskData ? dayOffset : null)}
            >
                {renderTimelineHeader()}
                <div
                    className={`relative h-full bg-background ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/30 cursor-copy' : 'cursor-pointer'}`}
                    data-testid={`timeline-area-${dayOffset}-${period}`}
                >
                    {isTargetCopyDay && <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold text-lg">Click to paste task</div>}
                    {currentTimeMarker}
                    {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                        <div key={`grid-${i}-${dayOffset}-${period}`} className={`border-l ${GRID_LINE_STYLE}`} style={{ left: `${i * PIXELS_PER_HOUR}px`, height: '100%', top: 0, position: 'absolute' }} />
                    ))}
                    {tasksToRender.map((task) => {
                        let displayTask = (draggingTask?.task.id === task.id) ? draggingTask.task : task;
                        if (resizingTask?.task.id === task.id) {
                            displayTask = resizingTask.task;
                        }
                        
                        let colorIndex = 0;
                        if (displayTask.id) {
                            const numericIdPart = parseInt(displayTask.id.replace(/[^0-9]/g, ''), 10);
                            if (!isNaN(numericIdPart)) {
                                colorIndex = numericIdPart;
                            }
                        }
                        
                        return (
                            <div
                                key={displayTask.id}
                                onMouseDown={(e) => {
                                    handleDragStart(task, e); 
                                }}
                                style={{
                                    position: 'absolute',
                                    left: `${(displayTask.startHour - startHour) * PIXELS_PER_HOUR}px`,
                                    width: `${displayTask.duration * PIXELS_PER_HOUR}px`,
                                    height: '100%',
                                    top: 0,
                                }}
                            >
                                <MemoizedTaskCard
                                    task={displayTask}
                                    onStartEdit={(task, options) => {
                                        const modalOptions = {
                                            isNew: options?.isNew ?? false,
                                            isFromPool: options?.isFromPool ?? false,
                                        };
                                        openEditModal(task, modalOptions);
                                    }}
                                    onCopy={() => {}}
                                    onViewNotes={() => {}}
                                    onResizeStart={() => {}}
                                    height={100} 
                                    currentTime={currentTimeForMarker}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}; 