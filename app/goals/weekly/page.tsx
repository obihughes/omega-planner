'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GoalsStorage, dateFromDateKey } from '@/utils';
import { WeekGoals, WeeklyGoal } from '@/types';
import { Trash2, Plus, ExternalLink, MoreVertical, Edit2, Save, X, StickyNote, Star, GripVertical, RotateCcw } from 'lucide-react';

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
  
  // Generate 14 days: 7 days before today, today, 6 after (2 weeks total)
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i - 7); // 7 days before, then today, then 6 after
      return d;
    });
  }, []);

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

  const moveGoal = useCallback((fromDateKey: string, toDateKey: string, goalId: string) => {
    // Remove from source
    const fromDate = dateFromDateKey(fromDateKey);
    const fromWeekKey = toWeekStartKey(fromDate);
    const fromWeekData = goalsData[fromWeekKey];
    const goal = fromWeekData?.goalsByDate?.[fromDateKey]?.find(g => g.id === goalId);
    
    if (!goal) return;
    
    // Check if target day has space (max 3 goals)
    const toDate = dateFromDateKey(toDateKey);
    const toWeekKey = toWeekStartKey(toDate);
    const toWeekData = goalsData[toWeekKey];
    const targetGoals = toWeekData?.goalsByDate?.[toDateKey] || [];
    
    if (targetGoals.length >= 3) {
      alert('Target day already has 3 goals (maximum)');
      return;
    }
    
    // Remove from source
    const nextFrom = GoalsStorage.removeGoal(fromWeekKey, fromDateKey, goalId);
    
    // Add to target
    const nextTo = GoalsStorage.addGoal(toWeekKey, toDateKey, goal);
    
    // Update state
    setGoalsData(prev => ({
      ...prev,
      [fromWeekKey]: nextFrom,
      [toWeekKey]: nextTo,
    }));
  }, [goalsData]);

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
          <h1 className="text-xl font-medium">Daily Goals</h1>
          <div className="text-sm text-muted-foreground">2 Week View · Up to 3 goals per day</div>
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
                  allDays={days}
                  onAddGoal={(title, color, goalType) => addGoal(dateKey, title, color, goalType)}
                  onToggleGoal={(id) => toggleGoal(dateKey, id)}
                  onRemoveGoal={(id) => removeGoal(dateKey, id)}
                  onUpdateColor={(id, color) => updateGoalColor(dateKey, id, color)}
                  onUpdateGoal={(id, updates) => updateGoal(dateKey, id, updates)}
                  onMoveGoal={(goalId, toDateKey) => moveGoal(dateKey, toDateKey, goalId)}
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
  allDays: Date[];
  onAddGoal: (title: string, color: string, goalType: 'primary' | 'supporting') => void;
  onToggleGoal: (id: string) => void;
  onRemoveGoal: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
  onUpdateGoal: (id: string, updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType'>>) => void;
  onMoveGoal: (goalId: string, toDateKey: string) => void;
  onCreateTask: (goal: WeeklyGoal) => void;
  canAddMore: boolean;
}

function DayColumn({ 
  date, 
  dateKey, 
  goals, 
  isToday, 
  isWeekend,
  allDays,
  onAddGoal, 
  onToggleGoal, 
  onRemoveGoal,
  onUpdateColor,
  onUpdateGoal,
  onMoveGoal,
  onCreateTask,
  canAddMore 
}: DayColumnProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedColor, setSelectedColor] = useState('gray');
  const [selectedGoalType, setSelectedGoalType] = useState<'primary' | 'supporting'>('supporting');
  const [isDragOver, setIsDragOver] = useState(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canAddMore) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!canAddMore) {
      alert('This day already has 3 goals (maximum)');
      return;
    }

    const goalId = e.dataTransfer.getData('goalId');
    const fromDateKey = e.dataTransfer.getData('fromDateKey');
    
    if (goalId && fromDateKey && fromDateKey !== dateKey) {
      onMoveGoal(goalId, dateKey);
    }
  };

  return (
    <div 
      className={`border flex flex-col min-h-[280px] transition-colors ${
        isToday 
          ? 'bg-primary/5 border-primary/20' 
          : isWeekend 
            ? 'bg-muted/30' 
            : 'bg-card'
      } ${isDragOver ? 'ring-2 ring-primary ring-offset-2 bg-primary/10' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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

      <div className="flex-1 p-3 space-y-2 overflow-hidden">
        {goals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            dateKey={dateKey}
            allDays={allDays}
            onToggle={() => onToggleGoal(goal.id)}
            onRemove={() => onRemoveGoal(goal.id)}
            onUpdateColor={(color) => onUpdateColor(goal.id, color)}
            onUpdate={(updates) => onUpdateGoal(goal.id, updates)}
            onMoveGoal={(toDateKey) => onMoveGoal(goal.id, toDateKey)}
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
  dateKey: string;
  allDays: Date[];
  onToggle: () => void;
  onRemove: () => void;
  onUpdateColor: (color: string) => void;
  onUpdate: (updates: Partial<Pick<WeeklyGoal, 'title' | 'notes' | 'goalType'>>) => void;
  onMoveGoal: (toDateKey: string) => void;
  onCreateTask: () => void;
}

function GoalItem({ goal, dateKey, allDays, onToggle, onRemove, onUpdateColor, onUpdate, onMoveGoal, onCreateTask }: GoalItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [editedNotes, setEditedNotes] = useState(goal.notes || '');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const colorScheme = GOAL_COLORS.find(c => c.value === goal.color) || GOAL_COLORS[0];
  const isPrimary = goal.goalType === 'primary';
  
  // Dynamic text sizing based on title length
  const getTextSize = () => {
    if (!isPrimary) return 'text-sm';
    if (goal.title.length > 40) return 'text-sm';
    if (goal.title.length > 25) return 'text-base';
    return 'text-lg';
  };

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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('goalId', goal.id);
    e.dataTransfer.setData('fromDateKey', dateKey);
  };

  const handleMoveToDay = (targetDateKey: string) => {
    if (targetDateKey !== dateKey) {
      onMoveGoal(targetDateKey);
    }
    setShowMoveMenu(false);
    setMenuOpen(false);
  };

  return (
    <div 
      className={`border group transition-all relative ${colorScheme.bg} ${colorScheme.border} ${
        isPrimary ? 'p-3 border-2 border-l-4' : 'p-2'
      }`}
      draggable={!isEditing && !goal.done}
      onDragStart={handleDragStart}
      onMouseLeave={() => {
        if (!isEditing) {
          setMenuOpen(false);
          setShowColorPicker(false);
          setShowMoveMenu(false);
        }
      }}
    >
      {/* Primary goal indicator */}
      {isPrimary && (
        <div className="absolute top-2 left-1 text-yellow-500">
          <Star className="w-3 h-3 fill-current" />
        </div>
      )}
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
              className={`flex-1 ${getTextSize()} ${isPrimary ? 'font-bold' : ''} h-auto min-h-[2rem]`}
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
            {/* Drag handle - only show for non-completed items */}
            {!goal.done && (
              <div className="opacity-0 group-hover:opacity-50 cursor-grab active:cursor-grabbing flex-shrink-0 mt-0.5">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            
            <input
              type="checkbox"
              checked={goal.done}
              onChange={onToggle}
              className={`${isPrimary ? 'w-5 h-5 mt-1' : 'w-4 h-4 mt-0.5'} cursor-pointer flex-shrink-0`}
              aria-label="toggle goal"
            />
            
            <div className="flex-1 min-w-0">
              <span 
                className={`block break-words ${getTextSize()} ${
                  isPrimary ? 'font-bold' : ''
                } ${goal.done ? 'line-through opacity-50' : ''} ${colorScheme.text}`}
                title={goal.title}
                onDoubleClick={() => setIsEditing(true)}
              >
                {goal.title}
              </span>
              {goal.notes && (
                <div className={`text-xs text-muted-foreground mt-1 opacity-70 flex items-start gap-1 ${goal.done ? 'line-through' : ''}`}>
                  <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{goal.notes}</span>
                </div>
              )}
            </div>
            
            {/* Menu button - now shows for both completed and non-completed */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setShowColorPicker(false);
                  setShowMoveMenu(false);
                }}
                className="p-1 hover:bg-muted transition-colors border opacity-0 group-hover:opacity-100"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {menuOpen && (
                <div ref={menuRef} className="absolute right-0 mt-1 z-50 bg-popover border shadow-lg min-w-[180px]">
                  {goal.done ? (
                    // Menu for completed goals
                    <>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                        onClick={() => {
                          onToggle();
                          setMenuOpen(false);
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Mark as incomplete
                      </button>
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
                      <div className="border-t my-1"></div>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-destructive flex items-center gap-2"
                        onClick={onRemove}
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </>
                  ) : (
                    // Menu for active goals
                    <>
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
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={handleToggleGoalType}
                      >
                        {isPrimary ? '→ Make supporting' : '→ Make primary'}
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          setShowColorPicker((v) => !v);
                          setMenuOpen(false);
                        }}
                      >
                        Change color
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm relative"
                        onClick={() => {
                          setShowMoveMenu(!showMoveMenu);
                        }}
                      >
                        Move to day...
                        {showMoveMenu && (
                          <div 
                            className="absolute left-full top-0 ml-1 bg-popover border shadow-lg min-w-[150px] max-h-[300px] overflow-y-auto z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {allDays.map((day) => {
                              const targetDateKey = toDateKey(day);
                              const isCurrentDay = targetDateKey === dateKey;
                              return (
                                <button
                                  key={targetDateKey}
                                  className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${
                                    isCurrentDay ? 'bg-muted/50 cursor-not-allowed' : ''
                                  }`}
                                  onClick={() => !isCurrentDay && handleMoveToDay(targetDateKey)}
                                  disabled={isCurrentDay}
                                >
                                  {day.toLocaleDateString(undefined, { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                  {isCurrentDay && ' (current)'}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </button>
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
                      <div className="border-t my-1"></div>
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-destructive flex items-center gap-2"
                        onClick={onRemove}
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {showColorPicker && (
            <div className="flex gap-1 mt-2 pt-2 border-t flex-wrap z-50 relative bg-card">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    onUpdateColor(c.value);
                    setShowColorPicker(false);
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


