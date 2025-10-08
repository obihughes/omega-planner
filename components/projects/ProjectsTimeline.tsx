'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getContrastColor } from '@/utils/colorUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ProjectTaskFormModal } from '@/components/modals/ProjectTaskFormModal';
import { ProjectTask } from '@/types';


type DayTick = { date: Date; key: string };

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return date;
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

type ViewMode = 'week' | 'month' | 'quarter';
type FilterMode = 'all' | 'active' | 'completed';
type QuickFilter = 'none' | 'overdue' | 'high-priority' | 'blocked' | 'upcoming';
type GroupMode = 'project' | 'status' | 'priority';

export default function ProjectsTimeline() {
  const { projects, updateTaskInProject } = useProjects();
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterMode] = useState<FilterMode>('all'); // Always show all
  const [quickFilter] = useState<QuickFilter>('none'); // No quick filters
  const [groupMode] = useState<GroupMode>('project'); // Always group by project
  const [showProjectBars, setShowProjectBars] = useState(true);
  const [showWorkloadDensity, setShowWorkloadDensity] = useState(false);
  // Collapsed state hides tasks but keeps the project row visible so it can be expanded again
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{task: ProjectTask, projectId: string} | null>(null);

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = new Date(monthCursor);
      weekStart.setDate(monthCursor.getDate() - monthCursor.getDay()); // Start of week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { rangeStart: weekStart, rangeEnd: weekEnd };
    } else if (viewMode === 'quarter') {
      const quarterStart = new Date(monthCursor.getFullYear(), Math.floor(monthCursor.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
      return { rangeStart: quarterStart, rangeEnd: quarterEnd };
    } else {
      return { rangeStart: startOfMonth(monthCursor), rangeEnd: endOfMonth(monthCursor) };
    }
  }, [monthCursor, viewMode]);

  const dayTicks: DayTick[] = useMemo(() => {
    const days: DayTick[] = [];
    const d = new Date(rangeStart);
    while (d <= rangeEnd) {
      days.push({ date: new Date(d), key: d.toISOString().slice(0, 10) });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [rangeStart, rangeEnd]);

  // Layout constants (improved spacing)
  const labelColumnWidth = 240;

  // Measure container width to compute a responsive day width so we use all available space
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const dayWidth: number = useMemo(() => {
    const numDays = Math.max(1, dayTicks.length);
    const minDayWidth = 30;  // Increased minimum for better readability
    const maxDayWidth = 80;  // Increased maximum for more spacious view
    if (!containerWidth) return 40; // SSR/initial fallback
    const available = Math.max(0, containerWidth - labelColumnWidth);
    const computed = Math.floor(available / numDays);
    return Math.min(Math.max(computed, minDayWidth), maxDayWidth);
  }, [containerWidth, dayTicks.length]);

  // Calculate proper swimlanes for tasks to avoid overlaps
  const calculateTaskLanes = (tasks: any[]) => {
    const lanes: any[][] = [];
    const sortedTasks = [...tasks].sort((a, b) => {
      const aStart = new Date(a.startDate || a.dueDate || 0).getTime();
      const bStart = new Date(b.startDate || b.dueDate || 0).getTime();
      return aStart - bStart;
    });

    sortedTasks.forEach(task => {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        const canPlace = !lane.some(existing => {
          const taskStart = new Date(task.startDate || task.dueDate);
          const taskEnd = new Date(task.dueDate || task.startDate);
          const existingStart = new Date(existing.startDate || existing.dueDate);
          const existingEnd = new Date(existing.dueDate || existing.startDate);
          return !(taskEnd < existingStart || taskStart > existingEnd);
        });
        if (canPlace) {
          lane.push({ ...task, lane: i });
          placed = true;
          break;
        }
      }
      if (!placed) {
        lanes.push([{ ...task, lane: lanes.length }]);
      }
    });

    return lanes.flat();
  };

  const taskHeight = 16; // Height of each task bar
  const laneSpacing = 3; // Spacing between lanes
  const projectLabelHeight = 18; // Top padding for project timeline bar
  const taskAreaHeight = 50; // Space allocated for tasks in each row
  const rowHeight = projectLabelHeight + taskAreaHeight;
  const rowGap = 12;
  const headerHeight = 60;
  const contentWidth = labelColumnWidth + dayTicks.length * dayWidth;

  const dateToX = (date: Date) => {
    const clamped = clampDate(date, rangeStart, rangeEnd);
    const diffMs = clamped.getTime() - rangeStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return labelColumnWidth + diffDays * dayWidth;
  };

  const todayX = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= rangeStart && today <= rangeEnd) {
      return dateToX(today);
    }
    return null;
  }, [rangeStart, rangeEnd, dateToX]);

  const statusColor: Record<'todo' | 'in-progress' | 'completed' | 'blocked', string> = {
    'todo': '#60a5fa',        // blue-400
    'in-progress': '#f59e0b', // amber-500
    'completed': '#10b981',   // emerald-500
    'blocked': '#ef4444'      // red-500
  };

  const priorityColor: Record<'low' | 'medium' | 'high' | 'urgent', string> = {
    'low': '#94a3b8',      // slate-400
    'medium': '#60a5fa',   // blue-400
    'high': '#f59e0b',     // amber-500
    'urgent': '#ef4444'    // red-500
  };

  // Check if a task is overdue
  const isTaskOverdue = (task: ProjectTask): boolean => {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  };

  // Check if task is upcoming (within next 7 days)
  const isTaskUpcoming = (task: ProjectTask): boolean => {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate <= weekFromNow;
  };

  // Calculate task progress based on subtasks
  const getTaskProgress = (task: ProjectTask): number => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : 0;
    }
    const completed = task.subtasks.filter(st => st.status === 'completed').length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  // Apply filters and grouping
  const { groupedData, stats } = useMemo(() => {
    let filtered = projects.filter(p => !p.isDeleted);
    
    // Apply filter mode
    if (filterMode === 'active') {
      filtered = filtered.filter(p => p.status === 'active' || p.status === 'planning');
    } else if (filterMode === 'completed') {
      filtered = filtered.filter(p => p.status === 'completed');
    }

    // Apply quick filters to tasks
    const filterTasks = (project: any) => {
      let tasks = project.tasks || [];
      
      if (quickFilter === 'overdue') {
        tasks = tasks.filter((t: ProjectTask) => isTaskOverdue(t));
      } else if (quickFilter === 'high-priority') {
        tasks = tasks.filter((t: ProjectTask) => t.priority === 'high' || t.priority === 'urgent');
      } else if (quickFilter === 'blocked') {
        tasks = tasks.filter((t: ProjectTask) => t.status === 'blocked');
      } else if (quickFilter === 'upcoming') {
        tasks = tasks.filter((t: ProjectTask) => isTaskUpcoming(t));
      }
      
      return tasks;
    };

    // Calculate stats
    const allTasks = filtered.flatMap(p => p.tasks || []);
    const overdueCount = allTasks.filter(t => isTaskOverdue(t)).length;
    const blockedCount = allTasks.filter(t => t.status === 'blocked').length;
    const highPriorityCount = allTasks.filter(t => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed').length;
    const upcomingCount = allTasks.filter(t => isTaskUpcoming(t)).length;

    // Group data
    if (groupMode === 'project') {
      const grouped = filtered.map(project => ({
        id: project.id,
        name: project.name,
        color: project.color,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        tasks: filterTasks(project),
        isProject: true
      }));
      return { 
        groupedData: grouped, 
        stats: { overdueCount, blockedCount, highPriorityCount, upcomingCount }
      };
    } else if (groupMode === 'status') {
      const statusGroups: any = {};
      filtered.forEach(project => {
        const tasks = filterTasks(project);
        tasks.forEach((task: ProjectTask) => {
          if (!statusGroups[task.status]) {
            statusGroups[task.status] = {
              id: task.status,
              name: task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' '),
              color: statusColor[task.status],
              tasks: [],
              isProject: false
            };
          }
          statusGroups[task.status].tasks.push({ ...task, projectId: project.id, projectName: project.name, projectColor: project.color });
        });
      });
      return { 
        groupedData: Object.values(statusGroups), 
        stats: { overdueCount, blockedCount, highPriorityCount, upcomingCount }
      };
    } else { // priority
      const priorityGroups: any = {};
      const priorityOrder = ['urgent', 'high', 'medium', 'low'];
      filtered.forEach(project => {
        const tasks = filterTasks(project);
        tasks.forEach((task: ProjectTask) => {
          if (!priorityGroups[task.priority]) {
            priorityGroups[task.priority] = {
              id: task.priority,
              name: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
              color: priorityColor[task.priority],
              tasks: [],
              isProject: false
            };
          }
          priorityGroups[task.priority].tasks.push({ ...task, projectId: project.id, projectName: project.name, projectColor: project.color });
        });
      });
      const sorted = priorityOrder.map(p => priorityGroups[p]).filter(Boolean);
      return { 
        groupedData: sorted, 
        stats: { overdueCount, blockedCount, highPriorityCount, upcomingCount }
      };
    }
  }, [projects, filterMode, quickFilter, groupMode]);

  const toggleProjectCollapsed = (projectId: string) => {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
      return next;
    });
  };

  const getProjectStats = (project: any) => {
    const total = project.tasks?.length || 0;
    const completed = project.tasks?.filter((t: any) => t.status === 'completed').length || 0;
    const inProgress = project.tasks?.filter((t: any) => t.status === 'in-progress').length || 0;
    return { total, completed, inProgress };
  };

  const navigateTimeRange = (direction: 'prev' | 'next') => {
    const delta = viewMode === 'week' ? 7 : viewMode === 'quarter' ? 90 : 30;
    setMonthCursor(prev => {
      const newDate = new Date(prev);
      if (direction === 'next') {
        newDate.setDate(prev.getDate() + delta);
      } else {
        newDate.setDate(prev.getDate() - delta);
      }
      return newDate;
    });
  };

  const formatRangeTitle = () => {
    if (viewMode === 'week') {
      return `${rangeStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (viewMode === 'quarter') {
      const quarter = Math.floor(rangeStart.getMonth() / 3) + 1;
      return `Q${quarter} ${rangeStart.getFullYear()}`;
    } else {
      return rangeStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const handleTaskClick = (task: ProjectTask, projectId: string) => {
    setEditingTask({ task, projectId });
  };

  const handleCloseModal = () => {
    setEditingTask(null);
  };

  const handleSaveTask = (taskData: Partial<ProjectTask>, isNew: boolean) => {
    if (editingTask && !isNew) {
      updateTaskInProject(editingTask.projectId, editingTask.task.id, taskData);
    }
    setEditingTask(null);
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Simplified Header */}
      <div className="px-4 py-3 border-b border-border/60 bg-card/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                className="h-8 w-8 rounded border border-border hover:bg-accent flex items-center justify-center"
                onClick={() => navigateTimeRange('prev')}
                aria-label={`Previous ${viewMode}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-medium min-w-[140px] text-center">
                {formatRangeTitle()}
              </div>
              <button
                className="h-8 w-8 rounded border border-border hover:bg-accent flex items-center justify-center"
                onClick={() => navigateTimeRange('next')}
                aria-label={`Next ${viewMode}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                className="ml-1 px-2 py-1 text-xs rounded border border-border hover:bg-accent"
                onClick={() => setMonthCursor(startOfMonth(new Date()))}
              >
                Today
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded overflow-hidden">
              {(['week', 'month', 'quarter'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    viewMode === mode 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-accent text-muted-foreground'
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'week' ? 'Week' : mode === 'month' ? 'Month' : 'Quarter'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto">
        <svg width={contentWidth} height={headerHeight + groupedData.length * (rowHeight + rowGap)}>
          {/* Header background */}
          <rect x={0} y={0} width={contentWidth} height={headerHeight} fill="transparent" />

          {/* Label column background */}
          <rect x={0} y={0} width={labelColumnWidth} height={headerHeight + groupedData.length * (rowHeight + rowGap)} fill="transparent" />

          {/* Weekend shading (ultra subtle) */}
          {dayTicks.map((tick, idx) => {
            const x = labelColumnWidth + idx * dayWidth;
            const isWeekend = tick.date.getDay() === 0 || tick.date.getDay() === 6;
            if (!isWeekend) return null;
            return (
              <rect
                key={`wknd-${tick.key}`}
                x={x}
                y={headerHeight}
                width={dayWidth}
                height={groupedData.length * (rowHeight + rowGap)}
                fill={'hsl(var(--muted-foreground) / 0.06)'}
              />
            );
          })}

          {/* Enhanced date labels with clearer divisions */}
          {dayTicks.map((tick, idx) => {
            const x = labelColumnWidth + idx * dayWidth;
            const isMonday = tick.date.getDay() === 1;
            const isFirstOfMonth = tick.date.getDate() === 1;
            const showLabel = viewMode === 'week' || isMonday || (viewMode === 'quarter' && isFirstOfMonth);
            
            return (
              <g key={`date-${tick.key}`}>
                {/* Clear vertical separator for every day */}
                <line 
                  x1={x} 
                  x2={x} 
                  y1={headerHeight} 
                  y2={headerHeight + groupedData.length * (rowHeight + rowGap)} 
                  stroke="hsl(var(--border))" 
                  strokeWidth={0.5}
                  opacity={0.3}
                />
                
                {/* Stronger separator for weeks */}
                {isMonday && (
                  <line 
                    x1={x} 
                    x2={x} 
                    y1={headerHeight - 20} 
                    y2={headerHeight + groupedData.length * (rowHeight + rowGap)} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={1}
                    opacity={0.4}
                  />
                )}
                
                {/* Strongest separator for months */}
                {isFirstOfMonth && (
                  <line 
                    x1={x} 
                    x2={x} 
                    y1={0} 
                    y2={headerHeight + groupedData.length * (rowHeight + rowGap)} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    opacity={0.6}
                  />
                )}
                
                {/* Date labels */}
                {showLabel && (
                  <>
                    {/* Day of month */}
                    <text 
                      x={x + dayWidth / 2} 
                      y={headerHeight - 28} 
                      textAnchor="middle" 
                      fontSize={13} 
                      fill="hsl(var(--foreground))"
                      fontWeight={isFirstOfMonth ? 'bold' : 'normal'}
                    >
                  {tick.date.getDate()}
                </text>
                    {/* Day of week (only for week view or first of month) */}
                    {(viewMode === 'week' || isFirstOfMonth) && (
                      <text 
                        x={x + dayWidth / 2} 
                        y={headerHeight - 12} 
                        textAnchor="middle" 
                        fontSize={10} 
                        fill="hsl(var(--muted-foreground))"
                      >
                        {tick.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </text>
                    )}
                    {/* Month label for first of month */}
                    {isFirstOfMonth && (
                      <text 
                        x={x + 4} 
                        y={headerHeight - 45} 
                        textAnchor="start" 
                        fontSize={12} 
                        fill="hsl(var(--foreground))"
                        fontWeight="bold"
                      >
                        {tick.date.toLocaleDateString('en-US', { month: 'short' })}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
          {/* Rightmost border line */}
          <line x1={labelColumnWidth + dayTicks.length * dayWidth} x2={labelColumnWidth + dayTicks.length * dayWidth} y1={0} y2={headerHeight + groupedData.length * (rowHeight + rowGap)} stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth={0.5} />

          {/* Today indicator line */}
          {todayX && (
            <g>
              <line 
                x1={todayX} 
                x2={todayX} 
                y1={0} 
                y2={headerHeight + groupedData.length * (rowHeight + rowGap)} 
                stroke="#ef4444" 
                strokeWidth={2} 
                opacity={0.8}
              />
              <text 
                x={todayX + 4} 
                y={headerHeight / 2 + 4} 
                fontSize={10} 
                fill="#ef4444" 
                fontWeight="bold"
              >
                Today
              </text>
            </g>
          )}

          {/* Workload density visualization (heat map) */}
          {showWorkloadDensity && (
            <g>
              {dayTicks.map((tick, idx) => {
                const x = labelColumnWidth + idx * dayWidth;
                const tasksOnDay = groupedData.flatMap(g => g.tasks || []).filter((task: any) => {
                  if (!task.startDate || !task.dueDate) return false;
                  const taskStart = new Date(task.startDate);
                  const taskEnd = new Date(task.dueDate);
                  return tick.date >= taskStart && tick.date <= taskEnd;
                }).length;
                
                if (tasksOnDay === 0) return null;
                const intensity = Math.min(tasksOnDay / 5, 1); // Max out at 5 tasks
                return (
                  <rect
                    key={`density-${tick.key}`}
                    x={x}
                    y={headerHeight - 8}
                    width={dayWidth}
                    height={4}
                    fill={`hsl(45, 100%, ${100 - intensity * 40}%)`}
                    opacity={0.7}
                  />
                );
              })}
            </g>
          )}

          {/* Group rows and tasks */}
          {groupedData.map((group, rowIndex) => {
            const yBase = headerHeight + rowIndex * (rowHeight + rowGap);
            const stats = getProjectStats(group);

            return (
              <g key={group.id}>
                {/* Row separator */}
                <line x1={0} x2={contentWidth} y1={yBase + rowHeight + rowGap / 2} y2={yBase + rowHeight + rowGap / 2} stroke="hsl(var(--muted-foreground) / 0.25)" strokeWidth={0.5} />

                {/* Compact Project/Group label area - aligned with first task lane */}
                <g>
                  {/* Label background card aligned with tasks */}
                  <rect 
                    x={4} 
                    y={yBase + projectLabelHeight} 
                    width={labelColumnWidth - 8} 
                    height={taskHeight} 
                    rx={2} 
                    fill="hsl(var(--card))" 
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                    opacity={0.8}
                  />
                  
                  <g className="cursor-pointer" onClick={() => toggleProjectCollapsed(group.id)}>
                    {/* Color indicator bar */}
                    <rect 
                      x={4} 
                      y={yBase + projectLabelHeight} 
                      width={3} 
                      height={taskHeight} 
                      rx={2}
                      fill={group.color || '#64748b'} 
                    />
                    
                    {/* Expand/collapse indicator */}
                    <text 
                      x={14} 
                      y={yBase + projectLabelHeight + taskHeight / 2 + 4} 
                      fontSize={11} 
                      fill="hsl(var(--muted-foreground))"
                    >
                      {collapsedProjects.has(group.id) ? '▶' : '▼'}
                    </text>
                    
                    {/* Project name */}
                    <text 
                      x={26} 
                      y={yBase + projectLabelHeight + taskHeight / 2 + 4} 
                      fontSize={12} 
                      fill="hsl(var(--foreground))" 
                      fontWeight="600"
                    >
                      {group.name}
                  </text>
                    
                    {/* Compact progress indicator */}
                    {stats.total > 0 && (
                      <g>
                        <rect 
                          x={labelColumnWidth - 52} 
                          y={yBase + projectLabelHeight + taskHeight / 2 - 3} 
                          width={40} 
                          height={6} 
                          rx={3} 
                          fill="hsl(var(--muted) / 0.3)"
                        />
                        <rect 
                          x={labelColumnWidth - 52} 
                          y={yBase + projectLabelHeight + taskHeight / 2 - 3} 
                          width={(stats.completed / stats.total) * 40} 
                          height={6} 
                          rx={3} 
                          fill={statusColor['completed']}
                        />
                      </g>
                    )}
                  </g>
                  
                  {/* Swimlane guides (subtle horizontal lines) */}
                  {!collapsedProjects.has(group.id) && (
                    <g>
                      {[...Array(Math.floor(taskAreaHeight / (taskHeight + laneSpacing)))].map((_, laneIdx) => (
                        <line
                          key={`lane-${laneIdx}`}
                          x1={labelColumnWidth}
                          x2={contentWidth}
                          y1={yBase + projectLabelHeight + laneIdx * (taskHeight + laneSpacing) + taskHeight / 2}
                          y2={yBase + projectLabelHeight + laneIdx * (taskHeight + laneSpacing) + taskHeight / 2}
                          stroke="hsl(var(--muted-foreground) / 0.08)"
                          strokeWidth={0.5}
                          strokeDasharray="4 4"
                        />
                      ))}
                    </g>
                  )}
                </g>

                {/* Project-level timeline bar (if project has start/end dates) */}
                {showProjectBars && group.isProject && group.startDate && group.endDate && (
                  <g>
                    {(() => {
                      const projStart = new Date(group.startDate);
                      const projEnd = new Date(group.endDate);
                      if (projEnd < rangeStart || projStart > rangeEnd) return null;
                      
                      const startX = dateToX(projStart);
                      const endX = dateToX(new Date(projEnd.getFullYear(), projEnd.getMonth(), projEnd.getDate() + 1));
                      const width = Math.max(8, endX - startX - 4);
                      const barY = yBase + 8; // Position at top of row area
                      
                      return (
                        <>
                          {/* Project timeline background bar */}
                          <rect 
                            x={startX} 
                            y={barY} 
                            width={width} 
                            height={6} 
                            rx={2} 
                            fill={group.color} 
                            opacity={0.2}
                            stroke={group.color}
                            strokeWidth={1}
                          />
                          {/* Solid progress indicator */}
                          <rect 
                            x={startX} 
                            y={barY} 
                            width={width * (stats.completed / Math.max(stats.total, 1))} 
                            height={6} 
                            rx={2} 
                            fill={group.color} 
                            opacity={0.5}
                          />
                          {/* Start milestone diamond */}
                          <g transform={`translate(${startX}, ${barY + 3}) rotate(45)`}>
                            <rect x={-3} y={-3} width={6} height={6} fill={group.color} stroke="white" strokeWidth={1.5} />
                          </g>
                          {/* End milestone diamond */}
                          <g transform={`translate(${endX - 2}, ${barY + 3}) rotate(45)`}>
                            <rect x={-3} y={-3} width={6} height={6} fill={group.color} stroke="white" strokeWidth={1.5} />
                          </g>
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* Tasks with proper swimlane positioning */}
                {!collapsedProjects.has(group.id) && (() => {
                  // Calculate lanes for all tasks in this group
                  const tasksWithDates = (group.tasks || []).filter((t: any) => 
                    (t.startDate && t.dueDate) || t.startDate || t.dueDate
                  );
                  const lanedTasks = calculateTaskLanes(tasksWithDates);
                  
                  return lanedTasks.map((task: any) => {
                  const hasSpan = task.startDate && task.dueDate;
                  const hasDueOnly = !task.startDate && task.dueDate;
                  const hasStartOnly = task.startDate && !task.dueDate;

                  if (hasSpan) {
                    // Range filter: render only if the span overlaps the current view range
                    const startOnly = new Date(new Date(task.startDate!).getFullYear(), new Date(task.startDate!).getMonth(), new Date(task.startDate!).getDate());
                    const endOnly = new Date(new Date(task.dueDate!).getFullYear(), new Date(task.dueDate!).getMonth(), new Date(task.dueDate!).getDate());
                    if (endOnly < rangeStart || startOnly > rangeEnd) {
                      return null; // completely outside the visible range
                    }
                      const start = dateToX(new Date(task.startDate!));
                      // include the end day fully by +1 day
                      const endX = dateToX(new Date(new Date(task.dueDate!).getFullYear(), new Date(task.dueDate!).getMonth(), new Date(task.dueDate!).getDate() + 1));
                      const width = Math.max(8, endX - start - 4);
                      const barY = yBase + projectLabelHeight + (task.lane || 0) * (taskHeight + laneSpacing);
                      const taskStatus = (task.status || 'todo') as 'todo' | 'in-progress' | 'completed' | 'blocked';
                      const taskPriority = (task.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent';
                      const color = statusColor[taskStatus];
                      const isHovered = hoveredTask === task.id;
                      const isOverdue = isTaskOverdue(task);
                      const progress = getTaskProgress(task);
                      const projectId = task.projectId || group.id;
                    
                    return (
                      <g 
                        key={task.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => handleTaskClick(task, projectId)}
                      >
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <g>
                              {/* Shadow layer */}
                              {isHovered && (
                                <rect 
                                  x={start + 1} 
                                  y={barY + 1} 
                                  width={width} 
                                  height={taskHeight} 
                                  rx={2} 
                                  fill="black" 
                                  opacity={0.15}
                                />
                              )}
                              
                              {/* Main task bar with gradient effect */}
                              <defs>
                                <linearGradient id={`grad-${task.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" style={{stopColor: color, stopOpacity: isHovered ? 0.95 : 0.85}} />
                                  <stop offset="100%" style={{stopColor: color, stopOpacity: isHovered ? 0.85 : 0.75}} />
                                </linearGradient>
                              </defs>
                              
                              <rect 
                                x={start} 
                                y={barY} 
                                width={width} 
                                height={taskHeight} 
                                rx={2} 
                                fill={`url(#grad-${task.id})`}
                                stroke={isOverdue ? '#ef4444' : isHovered ? color : 'hsl(var(--border))'}
                                strokeWidth={isOverdue ? 2 : 1}
                              />
                              
                              {/* Progress overlay for tasks with subtasks */}
                              {task.subtasks && task.subtasks.length > 0 && progress > 0 && (
                                <>
                                  <rect 
                                    x={start} 
                                    y={barY} 
                                    width={Math.max(4, (width * progress) / 100)} 
                                    height={taskHeight} 
                                    rx={2} 
                                    fill={statusColor['completed']} 
                                    opacity={0.4}
                                  />
                                  {/* Progress percentage text for wider bars */}
                                  {width > 60 && (
                                    <text 
                                      x={start + width - 28} 
                                      y={barY + taskHeight / 2 + 4} 
                                      fontSize={9} 
                                      fill="hsl(var(--foreground))" 
                                      opacity={0.7}
                                      fontWeight="600"
                                    >
                                      {progress}%
                                    </text>
                                  )}
                                </>
                              )}
                              
                              {/* Priority indicator */}
                              {(taskPriority === 'high' || taskPriority === 'urgent') && (
                                <>
                                  <circle 
                                    cx={start + 6} 
                                    cy={barY + taskHeight / 2} 
                                    r={3.5} 
                                    fill={priorityColor[taskPriority]} 
                                    stroke="white" 
                                    strokeWidth={1.5}
                                  />
                                  {/* Pulse animation effect for urgent */}
                                  {taskPriority === 'urgent' && (
                                    <circle 
                                      cx={start + 6} 
                                      cy={barY + taskHeight / 2} 
                                      r={5} 
                                      fill="none" 
                                      stroke={priorityColor[taskPriority]} 
                                      strokeWidth={1}
                                      opacity={0.5}
                                    />
                                  )}
                                </>
                              )}
                              
                              {/* Task title removed - shown only on hover via HoverCard */}
                              
                              {/* Hover glow effect */}
                              {isHovered && (
                                <rect 
                                  x={start - 1} 
                                  y={barY - 1} 
                                  width={width + 2} 
                                  height={taskHeight + 2} 
                                  rx={3} 
                                  fill="none" 
                                  stroke={color} 
                                  strokeWidth={2}
                                  opacity={0.4}
                                />
                              )}
                            </g>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="flex justify-between space-x-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">{task.title}</h4>
                                {!group.isProject && task.projectName && (
                                  <p className="text-xs">
                                    Project: <span className="font-medium" style={{color: task.projectColor}}>{task.projectName}</span>
                                  </p>
                                )}
                                <p className="text-sm">
                                  Status: <span className="font-medium" style={{color: color}}>{taskStatus}</span>
                                </p>
                                <p className="text-xs">
                                  Priority: <span className="font-medium" style={{color: priorityColor[taskPriority]}}>{taskPriority}</span>
                                </p>
                                {task.startDate && <p className="text-xs text-muted-foreground">Start: {new Date(task.startDate).toLocaleDateString()}</p>}
                                {task.dueDate && <p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                                {isOverdue && <p className="text-xs text-red-500 font-medium">⚠ Overdue!</p>}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <p className="text-xs text-muted-foreground">Subtasks: {task.subtasks.filter((st: any) => st.status === 'completed').length}/{task.subtasks.length} completed ({progress}%)</p>
                                )}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </g>
                    );
                  }

                  if (hasDueOnly || hasStartOnly) {
                    const d = new Date(hasDueOnly ? task.dueDate! : task.startDate!);
                    // Range filter: single-day markers must fall within the visible range
                    if (d < rangeStart || d > rangeEnd) {
                      return null;
                    }
                    const x = dateToX(d);
                    const barY = yBase + projectLabelHeight + (task.lane || 0) * (taskHeight + laneSpacing);
                    const taskStatus = (task.status || 'todo') as 'todo' | 'in-progress' | 'completed' | 'blocked';
                    const taskPriority = (task.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent';
                    const color = statusColor[taskStatus];
                    const isHovered = hoveredTask === task.id;
                    const isOverdue = isTaskOverdue(task);
                    const projectId = task.projectId || group.id;
                    const cardWidth = Math.min(dayWidth - 8, 50); // Compact square card
                    const startX = x + (dayWidth - cardWidth) / 2; // Center in day column
                    
                    return (
                      <g 
                        key={task.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => handleTaskClick(task, projectId)}
                      >
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <g>
                              {/* Shadow layer */}
                              {isHovered && (
                                <rect 
                                  x={startX + 1} 
                                  y={barY + 1} 
                                  width={cardWidth} 
                                  height={taskHeight} 
                                  rx={2} 
                                  fill="black" 
                                  opacity={0.15}
                                />
                              )}
                              
                              {/* Main task card */}
                              <defs>
                                <linearGradient id={`single-grad-${task.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" style={{stopColor: color, stopOpacity: isHovered ? 0.95 : 0.85}} />
                                  <stop offset="100%" style={{stopColor: color, stopOpacity: isHovered ? 0.85 : 0.75}} />
                                </linearGradient>
                              </defs>
                              
                              <rect 
                                x={startX} 
                                y={barY} 
                                width={cardWidth} 
                                height={taskHeight} 
                                rx={2} 
                                fill={`url(#single-grad-${task.id})`}
                                stroke={isOverdue ? '#ef4444' : isHovered ? color : 'hsl(var(--border))'}
                                strokeWidth={isOverdue ? 2 : 1}
                              />
                              
                              {/* Priority indicator */}
                              {(taskPriority === 'high' || taskPriority === 'urgent') && (
                                <circle 
                                  cx={startX + 6} 
                                  cy={barY + taskHeight / 2} 
                                  r={3} 
                                  fill={priorityColor[taskPriority]} 
                                  stroke="white" 
                                  strokeWidth={1.5}
                                />
                              )}
                              
                              {/* Hover glow effect */}
                              {isHovered && (
                                <rect 
                                  x={startX - 1} 
                                  y={barY - 1} 
                                  width={cardWidth + 2} 
                                  height={taskHeight + 2} 
                                  rx={3} 
                                  fill="none" 
                                  stroke={color} 
                                  strokeWidth={2}
                                  opacity={0.4}
                                />
                              )}
                            </g>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="flex justify-between space-x-4">
                               <div className="space-y-1">
                                <h4 className="text-sm font-semibold">{task.title}</h4>
                                {!group.isProject && task.projectName && (
                                  <p className="text-xs">
                                    Project: <span className="font-medium" style={{color: task.projectColor}}>{task.projectName}</span>
                                  </p>
                                )}
                                <p className="text-sm">
                                  Status: <span className="font-medium" style={{color: color}}>{taskStatus}</span>
                                </p>
                                <p className="text-xs">
                                  Priority: <span className="font-medium" style={{color: priorityColor[taskPriority]}}>{taskPriority}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Date: {new Date(d).toLocaleDateString()}
                                </p>
                                {isOverdue && <p className="text-xs text-red-500 font-medium">⚠ Overdue!</p>}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </g>
                    );
                  }

                  return null;
                  });
                })()}
              </g>
            );
          })}

          {/* Empty state */}
          {groupedData.length === 0 && (
            <g>
              <rect x={0} y={headerHeight} width={contentWidth} height={120} fill="rgba(148,163,184,0.05)" />
              <text x={contentWidth / 2} y={headerHeight + 50} textAnchor="middle" fontSize={14} fill="hsl(var(--muted-foreground))">
                No {groupMode === 'project' ? 'projects' : groupMode === 'status' ? 'tasks' : 'tasks'} found
              </text>
              <text x={contentWidth / 2} y={headerHeight + 75} textAnchor="middle" fontSize={12} fill="hsl(var(--muted-foreground))" opacity={0.7}>
                {quickFilter !== 'none' ? `No tasks match the current filter` : filterMode !== 'all' ? `Try changing the filter` : 'Create a project to see it on the timeline'}
              </text>
            </g>
          )}
        </svg>
      </div>

      {editingTask && (
        <ProjectTaskFormModal
          isOpen={!!editingTask}
          onClose={handleCloseModal}
          taskToEdit={editingTask.task}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}


