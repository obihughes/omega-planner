'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Subject } from '@/types/study';
import { cn } from '@/lib/utils';

interface StudyFiltersProps {
  weekRangeLabel: string;
  weekOffset: number;
  subjects: Subject[];
  subjectFilter: Set<string>;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onToggleSubjectFilter: (id: string, allSubjectIds: string[]) => void;
}

export function StudyFilters({
  weekRangeLabel,
  weekOffset,
  subjects,
  subjectFilter,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onToggleSubjectFilter,
}: StudyFiltersProps) {
  const [showSubjectFilter, setShowSubjectFilter] = useState(false);

  const hasActiveFilter = subjectFilter.size > 0;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-medium">Study Tracker</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousWeek}
            className="h-8 w-8 p-0"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={weekOffset === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={onCurrentWeek}
            className="h-8 px-3 text-xs"
            title="Go to current week"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextWeek}
            className="h-8 w-8 p-0"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">{weekRangeLabel}</div>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubjectFilter((p) => !p)}
            className={cn(
              'h-8 px-3 gap-2',
              hasActiveFilter && 'border-primary/50'
            )}
            title="Filter by subject"
          >
            <Filter className="w-4 h-4" />
            <span className="text-xs font-medium">
              {hasActiveFilter ? `Subjects (${subjectFilter.size})` : 'Subjects'}
            </span>
          </Button>
          {showSubjectFilter && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSubjectFilter(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-border bg-card p-2 shadow-lg">
                <p className="text-xs text-muted-foreground mb-2 px-2">
                  Show only selected
                </p>
                {subjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-2">
                    No subjects yet
                  </p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {subjects.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={subjectFilter.size === 0 || subjectFilter.has(s.id)}
                          onChange={() => onToggleSubjectFilter(s.id, subjects.map((x) => x.id))}
                          className="rounded border-border"
                        />
                        <span className="truncate">{s.name || 'Untitled'}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
