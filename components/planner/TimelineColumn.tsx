"use client";

import React from 'react';
import { Task } from '../../types/planner';
import { MemoizedTaskCard } from './TaskCard';
import {
    TIMELINE_START_HOUR,
    TIMELINE_END_HOUR,
    TIMELINE_SPLIT_HOUR_1,
    TIMELINE_SPLIT_HOUR_2,
    TIMELINE_SPLIT_HOUR_3,
    PIXELS_PER_HOUR,
    TIMELINE_COLUMN_HEIGHT,
    GRID_LINE_STYLE,
    DEFAULT_TASK_COLOR_INDEX,
    TASK_COLORS
} from '../../lib/constants';
import { getCalendarDateForColumn, getDateWithoutTime, isSameCalendarDate, dateFromDateKey } from '../../utils/dateUtils';
import { formatTime } from '@/utils/formatters';

interface TimelineColumnProps {
    dayOffset: number;
    period: 'night' | 'morning' | 'afternoon' | 'evening';
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
    /** Optional horizontal density override (px per hour). Defaults to PIXELS_PER_HOUR */
    pixelsPerHour?: number;
    /** Optional column height override. Defaults to TIMELINE_COLUMN_HEIGHT */
    columnHeightPx?: number;
    /** If true, column will stretch to container width (minWidth:100%). Defaults to true */
    fillWidth?: boolean;
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
    handleDragStart,
    pixelsPerHour,
    columnHeightPx,
    fillWidth = true
}) => {
    let startHour, endHour;
    switch (period) {
        case 'night': startHour = TIMELINE_START_HOUR; endHour = TIMELINE_SPLIT_HOUR_1; break;
        case 'morning': startHour = TIMELINE_SPLIT_HOUR_1; endHour = TIMELINE_SPLIT_HOUR_2; break;
        case 'afternoon': startHour = TIMELINE_SPLIT_HOUR_2; endHour = TIMELINE_SPLIT_HOUR_3; break;
        case 'evening': startHour = TIMELINE_SPLIT_HOUR_3; endHour = TIMELINE_END_HOUR; break;
    }

    const columnCalendarDateKey = getCalendarDateForColumn(dayOffset);
    const tasksForThisColumnDate = tasksByDate.get(columnCalendarDateKey) || [];

    // Filter out the original instance of the task if it's being dragged from this column
    const tasksWithoutDraggingOne = tasksForThisColumnDate.filter(t => {
        if (draggingTask && draggingTask.task.id === t.id) {
            return false; // Exclude it, we'll render the preview from draggingTask state
        }
        return true;
    });

    // Create a mutable list of tasks to render
    const tasksToRenderInColumn = [...tasksWithoutDraggingOne];

    // If the task being dragged is over THIS column, add its preview to the render list
    if (draggingTask && draggingTask.task.baseDate === columnCalendarDateKey) {
        tasksToRenderInColumn.push(draggingTask.task);
    }
    
    // Now, filter this combined list for the correct time period (morning, afternoon, etc.)
    const finalTasksToRender = tasksToRenderInColumn.filter((t): t is Task & { startHour: number } => {
        if (t.startHour === undefined) return false; // Only scheduled tasks render in timeline grid
        const taskStart = t.startHour as number;
        const taskEnd = taskStart + t.duration;
        return (
            (taskStart >= startHour && taskStart < endHour) ||
            (taskStart < startHour && taskEnd > startHour)
        );
    });

    const pixelsPerHourEffective = pixelsPerHour ?? PIXELS_PER_HOUR;
    const columnHeight = columnHeightPx ?? TIMELINE_COLUMN_HEIGHT;
    const isTargetCopyDay = copyingTaskData && targetCopyDayOffset === dayOffset;

    let currentTimeMarker = null;
    if (dayOffset === 0) {
        const now = currentTimeForMarker;
        const currentHourFloat = now.getHours() + now.getMinutes() / 60;
        if (currentHourFloat >= startHour && currentHourFloat < endHour) {
            const markerLeft = (currentHourFloat - startHour) * pixelsPerHourEffective;
            currentTimeMarker = (
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-[120] pointer-events-none"
                    style={{ left: `${markerLeft}px` }}
                    title={`Current time: ${formatTime(currentHourFloat)}`}
                >
                    <div style={{ 
                        position: 'absolute',
                        top: '0px',
                        left: '-3.75px',
                        width: '0', 
                        height: '0', 
                        borderLeft: '4px solid transparent', 
                        borderRight: '4px solid transparent', 
                        borderTop: '6px solid #ef4444' 
                    }} />
                </div>
            );
        }
    }

    const handleTimelineSingleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!copyingTaskData) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        const hourInBlock = (clickXrelative / pixelsPerHourEffective);
        const calculatedNewStartHour = startHour + hourInBlock;
        const snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;
        const targetDateKey = getCalendarDateForColumn(dayOffset);
        const targetDate = dateFromDateKey(targetDateKey);
        handleDropCopy(targetDate, snappedNewStartHour);
    };

    const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.detail !== 2 || copyingTaskData) return;
        
        const now = Date.now();
        if (now - lastDoubleClickTimestampRef.current < 2000) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        const hourInBlock = (clickXrelative / pixelsPerHourEffective);
        const calculatedNewStartHour = startHour + hourInBlock;
        let snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;
        snappedNewStartHour = Math.max(TIMELINE_START_HOUR, Math.min(snappedNewStartHour, TIMELINE_END_HOUR - 1));
        
        const targetDateKey = getCalendarDateForColumn(dayOffset);
        const newTaskDefaults: Task = {
            id: `temp-new-task-${now}`,
            name: "New Task",
            startHour: snappedNewStartHour,
            duration: 1,
            baseDate: targetDateKey,
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
                    <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground pt-1 pl-0.5 border-l border-gray-200 dark:border-gray-700" style={{ width: `${pixelsPerHourEffective}px` }}>
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
                className={`relative border border-gray-200 dark:border-gray-700 rounded-md flex flex-col`}
                style={{ width: `${pixelsPerHourEffective * (endHour - startHour)}px`, minWidth: fillWidth ? '100%' : undefined, height: `${columnHeight}px`, overflow: 'hidden' }}
                data-section-period={period}
                data-day-offset={dayOffset}
                onClick={handleTimelineSingleClick}
                onDoubleClick={handleTimelineDoubleClick}
                onMouseEnter={() => setTargetCopyDayOffset(copyingTaskData ? dayOffset : null)}
            >
                {renderTimelineHeader()}
                <div
                    className={`relative flex-grow bg-background ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/30 cursor-copy' : 'cursor-pointer'}`}
                    data-testid={`timeline-area-${dayOffset}-${period}`}
                >
                    {isTargetCopyDay && <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold text-lg">Click to paste task</div>}
                    {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                        <div key={`grid-${i}-${dayOffset}-${period}`} className={`border-l ${GRID_LINE_STYLE}`} style={{ left: `${i * pixelsPerHourEffective}px`, height: '100%', top: 0, position: 'absolute' }} />
                    ))}
                    {currentTimeMarker}
                    {finalTasksToRender.map((task) => {
                        let displayTask = task; // Use the task from our calculated list
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
                                    left: `${(displayTask.startHour - startHour) * pixelsPerHourEffective}px`,
                                    width: `${displayTask.duration * pixelsPerHourEffective}px`,
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
                                    height={columnHeight}
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