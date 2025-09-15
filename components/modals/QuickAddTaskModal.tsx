"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK_COLORS, DEFAULT_TASK_COLOR_INDEX } from '@/lib/constants';
import { Task } from '@/types/planner';
import { XIcon } from 'lucide-react';

interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  selectedDate: Date | null;
}

export function QuickAddTaskModal({ isOpen, onClose, onSave, selectedDate }: QuickAddTaskModalProps) {
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(1);
  const [selectedColorIndex, setSelectedColorIndex] = useState(-1);

  const handleSave = () => {
    if (!taskName.trim() || !selectedDate) return;

    const newTask: Partial<Task> = {
      id: `temp-pool-task-${Date.now()}`,
      name: taskName.trim(),
      duration,
      color: selectedColorIndex === -1 ? '' : TASK_COLORS[selectedColorIndex],
      notes: '',
      completed: false,
      poolDate: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
      startHour: 9, // Default start hour for pool tasks
      baseDate: selectedDate.toISOString().split('T')[0]
    };

    onSave(newTask);
    handleClose();
  };

  const handleClose = () => {
    setTaskName('');
    setDuration(1);
    setSelectedColorIndex(-1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Task for {selectedDate?.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </DialogTitle>
          <DialogDescription>
            Create a new task that will be added to your task pool for this date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="task-name">Task Name</Label>
            <Input
              id="task-name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name..."
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              min="0.25"
              max="12"
              step="0.25"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                  selectedColorIndex === -1
                    ? 'border-foreground scale-110'
                    : 'border-border hover:scale-105'
                }`}
                onClick={() => setSelectedColorIndex(-1)}
              >
                <XIcon className="w-5 h-5 text-muted-foreground" />
              </button>
              {TASK_COLORS.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColorIndex === index 
                      ? 'border-foreground scale-110' 
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.split(' ')[0] }}
                  onClick={() => setSelectedColorIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!taskName.trim()}
          >
            Add Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 