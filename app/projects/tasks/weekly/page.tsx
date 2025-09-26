'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { ProjectTask } from '@/types/projects';
import { celebrateAtElement } from '@/lib';
import { cn } from '@/lib/utils';

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = (day === 0 ? -6 : 1) - day; // shift so Monday is start
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function WeeklySchedulerPage() {
  const { projects, updateTaskInProject } = useProjects();

  const [weekStart, setWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));

  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const allTasks = useMemo(() => {
    return projects
      .filter(p => !p.isDeleted)
      .flatMap(project => project.tasks.map(t => ({
        ...t,
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
      })));
  }, [projects]);

  const tasksByDateKey = useMemo(() => {
    const map = new Map<string, Array<ProjectTask & { projectId: string; projectName: string; projectColor: string }>>();
    for (const t of allTasks) {
      const key = t.dueDate || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t as any);
    }
    return map;
  }, [allTasks]);

  const handleTaskDropOnDate = useCallback((date: Date, dataTransfer: DataTransfer | null) => {
    if (!dataTransfer) return;
    try {
      const raw = dataTransfer.getData('application/json');
      if (!raw) return;
      const payload = JSON.parse(raw) as { taskId: string; projectId: string };
      const dateKey = toDateKey(date);
      updateTaskInProject(payload.projectId, payload.taskId, { dueDate: dateKey });
    } catch {}
  }, [updateTaskInProject]);

  const toggleComplete = useCallback((projectId: string, task: ProjectTask, target: HTMLElement) => {
    const next = task.status === 'completed' ? 'todo' : 'completed';
    updateTaskInProject(projectId, task.id, { status: next, completedAt: next === 'completed' ? new Date().toISOString() : undefined });
    if (next === 'completed') {
      try { celebrateAtElement(target); } catch {}
    }
  }, [updateTaskInProject]);

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-light tracking-tight">Weekly Scheduler</h1>
              <span className="bg-muted px-3 py-1.5 text-sm">{formatDayLabel(daysOfWeek[0])} – {formatDayLabel(daysOfWeek[6])}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getStartOfWeek(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)))}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getStartOfWeek(new Date()))}>This Week</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getStartOfWeek(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)))}>Next</Button>
            </div>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Days (drop targets) */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 max-w-7xl mx-auto">
              {daysOfWeek.map((day) => {
                const dayKey = toDateKey(day);
                const dayTasks = tasksByDateKey.get(dayKey) || [];
                return (
                  <div
                    key={dayKey}
                    className="border border-border rounded bg-card/30 min-h-[220px] flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleTaskDropOnDate(day, e.dataTransfer); }}
                  >
                    <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
                      <div className="font-medium text-sm">{formatDayLabel(day)}</div>
                      <div className="text-xs text-muted-foreground">{dayTasks.length}</div>
                    </div>
                    <div className="p-3 space-y-2">
                      {dayTasks.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">Drop tasks here</div>
                      ) : (
                        dayTasks.map((t) => (
                          <div key={t.id} className="border bg-background hover:bg-accent/40 transition-colors px-2 py-1 flex items-center gap-2">
                            <button
                              onClick={(e) => toggleComplete((t as any).projectId, t, e.currentTarget)}
                              className={cn("w-4 h-4 border", t.status === 'completed' ? 'bg-green-500 border-green-600' : 'bg-background')}
                              title={t.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed'}
                            />
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (t as any).projectColor }} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate" title={t.title}>{t.title}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{(t as any).projectName}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Projects & Tasks (draggables) */}
          <div className="w-96 flex-shrink-0 border-l border-border/20 p-6 overflow-y-auto">
            <div className="space-y-4">
              {projects.filter(p => !p.isDeleted).map(project => (
                <div key={project.id} className="border border-border bg-card/40">
                  <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <div className="text-sm font-semibold truncate" title={project.name}>{project.name}</div>
                  </div>
                  <div className="p-3 space-y-2">
                    {project.tasks.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">No tasks</div>
                    ) : (
                      project.tasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, projectId: project.id }));
                          }}
                          className="border bg-background hover:bg-accent/40 transition-colors px-2 py-1 flex items-center gap-2 cursor-grab active:cursor-grabbing"
                          title={task.title}
                        >
                          <button
                            onClick={(e) => toggleComplete(project.id, task, e.currentTarget)}
                            className={cn("w-4 h-4 border", task.status === 'completed' ? 'bg-green-500 border-green-600' : 'bg-background')}
                            title={task.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed'}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{task.title}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{project.name}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


