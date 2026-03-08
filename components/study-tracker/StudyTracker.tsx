'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStudyTrackerContext } from '@/app/context/StudyTrackerContext';
import { StudyWeeklyView } from './StudyWeeklyView';
import { StudyMonthlyView } from './StudyMonthlyView';
import { SubjectManagementModal } from './SubjectManagementModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, CalendarRange, CalendarDays, Settings2 } from 'lucide-react';

type StudyViewMode = 'weekly' | 'monthly';

export function StudyTracker() {
  const [viewMode, setViewMode] = useState<StudyViewMode>('weekly');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const {
    subjects,
    addSubject,
    updateSubject,
    removeSubject,
    goToWeekContaining,
  } = useStudyTrackerContext();

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddingSubject && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAddingSubject]);

  const handleAddSubject = () => {
    const trimmed = newSubjectName.trim();
    if (trimmed) {
      addSubject(trimmed);
      setNewSubjectName('');
    }
    setIsAddingSubject(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddSubject();
    if (e.key === 'Escape') {
      setNewSubjectName('');
      setIsAddingSubject(false);
    }
  };

  const handleNavigateToWeek = (date: Date) => {
    setViewMode('weekly');
    goToWeekContaining(date);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium">Study Planner</h1>
          <div className="flex items-center gap-1.5">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('weekly')}
              className="h-8 px-3 gap-1.5 text-xs"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Weekly
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
              className="h-8 px-3 gap-1.5 text-xs"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Monthly
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAddingSubject ? (
            <div className="flex gap-2">
              <Input
                ref={addInputRef}
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onBlur={handleAddSubject}
                onKeyDown={handleAddKeyDown}
                placeholder="Subject name"
                className="h-8 w-40 text-sm"
              />
              <Button size="sm" onClick={handleAddSubject}>
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAddingSubject(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingSubject(true)}
                className="gap-2 h-8"
              >
                <Plus className="w-4 h-4" />
                Add subject
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubjectModal(true)}
                className="gap-2 h-8"
                title="Edit subjects"
              >
                <Settings2 className="w-4 h-4" />
                Manage subjects
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {viewMode === 'weekly' ? (
          <StudyWeeklyView />
        ) : (
          <StudyMonthlyView onNavigateToWeek={handleNavigateToWeek} />
        )}
      </div>

      <SubjectManagementModal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        subjects={subjects}
        onUpdateSubject={updateSubject}
        onRemoveSubject={removeSubject}
      />
    </div>
  );
}
