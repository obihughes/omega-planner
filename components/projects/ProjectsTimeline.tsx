'use client';

import React, { useMemo, useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { getContrastColor } from '@/utils/colorUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function ProjectsTimeline() {
  const { projects } = useProjects();
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));

  const monthStart = useMemo(() => startOfMonth(monthCursor), [monthCursor]);
  const monthEnd = useMemo(() => endOfMonth(monthCursor), [monthCursor]);

  const dayTicks: DayTick[] = useMemo(() => {
    const days: DayTick[] = [];
    const d = new Date(monthStart);
    while (d <= monthEnd) {
      days.push({ date: new Date(d), key: d.toISOString().slice(0, 10) });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [monthStart, monthEnd]);

  // Layout constants
  const labelColumnWidth = 220;
  const dayWidth = 28; // px per day
  const rowHeight = 40;
  const rowGap = 8;
  const headerHeight = 40;
  const contentWidth = labelColumnWidth + dayTicks.length * dayWidth;

  const dateToX = (date: Date) => {
    const clamped = clampDate(date, monthStart, monthEnd);
    const diffMs = clamped.getTime() - monthStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return labelColumnWidth + diffDays * dayWidth;
  };

  const statusColor: Record<'todo' | 'in-progress' | 'completed' | 'blocked', string> = {
    'todo': '#60a5fa',        // blue-400
    'in-progress': '#f59e0b', // amber-500
    'completed': '#10b981',   // emerald-500
    'blocked': '#ef4444'      // red-500
  };

  const visibleProjects = useMemo(() => projects.filter(p => !p.isDeleted), [projects]);

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="px-4 py-3 border-b border-border/60 bg-card/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="h-8 w-8 rounded border border-border hover:bg-accent flex items-center justify-center"
            onClick={() => setMonthCursor(prev => addMonths(prev, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium">
            {monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button
            className="h-8 w-8 rounded border border-border hover:bg-accent flex items-center justify-center"
            onClick={() => setMonthCursor(prev => addMonths(prev, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: statusColor['todo'] }} /> Todo</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: statusColor['in-progress'] }} /> In Progress</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: statusColor['completed'] }} /> Completed</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: statusColor['blocked'] }} /> Blocked</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <svg width={contentWidth} height={headerHeight + visibleProjects.length * (rowHeight + rowGap)}>
          {/* Header background */}
          <rect x={0} y={0} width={contentWidth} height={headerHeight} fill="transparent" />

          {/* Label column background */}
          <rect x={0} y={0} width={labelColumnWidth} height={headerHeight + visibleProjects.length * (rowHeight + rowGap)} fill="var(--color-elevated-bg, transparent)" />

          {/* Day grid and labels */}
          {dayTicks.map((tick, idx) => {
            const x = labelColumnWidth + idx * dayWidth;
            const isWeekend = tick.date.getDay() === 0 || tick.date.getDay() === 6;
            return (
              <g key={tick.key}>
                <rect
                  x={x}
                  y={headerHeight}
                  width={dayWidth}
                  height={visibleProjects.length * (rowHeight + rowGap)}
                  fill={isWeekend ? 'rgba(148,163,184,0.12)' : 'transparent'}
                />
                <line x1={x} x2={x} y1={0} y2={headerHeight + visibleProjects.length * (rowHeight + rowGap)} stroke="rgba(148,163,184,0.4)" strokeWidth={0.5} />
                <text x={x + dayWidth / 2} y={headerHeight / 2 + 4} textAnchor="middle" fontSize={11} fill="var(--foreground, #6b7280)">
                  {tick.date.getDate()}
                </text>
              </g>
            );
          })}
          {/* Rightmost border line */}
          <line x1={labelColumnWidth + dayTicks.length * dayWidth} x2={labelColumnWidth + dayTicks.length * dayWidth} y1={0} y2={headerHeight + visibleProjects.length * (rowHeight + rowGap)} stroke="rgba(148,163,184,0.4)" strokeWidth={0.5} />

          {/* Project rows and tasks */}
          {visibleProjects.map((project, rowIndex) => {
            const yBase = headerHeight + rowIndex * (rowHeight + rowGap);
            const labelBg = project.color || '#64748b';
            const labelFg = getContrastColor(project.color || '#64748b');

            return (
              <g key={project.id}>
                {/* Row separator */}
                <line x1={0} x2={contentWidth} y1={yBase + rowHeight + rowGap / 2} y2={yBase + rowHeight + rowGap / 2} stroke="rgba(148,163,184,0.25)" strokeWidth={0.5} />

                {/* Project label */}
                <rect x={8} y={yBase + 6} width={labelColumnWidth - 16} height={rowHeight - 12} rx={6} ry={6} fill={labelBg} opacity={0.15} />
                <circle cx={20} cy={yBase + rowHeight / 2} r={6} fill={project.color || '#64748b'} />
                <text x={34} y={yBase + rowHeight / 2 + 4} fontSize={12} fill={labelFg} style={{ mixBlendMode: 'normal' }}>
                  {project.name}
                </text>

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
                    const barY = yBase + 10 + (taskIdx % 2) * 14; // simple stagger to reduce overlap
                    const color = statusColor[task.status || 'todo'];
                    return (
                      <g key={task.id}>
                        <rect x={start} y={barY} width={width} height={12} rx={4} ry={4} fill={color} opacity={0.85} />
                        <text x={start + 6} y={barY + 9.5} fontSize={10} fill="#111827" opacity={0.9}>
                          {task.title}
                        </text>
                      </g>
                    );
                  }

                  if (hasDueOnly || hasStartOnly) {
                    const d = new Date(hasDueOnly ? task.dueDate! : task.startDate!);
                    const x = dateToX(d) + dayWidth / 2;
                    const dotY = yBase + rowHeight / 2;
                    const color = statusColor[task.status || 'todo'];
                    return (
                      <g key={task.id}>
                        <circle cx={x} cy={dotY} r={5} fill={color} />
                        <text x={x + 8} y={dotY + 3.5} fontSize={10} fill="var(--foreground, #334155)">
                          {task.title}
                        </text>
                      </g>
                    );
                  }

                  return null;
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}


