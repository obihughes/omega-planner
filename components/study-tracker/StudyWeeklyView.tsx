'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStudyTrackerContext } from '@/app/context/StudyTrackerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { StudyTaskItem } from './StudyTaskItem';
import { StudyTask, Subject } from '@/types/study';
import { cn } from '@/lib/utils';

const MAX_TASKS_PER_DAY = 6;

export function StudyWeeklyView() {
  const {
    subjects,
    twoWeekDays,
    todayKey,
    getTasksForDate,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
    moveTask,
  } = useStudyTrackerContext();

  const subjectMap = React.useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const handleAddTask = (dateKey: string, title: string, subjectId: string) => {
    if (!title.trim() || !subjectId) return;
    addTask(subjectId, dateKey, title.trim());
  };

  const handleMoveTask = (taskId: string, fromDateKey: string, toDateKey: string) => {
    if (fromDateKey !== toDateKey) {
      moveTask(taskId, toDateKey);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
        <div className="grid grid-cols-7 gap-4 auto-rows-fr">
          {twoWeekDays.map(({ date, dateKey }) => {
            const tasks = getTasksForDate(dateKey).slice(0, MAX_TASKS_PER_DAY);
            const isToday = dateKey === todayKey;
            const canAddMore = tasks.length < MAX_TASKS_PER_DAY;

            return (
              <StudyDayCard
                key={dateKey}
                date={date}
                dateKey={dateKey}
                tasks={tasks}
                subjects={subjects}
                subjectMap={subjectMap}
                isToday={isToday}
                canAddMore={canAddMore}
                onAddTask={(title, subjectId) => handleAddTask(dateKey, title, subjectId)}
                onToggleTask={(id) => toggleTask(id)}
                onRemoveTask={(id) => removeTask(id)}
                onUpdateTask={(id, updates) => updateTask(id, updates)}
                onMoveTask={handleMoveTask}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface StudyDayCardProps {
  date: Date;
  dateKey: string;
  tasks: StudyTask[];
  subjects: Subject[];
  subjectMap: Map<string, Subject>;
  isToday: boolean;
  canAddMore: boolean;
  onAddTask: (title: string, subjectId: string) => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Pick<StudyTask, 'title' | 'subjectId'>>) => void;
  onMoveTask: (taskId: string, fromDateKey: string, toDateKey: string) => void;
}

function StudyDayCard({
  date,
  dateKey,
  tasks,
  subjects,
  subjectMap,
  isToday,
  canAddMore,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onUpdateTask,
  onMoveTask,
}: StudyDayCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedSubjectId((prev) => {
      if (subjects.some((s) => s.id === prev)) return prev;
      return subjects[0]?.id ?? '';
    });
  }, [subjects]);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSubmit = () => {
    if (inputValue.trim() && selectedSubjectId) {
      onAddTask(inputValue, selectedSubjectId);
      setInputValue('');
      setShowInput(false);
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setShowInput(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const payload = JSON.parse(raw) as { taskId: string; fromDateKey: string };
      if (payload.fromDateKey !== dateKey) {
        onMoveTask(payload.taskId, payload.fromDateKey, dateKey);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        'border flex flex-col min-h-[320px] transition-colors',
        isToday ? 'border-green-500' : 'bg-muted/20'
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">
            {date.toLocaleDateString(undefined, { weekday: 'short' })}
          </div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <button
          type="button"
          aria-label="Add study task"
          onClick={() => canAddMore && subjects.length > 0 && setShowInput(true)}
          disabled={!canAddMore || showInput || subjects.length === 0}
          className={cn(
            'w-7 h-7 grid place-items-center border transition-colors',
            !canAddMore || showInput || subjects.length === 0
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-muted'
          )}
          title="Add study task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-visible">
        {tasks.map((task) => (
          <StudyTaskItem
            key={task.id}
            task={task}
            subject={subjectMap.get(task.subjectId)}
            subjects={subjects}
            dateKey={dateKey}
            onToggle={() => onToggleTask(task.id)}
            onRemove={() => onRemoveTask(task.id)}
            onUpdate={(updates) => onUpdateTask(task.id, updates)}
          />
        ))}

        {showInput && canAddMore && subjects.length > 0 ? (
          <div className="space-y-2 pt-1">
            <Input
              ref={inputRef}
              placeholder="New task..."
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
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || 'Untitled'}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="sm" className="flex-1">
                Add
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
