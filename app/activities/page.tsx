'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/ui';
import { ActivitiesStorage, ActivitiesByDate, ActivitiesListStorage, ActivityItem } from '@/utils/activitiesStorage';
import { Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function ActivitiesPage() {
  // Independent editable Activities list (decoupled from Workspace projects)
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [entriesByDate, setEntriesByDate] = useState<ActivitiesByDate>({});
  const [loaded, setLoaded] = useState(false);
  const [wrapNames, setWrapNames] = useState<boolean>(false);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [month, setMonth] = useState<number>(() => new Date().getMonth());

  const [newActivityName, setNewActivityName] = useState<string>('');
  const [newActivityColor, setNewActivityColor] = useState<string>('#60a5fa');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const nameColWidth = 280;

  useEffect(() => {
    // Load activities list
    setActivities(ActivitiesListStorage.load());
    // Load entries
    const loadedData = ActivitiesStorage.load();
    setEntriesByDate(loadedData);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    ActivitiesStorage.save(entriesByDate);
  }, [loaded, entriesByDate]);

  useEffect(() => {
    if (!loaded) return;
    ActivitiesListStorage.save(activities);
  }, [loaded, activities]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('omega-planner-activities-ui-v1');
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.wrapNames === 'boolean') setWrapNames(prefs.wrapNames);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('omega-planner-activities-ui-v1', JSON.stringify({ wrapNames }));
    } catch {}
  }, [wrapNames]);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const dayNumbers = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const dateKeyDyn = useCallback((y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` , []);
  const dateKey = useCallback((d: number) => dateKeyDyn(year, month, d), [dateKeyDyn, year, month]);

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

  const monthLabel = useMemo(() => new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }), [year, month]);

  const updateEntry = (activityId: string, y: number, m: number, d: number, value: string) => {
    const key = dateKeyDyn(y, m, d);
    setEntriesByDate(prev => {
      const perDate = { ...(prev[key] || {}) } as Record<string, string>;
      if (value.trim()) perDate[activityId] = value;
      else delete perDate[activityId];
      return { ...prev, [key]: perDate };
    });
  };

  // Manage activities list
  const addActivity = () => {
    const name = newActivityName.trim();
    if (!name) return;
    const item = ActivitiesListStorage.create(name, newActivityColor);
    setActivities(prev => [...prev, item]);
    setNewActivityName('');
  };

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const commitEdit = (id: string) => {
    const name = editingName.trim();
    if (!name) { cancelEdit(); return; }
    setActivities(prev => prev.map(a => a.id === id ? { ...a, name } : a));
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    setEntriesByDate(prev => ActivitiesStorage.removeActivityFromAllDates(prev, id));
  };

  const updateColor = (id: string, color: string) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, color } : a));
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col p-4">
        {/* Page Header */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
              <p className="text-sm text-muted-foreground mt-1">Track daily notes across activities</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="hover:bg-muted rounded-md p-2 border" onClick={prevMonth} title="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="min-w-[160px] text-center font-semibold text-base">{monthLabel}</span>
              <button className="hover:bg-muted rounded-md p-2 border" onClick={nextMonth} title="Next month">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={jumpToToday}
                className="ml-2 inline-flex items-center gap-1 px-3 py-2 border rounded-md text-sm hover:bg-muted"
                title="Jump to today"
              >
                <Calendar className="w-4 h-4" />
                Today
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 mt-4 bg-muted/30 rounded-lg p-3 border">
            <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
              <input 
                type="checkbox" 
                checked={wrapNames} 
                onChange={(e) => setWrapNames(e.target.checked)}
                className="rounded border-border"
              />
              <span>Wrap activity names</span>
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addActivity(); }}
                placeholder="Add activity name"
                className="h-8 px-2 py-1 text-sm bg-background border rounded-md min-w-[200px]"
              />
              <input 
                type="color" 
                value={newActivityColor}
                onChange={(e) => setNewActivityColor(e.target.value)}
                title="Color"
                className="h-8 w-8 p-0 border rounded-md cursor-pointer"
              />
              <button 
                onClick={addActivity}
                className="inline-flex items-center gap-1 px-2 py-1 border rounded-md text-sm hover:bg-muted"
                title="Add activity"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid Container - Separated into two distinct sections */}
        <div className="flex-1 border rounded-lg shadow-sm overflow-hidden bg-card relative">
          {/* Left Fixed Section */}
          <div 
            className="absolute top-0 left-0 bottom-0 bg-card border-r overflow-hidden flex flex-col z-20"
            style={{ width: `${nameColWidth}px` }}
          >
            {/* Header for left column */}
            <div className="flex-shrink-0 border-b bg-muted/30">
              <div className="h-8 flex items-center px-4 text-xs font-medium text-muted-foreground border-b">Day</div>
              <div className="h-9 flex items-center px-4 text-sm font-medium">Activity</div>
            </div>

            {/* Activity names list - scrollable */}
            <div className="flex-1 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">No activities yet</div>
              ) : (
                activities.map((a) => (
                  <div 
                    key={a.id} 
                    className="px-4 py-3 text-sm flex items-center gap-2 hover:bg-muted/20 transition-colors border-b"
                    style={{ height: '88px' }}
                  >
                    <div 
                      className="w-1 h-10 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: a.color || '#64748b' }}
                    />
                    <div className="flex-1 min-w-0">
                      {editingId === a.id ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(a.id); if (e.key === 'Escape') cancelEdit(); }}
                            className="w-full h-7 px-2 py-1 text-xs bg-background border rounded-md"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button className="flex-1 px-2 py-1 text-xs border rounded-md hover:bg-muted" title="Save" onClick={() => commitEdit(a.id)}>
                              <Check className="w-3 h-3 mx-auto" />
                            </button>
                            <button className="flex-1 px-2 py-1 text-xs border rounded-md hover:bg-muted" title="Cancel" onClick={cancelEdit}>
                              <X className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className={`font-medium text-xs ${wrapNames ? 'whitespace-normal break-words' : 'truncate'}`}>
                            {a.name}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <input 
                              type="color" 
                              value={a.color || '#64748b'}
                              onChange={(e) => updateColor(a.id, e.target.value)}
                              className="h-5 w-5 p-0 border rounded cursor-pointer flex-shrink-0"
                              title="Change color"
                            />
                            <button 
                              className="p-1 text-xs border rounded hover:bg-muted flex-shrink-0" 
                              title="Rename" 
                              onClick={() => startEditing(a.id, a.name)}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button 
                              className="p-1 text-xs border rounded hover:bg-muted hover:text-red-600 flex-shrink-0" 
                              title="Delete" 
                              onClick={() => deleteActivity(a.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Scrollable Section */}
          <div 
            className="absolute top-0 bottom-0 right-0 overflow-auto"
            style={{ left: `${nameColWidth}px` }}
          >
            {/* Header row - days */}
            <div className="sticky top-0 z-10 bg-card">
              <div style={{ minWidth: `${daysInMonth * 120}px` }}>
                <div className="flex border-b bg-muted/30">
                  {dayNumbers.map((d) => {
                    const date = new Date(year, month, d);
                    const dayOfWeek = date.toLocaleDateString(undefined, { weekday: 'short' });
                    return (
                      <div
                        key={`dow-${d}`}
                        className="h-8 text-[11px] flex items-center justify-center text-muted-foreground uppercase flex-shrink-0"
                        style={{ width: '120px' }}
                        title={date.toLocaleDateString(undefined, { weekday: 'long' })}
                      >
                        {dayOfWeek}
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex bg-muted/30 border-b">
                  {dayNumbers.map((d) => {
                    const isToday = (() => {
                      const t = new Date();
                      return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
                    })();
                    const isWeekend = [0, 6].includes(new Date(year, month, d).getDay());
                    return (
                      <div
                        key={d}
                        className={`h-9 text-[10px] font-medium flex items-center justify-center transition-all flex-shrink-0 ${
                          isToday 
                            ? 'rounded-md bg-primary text-primary-foreground shadow-sm scale-105' 
                            : isWeekend 
                              ? 'text-muted-foreground/70' 
                              : 'text-muted-foreground'
                        }`}
                        style={{ width: '120px' }}
                      >
                        {d}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid content - textarea cells */}
            <div>
              <div style={{ minWidth: `${daysInMonth * 120}px` }}>
                {activities.length === 0 ? (
                  <div className="p-12 text-center text-sm text-muted-foreground">Add activities to start tracking</div>
                ) : (
                  activities.map((a) => (
                    <div 
                      key={a.id} 
                      className="flex border-b hover:bg-muted/20 transition-colors"
                    >
                      {dayNumbers.map((d) => {
                        const key = dateKey(d);
                        const value = entriesByDate[key]?.[a.id] || '';
                        const isToday = (() => {
                          const t = new Date();
                          return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
                        })();
                        return (
                          <div 
                            key={`${a.id}-${d}`} 
                            className={`p-1 flex-shrink-0 ${isToday ? 'bg-primary/5' : ''}`}
                            style={{ width: '120px', height: '88px' }}
                          >
                            <textarea
                              value={value}
                              onChange={(e) => updateEntry(a.id, year, month, d, e.target.value)}
                              placeholder="Notes"
                              className="w-full h-full text-xs bg-background border rounded-md px-2 py-1 focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


