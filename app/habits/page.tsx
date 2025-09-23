'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AppLayout, Button, Input } from '@/components/ui';
import { Habit, HabitState } from '@/types';
import { HabitsStorage } from '@/utils';
import { ChevronLeft, ChevronRight, Plus, Trash2, Palette } from 'lucide-react';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completionsByDate, setCompletionsByDate] = useState<Record<string, Record<string, number>>>({});
  const [newHabitName, setNewHabitName] = useState('');
  const [loaded, setLoaded] = useState(false);
  // UI preferences
  const [wrapNames, setWrapNames] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  // Editing state
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Month navigation
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11

  useEffect(() => {
    const { habits, completionsByDate } = HabitsStorage.load();
    setHabits(habits);
    setCompletionsByDate(completionsByDate);
    setLoaded(true);
  }, []);

  // Load UI prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem('omega-planner-habits-ui-v1');
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.wrapNames === 'boolean') setWrapNames(prefs.wrapNames);
        if (prefs.timeframe === 'month' || prefs.timeframe === 'quarter' || prefs.timeframe === 'year') setTimeframe(prefs.timeframe);
      }
    } catch {}
  }, []);

  // Persist UI prefs
  useEffect(() => {
    try {
      localStorage.setItem('omega-planner-habits-ui-v1', JSON.stringify({ wrapNames, timeframe }));
    } catch {}
  }, [wrapNames, timeframe]);

  // Fixed sensible width for name column
  const nameColWidth = 280;

  useEffect(() => {
    if (!loaded) return; // avoid clobbering storage on initial mount (React Strict Mode)
    HabitsStorage.save(habits, completionsByDate);
  }, [loaded, habits, completionsByDate]);

  const addHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;
    const iso = new Date().toISOString();
    const habit: Habit = {
      id: Math.random().toString(36).slice(2),
      name,
      color: '#10b981',
      states: [
        { key: 'partial', label: 'Partial', level: 1, opacity: 0.7 },
        { key: 'full', label: 'Full', level: 2, opacity: 1 },
      ],
      createdAt: iso,
      updatedAt: iso
    };
    setHabits(prev => [...prev, habit]);
    setNewHabitName('');
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setCompletionsByDate(prev => {
      const next: Record<string, Record<string, number>> = {};
      for (const [dateKey, map] of Object.entries(prev)) {
        const copy = { ...map } as Record<string, number>;
        delete copy[id];
        next[dateKey] = copy;
      }
      return next;
    });
  };

  const updateHabitName = (id: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    
    setHabits(prev => prev.map(h => 
      h.id === id 
        ? { ...h, name: trimmedName, updatedAt: new Date().toISOString() }
        : h
    ));
    setEditingHabitId(null);
    setEditingName('');
  };

  const startEditingHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditingName(habit.name);
  };

  const cancelEditingHabit = () => {
    setEditingHabitId(null);
    setEditingName('');
  };

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const dayNumbers = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const dateKeyDyn = useCallback((y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` , []);
  const dateKey = useCallback((d: number) => dateKeyDyn(year, month, d), [dateKeyDyn, year, month]);

  // Completion levels: 0 = none, 1 = partial, 2 = full
  const getLevel = (habitId: string, d: number) => completionsByDate[dateKey(d)]?.[habitId] || 0;
  const isDone = (habitId: string, d: number) => getLevel(habitId, d) > 0;
  const toggle = (habitId: string, d: number) => {
    const key = dateKey(d);
    setCompletionsByDate(prev => {
      const perDate = { ...(prev[key] || {}) } as Record<string, number>;
      const cur = perDate[habitId] || 0;
      // Cycle 0 -> 1 (partial) -> 2 (full) -> 0
      const next = (cur + 1) % 3;
      if (next === 0) delete perDate[habitId]; else perDate[habitId] = next;
      return { ...prev, [key]: perDate };
    });
  };

  const monthLabel = useMemo(() => new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }), [year, month]);

  // No top stats per user request

  const prevMonth = () => {
    setMonth(m => {
      if (m === 0) { setYear(y => y - 1); return 11; }
      return m - 1;
    });
  };
  const nextMonth = () => {
    setMonth(m => {
      if (m === 11) { setYear(y => y + 1); return 0; }
      return m + 1;
    });
  };

  // Timeframe helpers
  const getQuarterStartMonth = (m: number) => Math.floor(m / 3) * 3;
  const monthsForTimeframe = useMemo(() => {
    if (timeframe === 'month') return [{ y: year, m: month }];
    if (timeframe === 'quarter') {
      const start = getQuarterStartMonth(month);
      return [0, 1, 2].map(i => ({ y: year, m: start + i }));
    }
    return Array.from({ length: 12 }, (_, i) => ({ y: year, m: i }));
  }, [timeframe, year, month]);

  const renderMonthBlock = (y: number, m: number) => {
    const dim = new Date(y, m + 1, 0).getDate();
    const dn = Array.from({ length: dim }, (_, i) => i + 1);
    return (
      <div key={`month-${y}-${m}`} className="bg-card border rounded overflow-x-auto mb-4">
        <div className="min-w-[720px]">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="text-sm font-medium">{new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${dim}, 16px)` }}>
            <div className="h-10 flex items-center px-3 text-sm font-medium">Habit</div>
            {dn.map((d) => {
              const isToday = (() => {
                const t = new Date();
                return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
              })();
              return (
                <div
                  key={d}
                  className={`h-10 text-[10px] flex items-center justify-center ${isToday ? 'rounded bg-primary/10 text-foreground border border-primary/30' : 'text-muted-foreground'}`}
                >
                  {d}
                </div>
              );
            })}
          </div>
          {habits.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No habits yet.</div>
          ) : (
            habits.map((h) => (
              <div key={`${h.id}-${y}-${m}`} className="grid items-center" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${dim}, 16px)` }}>
                <div className="px-3 py-2 text-sm flex items-center gap-2">
                  {editingHabitId === h.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => updateHabitName(h.id, editingName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateHabitName(h.id, editingName);
                        } else if (e.key === 'Escape') {
                          cancelEditingHabit();
                        }
                      }}
                      className="bg-background border rounded px-2 py-1 text-sm"
                      style={{ maxWidth: nameColWidth - 16 }}
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`cursor-pointer hover:text-primary ${wrapNames ? 'whitespace-normal break-words' : 'truncate'}`} 
                      style={{ maxWidth: nameColWidth - 16 }}
                      onClick={() => startEditingHabit(h)}
                      title="Click to edit habit name"
                    >
                      {h.name}
                    </span>
                  )}
                </div>
                {dn.map((d) => {
                  const isToday = (() => {
                    const t = new Date();
                    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
                  })();
                  const level = (completionsByDate[dateKeyDyn(y, m, d)]?.[h.id] || 0);
                  const base = h.color || '#10b981';
                  const st = (h.states || []).find(s => s.level === level);
                  const opacity = level === 0 ? 0.4 : (st?.opacity ?? 1);
                  return (
                    <button
                      key={`${h.id}-${y}-${m}-${d}`}
                      onClick={() => {
                        const key = dateKeyDyn(y, m, d);
                        setCompletionsByDate(prev => {
                          const perDate = { ...(prev[key] || {}) } as Record<string, number>;
                          const cur = perDate[h.id] || 0;
                          const next = (cur + 1) % 3;
                          if (next === 0) delete perDate[h.id]; else perDate[h.id] = next;
                          return { ...prev, [key]: perDate };
                        });
                      }}
                      className={`m-1 w-3.5 h-3.5 rounded transition-colors ${isToday ? 'ring-1 ring-primary' : ''}`}
                      style={{ backgroundColor: level === 0 ? 'var(--muted)' : base, opacity }}
                      title={`${String(d).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="h-full p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Habits</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="min-w-[160px] text-center font-medium">{monthLabel}</span>
              <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={wrapNames} onChange={(e) => setWrapNames(e.target.checked)} />
              Wrap names
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Timeframe</label>
              <select
                className="h-8 text-sm rounded border bg-background"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
              >
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>

          {/* Add habit */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a new habit..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addHabit(); }}
              className="max-w-sm"
            />
            <Button onClick={addHabit}><Plus className="w-4 h-4" /></Button>
          </div>

          {/* Grid(s) */}
          {timeframe === 'month' ? (
          <div className="bg-card border rounded overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Day headers */}
              <div className="grid" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${daysInMonth}, 16px)` }}>
                <div className="h-10 flex items-center px-3 text-sm font-medium">Habit</div>
                {dayNumbers.map((d) => {
                  const isToday = (() => {
                    const t = new Date();
                    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
                  })();
                  return (
                    <div
                      key={d}
                      className={`h-10 text-[10px] flex items-center justify-center ${isToday ? 'rounded bg-primary/10 text-foreground border border-primary/30' : 'text-muted-foreground'}`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              {/* Habit rows */}
              {habits.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No habits yet.</div>
              ) : (
                habits.map((h) => (
                  <div key={h.id} className="grid items-center" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${daysInMonth}, 16px)` }}>
                    <div className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                      {editingHabitId === h.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => updateHabitName(h.id, editingName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateHabitName(h.id, editingName);
                            } else if (e.key === 'Escape') {
                              cancelEditingHabit();
                            }
                          }}
                          className="bg-background border rounded px-2 py-1 text-sm"
                          style={{ maxWidth: nameColWidth - 120 }}
                          autoFocus
                        />
                      ) : (
                        <span 
                          className={`cursor-pointer hover:text-primary ${wrapNames ? 'whitespace-normal break-words' : 'truncate'}`} 
                          style={{ maxWidth: nameColWidth - 120 }}
                          onClick={() => startEditingHabit(h)}
                          title="Click to edit habit name"
                        >
                          {h.name}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        {/* Quick add: choose a state for today */}
                        <select
                          className="h-7 text-xs rounded border bg-background"
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const st = (h.states || []).find(s => s.key === val);
                            if (!st) return;
                            const today = new Date().getDate();
                            const key = dateKey(today);
                            setCompletionsByDate(prev => {
                              const perDate = { ...(prev[key] || {}) } as Record<string, number>;
                              perDate[h.id] = st.level;
                              return { ...prev, [key]: perDate };
                            });
                            e.currentTarget.value = '';
                          }}
                        >
                          <option value="">Quick add</option>
                          {(h.states || []).map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                        {/* Edit button shows color + custom states editor */}
                        <details>
                          <summary className="flex items-center gap-1 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            <Palette className="w-4 h-4" /> Edit
                          </summary>
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="color"
                              value={h.color || '#10b981'}
                              onChange={(e) => {
                                const color = e.target.value;
                                setHabits(prev => prev.map(x => x.id === h.id ? { ...x, color, updatedAt: new Date().toISOString() } : x));
                              }}
                              className="w-6 h-6 rounded border border-border bg-transparent p-0"
                            />
                            <div className="flex flex-col gap-2">
                              {(h.states || []).map((s, idx) => (
                                <div key={s.key} className="flex items-center gap-2">
                                  <input
                                    className="h-7 px-2 text-xs rounded border bg-background"
                                    value={s.label}
                                    onChange={(e) => setHabits(prev => prev.map(x => x.id === h.id ? {
                                      ...x,
                                      states: (x.states || []).map((y, i) => i === idx ? { ...y, label: e.target.value } : y),
                                      updatedAt: new Date().toISOString()
                                    } : x))}
                                  />
                                  <input
                                    type="number"
                                    min={1}
                                    className="h-7 w-16 px-2 text-xs rounded border bg-background"
                                    value={s.level}
                                    onChange={(e) => setHabits(prev => prev.map(x => x.id === h.id ? {
                                      ...x,
                                      states: (x.states || []).map((y, i) => i === idx ? { ...y, level: Math.max(1, parseInt(e.target.value || '1', 10)) } : y),
                                      updatedAt: new Date().toISOString()
                                    } : x))}
                                  />
                                  <div className="text-xs text-muted-foreground">level</div>
                                  <input
                                    type="number"
                                    step="0.05"
                                    min={0}
                                    max={1}
                                    className="h-7 w-20 px-2 text-xs rounded border bg-background"
                                    value={s.opacity}
                                    onChange={(e) => setHabits(prev => prev.map(x => x.id === h.id ? {
                                      ...x,
                                      states: (x.states || []).map((y, i) => i === idx ? { ...y, opacity: Math.min(1, Math.max(0, parseFloat(e.target.value || '1'))) } : y),
                                      updatedAt: new Date().toISOString()
                                    } : x))}
                                  />
                                  <div className="text-xs text-muted-foreground">opacity</div>
                                  <button
                                    className="text-xs text-destructive"
                                    onClick={() => setHabits(prev => prev.map(x => x.id === h.id ? {
                                      ...x,
                                      states: (x.states || []).filter((_, i) => i !== idx),
                                      updatedAt: new Date().toISOString()
                                    } : x))}
                                  >Remove</button>
                                </div>
                              ))}
                              <button
                                className="self-start text-xs px-2 py-1 border rounded hover:bg-muted"
                                onClick={() => setHabits(prev => prev.map(x => x.id === h.id ? {
                                  ...x,
                                  states: [...(x.states || []), { key: Math.random().toString(36).slice(2), label: 'State', level: (x.states?.length || 0) + 1, opacity: 1 }],
                                  updatedAt: new Date().toISOString()
                                } : x))}
                              >Add State</button>
                            </div>
                          </div>
                        </details>
                        <button onClick={() => deleteHabit(h.id)} className="text-muted-foreground hover:text-destructive" title="Delete habit">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {dayNumbers.map((d) => {
                      const isToday = (() => {
                        const t = new Date();
                        return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
                      })();
                      const level = getLevel(h.id, d);
                      const base = h.color || '#10b981';
                      const st = (h.states || []).find(s => s.level === level);
                      const opacity = level === 0 ? 0.4 : (st?.opacity ?? 1);
                      return (
                        <button
                          key={`${h.id}-${d}`}
                          onClick={() => toggle(h.id, d)}
                          className={`m-1 w-3.5 h-3.5 rounded transition-colors ${isToday ? 'ring-1 ring-primary' : ''}`}
                          style={{ backgroundColor: level === 0 ? 'var(--muted)' : base, opacity }}
                          title={`${String(d).padStart(2,'0')}/${String(month+1).padStart(2,'0')}/${year}`}
                        />
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
          ) : (
            <div>
              {monthsForTimeframe.map(({ y, m }) => renderMonthBlock(y, m))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}


