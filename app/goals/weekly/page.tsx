'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GoalsStorage, dateFromDateKey } from '@/utils';
import { WeekGoals, WeeklyGoal } from '@/types';
import { Trash2, Plus, ExternalLink, MoreVertical, Edit2, Save, X, StickyNote, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // State for week navigation (0 = current week, -1 = previous week, 1 = next week, etc.)
  const [weekOffset, setWeekOffset] = useState(0);

  // Generate 14 days: current week Monday-Sunday on top row, next week Monday-Sunday on bottom row
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Calculate the Monday of the target week
    const targetMonday = new Date(today);
    targetMonday.setDate(targetMonday.getDate() + (weekOffset * 7));
    const targetMondayStart = getMondayStart(targetMonday);

    // Create array with current week (Monday-Sunday) then next week (Monday-Sunday)
    const result = [];
    // Add current week: Monday to Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(targetMondayStart);
      d.setDate(targetMondayStart.getDate() + i);
      result.push(d);
    }
    // Add next week: Monday to Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(targetMondayStart);
      d.setDate(targetMondayStart.getDate() + 7 + i);
      result.push(d);
    }

    return result;
  }, [weekOffset]);

  // Client-only: load goals across visible weeks after mount to avoid SSR hydration mismatch
  const [goalsData, setGoalsData] = useState<Record<string, WeekGoals>>({});

  useEffect(() => {
    const cache: Record<string, WeekGoals> = {};
    days.forEach(day => {
      const weekKey = toWeekStartKey(day);
      if (!cache[weekKey]) {
        cache[weekKey] = GoalsStorage.loadWeek(weekKey);
      }
    });
    setGoalsData(cache);
  }, [days]);

  const addGoal = useCallback((dateKey: string, title: string, color?: string, goalType?: 'primary' | 'supporting') => {
    if (!title.trim()) return;
    const goal: WeeklyGoal = {
      id: Math.random().toString(36).slice(2),
      title: title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      color: color || 'gray',
      goalType: goalType || 'supporting',
    };
    // Find the week key for this date (timezone-safe parsing)
    const date = dateFromDateKey(dateKey);
    const weekKey = toWeekStartKey(date);
    const next = GoalsStorage.addGoal(weekKey, dateKey, goal);
    setGoalsData(prev => ({ ...prev, [weekKey]: next }));
  }, []);

  const toggleGoal = useCallback((dateKey: string, goalId: string) => {
    const date = dateFromDateKey(dateKey);
    const weekKey = toWeekStartKey(date);
    const next = GoalsStorage.toggleGoal(weekKey, dateKey, goalId);
    setGoalsData(prev => ({ ...prev, [weekKey]: next }));
  }, []);

  const removeGoal = useCallback((dateKey: string, goalId: string) => {
    const date = dateFromDateKey(dateKey);
    const weekKey = toWeekStartKey(date);
    const next = GoalsStorage.removeGoal(weekKey, dateKey, goalId);
    setGoalsData(prev => ({ ...prev, [weekKey]: next }));
  }, []);

  const updateGoalColor = useCallback((dateKey: string, goalId: string, color: string) => {
    const date = dateFromDateKey(dateKey);
    const weekKey = toWeekStartKey(date);
    const next = GoalsStorage.updateGoalColor(weekKey, dateKey, goalId, color);
    setGoalsData(prev => ({ ...prev, [weekKey]: next }));
  }, []);

  const updateGoal = useCallback((dateKey: string, goalId: string, updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType'>>) => {
    const date = dateFromDateKey(dateKey);
    const weekKey = toWeekStartKey(date);
    const next = GoalsStorage.updateGoal(weekKey, dateKey, goalId, updates);
    setGoalsData(prev => ({ ...prev, [weekKey]: next }));
  }, []);

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

  const goToPreviousWeek = useCallback(() => {
    setWeekOffset(prev => prev - 1);
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekOffset(prev => prev + 1);
  }, []);

  const goToCurrentWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  // Calculate current week range for display
  const currentWeekRange = useMemo(() => {
    if (days.length === 0) return '';
    const startDate = days[0];
    const endDate = days[days.length - 1];
    const startMonth = startDate.toLocaleDateString(undefined, { month: 'short' });
    const endMonth = endDate.toLocaleDateString(undefined, { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }, [days]);

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-medium">Daily Goals</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="h-8 w-8 p-0"
                title="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={weekOffset === 0 ? "default" : "outline"}
                size="sm"
                onClick={goToCurrentWeek}
                className="h-8 px-3 text-xs"
                title="Go to current week"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="h-8 w-8 p-0"
                title="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentWeekRange} · Up to 3 goals per day
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-7 gap-3 auto-rows-fr">
            {days.map((d) => {
              const dateKey = toDateKey(d);
              const weekKey = toWeekStartKey(d);
              const weekData = goalsData[weekKey];
              const items = (weekData?.goalsByDate?.[dateKey] || []).slice(0, 3);
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
                  onAddGoal={(title, color, goalType) => addGoal(dateKey, title, color, goalType)}
                  onToggleGoal={(id) => toggleGoal(dateKey, id)}
                  onRemoveGoal={(id) => removeGoal(dateKey, id)}
                  onUpdateColor={(id, color) => updateGoalColor(dateKey, id, color)}
                  onUpdateGoal={(id, updates) => updateGoal(dateKey, id, updates)}
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
  onAddGoal: (title: string, color: string, goalType: 'primary' | 'supporting') => void;
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateGoal: (id: string, updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType'>>) => void;
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
  onUpdateGoal,
  onCreateTask,
  canAddMore 
}: DayColumnProps) {
  const [showInput, setShowInput] = useState(false);
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
      setShowInput(false);
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setSelectedColor('gray');
    setSelectedGoalType('supporting');
    setShowInput(false);
  };

  return (
    <div 
      className={`border flex flex-col min-h-[280px] transition-colors ${
        isToday 
          ? 'bg-primary/5 border-primary/20' 
          : isWeekend 
            ? 'bg-muted/30' 
            : 'bg-card'
      }`}
    >
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <button
          type="button"
          aria-label="Add goal"
          onClick={() => canAddMore && setShowInput(true)}
          disabled={!canAddMore || showInput}
          className={`w-7 h-7 grid place-items-center border transition-colors ${
            !canAddMore || showInput ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
          }`}
          title="Add goal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-visible">
        {goals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            onToggle={() => onToggleGoal(goal.id)}
            onRemove={() => onRemoveGoal(goal.id)}
            onUpdateColor={(color) => onUpdateColor(goal.id, color)}
            onUpdate={(updates) => onUpdateGoal(goal.id, updates)}
            onCreateTask={() => onCreateTask(goal)}
          />
        ))}

        {showInput && canAddMore ? (
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
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`w-6 h-6 border-2 transition-all ${c.bg} ${
                    selectedColor === c.value ? 'ring-2 ring-offset-1 ring-primary scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={c.name}
                  onClick={() => setSelectedColor(c.value)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="sm" className="flex-1">Add</Button>
              <Button onClick={handleCancel} size="sm" variant="outline">Cancel</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface GoalItemProps {
  goal: WeeklyGoal;
  onToggle: () => void;
  onRemove: () => void;
  onUpdateColor: (color: string) => void;
  onUpdate: (updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType'>>) => void;
  onCreateTask: () => void;
}

function GoalItem({ goal, onToggle, onRemove, onUpdateColor, onUpdate, onCreateTask }: GoalItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [editedNotes, setEditedNotes] = useState(goal.notes || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const colorScheme = GOAL_COLORS.find(c => c.value === goal.color) || GOAL_COLORS[0];
  const isPrimary = goal.goalType === 'primary';

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle) {
      setEditedTitle(goal.title);
      setIsEditing(false);
      return;
    }
    
    onUpdate({
      title: trimmedTitle,
      notes: editedNotes.trim() || undefined,
    });
    setIsEditing(false);
    setShowNotes(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(goal.title);
    setEditedNotes(goal.notes || '');
    setIsEditing(false);
    setShowNotes(false);
  };

  const handleToggleGoalType = () => {
    onUpdate({
      goalType: isPrimary ? 'supporting' : 'primary',
    });
    setMenuOpen(false);
  };

  return (
    <div 
      className={`border group transition-all ${colorScheme.bg} ${colorScheme.border} ${
        isPrimary ? 'p-3 border-2' : 'p-2'
      }`}
      onMouseLeave={() => {
        if (!isEditing) {
          setMenuOpen(false);
          setShowColorPicker(false);
        }
      }}
    >
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Input
              ref={titleInputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
              className={`flex-1 ${isPrimary ? 'text-base font-semibold' : 'text-sm'} h-8`}
              placeholder="Goal title..."
            />
          </div>
          
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <StickyNote className="w-3 h-3" />
              {showNotes ? 'Hide notes' : 'Add notes'}
            </button>
            
            {showNotes && (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                className="text-xs min-h-[60px]"
              />
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSaveEdit} 
              size="sm" 
              className="flex-1 h-7 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button 
              onClick={handleCancelEdit} 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2 min-w-0">
            <input
              type="checkbox"
              checked={goal.done}
              onChange={onToggle}
              className={`${isPrimary ? 'w-5 h-5 mt-0.5' : 'w-4 h-4 mt-0.5'} cursor-pointer flex-shrink-0`}
              aria-label="toggle goal"
            />
            <div className="flex-1 min-w-0">
              <span 
                className={`block break-words ${
                  isPrimary ? 'text-base font-semibold' : 'text-sm'
                } ${goal.done ? 'line-through opacity-50' : ''} ${colorScheme.text}`}
                title={goal.title}
                onDoubleClick={() => setIsEditing(true)}
              >
                {goal.title}
              </span>
              {goal.notes && !goal.done && (
                <div className="text-xs text-muted-foreground mt-1 opacity-70 flex items-start gap-1">
                  <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{goal.notes}</span>
                </div>
              )}
            </div>
            
            <div className="relative flex-shrink-0 flex items-center gap-1">
              {!goal.done && (
                <button
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setShowColorPicker(false);
                  }}
                  className="p-1 hover:bg-muted transition-colors border opacity-0 group-hover:opacity-100"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
              {goal.done && (
                <button
                  onClick={() => {
                    setMenuOpen(!menuOpen);
                    setShowColorPicker(false);
                  }}
                  className="p-1 hover:bg-muted transition-colors border"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title="Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border shadow-lg min-w-[180px]">
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit goal
                  </button>
                  {!goal.done && (
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={handleToggleGoalType}
                    >
                      {isPrimary ? '→ Make supporting' : '→ Make primary'}
                    </button>
                  )}
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => {
                      setShowColorPicker((v) => !v);
                    }}
                  >
                    Change color
                  </button>
                  {!goal.done && (
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                      onClick={() => {
                        onCreateTask();
                        setMenuOpen(false);
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Create task
                    </button>
                  )}
                  <div className="border-t my-1"></div>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-destructive flex items-center gap-2"
                    onClick={() => {
                      onRemove();
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {showColorPicker && (
            <div className="flex gap-1 mt-2 pt-2 border-t flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    onUpdateColor(c.value);
                    setShowColorPicker(false);
                    setMenuOpen(false);
                  }}
                  className={`${isPrimary ? 'w-6 h-6' : 'w-5 h-5'} border transition-all ${c.bg} ${c.border} ${
                    goal.color === c.value ? 'ring-2 ring-offset-1 ring-primary' : 'hover:scale-110'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


