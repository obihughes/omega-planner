'use client';

import React, { useEffect, useState } from 'react';
import { Topic, TopicStatus, TOPIC_STATUSES, TOPIC_STATUS_LABELS } from '@/types/subjects';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type TopicFormValues = { title: string; status: TopicStatus; notes: string };

interface TopicFormProps {
  isOpen: boolean;
  topic: Topic | null;
  onClose: () => void;
  onSave: (values: TopicFormValues) => void;
}

export function TopicForm({ isOpen, topic, onClose, onSave }: TopicFormProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TopicStatus>('not-started');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(topic?.title ?? '');
    setStatus(topic?.status ?? 'not-started');
    setNotes(topic?.notes ?? '');
  }, [isOpen, topic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), status, notes });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{topic ? 'Edit topic' : 'New topic'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="topic-title">Title</Label>
            <Input
              id="topic-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Integration by parts"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex rounded-md border bg-muted/30 p-0.5 gap-0.5 w-fit" role="group" aria-label="Status">
              {TOPIC_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  aria-pressed={status === s}
                  className={cn(
                    'rounded px-3 py-1 text-xs font-medium transition-colors',
                    status === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {TOPIC_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topic-notes">Notes</Label>
            <Textarea
              id="topic-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key points, resources, questions..."
              className="min-h-[140px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
