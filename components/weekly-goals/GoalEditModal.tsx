'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { WeeklyGoal } from '@/types/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Save, StickyNote, Trash2, X } from 'lucide-react';
import { GOAL_COLORS } from './goalColors';

export interface GoalEditModalProps {
  goal: WeeklyGoal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType' | 'color'>>) => void;
  onDelete: () => void;
  onCreateTask: () => void;
}

export function GoalEditModal({
  goal,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onCreateTask,
}: GoalEditModalProps) {
  const [editedTitle, setEditedTitle] = useState(goal?.title || '');
  const [editedNotes, setEditedNotes] = useState(goal?.notes || '');
  const [selectedColor, setSelectedColor] = useState(goal?.color || 'gray');
  const [selectedGoalType, setSelectedGoalType] = useState<'primary' | 'supporting'>(
    goal?.goalType || 'supporting'
  );
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (goal) {
      setEditedTitle(goal.title);
      setEditedNotes(goal.notes || '');
      setSelectedColor(goal.color || 'gray');
      setSelectedGoalType(goal.goalType || 'supporting');
    }
  }, [goal]);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen || !goal) return null;

  const handleSave = () => {
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle) return;

    onSave({
      title: trimmedTitle,
      notes: editedNotes.trim() || undefined,
      color: selectedColor,
      goalType: selectedGoalType,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-card rounded-xl shadow-2xl p-4 w-full max-w-md border border-border text-foreground flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold">Edit Goal</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Goal Title</label>
          <Input
            ref={titleInputRef}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter goal title..."
            className="text-sm py-1.5"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Goal Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedGoalType('primary')}
              className={`flex-1 px-3 py-1.5 border transition-all rounded-lg text-xs font-medium ${
                selectedGoalType === 'primary'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              }`}
            >
              Primary Goal
            </button>
            <button
              type="button"
              onClick={() => setSelectedGoalType('supporting')}
              className={`flex-1 px-3 py-1.5 border transition-all rounded-lg text-xs font-medium ${
                selectedGoalType === 'supporting'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              }`}
            >
              Supporting Task
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Color</label>
          <div className="flex gap-1 flex-wrap">
            {GOAL_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`w-8 h-8 border-2 transition-all rounded ${color.bg} ${
                  selectedColor === color.value
                    ? 'ring-2 ring-offset-1 ring-primary scale-110 opacity-100'
                    : 'opacity-100 hover:opacity-100'
                }`}
                title={color.name}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium flex items-center gap-2">
            <StickyNote className="w-3 h-3" />
            Notes (Optional)
          </label>
          <Textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add any notes or context..."
            className="text-xs min-h-[60px] py-1.5"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} className="flex-1 py-1.5 text-sm" disabled={!editedTitle.trim()}>
            <Save className="w-3 h-3 mr-1" />
            Save Changes
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1 py-1.5 text-sm">
            Cancel
          </Button>
        </div>

        <div className="flex gap-2 pt-1 border-t border-border/50">
          <Button
            onClick={() => {
              onCreateTask();
              onClose();
            }}
            variant="outline"
            size="sm"
            className="flex-1 py-1 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Create Task
          </Button>
          <Button
            onClick={() => {
              onDelete();
              onClose();
            }}
            variant="outline"
            size="sm"
            className="flex-1 py-1 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
