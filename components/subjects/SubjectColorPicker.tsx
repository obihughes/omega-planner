'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SUBJECT_COLORS } from '@/hooks/useSubjectsManager';

export const SUBJECT_COLOR_CLASSES: Record<string, string> = {
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

export function subjectColorClass(color: string): string {
  return SUBJECT_COLOR_CLASSES[color] ?? 'bg-gray-500';
}

interface SubjectColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function SubjectColorPicker({ value, onChange }: SubjectColorPickerProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {SUBJECT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            'w-5 h-5 rounded-full border-2 transition-all flex-shrink-0',
            subjectColorClass(color),
            value === color ? 'ring-2 ring-offset-1 ring-primary scale-110' : 'opacity-70 hover:opacity-100'
          )}
          title={color}
          aria-label={`Color ${color}`}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
