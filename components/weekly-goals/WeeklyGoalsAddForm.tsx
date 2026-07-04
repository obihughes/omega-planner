'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GOAL_COLORS } from './goalColors';

export interface WeeklyGoalsAddFormProps {
  canAddMore: boolean;
  showInput: boolean;
  onShowInput: (show: boolean) => void;
  onAddGoal: (title: string, color: string, goalType: 'primary' | 'supporting') => void;
}

export function WeeklyGoalsAddForm({
  canAddMore,
  showInput,
  onShowInput,
  onAddGoal,
}: WeeklyGoalsAddFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedColor, setSelectedColor] = useState('gray');
  const [selectedGoalType, setSelectedGoalType] = useState<'primary' | 'supporting'>('supporting');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onAddGoal(inputValue, selectedColor, selectedGoalType);
      setInputValue('');
      setSelectedColor('gray');
      setSelectedGoalType('supporting');
      onShowInput(false);
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setSelectedColor('gray');
    setSelectedGoalType('supporting');
    onShowInput(false);
  };

  if (!showInput || !canAddMore) return null;

  return (
    <div className="space-y-2 pt-1">
      <Input
        ref={inputRef}
        placeholder="New goal..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          } else if (e.key === 'Escape') {
            handleCancel();
          }
        }}
        className="text-sm h-8"
      />

      <div className="flex gap-2 items-center text-xs">
        <span className="text-muted-foreground">Type:</span>
        <button
          type="button"
          onClick={() => setSelectedGoalType('primary')}
          className={`px-2 py-1 border transition-all ${
            selectedGoalType === 'primary'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card hover:bg-muted'
          }`}
        >
          Primary
        </button>
        <button
          type="button"
          onClick={() => setSelectedGoalType('supporting')}
          className={`px-2 py-1 border transition-all ${
            selectedGoalType === 'supporting'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card hover:bg-muted'
          }`}
        >
          Task
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {GOAL_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            className={`w-6 h-6 border-2 transition-all ${color.bg} ${
              selectedColor === color.value
                ? 'ring-2 ring-offset-1 ring-primary scale-110'
                : 'opacity-60 hover:opacity-100'
            }`}
            title={color.name}
            onClick={() => setSelectedColor(color.value)}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} size="sm" className="flex-1">
          Add
        </Button>
        <Button onClick={handleCancel} size="sm" variant="outline">
          Cancel
        </Button>
      </div>
    </div>
  );
}
