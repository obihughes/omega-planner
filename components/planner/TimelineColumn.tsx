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
    /** When true, render delete controls and allow quick deletes */
    deleteMode?: boolean;
    /** Delete callback for quick-delete mode */
    onDeleteTask?: (task: Task) => void;
    /** Optional: when provided, enables drop from pool/inbox onto timeline (scheduling view) */
    onDropFromPool?: (task: Task, targetDate: Date, startHour: number) => void;
    /** Target date for pool drops (used when dayOffset maps to selectedDate in scheduling view) */
    targetDate?: Date;
    /** When true, disables all interactions (e.g. class schedule view) */
    readOnly?: boolean;
    /** Optional: when provided, used for double-click add instead of openEditModal */
    onDoubleClickAdd?: (date: Date, startHour: number) => void;
    /** Optional: copy handler for task card */
    onCopy?: (task: Task) => void;
    /** Optional: view notes handler for task card */
    onViewNotes?: (task: Task) => void;
    /** Optional: resize handler for task card */
    onResizeStart?: (task: Task, edge: 'start' | 'end', e: React.MouseEvent<HTMLDivElement>) => void;
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
    fillWidth = true,
    deleteMode = false,
    onDeleteTask,
    onDropFromPool,
    targetDate,
    readOnly = false,
    onDoubleClickAdd,
    onCopy,
    onViewNotes,
    onResizeStart
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
        if (readOnly || !copyingTaskData) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        const hourInBlock = (clickXrelative / pixelsPerHourEffective);
        const calculatedNewStartHour = startHour + hourInBlock;
        const snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;
        const targetDateKey = getCalendarDateForColumn(dayOffset);
        const targetDateValue = dateFromDateKey(targetDateKey);
        handleDropCopy(targetDateValue, snappedNewStartHour);
    };

    const handleTimelineDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (readOnly || e.detail !== 2 || copyingTaskData) return;
        
        const now = Date.now();
        if (now - lastDoubleClickTimestampRef.current < 2000) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickXrelative = e.clientX - rect.left;
        const hourInBlock = (clickXrelative / pixelsPerHourEffective);
        const calculatedNewStartHour = startHour + hourInBlock;
        let snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;
        snappedNewStartHour = Math.max(TIMELINE_START_HOUR, Math.min(snappedNewStartHour, TIMELINE_END_HOUR - 1));
        
        const targetDateKey = getCalendarDateForColumn(dayOffset);
        const targetDateValue = dateFromDateKey(targetDateKey);

        if (onDoubleClickAdd) {
            onDoubleClickAdd(targetDateValue, snappedNewStartHour);
        } else {
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
        }
        lastDoubleClickTimestampRef.current = now;
    };

    const handleDropFromPoolInner = (e: React.DragEvent<HTMLDivElement>) => {
        if (readOnly || !onDropFromPool || !targetDate) return;
        e.preventDefault();
        const taskDataString = e.dataTransfer.getData('text/plain');
        if (!taskDataString) return;
        try {
            const data = JSON.parse(taskDataString);
            let task: Task | null = null;
            if (data.source === 'pool' && data.id) {
                task = data as Task;
            } else if (data.type === 'task-assignment' && data.task) {
                task = data.task;
            }
            if (!task || !task.id) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const hourInBlock = x / pixelsPerHourEffective;
            const calculatedNewStartHour = startHour + hourInBlock;
            let snappedNewStartHour = Math.round(calculatedNewStartHour * 4) / 4;
            snappedNewStartHour = Math.max(TIMELINE_START_HOUR, Math.min(snappedNewStartHour, TIMELINE_END_HOUR - 1));
            onDropFromPool(task, targetDate, snappedNewStartHour);
        } catch (err) {
            console.error('Drop from pool error:', err);
        }
    };

    const renderTimelineHeader = () => {
        const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
        return (
            <div className="flex h-8 border-b border-border/30 sticky top-0 bg-card/95 backdrop-blur-sm z-20">
                {timelineHours.map((hour) => (
                    <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground pt-1 pl-0.5 border-l border-border/20" style={{ width: `${pixelsPerHourEffective}px` }}>
                        {formatTime(hour)}
                    </div>
                ))}
                <div key={`timeline-end-marker-${period}`} className="flex-none border-l border-border/20" style={{ width: `1px` }}></div>
            </div>
        );
    };

    return (
        <div className={`w-full transition-colors duration-200 relative ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}>
            <div
                className={`relative border border-border/20 rounded-md flex flex-col`}
                style={{ width: `${pixelsPerHourEffective * (endHour - startHour)}px`, minWidth: fillWidth ? '100%' : undefined, height: `${columnHeight}px`, overflow: 'hidden' }}
                data-section-period={period}
                data-day-offset={dayOffset}
                onClick={readOnly ? undefined : handleTimelineSingleClick}
                onDoubleClick={readOnly ? undefined : handleTimelineDoubleClick}
                onMouseEnter={readOnly ? undefined : () => setTargetCopyDayOffset(copyingTaskData ? dayOffset : null)}
            >
                {renderTimelineHeader()}
                <div
                    className={`relative flex-grow bg-background ${isTargetCopyDay ? 'bg-blue-50/80 dark:bg-blue-900/30 cursor-copy' : 'cursor-pointer'}`}
                    data-testid={`timeline-area-${dayOffset}-${period}`}
                    data-day-offset={dayOffset}
                    data-section-period={period}
                    onDragOver={onDropFromPool && targetDate ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } : undefined}
                    onDrop={onDropFromPool && targetDate ? handleDropFromPoolInner : undefined}
                >
                    {isTargetCopyDay && <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center text-blue-500 dark:text-blue-300 font-bold text-lg">Click to paste task</div>}
                    {Array.from({ length: endHour - startHour }).map((_, i) => (
                        <div key={`grid-${i}-${dayOffset}-${period}`} className={`absolute h-full border-l ${i % 6 === 0 ? 'border-border/30' : 'border-border/10'}`} style={{ left: `${i * pixelsPerHourEffective}px`, top: 0 }} />
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
                                onMouseDown={readOnly ? undefined : (e) => {
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
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    {deleteMode && onDeleteTask && (
                                        <button
                                            type="button"
                                            aria-label="Delete task"
                                            title="Delete"
                                            className="absolute -top-1 -right-1 z-[130] bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow hover:bg-red-500"
                                            onClick={(e) => { e.stopPropagation(); onDeleteTask(displayTask); }}
                                        >
                                            ×
                                        </button>
                                    )}
                                    <MemoizedTaskCard
                                        task={displayTask}
                                        onStartEdit={readOnly ? () => {} : (taskToEdit, options) => {
                                            const modalOptions = {
                                                isNew: options?.isNew ?? false,
                                                isFromPool: options?.isFromPool ?? false,
                                            };
                                            openEditModal(taskToEdit, modalOptions);
                                        }}
                                        onCopy={readOnly ? () => {} : (onCopy ?? (() => {}))}
                                        onViewNotes={readOnly ? () => {} : (onViewNotes ?? (() => {}))}
                                        onResizeStart={readOnly ? () => {} : (onResizeStart ? (edge, e) => onResizeStart(displayTask, edge, e) : () => {})}
                                        height={columnHeight}
                                        currentTime={currentTimeForMarker}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}; 