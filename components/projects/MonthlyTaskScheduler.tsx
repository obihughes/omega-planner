'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProjectTask } from '@/types/projects';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getDateKey } from '@/utils/dateUtils';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface MonthlyTaskSchedulerProps {
  tasks: TaskWithProject[];
  onDateDrop: (date: Date, taskId: string) => void;
  onDateSelect?: (date: Date) => void;
}

export function MonthlyTaskScheduler({ tasks, onDateDrop, onDateSelect }: MonthlyTaskSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay();
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  const daysInCalendar = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [startDate]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithProject[]>();
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const key = getDateKey(t.dueDate);
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  const navigateMonth = (dir: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1));
      return d;
    });
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverKey(null);
    if (taskId) onDateDrop(date, taskId);
  };

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [] as TaskWithProject[];
    const key = getDateKey(selectedDate);
    return tasksByDate.get(key) || [];
  }, [selectedDate, tasksByDate]);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm font-medium">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigateMonth('next')}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground border-b border-border">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {daysInCalendar.map((date, idx) => {
          const key = getDateKey(date);
          const dayTasks = tasksByDate.get(key) || [];
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

          return (
            <div
              key={idx}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverKey(key)}
              onDragLeave={() => setDragOverKey(null)}
              onDrop={(e) => handleDrop(e, date)}
              onClick={() => { setSelectedDate(date); onDateSelect?.(date); }}
              className={cn(
                'relative h-28 p-2 border-b border-r border-border/30',
                !isCurrentMonth && 'bg-muted/20 text-muted-foreground/60',
                isToday && 'bg-primary/5 border-l-2 border-l-primary',
                dragOverKey === key && 'bg-blue-500/10',
                isSelected && 'ring-1 ring-primary'
              )}
              title={`${dayTasks.length} task${dayTasks.length===1?'':'s'}`}
            >
              <div className={cn('text-xs font-semibold', isToday && 'text-primary')}>{date.getDate()}</div>
              {/* Unlimited dots (wrap) */}
              {dayTasks.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {dayTasks.map(t => (
                    <span
                      key={t.id}
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.projectColor }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        <div className="text-sm font-medium mb-2">Selected day</div>
        {selectedTasks.length === 0 ? (
          <div className="text-xs text-muted-foreground">No tasks for this day</div>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {selectedTasks.map(t => (
              <li key={t.id} className="flex items-center gap-2 text-xs">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: t.projectColor }} />
                <span className="font-medium truncate">{t.title}</span>
                <span className="text-muted-foreground">({t.projectName})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


