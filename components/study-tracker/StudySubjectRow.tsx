'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Subject } from '@/types/study';
import { StudyCell } from './StudyCell';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

const BORDER_COLOR_MAP: Record<string, string> = {
  red: 'border-l-red-500',
  orange: 'border-l-orange-500',
  amber: 'border-l-amber-500',
  yellow: 'border-l-yellow-500',
  lime: 'border-l-lime-500',
  green: 'border-l-green-500',
  emerald: 'border-l-emerald-500',
  teal: 'border-l-teal-500',
  cyan: 'border-l-cyan-500',
  blue: 'border-l-blue-500',
  indigo: 'border-l-indigo-500',
  violet: 'border-l-violet-500',
  purple: 'border-l-purple-500',
  fuchsia: 'border-l-fuchsia-500',
  pink: 'border-l-pink-500',
  rose: 'border-l-rose-500',
  gray: 'border-l-gray-500',
  slate: 'border-l-slate-500',
  stone: 'border-l-stone-500',
  zinc: 'border-l-zinc-500',
};

interface StudySubjectRowProps {
  subject: Subject;
  weekDays: { date: Date; dateKey: string }[];
  todayKey: string;
  getEntry: (subjectId: string, dateKey: string) => string;
  onUpdateEntry: (subjectId: string, dateKey: string, topics: string) => void;
  onUpdateSubject: (id: string, updates: Partial<Pick<Subject, 'name' | 'color'>>) => void;
  onRemoveSubject: (id: string) => void;
}

export function StudySubjectRow({
  subject,
  weekDays,
  todayKey,
  getEntry,
  onUpdateEntry,
  onUpdateSubject,
  onRemoveSubject,
}: StudySubjectRowProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(subject.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalName(subject.name);
  }, [subject.name]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const borderClass = BORDER_COLOR_MAP[subject.color] ?? 'border-l-gray-500';

  const handleSaveName = () => {
    setIsEditingName(false);
    const trimmed = localName.trim();
    if (trimmed && trimmed !== subject.name) {
      onUpdateSubject(subject.id, { name: trimmed });
    } else {
      setLocalName(subject.name);
    }
  };

  const handleKeyDownName = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setLocalName(subject.name);
      setIsEditingName(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={cn(
        'flex border-l-4 border-b border-border/50 group',
        borderClass
      )}
    >
      <div className="w-32 min-w-[8rem] flex-shrink-0 flex flex-col border-r border-border/50 bg-muted/10 p-3">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              ref={inputRef}
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDownName}
              className="flex-1 min-w-0 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="flex-1 min-w-0 text-left text-sm font-medium truncate hover:text-primary transition-colors"
            >
              {subject.name || 'Untitled'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove "${subject.name}"? All study entries for this subject will be deleted.`)) {
                onRemoveSubject(subject.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
            title="Remove subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-7 min-w-0">
        {weekDays.map(({ dateKey }) => (
          <StudyCell
            key={dateKey}
            value={getEntry(subject.id, dateKey)}
            onSave={(topics) => onUpdateEntry(subject.id, dateKey, topics)}
            isToday={dateKey === todayKey}
          />
        ))}
      </div>
    </div>
  );
}
