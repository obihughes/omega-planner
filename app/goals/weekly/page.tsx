'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoalsStorage } from '@/utils';
import { WeekGoals, WeeklyGoal } from '@/types';
import { Trash2, Plus, ExternalLink } from 'lucide-react';

const GOAL_COLORS = [
  { name: 'Gray', bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-700 dark:text-gray-300', value: 'gray' },
  { name: 'Blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', value: 'blue' },
  { name: 'Green', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-700 dark:text-green-300', value: 'green' },
  { name: 'Yellow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-700 dark:text-yellow-300', value: 'yellow' },
  { name: 'Red', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-700 dark:text-red-300', value: 'red' },
  { name: 'Purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-700 dark:text-purple-300', value: 'purple' },
];

function getMondayStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun, 1 Mon
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toWeekStartKey(date: Date): string {
  return toDateKey(getMondayStart(date));
}

export default function WeeklyGoalsPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayStart(new Date()));
  const [week, setWeek] = useState<WeekGoals>(() => GoalsStorage.loadWeek(toWeekStartKey(getMondayStart(new Date()))));

  useEffect(() => {
    setWeek(GoalsStorage.loadWeek(toWeekStartKey(weekStart)));
  }, [weekStart]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const addGoal = useCallback((dateKey: string, title: string, color?: string) => {
    if (!title.trim()) return;
    const goal: WeeklyGoal = {
      id: Math.random().toString(36).slice(2),
      title: title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      color: color || 'gray',
    };
    const next = GoalsStorage.addGoal(week.weekStartKey, dateKey, goal);
    setWeek(next);
  }, [week]);

  const toggleGoal = useCallback((dateKey: string, goalId: string) => {
    const next = GoalsStorage.toggleGoal(week.weekStartKey, dateKey, goalId);
    setWeek(next);
  }, [week]);

  const removeGoal = useCallback((dateKey: string, goalId: string) => {
    const next = GoalsStorage.removeGoal(week.weekStartKey, dateKey, goalId);
    setWeek(next);
  }, [week]);

  const updateGoalColor = useCallback((dateKey: string, goalId: string, color: string) => {
    const next = GoalsStorage.updateGoalColor(week.weekStartKey, dateKey, goalId, color);
    setWeek(next);
  }, [week]);

  const createTaskFromGoal = useCallback((goal: WeeklyGoal, dateKey: string) => {
    // Navigate to tasks page with pre-filled data
    const params = new URLSearchParams({
      action: 'create',
      title: goal.title,
      dueDate: dateKey,
      notes: `From weekly goal: ${goal.title}`
    });
    router.push(`/projects/tasks?${params.toString()}`);
  }, [router]);

  const todayKey = toDateKey(new Date());

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(getMondayStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000)))}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(getMondayStart(new Date()))}>This Week</Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(getMondayStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)))}>Next</Button>
          </div>
          <h1 className="text-xl font-medium">Weekly Goals</h1>
          <div className="text-sm text-muted-foreground">Week of {toDateKey(weekStart)}</div>
        </header>

        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="grid grid-cols-7 gap-3 h-full">
            {days.map((d) => {
              const dateKey = toDateKey(d);
              const items = (week.goalsByDate[dateKey] || []).slice(0, 3);
              const isToday = dateKey === todayKey;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              
              return (
                <DayColumn
                  key={dateKey}
                  date={d}
                  dateKey={dateKey}
                  goals={items}
                  isToday={isToday}
                  isWeekend={isWeekend}
                  onAddGoal={(title, color) => addGoal(dateKey, title, color)}
                  onToggleGoal={(id) => toggleGoal(dateKey, id)}
                  onRemoveGoal={(id) => removeGoal(dateKey, id)}
                  onUpdateColor={(id, color) => updateGoalColor(dateKey, id, color)}
                  onCreateTask={(goal) => createTaskFromGoal(goal, dateKey)}
                  canAddMore={items.length < 3}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

interface DayColumnProps {
  date: Date;
  dateKey: string;
  goals: WeeklyGoal[];
  isToday: boolean;
  isWeekend: boolean;
  onAddGoal: (title: string, color: string) => void;
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onCreateTask: (goal: WeeklyGoal) => void;
  canAddMore: boolean;
}

function DayColumn({ 
  date, 
  dateKey, 
  goals, 
  isToday, 
  isWeekend,
  onAddGoal, 
  onToggleGoal, 
  onRemoveGoal,
  onUpdateColor,
  onCreateTask,
  canAddMore 
}: DayColumnProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedColor, setSelectedColor] = useState('gray');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onAddGoal(inputValue, selectedColor);
      setInputValue('');
      setSelectedColor('gray');
    }
    setShowInput(false);
  };

  const handleCancel = () => {
    setInputValue('');
    setSelectedColor('gray');
    setShowInput(false);
  };

  return (
    <div 
      className={`border flex flex-col h-full transition-colors ${
        isToday 
          ? 'bg-primary/5 border-primary/20' 
          : isWeekend 
            ? 'bg-muted/30' 
            : 'bg-card'
      }`}
      onMouseEnter={() => !showInput && canAddMore && setShowInput(true)}
      onMouseLeave={() => !inputValue && setShowInput(false)}
    >
      <div className="p-3 border-b">
        <div className="text-sm font-medium">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
        <div className="text-xs text-muted-foreground">{date.getDate()}</div>
      </div>

      <div className="flex-1 p-3 space-y-2">
        {goals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            onToggle={() => onToggleGoal(goal.id)}
            onRemove={() => onRemoveGoal(goal.id)}
            onUpdateColor={(color) => onUpdateColor(goal.id, color)}
            onCreateTask={() => onCreateTask(goal)}
          />
        ))}

        {showInput && canAddMore && (
          <div className="space-y-2">
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
              onBlur={handleCancel}
              className="text-sm h-8"
            />
            <div className="flex gap-1">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedColor(c.value);
                  }}
                  className={`w-5 h-5 border-2 transition-all ${c.bg} ${
                    selectedColor === c.value ? 'ring-2 ring-offset-1 ring-primary scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface GoalItemProps {
  goal: WeeklyGoal;
  onToggle: () => void;
  onRemove: () => void;
  onUpdateColor: (color: string) => void;
  onCreateTask: () => void;
}

function GoalItem({ goal, onToggle, onRemove, onUpdateColor, onCreateTask }: GoalItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const colorScheme = GOAL_COLORS.find(c => c.value === goal.color) || GOAL_COLORS[0];

  return (
    <div 
      className={`border p-2 group transition-all ${colorScheme.bg} ${colorScheme.border}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowColorPicker(false);
      }}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={goal.done}
          onChange={onToggle}
          className="w-4 h-4 mt-0.5 cursor-pointer"
          aria-label="toggle goal"
        />
        <span className={`flex-1 text-sm ${goal.done ? 'line-through opacity-50' : ''} ${colorScheme.text}`}>
          {goal.title}
        </span>
        
        {showActions && !goal.done && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`w-5 h-5 border hover:scale-110 transition-transform ${colorScheme.bg} ${colorScheme.border}`}
              title="Change color"
            />
            <button
              onClick={onCreateTask}
              className="p-0.5 hover:bg-primary/20 transition-colors"
              title="Create task"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRemove}
              className="p-0.5 hover:bg-destructive/20 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        )}
      </div>

      {showColorPicker && (
        <div className="flex gap-1 mt-2 pt-2 border-t">
          {GOAL_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                onUpdateColor(c.value);
                setShowColorPicker(false);
              }}
              className={`w-5 h-5 border transition-all ${c.bg} ${c.border} ${
                goal.color === c.value ? 'ring-2 ring-offset-1 ring-primary' : 'hover:scale-110'
              }`}
              title={c.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}


