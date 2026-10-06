'use client';

import React, { useMemo, useState } from 'react';
import { TopicSubject, Topic, TopicStatus, TOPIC_STATUSES, TOPIC_STATUS_LABELS } from '@/types/subjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Circle, CircleDot, CheckCircle2, Plus, Trash2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectColorClass } from './SubjectColorPicker';

type StatusFilter = 'all' | TopicStatus;

const NEXT_STATUS: Record<TopicStatus, TopicStatus> = {
  'not-started': 'in-progress',
  'in-progress': 'completed',
  completed: 'not-started',
};

const STATUS_ICON: Record<TopicStatus, React.ElementType> = {
  'not-started': Circle,
  'in-progress': CircleDot,
  completed: CheckCircle2,
};

const STATUS_COLOR: Record<TopicStatus, string> = {
  'not-started': 'text-muted-foreground',
  'in-progress': 'text-amber-500',
  completed: 'text-green-500',
};

interface TopicsPanelProps {
  subject: TopicSubject | null;
  topics: Topic[];
  onQuickAdd: (title: string) => void;
  onOpenNew: () => void;
  onOpenEdit: (topic: Topic) => void;
  onUpdate: (id: string, updates: Partial<Pick<Topic, 'title' | 'status' | 'notes'>>) => void;
  onRemove: (id: string) => void;
}

export function TopicsPanel({ subject, topics, onQuickAdd, onOpenNew, onOpenEdit, onUpdate, onRemove }: TopicsPanelProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const counts = useMemo(() => {
    const c: Record<TopicStatus, number> = { 'not-started': 0, 'in-progress': 0, completed: 0 };
    for (const t of topics) c[t.status] += 1;
    return c;
  }, [topics]);

  const visibleTopics = filter === 'all' ? topics : topics.filter((t) => t.status === filter);
  const percent = topics.length ? Math.round((counts.completed / topics.length) * 100) : 0;

  if (!subject) {
    return (
      <section className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Add a subject on the left to start listing topics.
      </section>
    );
  }

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    onQuickAdd(quickTitle);
    setQuickTitle('');
  };

  return (
    <section className="flex-1 flex flex-col min-h-0 min-w-0">
      <div className="px-6 py-4 border-b border-border/50 space-y-3">
        <div className="flex items-center gap-3">
          <span className={cn('w-3.5 h-3.5 rounded-full flex-shrink-0', subjectColorClass(subject.color))} />
          <h2 className="text-lg font-medium truncate flex-1">{subject.name || 'Untitled'}</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {counts.completed}/{topics.length} completed
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full transition-all', subjectColorClass(subject.color))} style={{ width: `${percent}%` }} />
        </div>
        <div className="flex gap-2">
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd();
            }}
            placeholder="Add a topic to cover and press Enter"
            className="h-9 text-sm"
          />
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onOpenNew} title="Add topic with notes">
            <Plus className="w-4 h-4" />
            Detailed
          </Button>
        </div>
        <div className="flex rounded-md border bg-muted/30 p-0.5 gap-0.5 w-fit" role="group" aria-label="Filter by status">
          {(['all', ...TOPIC_STATUSES] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'all' ? `All (${topics.length})` : `${TOPIC_STATUS_LABELS[f]} (${counts[f]})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
        {visibleTopics.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {topics.length === 0 ? 'No topics yet. Add the first one above.' : 'No topics with this status.'}
          </p>
        )}
        {visibleTopics.map((topic) => {
          const Icon = STATUS_ICON[topic.status];
          return (
            <div
              key={topic.id}
              className="group flex items-start gap-3 rounded-md border border-border/50 bg-card px-3 py-2.5 hover:border-border transition-colors"
            >
              <button
                type="button"
                onClick={() => onUpdate(topic.id, { status: NEXT_STATUS[topic.status] })}
                className={cn('mt-0.5 flex-shrink-0', STATUS_COLOR[topic.status])}
                title={`${TOPIC_STATUS_LABELS[topic.status]} (click to change)`}
              >
                <Icon className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => onOpenEdit(topic)} className="flex-1 min-w-0 text-left">
                <div
                  className={cn(
                    'text-sm font-medium break-words',
                    topic.status === 'completed' && 'line-through text-muted-foreground'
                  )}
                >
                  {topic.title || 'Untitled'}
                </div>
                {topic.notes.trim() && (
                  <div className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                    <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2 whitespace-pre-wrap">{topic.notes}</span>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete topic "${topic.title}"?`)) onRemove(topic.id);
                }}
                className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity"
                title="Delete topic"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
