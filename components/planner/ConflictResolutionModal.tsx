"use client";

import React from 'react';
import { ClassScheduleConflict } from '@/types/planner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/utils/formatters';

export type ClassCopyResolutionChoice = 'skip' | 'replace' | 'cancel';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  targetDateLabel: string;
  conflicts: ClassScheduleConflict[];
  onResolve: (choice: ClassCopyResolutionChoice) => void;
}

function formatTimeRange(startHour: number, duration: number): string {
  const endHour = startHour + duration;
  return `${formatTime(startHour)} – ${formatTime(endHour)}`;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  targetDateLabel,
  conflicts,
  onResolve,
}) => {
  const uniqueConflicts = React.useMemo(() => {
    const seen = new Set<string>();
    return conflicts.filter((conflict) => {
      const key = `${conflict.convertedTask.id}:${conflict.plannerTask.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [conflicts]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onResolve('cancel');
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Class import conflicts</DialogTitle>
          <DialogDescription>
            {uniqueConflicts.length} class{uniqueConflicts.length === 1 ? '' : 'es'} overlap with existing tasks on {targetDateLabel}.
            Choose how to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
          {uniqueConflicts.map((conflict) => (
            <div
              key={`${conflict.convertedTask.id}-${conflict.plannerTask.id}`}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <div className="font-medium text-foreground">{conflict.classTask.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Class: {formatTimeRange(conflict.classTask.startHour, conflict.classTask.duration)}
              </div>
              <div className="text-xs text-muted-foreground">
                Existing: {conflict.plannerTask.name} ({formatTimeRange(conflict.plannerTask.startHour!, conflict.plannerTask.duration)})
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onResolve('cancel')}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => onResolve('skip')}>
            Skip conflicting
          </Button>
          <Button onClick={() => onResolve('replace')}>
            Replace existing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
