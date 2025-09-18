'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckSquare2, Pause, Play, RotateCcw, Trash2, Plus, GripVertical, Clock, ListChecks, Bell, BellOff } from 'lucide-react';

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
const PAST_SESSIONS_OPEN_KEY = 'omega-planner-focus-show-past-v1';
const SESSION_TARGET_KEY = 'omega-planner-focus-target-seconds-v1';
const SOUND_ENABLED_KEY = 'omega-planner-focus-sound-enabled-v1';

function formatHMS(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatTimeRangeParts(startIso: string, endIso: string): { time: string; dayLabel: string } {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const time = `${start.toLocaleTimeString([], timeOptions)} – ${end.toLocaleTimeString([], timeOptions)}`;

  const isSameDay = (a: Date, b: Date) => (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );

  let dayLabel = '';
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(start, end)) {
    if (isSameDay(start, now)) dayLabel = 'Today';
    else if (isSameDay(start, yesterday)) dayLabel = 'Yesterday';
    else dayLabel = start.toLocaleDateString();
  } else {
    dayLabel = `${start.toLocaleDateString()} → ${end.toLocaleDateString()}`;
  }

  return { time, dayLabel };
}

export default function FocusPage() {
  const defaultState: FocusState = {
    elapsedSeconds: 0,
    isRunning: false,
    sessionStartedAt: null,
    planned: [],
    completed: [],
    backlog: [],
  };
  const [state, setState] = useState<FocusState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [newPlannedTitle, setNewPlannedTitle] = useState('');
  const [newCompletedTitle, setNewCompletedTitle] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dragOverZone, setDragOverZone] = useState<'planned' | 'backlog' | null>(null);
  const [targetSeconds, setTargetSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const notifiedFiveRef = useRef<boolean>(false);
  const notifiedTimeUpRef = useRef<boolean>(false);

  type FocusSession = {
    id: string;
    startedAt: string; // ISO
    endedAt: string;   // ISO
    durationSeconds: number;
    completed: FocusTask[];
  };
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [showPastSessions, setShowPastSessions] = useState<boolean>(false);

  // Load persisted state after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FocusState>;
        setState(prev => ({
          elapsedSeconds: typeof parsed.elapsedSeconds === 'number' ? parsed.elapsedSeconds : prev.elapsedSeconds,
          isRunning: typeof parsed.isRunning === 'boolean' ? parsed.isRunning : prev.isRunning,
          sessionStartedAt: typeof parsed.sessionStartedAt === 'string' ? parsed.sessionStartedAt : prev.sessionStartedAt,
          planned: Array.isArray(parsed.planned) ? parsed.planned as FocusTask[] : prev.planned,
          completed: Array.isArray(parsed.completed) ? parsed.completed as FocusTask[] : prev.completed,
          backlog: Array.isArray(parsed.backlog) ? parsed.backlog as FocusTask[] : prev.backlog,
        }));
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Load sessions after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) setSessions(JSON.parse(raw) as FocusSession[]);
    } catch {}
    setSessionsLoaded(true);
  }, []);

  // Load Past Sessions visibility preference after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(PAST_SESSIONS_OPEN_KEY);
      if (raw != null) setShowPastSessions(raw === '1' || raw === 'true');
    } catch {}
  }, []);

  // Load session target after mount
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

  // Load sound enabled after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SOUND_ENABLED_KEY);
      if (raw != null) setSoundEnabled(raw === '1' || raw === 'true');
    } catch {}
  }, []);

  // --- Session editing state ---
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionEditStarted, setSessionEditStarted] = useState<string>(''); // datetime-local
  const [sessionEditEnded, setSessionEditEnded] = useState<string>('');     // datetime-local
  const [sessionEditCompleted, setSessionEditCompleted] = useState<FocusTask[]>([]);
  const [sessionEditNewCompletedTitle, setSessionEditNewCompletedTitle] = useState<string>('');

  const toLocalDateTimeInput = (iso: string): string => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const fromLocalDateTimeInputToISO = (local: string): string | null => {
    if (!local) return null;
    // local is in user's timezone; create Date then toISOString
    const d = new Date(local);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const beginEditSession = (ses: FocusSession) => {
    setEditingSessionId(ses.id);
    setSessionEditStarted(toLocalDateTimeInput(ses.startedAt));
    setSessionEditEnded(toLocalDateTimeInput(ses.endedAt));
    setSessionEditCompleted(ses.completed.map(t => ({ ...t })));
    setSessionEditNewCompletedTitle('');
  };

  const cancelEditSession = () => {
    setEditingSessionId(null);
    setSessionEditStarted('');
    setSessionEditEnded('');
    setSessionEditCompleted([]);
    setSessionEditNewCompletedTitle('');
  };

  const saveEditSession = () => {
    if (!editingSessionId) return;
    const isoStart = fromLocalDateTimeInputToISO(sessionEditStarted);
    const isoEnd = fromLocalDateTimeInputToISO(sessionEditEnded);
    if (!isoStart || !isoEnd) {
      cancelEditSession();
      return;
    }
    const startMs = new Date(isoStart).getTime();
    const endMs = new Date(isoEnd).getTime();
    const durationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
    const next = sessions.map(s => s.id === editingSessionId
      ? { ...s, startedAt: isoStart, endedAt: isoEnd, durationSeconds, completed: sessionEditCompleted }
      : s
    ).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    setSessions(next);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(next)); } catch {}
    }
    cancelEditSession();
  };

  const deleteSession = (id: string) => {
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(next)); } catch {}
    }
    if (editingSessionId === id) cancelEditSession();
  };

  const addCompletedToEditingSession = () => {
    const title = sessionEditNewCompletedTitle.trim();
    if (!title) return;
    setSessionEditCompleted(prev => [{ id: crypto.randomUUID(), title, done: true }, ...prev]);
    setSessionEditNewCompletedTitle('');
  };

  const updateEditingCompletedTitle = (taskId: string, title: string) => {
    setSessionEditCompleted(prev => prev.map(t => t.id === taskId ? { ...t, title } : t));
  };

  const removeEditingCompletedTask = (taskId: string) => {
    setSessionEditCompleted(prev => prev.filter(t => t.id !== taskId));
  };

  // Persist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Persist Past Sessions visibility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(PAST_SESSIONS_OPEN_KEY, showPastSessions ? '1' : '0'); } catch {}
    }
  }, [showPastSessions]);

  // Persist target seconds
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(SESSION_TARGET_KEY, String(targetSeconds)); } catch {}
    }
  }, [targetSeconds]);

  // Persist sound enabled
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(SOUND_ENABLED_KEY, soundEnabled ? '1' : '0'); } catch {}
    }
  }, [soundEnabled]);

  // Reset notifications when target changes
  useEffect(() => {
    notifiedFiveRef.current = false;
    notifiedTimeUpRef.current = false;
  }, [targetSeconds]);

  const ensureAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined' || !soundEnabled) return null;
    if (!audioCtxRef.current) {
      const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtxRef.current = new AudioCtx();
    }
    // Try to resume in case it was suspended due to autoplay policies
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
    // Fade out to avoid clicks
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

  // Notify on important times
  useEffect(() => {
    if (!state.isRunning || targetSeconds <= 0) return;
    const remaining = targetSeconds - state.elapsedSeconds;
    // 5 minutes remaining (only if target is at least 5 minutes)
    if (targetSeconds >= 300 && remaining <= 300 && remaining > 0 && !notifiedFiveRef.current) {
      playBeep('warning');
      notifiedFiveRef.current = true;
    }
    // Time up
    if (state.elapsedSeconds >= targetSeconds && !notifiedTimeUpRef.current) {
      playBeep('timeup');
      notifiedTimeUpRef.current = true;
    }
  }, [state.elapsedSeconds, state.isRunning, targetSeconds]);

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

  const start = () => {
    // Prime audio on user gesture
    ensureAudioContext();
    notifiedFiveRef.current = false;
    notifiedTimeUpRef.current = false;
    setState(s => ({ ...s, isRunning: true, sessionStartedAt: s.sessionStartedAt ?? new Date().toISOString() }));
  };
  const pause = () => setState(s => ({ ...s, isRunning: false }));
  const endSession = () => {
    notifiedFiveRef.current = false;
    notifiedTimeUpRef.current = false;
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
              {!loaded ? '\u00A0' : (state.sessionStartedAt ? new Date(state.sessionStartedAt).toLocaleString() : 'No active session')}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 py-6 flex-1 overflow-y-auto">
          {/* Timer / Controls */}
          <div className="flex flex-col items-center justify-center mb-6 gap-3">
            <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card/50 w-full max-w-3xl">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div className="font-mono text-3xl min-w-[88px]">{loaded ? formatHMS(state.elapsedSeconds) : '00:00'}</div>
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
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Target</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={targetSeconds === 15 * 60 ? 'secondary' : 'ghost'} className="h-7 px-2" onClick={() => setTargetSeconds(15 * 60)}>15m</Button>
                  <Button size="sm" variant={targetSeconds === 25 * 60 ? 'secondary' : 'ghost'} className="h-7 px-2" onClick={() => setTargetSeconds(25 * 60)}>25m</Button>
                  <Button size="sm" variant={targetSeconds === 45 * 60 ? 'secondary' : 'ghost'} className="h-7 px-2" onClick={() => setTargetSeconds(45 * 60)}>45m</Button>
                  <Button size="sm" variant={targetSeconds === 60 * 60 ? 'secondary' : 'ghost'} className="h-7 px-2" onClick={() => setTargetSeconds(60 * 60)}>60m</Button>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    value={Math.floor(targetSeconds / 60)}
                    onChange={(e) => {
                      const minutes = Math.max(0, parseInt(e.target.value || '0', 10));
                      if (!Number.isNaN(minutes)) setTargetSeconds(minutes * 60);
                    }}
                    className="h-8 w-16 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
                <div className="pl-2">
                  <Button size="sm" variant="ghost" onClick={() => setSoundEnabled(v => !v)} className="h-7 px-2" title={soundEnabled ? 'Sound enabled' : 'Sound disabled'}>
                    {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress and remaining time */}
            <div className="w-full max-w-3xl">
              <div className="progress-bar h-2 w-full border border-border/50">
                <div
                  className="progress-fill"
                  style={{ width: `${targetSeconds > 0 ? Math.min(100, Math.floor((state.elapsedSeconds / targetSeconds) * 100)) : 0}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {targetSeconds > 0
                    ? `${formatHMS(Math.max(0, targetSeconds - state.elapsedSeconds))} remaining`
                    : 'No target set'}
                </span>
                {targetSeconds > 0 && (
                  <span>{Math.min(100, Math.floor((state.elapsedSeconds / targetSeconds) * 100))}%</span>
                )}
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

          {/* Sessions History (hidden during an active session; collapsible otherwise) */}
          {!state.sessionStartedAt && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Past Sessions</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowPastSessions(v => !v)} className="h-7 px-2">
                  {showPastSessions ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showPastSessions && (
                <>
                  {!sessionsLoaded ? (
                    <div className="text-xs text-muted-foreground">Loading sessions…</div>
                  ) : sessions.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No sessions recorded yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map(ses => (
                        <div key={ses.id} className="p-3 border border-border rounded bg-card/50">
                          {/* Read mode */}
                          {editingSessionId !== ses.id ? (
                            <>
                              <div className="flex items-center justify-between">
                                <div>
                                  {(() => { const p = formatTimeRangeParts(ses.startedAt, ses.endedAt); return (
                                    <>
                                      <div className="text-sm font-semibold">{formatHMS(ses.durationSeconds)}</div>
                                      <div className="text-xs text-muted-foreground">{p.time}</div>
                                      <div className="text-[10px] text-muted-foreground/80">{p.dayLabel}</div>
                                    </>
                                  ); })()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => beginEditSession(ses)} className="h-7 px-2">Edit</Button>
                                  <Button size="sm" variant="ghost" onClick={() => deleteSession(ses.id)} className="h-7 px-2 text-destructive">Delete</Button>
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="text-xs text-muted-foreground">
                                  {ses.completed.length} task{ses.completed.length === 1 ? '' : 's'} completed
                                </div>
                                {ses.completed.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {ses.completed.slice(0, 6).map(t => (
                                      <span key={t.id} className="px-1.5 py-0.5 text-xs bg-accent/40 border border-border/50 rounded">{t.title}</span>
                                    ))}
                                    {ses.completed.length > 6 && (
                                      <span className="px-1.5 py-0.5 text-xs text-muted-foreground">+{ses.completed.length - 6} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            /* Edit mode */
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <label className="text-muted-foreground">Start</label>
                                  <Input type="datetime-local" value={sessionEditStarted} onChange={(e) => setSessionEditStarted(e.target.value)} className="h-8" />
                                  <label className="text-muted-foreground">End</label>
                                  <Input type="datetime-local" value={sessionEditEnded} onChange={(e) => setSessionEditEnded(e.target.value)} className="h-8" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="secondary" onClick={saveEditSession} className="h-8 px-3">Save</Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditSession} className="h-8 px-3">Cancel</Button>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium">Completed tasks</h4>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={sessionEditNewCompletedTitle}
                                      onChange={(e) => setSessionEditNewCompletedTitle(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') addCompletedToEditingSession(); }}
                                      placeholder="Add completed task..."
                                      className="h-8 text-sm"
                                    />
                                    <Button size="sm" onClick={addCompletedToEditingSession} className="h-8 px-2"><Plus className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {sessionEditCompleted.length === 0 && (
                                    <div className="text-xs text-muted-foreground">No completed tasks recorded.</div>
                                  )}
                                  {sessionEditCompleted.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-2 border border-border/40 bg-background rounded">
                                      <Input
                                        value={t.title}
                                        onChange={(e) => updateEditingCompletedTitle(t.id, e.target.value)}
                                        className="h-8 text-sm flex-1 mr-2"
                                      />
                                      <Button size="sm" variant="ghost" onClick={() => removeEditingCompletedTask(t.id)} className="h-7 w-7 p-0 text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}


