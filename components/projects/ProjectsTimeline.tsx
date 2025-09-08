'use client';

import React, { useMemo, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getContrastColor } from '@/utils/colorUtils';
import { ChevronLeft, ChevronRight, Calendar, Filter, Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export default function ProjectsTimeline() {
  const { projects, updateTaskInProject } = useProjects();
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [hiddenProjects, setHiddenProjects] = useState<Set<string>>(new Set());
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

  // Layout constants (compact)
  const labelColumnWidth = 220;
  const dayWidth = 28; // px per day
  const rowHeight = 44;
  const rowGap = 10;
  const headerHeight = 40;
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

  const visibleProjects = useMemo(() => {
    let filtered = projects.filter(p => !p.isDeleted && !hiddenProjects.has(p.id));
    
    if (filterMode === 'active') {
      filtered = filtered.filter(p => p.status === 'active' || p.status === 'planning');
    } else if (filterMode === 'completed') {
      filtered = filtered.filter(p => p.status === 'completed');
    }
    
    return filtered;
  }, [projects, hiddenProjects, filterMode]);

  const toggleProjectVisibility = (projectId: string) => {
    setHiddenProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
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
      <div className="px-4 py-3 border-b border-border/60 bg-card/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
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

          {/* Filter Toggle */}
          <div className="flex items-center border border-border rounded overflow-hidden">
            <button
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                filterMode === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-accent text-muted-foreground'
              }`}
              onClick={() => setFilterMode('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                filterMode === 'active' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-accent text-muted-foreground'
              }`}
              onClick={() => setFilterMode('active')}
            >
              Active
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                filterMode === 'completed' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background hover:bg-accent text-muted-foreground'
              }`}
              onClick={() => setFilterMode('completed')}
            >
              Done
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs opacity-70">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: statusColor['todo'] }} /> Todo</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: statusColor['in-progress'] }} /> In Progress</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: statusColor['completed'] }} /> Completed</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: statusColor['blocked'] }} /> Blocked</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <svg width={contentWidth} height={headerHeight + visibleProjects.length * (rowHeight + rowGap)}>
          {/* Header background */}
          <rect x={0} y={0} width={contentWidth} height={headerHeight} fill="transparent" />

          {/* Label column background */}
          <rect x={0} y={0} width={labelColumnWidth} height={headerHeight + visibleProjects.length * (rowHeight + rowGap)} fill="transparent" />

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
                height={visibleProjects.length * (rowHeight + rowGap)}
                fill={'rgba(148,163,184,0.06)'}
              />
            );
          })}

          {/* Week separators and labels (Mondays) */}
          {dayTicks.map((tick, idx) => {
            if (tick.date.getDay() !== 1) return null; // Monday
            const x = labelColumnWidth + idx * dayWidth;
            return (
              <g key={`wk-${tick.key}`}>
                <line x1={x} x2={x} y1={0} y2={headerHeight + visibleProjects.length * (rowHeight + rowGap)} stroke="rgba(148,163,184,0.35)" strokeWidth={0.75} />
                <text x={x + 2} y={headerHeight / 2 + 4} textAnchor="start" fontSize={11} fill="var(--foreground, #6b7280)">
                  {tick.date.getDate()}
                </text>
              </g>
            );
          })}
          {/* Rightmost border line */}
          <line x1={labelColumnWidth + dayTicks.length * dayWidth} x2={labelColumnWidth + dayTicks.length * dayWidth} y1={0} y2={headerHeight + visibleProjects.length * (rowHeight + rowGap)} stroke="rgba(148,163,184,0.4)" strokeWidth={0.5} />

          {/* Today indicator line */}
          {todayX && (
            <g>
              <line 
                x1={todayX} 
                x2={todayX} 
                y1={0} 
                y2={headerHeight + visibleProjects.length * (rowHeight + rowGap)} 
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

          {/* Project rows and tasks */}
          {visibleProjects.map((project, rowIndex) => {
            const yBase = headerHeight + rowIndex * (rowHeight + rowGap);
            const labelBg = project.color || '#64748b';
            const labelFg = getContrastColor(project.color || '#64748b');
            const stats = getProjectStats(project);

            return (
              <g key={project.id}>
                {/* Row separator */}
                <line x1={0} x2={contentWidth} y1={yBase + rowHeight + rowGap / 2} y2={yBase + rowHeight + rowGap / 2} stroke="rgba(148,163,184,0.25)" strokeWidth={0.5} />

                {/* Project label with enhanced info */}
                <g className="cursor-pointer" onClick={() => toggleProjectVisibility(project.id)}>
                  <circle cx={20} cy={yBase + rowHeight / 2} r={6} fill={project.color || '#64748b'} />
                  <text x={34} y={yBase + rowHeight / 2 - 2} fontSize={12} fill="var(--foreground)" fontWeight="bold">
                    {project.name}
                  </text>
                  <text x={34} y={yBase + rowHeight / 2 + 12} fontSize={10} fill="var(--muted-foreground)">
                    {stats.total > 0 ? `${stats.completed}/${stats.total} tasks` : 'No tasks'}
                    {stats.inProgress > 0 && ` • ${stats.inProgress} in progress`}
                  </text>
                  
                  {/* Progress bar */}
                  {stats.total > 0 && (
                    <g>
                      <rect x={34} y={yBase + rowHeight / 2 + 16} width={100} height={2} fill="rgba(148,163,184,0.3)" rx={1} />
                      <rect 
                        x={34} 
                        y={yBase + rowHeight / 2 + 16} 
                        width={(stats.completed / stats.total) * 100} 
                        height={2} 
                        fill={statusColor['completed']} 
                        rx={1} 
                      />
                    </g>
                  )}
                </g>

                {/* Tasks */}
                {(project.tasks || []).map((task, taskIdx) => {
                  const hasSpan = task.startDate && task.dueDate;
                  const hasDueOnly = !task.startDate && task.dueDate;
                  const hasStartOnly = task.startDate && !task.dueDate;

                  if (hasSpan) {
                    const start = dateToX(new Date(task.startDate!));
                    // include the end day fully by +1 day
                    const endX = dateToX(new Date(new Date(task.dueDate!).getFullYear(), new Date(task.dueDate!).getMonth(), new Date(task.dueDate!).getDate() + 1));
                    const width = Math.max(6, endX - start - 2);
                    const barY = yBase + 12 + (taskIdx % 2) * 14; // simple stagger to reduce overlap
                    const color = statusColor[task.status || 'todo'];
                    const isHovered = hoveredTask === task.id;
                    return (
                      <g 
                        key={task.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => handleTaskClick(task, project.id)}
                      >
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <g>
                              <rect 
                                x={start} 
                                y={barY} 
                                width={width} 
                                height={12} 
                                rx={4} 
                                ry={4} 
                                fill={color} 
                                opacity={isHovered ? 0.9 : 0.75}
                                stroke={isHovered ? color : 'none'}
                                strokeWidth={isHovered ? 1 : 0}
                              />
                              {(width > 30 || isHovered) && (
                                <text 
                                  x={start + 6} 
                                  y={barY + 9.5} 
                                  fontSize={10} 
                                  fill={getContrastColor(color)} 
                                  opacity={0.9}
                                  fontWeight={isHovered ? 'bold' : 'normal'}
                                  style={{ pointerEvents: 'none' }}
                                >
                                  {task.title}
                                </text>
                              )}
                            </g>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="flex justify-between space-x-4">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold">{task.title}</h4>
                                <p className="text-sm">
                                  Status: <span className="font-medium" style={{color: color}}>{task.status}</span>
                                </p>
                                {task.startDate && <p className="text-xs text-muted-foreground">Start: {new Date(task.startDate).toLocaleDateString()}</p>}
                                {task.dueDate && <p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </g>
                    );
                  }

                  if (hasDueOnly || hasStartOnly) {
                    const d = new Date(hasDueOnly ? task.dueDate! : task.startDate!);
                    const x = dateToX(d) + dayWidth / 2;
                    const dotY = yBase + rowHeight / 2;
                    const color = statusColor[task.status || 'todo'];
                    const isHovered = hoveredTask === task.id;
                    return (
                      <g 
                        key={task.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => handleTaskClick(task, project.id)}
                      >
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <g>
                              <circle 
                                cx={x} 
                                cy={dotY} 
                                r={isHovered ? 7 : 5} 
                                fill={color} 
                                opacity={isHovered ? 1 : 0.9}
                                stroke={isHovered ? '#fff' : 'none'}
                                strokeWidth={isHovered ? 2 : 0}
                              />
                              {isHovered && (
                                <text 
                                  x={x + 12} 
                                  y={dotY + 4} 
                                  fontSize={10} 
                                  fill="var(--foreground)" 
                                  fontWeight="bold"
                                >
                                  {task.title}
                                </text>
                              )}
                            </g>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="flex justify-between space-x-4">
                               <div className="space-y-1">
                                <h4 className="text-sm font-semibold">{task.title}</h4>
                                <p className="text-sm">
                                  Status: <span className="font-medium" style={{color: color}}>{task.status}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Date: {new Date(d).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </g>
                    );
                  }

                  return null;
                })}
              </g>
            );
          })}

          {/* Empty state */}
          {visibleProjects.length === 0 && (
            <g>
              <rect x={0} y={headerHeight} width={contentWidth} height={120} fill="rgba(148,163,184,0.05)" />
              <text x={contentWidth / 2} y={headerHeight + 50} textAnchor="middle" fontSize={14} fill="var(--muted-foreground)">
                No projects found
              </text>
              <text x={contentWidth / 2} y={headerHeight + 75} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)" opacity={0.7}>
                {filterMode !== 'all' ? `Try changing the filter to see more projects` : 'Create a project to see it on the timeline'}
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


