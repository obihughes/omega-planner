'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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

  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    return weekStart.getTime() === currentWeekStart.getTime();
  }, [weekStart]);

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
        {/* Enhanced Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-foreground">Weekly Goals</h1>
                  <p className="text-sm text-muted-foreground mt-1 hidden sm:block">Plan and organize your weekly tasks</p>
                </div>
                <div className={cn(
                  "px-3 lg:px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 self-start sm:self-auto",
                  isCurrentWeek
                    ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border/30"
                )}>
                  <span className="hidden sm:inline">{formatDayLabel(daysOfWeek[0])} – {formatDayLabel(daysOfWeek[6])}</span>
                  <span className="sm:hidden">{formatDayLabel(daysOfWeek[0])} – {formatDayLabel(daysOfWeek[6])}</span>
                  {isCurrentWeek && <span className="ml-2 text-xs">• Current</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-3 self-end lg:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekStart(getStartOfWeek(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)))}
                  className="shadow-sm hover:shadow-md transition-all duration-200 text-xs lg:text-sm"
                >
                  <span className="hidden sm:inline">← Previous</span>
                  <span className="sm:hidden">←</span>
                </Button>
                <Button
                  variant={isCurrentWeek ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWeekStart(getStartOfWeek(new Date()))}
                  className={cn(
                    "shadow-sm hover:shadow-md transition-all duration-200 text-xs lg:text-sm",
                    isCurrentWeek && "ring-2 ring-primary/20"
                  )}
                >
                  <span className="hidden sm:inline">This Week</span>
                  <span className="sm:hidden">Today</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekStart(getStartOfWeek(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)))}
                  className="shadow-sm hover:shadow-md transition-all duration-200 text-xs lg:text-sm"
                >
                  <span className="hidden sm:inline">Next →</span>
                  <span className="sm:hidden">→</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Days (drop targets) */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 p-4 lg:p-6 max-w-7xl mx-auto">
              {daysOfWeek.map((day) => {
                const dayKey = toDateKey(day);
                const dayTasks = tasksByDateKey.get(dayKey) || [];
                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <Card
                    key={dayKey}
                    className={cn(
                      "min-h-[280px] flex flex-col transition-all duration-300 hover:shadow-lg",
                      isToday && "ring-2 ring-green-500 border-2 border-green-500/20"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleTaskDropOnDate(day, e.dataTransfer); }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "font-semibold text-base",
                            isToday ? "text-primary" : "text-foreground"
                          )}>
                            {formatDayLabel(day)}
                          </div>
                          {isToday && (
                            <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              Today
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            dayTasks.length > 0
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-0">
                      <div className="space-y-3">
                        {dayTasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <div className="text-sm text-muted-foreground">Drop tasks here</div>
                          </div>
                        ) : (
                          dayTasks.map((t) => (
                            <div key={t.id} className="border bg-background hover:bg-accent/40 transition-colors px-3 py-2 flex items-center gap-3 rounded-lg shadow-sm">
                              <button
                                onClick={(e) => toggleComplete((t as any).projectId, t, e.currentTarget)}
                                className={cn("w-4 h-4 border rounded transition-colors", t.status === 'completed' ? 'bg-green-500 border-green-600' : 'bg-background hover:border-primary/50')}
                                title={t.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed'}
                              />
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: (t as any).projectColor }} />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium truncate" title={t.title}>{t.title}</div>
                                <div className="text-xs text-muted-foreground truncate">{(t as any).projectName}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Enhanced Right: Projects & Tasks (draggables) */}
          <div className="w-full lg:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border/30 bg-muted/20 p-4 lg:p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Projects</h2>
                <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
                  {projects.filter(p => !p.isDeleted).length} projects
                </div>
              </div>

              {projects.filter(p => !p.isDeleted).map(project => {
                const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
                const totalTasks = project.tasks.length;

                return (
                  <Card key={project.id} className="shadow-sm hover:shadow-md transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full shadow-sm border-2 border-white"
                            style={{ backgroundColor: project.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate" title={project.name}>
                              {project.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {completedTasks}/{totalTasks} tasks completed
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {project.tasks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="text-xs text-muted-foreground">No tasks yet</div>
                          </div>
                        ) : (
                          project.tasks.map(task => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, projectId: project.id }));
                              }}
                              className={cn(
                                "border bg-background hover:bg-accent/40 transition-all duration-200 px-3 py-2 flex items-center gap-3 cursor-grab active:cursor-grabbing rounded-lg shadow-sm hover:shadow-md",
                                task.status === 'completed' && "opacity-60"
                              )}
                              title={task.title}
                            >
                              <button
                                onClick={(e) => toggleComplete(project.id, task, e.currentTarget)}
                                className={cn(
                                  "w-4 h-4 border rounded transition-colors flex-shrink-0",
                                  task.status === 'completed'
                                    ? 'bg-green-500 border-green-600'
                                    : 'bg-background hover:border-primary/50'
                                )}
                                title={task.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed'}
                              />
                              <div className="min-w-0 flex-1">
                                <div className={cn(
                                  "text-sm font-medium truncate",
                                  task.status === 'completed' && "line-through text-muted-foreground"
                                )}>
                                  {task.title}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


