'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GoalsStorage } from '@/utils';
import { ImportantDate, WeekGoals, WeeklyGoal } from '@/types';

function getMondayStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun, 1 Mon
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toWeekStartKey(date: Date): string {
  return toDateKey(getMondayStart(date));
}

export default function WeeklyGoalsPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayStart(new Date()));
  const [week, setWeek] = useState<WeekGoals>(() => GoalsStorage.loadWeek(toWeekStartKey(getMondayStart(new Date()))));

  useEffect(() => {
    setWeek(GoalsStorage.loadWeek(toWeekStartKey(weekStart)));
  }, [weekStart]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const addGoal = useCallback((dateKey: string, title: string) => {
    if (!title.trim()) return;
    const goal: WeeklyGoal = {
      id: Math.random().toString(36).slice(2),
      title: title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    const next = GoalsStorage.addGoal(week.weekStartKey, dateKey, goal);
    setWeek(next);
  }, [week]);

  const toggleGoal = useCallback((dateKey: string, goalId: string) => {
    const next = GoalsStorage.toggleGoal(week.weekStartKey, dateKey, goalId);
    setWeek(next);
  }, [week]);

  const removeGoal = useCallback((dateKey: string, goalId: string) => {
    const next = GoalsStorage.removeGoal(week.weekStartKey, dateKey, goalId);
    setWeek(next);
  }, [week]);

  const addImportantDate = useCallback((title: string, dateKey: string) => {
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
    const item: ImportantDate = { id: Math.random().toString(36).slice(2), title: title.trim(), dateKey };
    const next = GoalsStorage.upsertImportantDate(week.weekStartKey, item);
    setWeek(next);
  }, [week]);

  const removeImportantDate = useCallback((id: string) => {
    const next = GoalsStorage.removeImportantDate(week.weekStartKey, id);
    setWeek(next);
  }, [week]);

  return (
    <AppLayout>
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between py-4 border-b">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getMondayStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)))}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getMondayStart(new Date()))}>This Week</Button>
              <Button variant="outline" size="sm" onClick={() => setWeekStart(getMondayStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)))}>Next</Button>
            </div>
            <h1 className="text-xl font-medium">Weekly Goals</h1>
            <div className="text-sm text-muted-foreground">Week of {toDateKey(weekStart)}</div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-7 gap-4 mt-6">
            {days.map((d) => {
              const dateKey = toDateKey(d);
              const items = (week.goalsByDate[dateKey] || []).slice(0, 3);
              return (
                <div key={dateKey} className="border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                    <div className="text-xs text-muted-foreground">{dateKey}</div>
                  </div>

                  <ul className="space-y-2">
                    {items.map((g) => (
                      <li key={g.id} className="flex items-center gap-2">
                        <input
                          aria-label="toggle goal"
                          type="checkbox"
                          className="w-4 h-4"
                          checked={g.done}
                          onChange={() => toggleGoal(dateKey, g.id)}
                        />
                        <span className={g.done ? 'line-through text-muted-foreground' : ''}>{g.title}</span>
                        <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => removeGoal(dateKey, g.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>

                  {items.length < 3 && (
                    <AddGoalInput onAdd={(title) => addGoal(dateKey, title)} />
                  )}
                </div>
              );
            })}
          </section>

          <section className="mt-8 border-t pt-6">
            <h2 className="text-lg font-medium mb-3">Important Dates</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <AddImportantDate onAdd={(title, dateKey) => addImportantDate(title, dateKey)} />
              <div className="md:col-span-2">
                <ul className="space-y-2">
                  {week.importantDates.map((d) => (
                    <li key={d.id} className="border p-2 flex items-center gap-2">
                      <div className="text-sm font-medium flex-1">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{d.dateKey}</div>
                      <Button variant="outline" size="sm" onClick={() => removeImportantDate(d.id)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function AddGoalInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(value);
        setValue('');
      }}
      className="mt-3 flex items-center gap-2"
    >
      <Input placeholder="Add goal (max 3)" value={value} onChange={(e) => setValue(e.target.value)} />
      <Button type="submit" variant="outline" size="sm">Add</Button>
    </form>
  );
}

function AddImportantDate({ onAdd }: { onAdd: (title: string, dateKey: string) => void }) {
  const [title, setTitle] = useState('');
  const [dateKey, setDateKey] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(title, dateKey);
        setTitle('');
        setDateKey('');
      }}
      className="border p-3 grid gap-2"
    >
      <Input placeholder="Important date title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input placeholder="YYYY-MM-DD" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
      <Button type="submit" variant="outline" size="sm">Add</Button>
    </form>
  );
}


