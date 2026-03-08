'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Subject } from '@/types/study';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUBJECT_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'gray', 'slate', 'stone', 'zinc',
];

const COLOR_CLASSES: Record<string, string> = {
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

interface SubjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onUpdateSubject: (id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>) => void;
  onRemoveSubject: (id: string) => void;
}

export function SubjectManagementModal({
  isOpen,
  onClose,
  subjects,
  onUpdateSubject,
  onRemoveSubject,
}: SubjectManagementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-card rounded-xl shadow-2xl p-4 w-full max-w-md border border-border text-foreground flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold">Manage Subjects</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Edit subject names and colors. Deleting a subject will remove all its study tasks.
        </p>

        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No subjects yet. Add one from the header.
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {subjects.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                onUpdate={(updates) => onUpdateSubject(subject.id, updates)}
                onRemove={() => {
                  if (window.confirm(`Remove "${subject.name}"? All study tasks for this subject will be deleted.`)) {
                    onRemoveSubject(subject.id);
                  }
                }}
              />
            ))}
          </div>
        )}

        <Button onClick={onClose} variant="outline" className="mt-2">
          Done
        </Button>
      </div>
    </div>
  );
}

interface SubjectRowProps {
  subject: Subject;
  onUpdate: (updates: Partial<Pick<Subject, 'name' | 'color'>>) => void;
  onRemove: () => void;
}

function SubjectRow({ subject, onUpdate, onRemove }: SubjectRowProps) {
  const [name, setName] = useState(subject.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(subject.name);
  }, [subject.name]);

  const handleBlur = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== subject.name) {
      onUpdate({ name: trimmed });
    } else if (!trimmed) {
      setName(subject.name);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') inputRef.current?.blur();
          }}
          placeholder="Subject name"
          className="flex-1 h-8 text-sm"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          title="Remove subject"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {SUBJECT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-all flex-shrink-0',
              COLOR_CLASSES[color] ?? 'bg-gray-500',
              subject.color === color ? 'ring-2 ring-offset-1 ring-primary scale-110' : 'opacity-70 hover:opacity-100'
            )}
            title={color}
            onClick={() => onUpdate({ color })}
          />
        ))}
      </div>
    </div>
  );
}
