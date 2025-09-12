'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckSquare2, Pause, Play, RotateCcw, Trash2, Plus, GripVertical, Clock, ListChecks } from 'lucide-react';

type FocusTask = {
  id: string;
  title: string;
  done: boolean;
};

type FocusState = {
  // Stopwatch-based session timing
  elapsedSeconds: number;
  isRunning: boolean;
  sessionStartedAt: string | null; // ISO
  // Planned for this session
  planned: FocusTask[];
  // Completed during this session
  completed: FocusTask[];
  // Backlog at right; can be dragged or added into planned
  backlog: FocusTask[];
};

const STORAGE_KEY = 'omega-planner-focus-state-v1';
const SESSIONS_KEY = 'omega-planner-focus-sessions-v1';

const defaultDurationMinutes = 25;

function formatHMS(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function FocusPage() {
  const [state, setState] = useState<FocusState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<FocusState>;
          return {
            elapsedSeconds: parsed.elapsedSeconds ?? 0,
            isRunning: parsed.isRunning ?? false,
            sessionStartedAt: parsed.sessionStartedAt ?? null,
            planned: parsed.planned ?? [],
            completed: parsed.completed ?? [],
            backlog: parsed.backlog ?? [],
          };
        }
      } catch {}
    }
    return {
      elapsedSeconds: 0,
      isRunning: false,
      sessionStartedAt: null,
      planned: [],
      completed: [],
      backlog: [],
    };
  });

  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [newPlannedTitle, setNewPlannedTitle] = useState('');
  const [newCompletedTitle, setNewCompletedTitle] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dragOverZone, setDragOverZone] = useState<'planned' | 'backlog' | null>(null);

  type FocusSession = {
    id: string;
    startedAt: string; // ISO
    endedAt: string;   // ISO
    durationSeconds: number;
    completed: FocusTask[];
  };
  const [sessions, setSessions] = useState<FocusSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SESSIONS_KEY);
        if (raw) return JSON.parse(raw) as FocusSession[];
      } catch {}
    }
    return [];
  });

  // Persist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Stopwatch timer
  useEffect(() => {
    if (!state.isRunning) return;
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + 1,
      }));
    }, 1000);
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const start = () => setState(s => ({ ...s, isRunning: true, sessionStartedAt: s.sessionStartedAt ?? new Date().toISOString() }));
  const pause = () => setState(s => ({ ...s, isRunning: false }));
  const endSession = () => {
    setState(s => {
      if (!s.sessionStartedAt) {
        return { ...s, isRunning: false };
      }
      const session: FocusSession = {
        id: crypto.randomUUID(),
        startedAt: s.sessionStartedAt,
        endedAt: new Date().toISOString(),
        durationSeconds: s.elapsedSeconds,
        completed: [...s.completed],
      };
      const nextSessions = [session, ...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      setSessions(nextSessions);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions)); } catch {}
      }
      return {
        ...s,
        isRunning: false,
        sessionStartedAt: null,
        elapsedSeconds: 0,
        // keep planned/backlog as-is; completed resets for next session
        completed: [],
      };
    });
  };

  // Add completed directly (ad-hoc done item)
  const addCompleted = () => {
    const title = newCompletedTitle.trim();
    if (!title) return;
    setState(s => ({
      ...s,
      completed: [{ id: crypto.randomUUID(), title, done: true }, ...s.completed],
    }));
    setNewCompletedTitle('');
  };

  const addBacklog = () => {
    const title = newBacklogTitle.trim();
    if (!title) return;
    setState(s => ({
      ...s,
      backlog: [{ id: crypto.randomUUID(), title, done: false }, ...s.backlog],
    }));
    setNewBacklogTitle('');
  };

  const addPlanned = () => {
    const title = newPlannedTitle.trim();
    if (!title) return;
    setState(s => ({
      ...s,
      planned: [{ id: crypto.randomUUID(), title, done: false }, ...s.planned],
    }));
    setNewPlannedTitle('');
  };

  const moveBacklogToPlanned = (taskId: string) => {
    setState(s => {
      const task = s.backlog.find(t => t.id === taskId);
      if (!task) return s;
      return {
        ...s,
        backlog: s.backlog.filter(t => t.id !== taskId),
        planned: [{ ...task, done: false }, ...s.planned],
      };
    });
  };

  const completePlanned = (taskId: string) => {
    setState(s => {
      const task = s.planned.find(t => t.id === taskId);
      if (!task) return s;
      const updatedPlanned = s.planned.filter(t => t.id !== taskId);
      return {
        ...s,
        planned: updatedPlanned,
        completed: [{ ...task, done: true }, ...s.completed],
      };
    });
  };

  const returnPlannedToBacklog = (taskId: string) => {
    setState(s => {
      const task = s.planned.find(t => t.id === taskId);
      if (!task) return s;
      return {
        ...s,
        planned: s.planned.filter(t => t.id !== taskId),
        backlog: [{ ...task, done: false }, ...s.backlog],
      };
    });
  };

  const deleteBacklog = (taskId: string) => setState(s => ({ ...s, backlog: s.backlog.filter(t => t.id !== taskId) }));
  const deletePlanned = (taskId: string) => setState(s => ({ ...s, planned: s.planned.filter(t => t.id !== taskId) }));
  const deleteCompleted = (taskId: string) => setState(s => ({ ...s, completed: s.completed.filter(t => t.id !== taskId) }));

  const isOver = state.secondsRemaining === 0;

  // --- Drag & Drop (native HTML5) ---
  const handleTaskDragStart = (source: 'planned' | 'backlog', taskId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-focus-task', JSON.stringify({ source, taskId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (zone: 'planned' | 'backlog') => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverZone !== zone) setDragOverZone(zone);
  };

  const handleDragLeave = (zone: 'planned' | 'backlog') => () => {
    if (dragOverZone === zone) setDragOverZone(null);
  };

  const handleDropTo = (zone: 'planned' | 'backlog') => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
    const raw = e.dataTransfer.getData('application/x-focus-task');
    if (!raw) return;
    try {
      const { source, taskId } = JSON.parse(raw) as { source: 'planned' | 'backlog'; taskId: string };
      if (!taskId || source === zone) return;
      if (source === 'backlog' && zone === 'planned') {
        moveBacklogToPlanned(taskId);
      } else if (source === 'planned' && zone === 'backlog') {
        returnPlannedToBacklog(taskId);
      }
    } catch {}
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ListChecks className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold">Focus</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {state.sessionStartedAt ? new Date(state.sessionStartedAt).toLocaleString() : 'No active session'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 py-6 flex-1 overflow-y-auto">
          {/* Timer / Controls */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card/50">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div className="font-mono text-3xl">{formatHMS(state.elapsedSeconds)}</div>
              <div className="flex items-center gap-2">
                {!state.isRunning ? (
                  <Button size="sm" onClick={start} className="flex items-center gap-1">
                    <Play className="w-4 h-4" /> Start
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={pause} className="flex items-center gap-1">
                    <Pause className="w-4 h-4" /> Pause
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={endSession} className="flex items-center gap-1">
                  <RotateCcw className="w-4 h-4" /> End Session
                </Button>
              </div>
            </div>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Planned for session */}
            <div className="border border-border rounded-lg bg-card/50">
              <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Planned this session</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={newPlannedTitle}
                    onChange={(e) => setNewPlannedTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addPlanned(); }}
                    placeholder="Add planned task..."
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={addPlanned} className="h-8 px-2"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div
                className={cn(
                  "p-3 space-y-2 transition-colors",
                  dragOverZone === 'planned' && 'ring-2 ring-primary/40 rounded-lg bg-primary/5'
                )}
                onDragOver={handleDragOver('planned')}
                onDragEnter={handleDragOver('planned')}
                onDragLeave={handleDragLeave('planned')}
                onDrop={handleDropTo('planned')}
              >
                {state.planned.length === 0 && (
                  <div className="text-xs text-muted-foreground">No planned tasks. Add or pull from backlog →</div>
                )}
                {state.planned.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 border border-border/40 bg-background rounded"
                    draggable
                    onDragStart={handleTaskDragStart('planned', t.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => completePlanned(t.id)} title="Mark done" className="h-7 w-7 p-0">
                        <CheckSquare2 className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => returnPlannedToBacklog(t.id)} title="Return to backlog" className="h-7 w-7 p-0">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePlanned(t.id)} title="Remove" className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed in this session */}
            <div className="border border-border rounded-lg bg-card/50">
              <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Completed this session</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={newCompletedTitle}
                    onChange={(e) => setNewCompletedTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addCompleted(); }}
                    placeholder="Add thing you just did..."
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={addCompleted} className="h-8 px-2"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {state.completed.length === 0 && (
                  <div className="text-xs text-muted-foreground">Nothing completed yet.</div>
                )}
                {state.completed.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 border border-border/40 bg-background rounded">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckSquare2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm truncate line-through text-muted-foreground">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => deleteCompleted(t.id)} title="Remove" className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backlog (session ideas) */}
            <div className="border border-border rounded-lg bg-card/50">
              <div className="p-3 border-b border-border/40 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Backlog</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={newBacklogTitle}
                    onChange={(e) => setNewBacklogTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addBacklog(); }}
                    placeholder="Add backlog item..."
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={addBacklog} className="h-8 px-2"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
              <div
                className={cn(
                  "p-3 space-y-2 transition-colors",
                  dragOverZone === 'backlog' && 'ring-2 ring-primary/40 rounded-lg bg-primary/5'
                )}
                onDragOver={handleDragOver('backlog')}
                onDragEnter={handleDragOver('backlog')}
                onDragLeave={handleDragLeave('backlog')}
                onDrop={handleDropTo('backlog')}
              >
                {state.backlog.length === 0 && (
                  <div className="text-xs text-muted-foreground">No backlog yet. Add ideas here.</div>
                )}
                {state.backlog.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 border border-border/40 bg-background rounded"
                    draggable
                    onDragStart={handleTaskDragStart('backlog', t.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => moveBacklogToPlanned(t.id)} title="Add to session" className="h-7 w-7 p-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteBacklog(t.id)} title="Remove" className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sessions History */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-2">Past Sessions</h3>
            {sessions.length === 0 ? (
              <div className="text-xs text-muted-foreground">No sessions recorded yet.</div>
            ) : (
              <div className="space-y-2">
                {sessions.map(ses => (
                  <div key={ses.id} className="p-3 border border-border rounded bg-card/50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{new Date(ses.startedAt).toLocaleString()}</span>
                        <span className="text-muted-foreground"> → {new Date(ses.endedAt).toLocaleString()}</span>
                      </div>
                      <div className="text-sm font-mono">{formatHMS(ses.durationSeconds)}</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {ses.completed.length} task{ses.completed.length === 1 ? '' : 's'} completed
                      {ses.completed.length > 0 && (
                        <span className="block mt-1 text-foreground">
                          {ses.completed.slice(0, 5).map(t => t.title).join(', ')}{ses.completed.length > 5 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


