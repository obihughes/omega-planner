'use client';

import React, { useState, useMemo } from 'react';
import { useStudyTrackerContext } from '@/app/context/StudyTrackerContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUBJECT_DOT_COLORS: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  gray: 'bg-gray-500',
  slate: 'bg-slate-500',
  stone: 'bg-stone-500',
  zinc: 'bg-zinc-500',
};

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface StudyMonthlyViewProps {
  onNavigateToWeek?: (date: Date) => void;
}

export function StudyMonthlyView({ onNavigateToWeek }: StudyMonthlyViewProps) {
  const {
    subjects,
    subjectFilter,
    toggleSubjectFilter,
    getTasksForDateRange,
  } = useStudyTrackerContext();

  const [monthOffset, setMonthOffset] = useState(0);
  const [showSubjectFilter, setShowSubjectFilter] = useState(false);

  const { firstOfMonth, days, monthLabel } = useMemo(() => {
    const today = new Date();
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const firstOfMonth = new Date(targetMonth);
    const startDate = new Date(firstOfMonth);
    const firstDayWeekday = firstOfMonth.getDay();
    startDate.setDate(firstOfMonth.getDate() - firstDayWeekday);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }

    const monthLabel = firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { firstOfMonth, days, monthLabel };
  }, [monthOffset]);

  const startKey = toDateKey(days[0]);
  const endKey = toDateKey(days[days.length - 1]);
  const tasksInRange = useMemo(
    () => getTasksForDateRange(startKey, endKey),
    [getTasksForDateRange, startKey, endKey]
  );

  const tasksByDate = useMemo(() => {
    const map = new Map<string, { subjectId: string; color: string }[]>();
    for (const task of tasksInRange) {
      const subject = subjects.find((s) => s.id === task.subjectId);
      const color = subject?.color ?? 'gray';
      const filtered =
        subjectFilter.size === 0 || subjectFilter.has(task.subjectId);
      if (!filtered) continue;

      const existing = map.get(task.dateKey) ?? [];
      if (!existing.some((e) => e.subjectId === task.subjectId)) {
        existing.push({ subjectId: task.subjectId, color });
        map.set(task.dateKey, existing);
      }
    }
    return map;
  }, [tasksInRange, subjects, subjectFilter]);

  const hasActiveFilter = subjectFilter.size > 0;

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonthOffset((p) => p - 1)}
              className="h-8 w-8 p-0"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={monthOffset === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMonthOffset(0)}
              className="h-8 px-3 text-xs"
              title="Current month"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonthOffset((p) => p + 1)}
              className="h-8 w-8 p-0"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">{monthLabel}</div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubjectFilter((p) => !p)}
              className={cn('h-8 px-3 gap-2', hasActiveFilter && 'border-primary/50')}
              title="Filter by subject"
            >
              <Filter className="w-4 h-4" />
              <span className="text-xs font-medium">
                {hasActiveFilter ? `Subjects (${subjectFilter.size})` : 'Subjects'}
              </span>
            </Button>
            {showSubjectFilter && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSubjectFilter(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-border bg-card p-2 shadow-lg">
                  <p className="text-xs text-muted-foreground mb-2 px-2">
                    Show activity for selected subjects
                  </p>
                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-2">
                      No subjects yet
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {subjects.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={
                              subjectFilter.size === 0 || subjectFilter.has(s.id)
                            }
                            onChange={() =>
                              toggleSubjectFilter(s.id, subjects.map((x) => x.id))
                            }
                            className="rounded border-border"
                          />
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              SUBJECT_DOT_COLORS[s.color] ?? 'bg-gray-500'
                            )}
                          />
                          <span className="truncate">{s.name || 'Untitled'}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="bg-card overflow-hidden border border-border/50 rounded-lg max-w-4xl mx-auto">
          <div className="grid grid-cols-7 border-b border-border/40 text-center font-semibold text-muted-foreground bg-card">
            <div className="p-3 text-xs">Sun</div>
            <div className="p-3 text-xs">Mon</div>
            <div className="p-3 text-xs">Tue</div>
            <div className="p-3 text-xs">Wed</div>
            <div className="p-3 text-xs">Thu</div>
            <div className="p-3 text-xs">Fri</div>
            <div className="p-3 text-xs">Sat</div>
          </div>

          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === firstOfMonth.getMonth();
              const isToday =
                date.toDateString() === new Date().toDateString();
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPast = date < today && !isToday;
              const dateKey = toDateKey(date);
              const daySubjects = tasksByDate.get(dateKey) ?? [];

              return (
                <div
                  key={`${firstOfMonth.getMonth()}-${index}`}
                  className={cn(
                    'min-h-[100px] border-r border-b border-border/30 last:border-r-0 transition-all duration-200 cursor-pointer relative group',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    isPast && 'opacity-50',
                    isToday && 'border-primary border-2 bg-primary/10 ring-2 ring-primary/30'
                  )}
                  onClick={() => onNavigateToWeek?.(date)}
                >
                  <div className="relative z-10 h-full p-2">
                    <div
                      className={cn(
                        'text-sm mb-2 font-medium',
                        !isCurrentMonth && 'text-muted-foreground',
                        isToday && 'text-primary font-bold'
                      )}
                    >
                      {date.getDate()}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {daySubjects.slice(0, 5).map(({ subjectId, color }) => (
                        <div
                          key={subjectId}
                          className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            SUBJECT_DOT_COLORS[color] ?? 'bg-gray-500'
                          )}
                          title={
                            subjects.find((s) => s.id === subjectId)?.name ??
                            'Unknown'
                          }
                        />
                      ))}
                      {daySubjects.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{daySubjects.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
