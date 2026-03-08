'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StudyCellProps {
  value: string;
  onSave: (value: string) => void;
  isToday: boolean;
  className?: string;
}

export function StudyCell({ value, onSave, isToday, className }: StudyCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(localValue.length, localValue.length);
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = localValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
      textareaRef.current?.blur();
    }
  };

  return (
    <div
      className={cn(
        'min-h-[120px] border p-3 transition-colors',
        isToday ? 'border-green-500 bg-green-500/5' : 'border-border/50 bg-muted/20',
        'hover:bg-muted/30',
        className
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Add topics..."
          className={cn(
            'w-full min-h-[100px] resize-none rounded border-0 bg-transparent p-0 text-sm',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-0'
          )}
        />
      ) : (
        <div className="min-h-[100px] text-sm text-foreground whitespace-pre-wrap">
          {localValue || (
            <span className="text-muted-foreground">Add topics...</span>
          )}
        </div>
      )}
    </div>
  );
}
