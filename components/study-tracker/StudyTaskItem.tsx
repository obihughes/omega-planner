'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudyTask, Subject } from '@/types/study';
import { Edit2, Trash2, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SUBJECT_COLOR_SCHEME: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-700 dark:text-red-300' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-700 dark:text-orange-300' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-300' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-700 dark:text-yellow-300' },
  lime: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-700 dark:text-lime-300' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-700 dark:text-green-300' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-700 dark:text-teal-300' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-700 dark:text-cyan-300' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-300' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-700 dark:text-indigo-300' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-700 dark:text-violet-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700 dark:text-purple-300' },
  fuchsia: { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-700 dark:text-pink-300' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-700 dark:text-rose-300' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-700 dark:text-gray-300' },
  slate: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-700 dark:text-slate-300' },
  stone: { bg: 'bg-stone-500/10', border: 'border-stone-500/30', text: 'text-stone-700 dark:text-stone-300' },
  zinc: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-700 dark:text-zinc-300' },
};

interface StudyTaskItemProps {
  task: StudyTask;
  subject: Subject | undefined;
  subjects: Subject[];
  dateKey: string;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<Pick<StudyTask, 'title' | 'subjectId'>>) => void;
}

export function StudyTaskItem({ task, subject, subjects, dateKey, onToggle, onRemove, onUpdate }: StudyTaskItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const colorScheme = SUBJECT_COLOR_SCHEME[subject?.color ?? 'gray'] ?? SUBJECT_COLOR_SCHEME.gray;

  const handleSaveEdit = (updates: Partial<Pick<StudyTask, 'title' | 'subjectId'>>) => {
    onUpdate(updates);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromDateKey: dateKey }));
        }}
        className={cn(
          'border group transition-all p-2 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md relative overflow-hidden',
          colorScheme.bg,
          colorScheme.border,
          task.done && 'opacity-50'
        )}
      >
        <span
          className={cn(
            'block break-words text-sm',
            task.done && 'line-through',
            colorScheme.text
          )}
          title={task.title}
          onClick={() => setIsEditModalOpen(true)}
        >
          {task.title}
        </span>
        {subject && (
          <span className="text-xs text-muted-foreground mt-0.5 block truncate">
            {subject.name}
          </span>
        )}

        <input
          type="checkbox"
          checked={task.done}
          onChange={onToggle}
          className="w-4 h-4 cursor-pointer rounded absolute bottom-0.5 right-0.5 pointer-events-auto"
          aria-label="Toggle task"
        />

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-0.5 right-0.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded"
          title="Edit task"
          type="button"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>

      {isEditModalOpen && (
        <StudyTaskEditModal
          task={task}
          subject={subject}
          subjects={subjects}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          onDelete={() => {
            onRemove();
            setIsEditModalOpen(false);
          }}
        />
      )}
    </>
  );
}

interface StudyTaskEditModalProps {
  task: StudyTask;
  subject: Subject | undefined;
  subjects: Subject[];
  onClose: () => void;
  onSave: (updates: Partial<Pick<StudyTask, 'title' | 'subjectId'>>) => void;
  onDelete: () => void;
}

function StudyTaskEditModal({ task, subject, subjects, onClose, onSave, onDelete }: StudyTaskEditModalProps) {
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [selectedSubjectId, setSelectedSubjectId] = useState(task.subjectId);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, []);

  const handleSave = () => {
    const trimmed = editedTitle.trim();
    if (!trimmed) return;
    onSave({ title: trimmed, subjectId: selectedSubjectId });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'Enter' && e.ctrlKey) handleSave();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-card rounded-xl shadow-2xl p-4 w-full max-w-md border border-border text-foreground flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold">Edit Study Task</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Task Title</label>
          <Input
            ref={titleInputRef}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter task title..."
            className="text-sm py-1.5"
          />
        </div>

        {subjects.length > 1 && (
          <div className="space-y-1">
            <label className="text-xs font-medium">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || 'Untitled'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} className="flex-1 py-1.5 text-sm" disabled={!editedTitle.trim()}>
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1 py-1.5 text-sm">
            Cancel
          </Button>
        </div>

        <div className="pt-1 border-t border-border/50">
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="w-full py-1 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
