'use client';

import React, { useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDateKey } from '@/utils/dateUtils';
import { Calendar, Plus, X } from 'lucide-react';

export default function WorkspaceTodayPage() {
  const { projects, updateTaskInProject } = useProjects();

  // Today key
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const dateKey = useMemo(() => getDateKey(today), [today]);

  // Aggregate project tasks due today (project-only view)
  const tasksDueToday = useMemo(() => {
    return projects
      .filter(p => !p.isDeleted)
      .flatMap(p => p.tasks.map(t => ({ ...t, projectId: p.id, projectName: p.name, projectColor: p.color })))
      .filter(t => t.dueDate === dateKey);
  }, [projects, dateKey]);

  // Projects list
  const activeProjects = useMemo(() => projects.filter(p => !p.isDeleted), [projects]);

  const handleDropOnToday = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { taskId?: string; projectId?: string };
      if (payload.taskId && payload.projectId) {
        // Find the project task title
        updateTaskInProject(payload.projectId, payload.taskId, { dueDate: dateKey });
        return;
      }
    } catch {}
  }, [updateTaskInProject, dateKey]);

  const quickAddToToday = useCallback((projectId: string, taskId: string) => {
    updateTaskInProject(projectId, taskId, { dueDate: dateKey });
  }, [updateTaskInProject, dateKey]);

  const toggleComplete = useCallback((projectId: string, taskId: string, current: 'todo' | 'in-progress' | 'completed' | 'blocked') => {
    const next = current === 'completed' ? 'todo' : 'completed';
    updateTaskInProject(projectId, taskId, { status: next });
  }, [updateTaskInProject]);

  const clearToday = useCallback((projectId: string, taskId: string) => {
    updateTaskInProject(projectId, taskId, { dueDate: undefined });
  }, [updateTaskInProject]);

  return (
    <AppLayout>
      <div className="h-full flex overflow-hidden">
        {/* Left: Today vertical list (fixed half width) */}
        <div className="w-1/2 shrink-0 border-r border-border/40 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-card/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <div className="text-lg font-semibold">Today</div>
                <div className="text-sm text-muted-foreground">{today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="text-xs text-muted-foreground">{tasksDueToday.length} tasks</div>
            </div>
          </div>

          {/* Drop target + today list (project tasks only) */}
          <div className="flex-1 p-4 overflow-y-auto" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnToday}>
            {tasksDueToday.length > 0 ? (
              <div className="space-y-2">
                {tasksDueToday.map(t => (
                  <div key={t.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-3 border rounded bg-card px-3 h-12">
                    <button
                      onClick={() => toggleComplete((t as any).projectId, t.id, t.status)}
                      className={cn('w-4 h-4 border rounded', t.status === 'completed' ? 'bg-green-500 border-green-600' : 'bg-background')}
                      title={t.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed'}
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: (t as any).projectColor }} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{(t as any).projectName}</div>
                      </div>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => clearToday((t as any).projectId, t.id)} title="Remove from Today">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full grid place-items-center border border-dashed border-border/60 rounded bg-background/40 text-muted-foreground">
                <div className="text-sm">Drag project tasks here to add to Today</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Projects and tasks (drag sources with quick add) - fixed half width */}
        <div className="w-1/2 shrink-0 p-4 overflow-y-auto">
          <div className="text-sm font-semibold mb-3">Projects</div>
          <div className="space-y-4">
            {activeProjects.map(project => (
              <div key={project.id} className="border border-border rounded bg-card/40">
                <div className="px-3 py-2 border-b border-border/50 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                  <div className="text-sm font-medium truncate" title={project.name}>{project.name}</div>
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
                          e.dataTransfer.effectAllowed = 'move';
                          // Custom small drag image to avoid full-width ghost
                          try {
                            const ghost = document.createElement('div');
                            ghost.textContent = task.title;
                            ghost.style.position = 'fixed';
                            ghost.style.top = '-1000px';
                            ghost.style.left = '-1000px';
                            ghost.style.padding = '4px 8px';
                            ghost.style.fontSize = '12px';
                            ghost.style.background = 'var(--card)';
                            ghost.style.border = '1px solid var(--border)';
                            ghost.style.borderRadius = '6px';
                            ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                            document.body.appendChild(ghost);
                            e.dataTransfer.setDragImage(ghost, 6, 6);
                            setTimeout(() => document.body.removeChild(ghost), 0);
                          } catch {}
                        }}
                        className="border bg-background hover:bg-accent/40 transition-colors px-2 py-1 flex items-center gap-2 rounded"
                        title={task.title}
                      >
                        <div className={cn('w-4 h-4 border', task.status === 'completed' ? 'bg-green-500 border-green-600' : 'bg-background')} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{task.title}</div>
                          {task.dueDate && (
                            <div className="text-[10px] text-muted-foreground truncate">Due {task.dueDate}</div>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => quickAddToToday(project.id, task.id)}>
                          <Plus className="w-3 h-3 mr-1" /> Today
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


