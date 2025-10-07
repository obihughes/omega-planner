'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getDateKey } from '@/utils/dateUtils';
import { 
  Calendar, Plus, X, Play, Pause, RotateCcw, Clock, 
  CheckSquare2, GripVertical, Trash2, Square, Bell, BellOff 
} from 'lucide-react';

// Simple task type (non-project tasks)
type SimpleTask = {
  id: string;
  title: string;
  done: boolean;
};

type SessionState = {
  elapsedSeconds: number;
  isRunning: boolean;
  sessionStartedAt: string | null;
  lastResumedAt: string | null;
  // Simple tasks planned for today
  plannedTasks: SimpleTask[];
  // Completed tasks (both simple and project tasks)
  completedTasks: SimpleTask[];
  // Backlog of simple tasks
  backlogTasks: SimpleTask[];
};

type FocusSession = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  completed: SimpleTask[];
};

const STORAGE_KEY = 'omega-planner-workspace-today-v1';
const SESSIONS_KEY = 'omega-planner-workspace-sessions-v1';
const SESSION_TARGET_KEY = 'omega-planner-workspace-target-v1';
const SOUND_ENABLED_KEY = 'omega-planner-workspace-sound-v1';

function formatHMS(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkspaceTodayPage() {
  const { projects, updateTaskInProject } = useProjects();

  // Session state
  const defaultState: SessionState = {
    elapsedSeconds: 0,
    isRunning: false,
    sessionStartedAt: null,
    lastResumedAt: null,
    plannedTasks: [],
    completedTasks: [],
    backlogTasks: [],
  };

  const [sessionState, setSessionState] = useState<SessionState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [targetSeconds, setTargetSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [tick, setTick] = useState<number>(0);
  const [showPastSessions, setShowPastSessions] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const notifiedFiveRef = useRef<boolean>(false);
  const notifiedTimeUpRef = useRef<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // Input states
  const [newPlannedTitle, setNewPlannedTitle] = useState('');
  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [dragOverZone, setDragOverZone] = useState<'planned' | 'backlog' | null>(null);

  // Today key
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const dateKey = useMemo(() => getDateKey(today), [today]);

  // Project tasks due today
  const projectTasksDueToday = useMemo(() => {
    return projects
      .filter(p => !p.isDeleted)
      .flatMap(p => p.tasks.map(t => ({ ...t, projectId: p.id, projectName: p.name, projectColor: p.color })))
      .filter(t => t.dueDate === dateKey);
  }, [projects, dateKey]);

  // Active projects
  const activeProjects = useMemo(() => projects.filter(p => !p.isDeleted), [projects]);

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SessionState>;
        setSessionState(prev => ({
          elapsedSeconds: typeof parsed.elapsedSeconds === 'number' ? parsed.elapsedSeconds : prev.elapsedSeconds,
          isRunning: typeof parsed.isRunning === 'boolean' ? parsed.isRunning : prev.isRunning,
          sessionStartedAt: typeof parsed.sessionStartedAt === 'string' ? parsed.sessionStartedAt : prev.sessionStartedAt,
          lastResumedAt: typeof parsed.lastResumedAt === 'string' ? parsed.lastResumedAt : null,
          plannedTasks: Array.isArray(parsed.plannedTasks) ? parsed.plannedTasks : prev.plannedTasks,
          completedTasks: Array.isArray(parsed.completedTasks) ? parsed.completedTasks : prev.completedTasks,
          backlogTasks: Array.isArray(parsed.backlogTasks) ? parsed.backlogTasks : prev.backlogTasks,
        }));
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) setSessions(JSON.parse(raw) as FocusSession[]);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SESSION_TARGET_KEY);
      if (raw != null) {
        const v = parseInt(raw, 10);
        if (!Number.isNaN(v) && v >= 0) setTargetSeconds(v);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SOUND_ENABLED_KEY);
      if (raw != null) setSoundEnabled(raw === '1' || raw === 'true');
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    if (typeof window !== 'undefined' && loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionState));
    }
  }, [sessionState, loaded]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(SESSION_TARGET_KEY, String(targetSeconds)); } catch {}
    }
  }, [targetSeconds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(SOUND_ENABLED_KEY, soundEnabled ? '1' : '0'); } catch {}
    }
  }, [soundEnabled]);

  // Calculate displayed elapsed time
  const displayedElapsedSeconds = useMemo(() => {
    if (sessionState.isRunning && sessionState.lastResumedAt) {
      const sinceMs = Date.now() - new Date(sessionState.lastResumedAt).getTime();
      const extra = Math.max(0, Math.floor(sinceMs / 1000));
      return sessionState.elapsedSeconds + extra;
    }
    return sessionState.elapsedSeconds;
  }, [sessionState.elapsedSeconds, sessionState.isRunning, sessionState.lastResumedAt, tick]);

  // Timer tick
  useEffect(() => {
    if (!sessionState.isRunning) return;
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTick(v => (v + 1) % 1_000_000);
    }, 1000);
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [sessionState.isRunning]);

  // Audio context
  const ensureAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined' || !soundEnabled) return null;
    if (!audioCtxRef.current) {
      const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtxRef.current = new AudioCtx();
    }
    try { audioCtxRef.current.resume(); } catch {}
    return audioCtxRef.current;
  };

  const playTone = (frequency: number, durationMs: number, volume = 0.05) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000);
  };

  const playBeep = (kind: 'warning' | 'timeup') => {
    if (!soundEnabled) return;
    if (kind === 'warning') {
      playTone(880, 200);
      setTimeout(() => playTone(880, 200), 250);
    } else {
      playTone(660, 180);
      setTimeout(() => playTone(880, 180), 220);
      setTimeout(() => playTone(660, 220), 440);
    }
  };

  const playSuccessChime = () => {
    if (!soundEnabled) return;
    playTone(880, 120, 0.06);
    setTimeout(() => playTone(1175, 140, 0.06), 130);
    setTimeout(() => playTone(1568, 180, 0.05), 300);
  };

  const spawnConfettiAt = (x: number, y: number) => {
    if (typeof document === 'undefined') return;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    const colors = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#8338EC'];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      const w = 6 + Math.random() * 4;
      const h = 8 + Math.random() * 6;
      piece.style.position = 'absolute';
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.width = `${w}px`;
      piece.style.height = `${h}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.opacity = '1';
      piece.style.transform = `translate3d(0,0,0) rotate(${Math.floor(Math.random() * 360)}deg)`;
      piece.style.transition = 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms linear';
      piece.style.willChange = 'transform, opacity';
      container.appendChild(piece);

      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 120;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance * 1.2 + 10;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          piece.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${Math.floor(Math.random() * 360)}deg)`;
          piece.style.opacity = '0';
        });
      });
    }

    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 900);
  };

  const spawnConfettiFromElement = (el: HTMLElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    spawnConfettiAt(x, y);
  };

  // Notifications
  useEffect(() => {
    if (!sessionState.isRunning || targetSeconds <= 0) return;
    const remaining = targetSeconds - displayedElapsedSeconds;
    if (targetSeconds >= 300 && remaining <= 300 && remaining > 0 && !notifiedFiveRef.current) {
      playBeep('warning');
      notifiedFiveRef.current = true;
    }
    if (displayedElapsedSeconds >= targetSeconds && !notifiedTimeUpRef.current) {
      playBeep('timeup');
      notifiedTimeUpRef.current = true;
    }
  }, [displayedElapsedSeconds, sessionState.isRunning, targetSeconds]);

  useEffect(() => {
    notifiedFiveRef.current = false;
    notifiedTimeUpRef.current = false;
  }, [targetSeconds]);

  // Wake lock
  useEffect(() => {
    let cancelled = false;
    const requestWakeLock = async () => {
      try {
        if ((navigator as any).wakeLock && sessionState.isRunning && document.visibilityState === 'visible' && !cancelled && !wakeLockRef.current) {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current = sentinel;
          sentinel.addEventListener?.('release', () => {
            wakeLockRef.current = null;
          });
        }
      } catch {}
    };
    requestWakeLock();
    if (!sessionState.isRunning && wakeLockRef.current) {
      try { wakeLockRef.current.release(); } catch {}
      wakeLockRef.current = null;
    }
    return () => {
      cancelled = true;
    };
  }, [sessionState.isRunning]);

  useEffect(() => {
    const onVisibility = async () => {
      if ((navigator as any).wakeLock) {
        if (document.visibilityState === 'visible' && sessionState.isRunning && !wakeLockRef.current) {
          try {
            const sentinel = await (navigator as any).wakeLock.request('screen');
            wakeLockRef.current = sentinel;
            sentinel.addEventListener?.('release', () => {
              wakeLockRef.current = null;
            });
          } catch {}
        } else if (document.visibilityState !== 'visible' && wakeLockRef.current) {
          try { wakeLockRef.current.release(); } catch {}
          wakeLockRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (wakeLockRef.current) {
        try { wakeLockRef.current.release(); } catch {}
        wakeLockRef.current = null;
      }
    };
  }, [sessionState.isRunning]);

  // Session controls
  const startSession = () => {
    ensureAudioContext();
    notifiedFiveRef.current = false;
    notifiedTimeUpRef.current = false;
    setSessionState(s => ({
      ...s,
      isRunning: true,
      sessionStartedAt: s.sessionStartedAt ?? new Date().toISOString(),
      lastResumedAt: new Date().toISOString(),
    }));
  };

  const pauseSession = () => setSessionState(s => {
    if (!s.isRunning) return s;
    const lastMs = s.lastResumedAt ? new Date(s.lastResumedAt).getTime() : 0;
    const extra = lastMs ? Math.max(0, Math.floor((Date.now() - lastMs) / 1000)) : 0;
    return { ...s, isRunning: false, elapsedSeconds: s.elapsedSeconds + extra, lastResumedAt: null };
  });

  const endSession = () => {
    notifiedFiveRef.current = false;
    notifiedTimeUpRef.current = false;
    setSessionState(s => {
      if (!s.sessionStartedAt) {
        return { ...s, isRunning: false, lastResumedAt: null };
      }
      const lastMs = s.lastResumedAt ? new Date(s.lastResumedAt).getTime() : 0;
      const extra = s.isRunning && lastMs ? Math.max(0, Math.floor((Date.now() - lastMs) / 1000)) : 0;
      const total = s.elapsedSeconds + extra;
      const session: FocusSession = {
        id: crypto.randomUUID(),
        startedAt: s.sessionStartedAt,
        endedAt: new Date().toISOString(),
        durationSeconds: total,
        completed: [...s.completedTasks],
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
        lastResumedAt: null,
        completedTasks: [],
      };
    });
  };

  // Simple task management
  const addPlannedTask = () => {
    const title = newPlannedTitle.trim();
    if (!title) return;
    setSessionState(s => ({
      ...s,
      plannedTasks: [{ id: crypto.randomUUID(), title, done: false }, ...s.plannedTasks],
    }));
    setNewPlannedTitle('');
  };

  const addBacklogTask = () => {
    const title = newBacklogTitle.trim();
    if (!title) return;
    setSessionState(s => ({
      ...s,
      backlogTasks: [{ id: crypto.randomUUID(), title, done: false }, ...s.backlogTasks],
    }));
    setNewBacklogTitle('');
  };

  const completePlannedTask = (taskId: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    try { spawnConfettiFromElement(e.currentTarget as unknown as HTMLElement); } catch {}
    try { playSuccessChime(); } catch {}
    setSessionState(s => {
      const task = s.plannedTasks.find(t => t.id === taskId);
      if (!task) return s;
      return {
        ...s,
        plannedTasks: s.plannedTasks.filter(t => t.id !== taskId),
        completedTasks: [{ ...task, done: true }, ...s.completedTasks],
      };
    });
  };

  const deletePlannedTask = (taskId: string) => {
    setSessionState(s => ({ ...s, plannedTasks: s.plannedTasks.filter(t => t.id !== taskId) }));
  };

  const deleteBacklogTask = (taskId: string) => {
    setSessionState(s => ({ ...s, backlogTasks: s.backlogTasks.filter(t => t.id !== taskId) }));
  };

  const deleteCompletedTask = (taskId: string) => {
    setSessionState(s => ({ ...s, completedTasks: s.completedTasks.filter(t => t.id !== taskId) }));
  };

  const moveBacklogToPlanned = (taskId: string) => {
    setSessionState(s => {
      const task = s.backlogTasks.find(t => t.id === taskId);
      if (!task) return s;
      return {
        ...s,
        backlogTasks: s.backlogTasks.filter(t => t.id !== taskId),
        plannedTasks: [{ ...task, done: false }, ...s.plannedTasks],
      };
    });
  };

  const returnPlannedToBacklog = (taskId: string) => {
    setSessionState(s => {
      const task = s.plannedTasks.find(t => t.id === taskId);
      if (!task) return s;
      return {
        ...s,
        plannedTasks: s.plannedTasks.filter(t => t.id !== taskId),
        backlogTasks: [{ ...task, done: false }, ...s.backlogTasks],
      };
    });
  };

  // Drag and drop for simple tasks
  const handleTaskDragStart = (source: 'planned' | 'backlog', taskId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-simple-task', JSON.stringify({ source, taskId }));
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
    const raw = e.dataTransfer.getData('application/x-simple-task');
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

  // Project task management
  const handleDropProjectTaskOnToday = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { taskId?: string; projectId?: string };
      if (payload.taskId && payload.projectId) {
        updateTaskInProject(payload.projectId, payload.taskId, { dueDate: dateKey });
        return;
      }
    } catch {}
  }, [updateTaskInProject, dateKey]);

  const quickAddToToday = useCallback((projectId: string, taskId: string) => {
    updateTaskInProject(projectId, taskId, { dueDate: dateKey });
  }, [updateTaskInProject, dateKey]);

  const toggleProjectTaskComplete = useCallback((projectId: string, taskId: string, current: 'todo' | 'in-progress' | 'completed' | 'blocked') => {
    const next = current === 'completed' ? 'todo' : 'completed';
    updateTaskInProject(projectId, taskId, { status: next });
  }, [updateTaskInProject]);

  const clearProjectTaskFromToday = useCallback((projectId: string, taskId: string) => {
    updateTaskInProject(projectId, taskId, { dueDate: undefined });
  }, [updateTaskInProject]);

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Timer Header */}
        <div className="border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <h1 className="text-xl font-bold">Today</h1>
                <div className="text-sm text-muted-foreground">
                  {today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="font-mono text-xl min-w-[60px]">
                  {loaded ? (targetSeconds > 0 ? formatHMS(Math.max(0, targetSeconds - displayedElapsedSeconds)) : formatHMS(displayedElapsedSeconds)) : '00:00'}
                </div>
                {!sessionState.isRunning ? (
                  <Button size="sm" onClick={startSession} className="h-8">
                    <Play className="w-3 h-3 mr-1" /> Start
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={pauseSession} className="h-8">
                    <Pause className="w-3 h-3 mr-1" /> Pause
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={endSession} className="h-8">
                  <RotateCcw className="w-3 h-3 mr-1" /> End
                </Button>

                {/* Target buttons */}
                <div className="flex items-center gap-1 ml-2">
                  <Button size="sm" variant={targetSeconds === 25 * 60 ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setTargetSeconds(25 * 60)}>25m</Button>
                  <Button size="sm" variant={targetSeconds === 45 * 60 ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setTargetSeconds(45 * 60)}>45m</Button>
                  <Button size="sm" variant={targetSeconds === 60 * 60 ? 'secondary' : 'ghost'} className="h-7 px-2 text-xs" onClick={() => setTargetSeconds(60 * 60)}>60m</Button>
                </div>

                <Button size="sm" variant="ghost" onClick={() => setSoundEnabled(v => !v)} className="h-7 w-7 p-0" title={soundEnabled ? 'Sound enabled' : 'Sound disabled'}>
                  {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            {targetSeconds > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full border border-border/50 rounded-full overflow-hidden bg-background/40">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.floor((displayedElapsedSeconds / targetSeconds) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Today's Tasks */}
          <div className="w-1/2 shrink-0 border-r border-border/40 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Planned Simple Tasks */}
              <div className="border border-border rounded-lg bg-card/50">
                <div className="p-3 border-b border-border/40 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Planned Tasks</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newPlannedTitle}
                      onChange={(e) => setNewPlannedTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addPlannedTask(); }}
                      placeholder="Add task..."
                      className="h-8 text-sm w-48"
                    />
                    <Button size="sm" onClick={addPlannedTask} className="h-8 px-2"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div
                  className={cn(
                    "p-3 space-y-2 min-h-[100px] transition-colors",
                    dragOverZone === 'planned' && 'ring-2 ring-primary/40 rounded-lg bg-primary/5'
                  )}
                  onDragOver={handleDragOver('planned')}
                  onDragEnter={handleDragOver('planned')}
                  onDragLeave={handleDragLeave('planned')}
                  onDrop={handleDropTo('planned')}
                >
                  {sessionState.plannedTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground">No planned tasks. Add above or drag from backlog.</div>
                  )}
                  {sessionState.plannedTasks.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 border border-border/40 bg-background rounded hover:bg-accent/20 transition-colors"
                      draggable
                      onDragStart={handleTaskDragStart('planned', t.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button size="sm" variant="ghost" onClick={completePlannedTask(t.id)} title="Complete" className="h-7 w-7 p-0">
                          <Square className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => returnPlannedToBacklog(t.id)} title="Move to backlog" className="h-7 w-7 p-0">
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deletePlannedTask(t.id)} title="Delete" className="h-7 w-7 p-0 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Tasks Due Today */}
              <div className="border border-border rounded-lg bg-card/50">
                <div className="p-3 border-b border-border/40">
                  <h2 className="text-sm font-semibold">Project Tasks Due Today</h2>
                  <div className="text-xs text-muted-foreground mt-1">{projectTasksDueToday.length} tasks</div>
                </div>
                <div
                  className="p-3 space-y-2 min-h-[100px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropProjectTaskOnToday}
                >
                  {projectTasksDueToday.length === 0 && (
                    <div className="text-xs text-muted-foreground">No project tasks due today. Drag from projects →</div>
                  )}
                  {projectTasksDueToday.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2 border border-border/40 bg-background rounded">
                      <button
                        onClick={() => toggleProjectTaskComplete((t as any).projectId, t.id, t.status)}
                        className={cn('w-4 h-4 border rounded flex-shrink-0', t.status === 'completed' ? 'bg-green-500 border-green-600' : 'bg-background')}
                        title={t.status === 'completed' ? 'Mark as To Do' : 'Mark as Completed'}
                      />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (t as any).projectColor }} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{t.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{(t as any).projectName}</div>
                        </div>
                      </div>
                      <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => clearProjectTaskFromToday((t as any).projectId, t.id)} title="Remove from Today">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="border border-border rounded-lg bg-card/50">
                <div className="p-3 border-b border-border/40">
                  <h2 className="text-sm font-semibold">Completed</h2>
                </div>
                <div className="p-3 space-y-2">
                  {sessionState.completedTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground">Nothing completed yet.</div>
                  )}
                  {sessionState.completedTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 border border-border/40 bg-background rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckSquare2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm truncate line-through text-muted-foreground">{t.title}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => deleteCompletedTask(t.id)} title="Remove" className="h-7 w-7 p-0 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Backlog */}
              <div className="border border-border rounded-lg bg-card/50">
                <div className="p-3 border-b border-border/40 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Backlog</h2>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newBacklogTitle}
                      onChange={(e) => setNewBacklogTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addBacklogTask(); }}
                      placeholder="Add backlog item..."
                      className="h-8 text-sm w-48"
                    />
                    <Button size="sm" onClick={addBacklogTask} className="h-8 px-2"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div
                  className={cn(
                    "p-3 space-y-2 min-h-[80px] transition-colors",
                    dragOverZone === 'backlog' && 'ring-2 ring-primary/40 rounded-lg bg-primary/5'
                  )}
                  onDragOver={handleDragOver('backlog')}
                  onDragEnter={handleDragOver('backlog')}
                  onDragLeave={handleDragLeave('backlog')}
                  onDrop={handleDropTo('backlog')}
                >
                  {sessionState.backlogTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground">No backlog items yet.</div>
                  )}
                  {sessionState.backlogTasks.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 border border-border/40 bg-background rounded hover:bg-accent/20 transition-colors"
                      draggable
                      onDragStart={handleTaskDragStart('backlog', t.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button size="sm" variant="ghost" onClick={() => moveBacklogToPlanned(t.id)} title="Move to planned" className="h-7 w-7 p-0">
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteBacklogTask(t.id)} title="Delete" className="h-7 w-7 p-0 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Projects (drag sources) */}
          <div className="w-1/2 shrink-0 p-4 overflow-y-auto overflow-x-hidden">
            <div className="text-sm font-semibold mb-3">Projects</div>
            <div className="space-y-3">
              {activeProjects.map(project => (
                <div key={project.id} className="border border-border rounded bg-card/40 overflow-hidden">
                  <div className="px-2.5 py-1.5 border-b border-border/50 flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                    <div className="text-xs font-medium truncate" title={project.name}>{project.name}</div>
                  </div>
                  <div className="p-2 space-y-1.5">
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
                          className="border bg-background hover:bg-accent/40 transition-colors px-1.5 py-1 flex items-center gap-1.5 rounded cursor-move min-w-0"
                          title={task.title}
                        >
                          <div className={cn('w-3.5 h-3.5 border flex-shrink-0', task.status === 'completed' ? 'bg-green-500 border-green-600' : 'bg-background')} />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-xs font-medium truncate" title={task.title}>{task.title}</div>
                            {task.dueDate && (
                              <div className="text-[9px] text-muted-foreground truncate">Due {task.dueDate}</div>
                            )}
                          </div>
                          <Button size="sm" variant="outline" className="h-6 px-1.5 text-[10px] flex-shrink-0" onClick={(e) => { e.stopPropagation(); quickAddToToday(project.id, task.id); }}>
                            <Plus className="w-2.5 h-2.5" />
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
      </div>
    </AppLayout>
  );
}
