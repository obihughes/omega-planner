'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AppLayout, Button, Input } from '@/components/ui';
import { Habit } from '@/types';
import { HabitsStorage } from '@/utils';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar, TrendingUp, Settings } from 'lucide-react';

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
  const [editModalHabitId, setEditModalHabitId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const jumpToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
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
    const firstDay = new Date(y, m, 1).getDay(); // 0 = Sunday
    
    return (
      <div key={`month-${y}-${m}`} className="bg-card border rounded-lg shadow-sm overflow-hidden mb-4">
        <div className="min-w-[720px]">
          {/* Month header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="text-base font-semibold">{new Date(y, m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          </div>
          
          {/* Day of week headers */}
          <div className="grid border-b" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${dim}, 16px)` }}>
            <div className="h-8 flex items-center px-4 text-xs font-medium text-muted-foreground">Day</div>
            {dn.map((d) => {
              const date = new Date(y, m, d);
              const dayOfWeek = date.toLocaleDateString(undefined, { weekday: 'narrow' });
              return (
                <div
                  key={`dow-${d}`}
                  className="h-8 text-[9px] flex items-center justify-center text-muted-foreground uppercase"
                  title={date.toLocaleDateString(undefined, { weekday: 'long' })}
                >
                  {dayOfWeek}
                </div>
              );
            })}
          </div>
          
          {/* Date numbers */}
          <div className="grid border-b" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${dim}, 16px)` }}>
            <div className="h-9 flex items-center px-4 text-sm font-medium">Habit</div>
            {dn.map((d) => {
              const isToday = (() => {
                const t = new Date();
                return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
              })();
              const isWeekend = [0, 6].includes(new Date(y, m, d).getDay());
              return (
                <div
                  key={d}
                  className={`h-9 text-[10px] font-medium flex items-center justify-center transition-all ${
                    isToday 
                      ? 'rounded-md bg-primary text-primary-foreground shadow-sm scale-110' 
                      : isWeekend 
                        ? 'text-muted-foreground/70' 
                        : 'text-muted-foreground'
                  }`}
                >
                  {d}
                </div>
              );
            })}
          </div>
          
          {habits.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-muted-foreground mb-2">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No habits yet</p>
              <p className="text-xs text-muted-foreground">Add your first habit above to start tracking</p>
            </div>
          ) : (
            habits.map((h) => (
              <div 
                key={`${h.id}-${y}-${m}`} 
                className="grid items-center hover:bg-muted/20 transition-colors border-b last:border-b-0" 
                style={{ gridTemplateColumns: `${nameColWidth}px repeat(${dim}, 16px)` }}
              >
                <div className="px-4 py-3 text-sm flex items-center gap-3">
                  <div 
                    className="w-1 h-10 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: h.color || '#10b981' }}
                  />
                  <div className="flex-1 min-w-0">
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
                        className="w-full bg-background border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      autoFocus
                    />
                  ) : (
                      <div 
                        className={`cursor-pointer hover:text-primary transition-colors font-medium ${wrapNames ? 'whitespace-normal break-words' : 'truncate'}`}
                      onClick={() => startEditingHabit(h)}
                      title="Click to edit habit name"
                    >
                      {h.name}
                      </div>
                  )}
                  </div>
                </div>
                {dn.map((d) => {
                  const isToday = (() => {
                    const t = new Date();
                    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
                  })();
                  const level = (completionsByDate[dateKeyDyn(y, m, d)]?.[h.id] || 0);
                  const base = h.color || '#10b981';
                  const st = (h.states || []).find(s => s.level === level);
                  const opacity = level === 0 ? 0.15 : (st?.opacity ?? 1);
                  const stateLabel = st ? st.label : 'None';
                  
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
                      className={`m-1 w-3.5 h-3.5 rounded transition-all hover:scale-125 hover:shadow-md active:scale-95 ${
                        isToday ? 'ring-2 ring-primary ring-offset-1' : ''
                      }`}
                      style={{ 
                        backgroundColor: level === 0 ? 'var(--muted)' : base, 
                        opacity 
                      }}
                      title={`${new Date(y, m, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}\n${stateLabel}`}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
              <p className="text-sm text-muted-foreground mt-1">Track your daily habits and build consistency</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={prevMonth} className="hover:bg-muted">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="min-w-[160px] text-center font-semibold text-base">{monthLabel}</span>
              <Button variant="ghost" size="sm" onClick={nextMonth} className="hover:bg-muted">
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={jumpToToday}
                className="ml-2"
                title="Jump to today"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Today
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6 bg-muted/30 rounded-lg p-3 border">
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
              <input 
                type="checkbox" 
                checked={wrapNames} 
                onChange={(e) => setWrapNames(e.target.checked)}
                className="rounded border-border"
              />
              <span>Wrap habit names</span>
            </label>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground font-medium">View</label>
              <select
                className="h-9 px-3 text-sm rounded-md border bg-background hover:bg-muted/50 transition-colors cursor-pointer focus:ring-2 focus:ring-primary/20 focus:outline-none"
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
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Add a new habit..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addHabit(); }}
              className="max-w-md focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={addHabit} className="shadow-sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Habit
            </Button>
          </div>

          {/* Grid(s) */}
          {timeframe === 'month' ? (
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="min-w-[720px]">
              {/* Day of week headers */}
              <div className="grid border-b" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${daysInMonth}, 16px)` }}>
                <div className="h-8 flex items-center px-4 text-xs font-medium text-muted-foreground">Day</div>
                {dayNumbers.map((d) => {
                  const date = new Date(year, month, d);
                  const dayOfWeek = date.toLocaleDateString(undefined, { weekday: 'narrow' });
                  return (
                    <div
                      key={`dow-${d}`}
                      className="h-8 text-[9px] flex items-center justify-center text-muted-foreground uppercase"
                      title={date.toLocaleDateString(undefined, { weekday: 'long' })}
                    >
                      {dayOfWeek}
                    </div>
                  );
                })}
              </div>

              {/* Date headers */}
              <div className="grid border-b" style={{ gridTemplateColumns: `${nameColWidth}px repeat(${daysInMonth}, 16px)` }}>
                <div className="h-9 flex items-center px-4 text-sm font-medium">Habit</div>
                {dayNumbers.map((d) => {
                  const isToday = (() => {
                    const t = new Date();
                    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
                  })();
                  const isWeekend = [0, 6].includes(new Date(year, month, d).getDay());
                  return (
                    <div
                      key={d}
                      className={`h-9 text-[10px] font-medium flex items-center justify-center transition-all ${
                        isToday 
                          ? 'rounded-md bg-primary text-primary-foreground shadow-sm scale-110' 
                          : isWeekend 
                            ? 'text-muted-foreground/70' 
                            : 'text-muted-foreground'
                      }`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              {/* Habit rows */}
              {habits.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-muted-foreground mb-2">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No habits yet</p>
                  <p className="text-xs text-muted-foreground">Add your first habit above to start tracking</p>
                </div>
              ) : (
                habits.map((h) => (
                  <div 
                    key={h.id} 
                    className="grid items-center hover:bg-muted/20 transition-colors border-b last:border-b-0" 
                    style={{ gridTemplateColumns: `${nameColWidth}px repeat(${daysInMonth}, 16px)` }}
                  >
                    <div className="px-4 py-3 text-sm flex items-center gap-3">
                      <div 
                        className="w-1 h-10 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: h.color || '#10b981' }}
                      />
                      <div className="flex-1 min-w-0">
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
                            className="w-full bg-background border rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                          <div 
                            className={`cursor-pointer hover:text-primary transition-colors font-medium ${wrapNames ? 'whitespace-normal break-words' : 'truncate'}`}
                          onClick={() => startEditingHabit(h)}
                          title="Click to edit habit name"
                        >
                          {h.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditModalHabitId(h.id)}
                          className="h-8 px-2"
                          title="Edit habit properties"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(h.id)}
                          className="h-8 px-2 hover:text-destructive"
                          title="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                      const opacity = level === 0 ? 0.15 : (st?.opacity ?? 1);
                      const stateLabel = st ? st.label : 'None';
                      
                      return (
                        <button
                          key={`${h.id}-${d}`}
                          onClick={() => toggle(h.id, d)}
                          className={`m-1 w-3.5 h-3.5 rounded transition-all hover:scale-125 hover:shadow-md active:scale-95 ${
                            isToday ? 'ring-2 ring-primary ring-offset-1' : ''
                          }`}
                          style={{ 
                            backgroundColor: level === 0 ? 'var(--muted)' : base, 
                            opacity 
                          }}
                          title={`${new Date(year, month, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}\n${stateLabel}`}
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

          {/* Edit Modal */}
          {editModalHabitId && (() => {
            const habit = habits.find(h => h.id === editModalHabitId);
            if (!habit) return null;
            
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setEditModalHabitId(null)}>
                <div className="bg-card border rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Edit Habit</h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditModalHabitId(null)}>
                      ✕
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Color picker */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={habit.color || '#10b981'}
                          onChange={(e) => {
                            const color = e.target.value;
                            setHabits(prev => prev.map(x => x.id === habit.id ? { ...x, color, updatedAt: new Date().toISOString() } : x));
                          }}
                          className="w-12 h-12 rounded-md border border-border cursor-pointer"
                        />
                        <div 
                          className="flex-1 h-12 rounded-md border" 
                          style={{ backgroundColor: habit.color || '#10b981' }}
                        />
                      </div>
                    </div>

                    {/* States editor */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Completion States</label>
                      <div className="space-y-3">
                        {(habit.states || []).map((s, idx) => (
                          <div key={s.key} className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
                            <div className="flex-1 space-y-2">
                              <input
                                placeholder="State label"
                                className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                value={s.label}
                                onChange={(e) => setHabits(prev => prev.map(x => x.id === habit.id ? {
                                  ...x,
                                  states: (x.states || []).map((y, i) => i === idx ? { ...y, label: e.target.value } : y),
                                  updatedAt: new Date().toISOString()
                                } : x))}
                              />
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-muted-foreground font-medium">Level</label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="h-9 w-20 px-2 text-sm rounded-md border bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                    value={s.level}
                                    onChange={(e) => setHabits(prev => prev.map(x => x.id === habit.id ? {
                                      ...x,
                                      states: (x.states || []).map((y, i) => i === idx ? { ...y, level: Math.max(1, parseInt(e.target.value || '1', 10)) } : y),
                                      updatedAt: new Date().toISOString()
                                    } : x))}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-muted-foreground font-medium">Opacity</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    max={1}
                                    className="h-9 w-20 px-2 text-sm rounded-md border bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                    value={s.opacity}
                                    onChange={(e) => setHabits(prev => prev.map(x => x.id === habit.id ? {
                                      ...x,
                                      states: (x.states || []).map((y, i) => i === idx ? { ...y, opacity: Math.min(1, Math.max(0, parseFloat(e.target.value || '1'))) } : y),
                                      updatedAt: new Date().toISOString()
                                    } : x))}
                                  />
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setHabits(prev => prev.map(x => x.id === habit.id ? {
                                ...x,
                                states: (x.states || []).filter((_, i) => i !== idx),
                                updatedAt: new Date().toISOString()
                              } : x))}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => setHabits(prev => prev.map(x => x.id === habit.id ? {
                            ...x,
                            states: [...(x.states || []), { key: Math.random().toString(36).slice(2), label: 'New State', level: (x.states?.length || 0) + 1, opacity: 1 }],
                            updatedAt: new Date().toISOString()
                          } : x))}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add State
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => setEditModalHabitId(null)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Delete Confirmation Modal */}
          {deleteConfirmId && (() => {
            const habit = habits.find(h => h.id === deleteConfirmId);
            if (!habit) return null;
            
            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}>
                <div className="bg-card border rounded-lg shadow-lg max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-semibold mb-2">Delete Habit?</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Are you sure you want to delete "<span className="font-medium text-foreground">{habit.name}</span>"? This will remove all tracking data for this habit and cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        deleteHabit(deleteConfirmId);
                        setDeleteConfirmId(null);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </AppLayout>
  );
}


