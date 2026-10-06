'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TopicSubject } from '@/types/subjects';
import { TopicProgress } from '@/hooks/useSubjectsManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Plus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubjectColorPicker, subjectColorClass } from './SubjectColorPicker';

interface SubjectsListProps {
  subjects: TopicSubject[];
  selectedSubjectId: string | null;
  progressBySubject: Record<string, TopicProgress>;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onUpdate: (id: string, updates: Partial<Pick<TopicSubject, 'name' | 'color'>>) => void;
  onRemove: (id: string) => void;
}

export function SubjectsList({
  subjects,
  selectedSubjectId,
  progressBySubject,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
}: SubjectsListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  const handleAdd = () => {
    if (newName.trim()) onAdd(newName);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <aside className="w-72 flex-shrink-0 border-r border-border/50 flex flex-col min-h-0">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Subjects</h2>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setIsAdding(true)}
          title="Add subject"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isAdding && (
          <div className="flex gap-1 p-1">
            <Input
              ref={addInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setNewName('');
                  setIsAdding(false);
                }
              }}
              placeholder="Subject name"
              className="h-8 text-sm"
            />
          </div>
        )}

        {subjects.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground px-2 py-6 text-center">
            No subjects yet. Click + to add one.
          </p>
        )}

        {subjects.map((subject) =>
          editingId === subject.id ? (
            <SubjectEditRow
              key={subject.id}
              subject={subject}
              onUpdate={(updates) => onUpdate(subject.id, updates)}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <SubjectRow
              key={subject.id}
              subject={subject}
              progress={progressBySubject[subject.id]}
              active={subject.id === selectedSubjectId}
              onSelect={() => onSelect(subject.id)}
              onEdit={() => setEditingId(subject.id)}
              onRemove={() => {
                if (window.confirm(`Remove "${subject.name}"? All its topics will be deleted.`)) {
                  onRemove(subject.id);
                }
              }}
            />
          )
        )}
      </div>
    </aside>
  );
}

interface SubjectRowProps {
  subject: TopicSubject;
  progress?: TopicProgress;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function SubjectRow({ subject, progress, active, onSelect, onEdit, onRemove }: SubjectRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
      )}
    >
      <span className={cn('w-3 h-3 rounded-full flex-shrink-0', subjectColorClass(subject.color))} />
      <span className="flex-1 truncate text-sm font-medium">{subject.name || 'Untitled'}</span>
      <span className="text-xs text-muted-foreground tabular-nums group-hover:hidden">
        {progress ? `${progress.completed}/${progress.total}` : '0'}
      </span>
      <div className="hidden group-hover:flex items-center gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded hover:bg-background/60"
          title="Edit subject"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded hover:bg-destructive/20 hover:text-destructive"
          title="Remove subject"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface SubjectEditRowProps {
  subject: TopicSubject;
  onUpdate: (updates: Partial<Pick<TopicSubject, 'name' | 'color'>>) => void;
  onDone: () => void;
}

function SubjectEditRow({ subject, onUpdate, onDone }: SubjectEditRowProps) {
  const [name, setName] = useState(subject.name);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== subject.name) onUpdate({ name: trimmed });
    onDone();
  };

  return (
    <div className="flex flex-col gap-2 p-2 rounded-md border border-border/50 bg-muted/20">
      <div className="flex items-center gap-1">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') onDone();
          }}
          className="h-8 text-sm"
        />
        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={commit} title="Save">
          <Check className="w-4 h-4" />
        </Button>
      </div>
      <SubjectColorPicker value={subject.color} onChange={(color) => onUpdate({ color })} />
    </div>
  );
}
