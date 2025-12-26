'use client';

import React, { useState, useEffect } from 'react';
import { CalendarPeriod } from '@/types/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (period: Omit<CalendarPeriod, 'id'>) => void;
  onDelete?: (periodId: string) => void;
  period?: CalendarPeriod | null;
  initialDate?: Date;
  initialEndDate?: Date;
}

const PERIOD_COLORS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export function PeriodModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  period,
  initialDate 
}: PeriodModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [color, setColor] = useState(PERIOD_COLORS[0]);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  useEffect(() => {
    if (period) {
      setTitle(period.title);
      setNotes(period.notes || period.description || '');
      setStartDate(new Date(period.startDate));
      setEndDate(new Date(period.endDate));
      setColor(period.color);
    } else {
      setTitle('');
      setNotes('');
      const start = initialDate || new Date();
      const end = initialEndDate || new Date(start);
      if (!initialEndDate) {
          end.setDate(start.getDate() + 6); // Default to 1 week period if no end date provided
      }
      setStartDate(start);
      setEndDate(end);
      setColor(PERIOD_COLORS[2]); // Default to amber
    }
  }, [period, initialDate, initialEndDate, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;
    if (endDate < startDate) return; // End date must be after start date

    onSave({
      title: title.trim(),
      notes: notes.trim(),
      startDate,
      endDate,
      color,
      type: 'period'
    });

    onClose();
  };

  const handleDelete = () => {
    if (period && onDelete) {
      onDelete(period.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {period ? 'Edit Interval' : 'Add Interval'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Interval title"
              className="w-full text-sm h-9"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">
                Start Date
              </label>
              <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-9",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2" align="center">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        setStartDate(selectedDate);
                        // Adjust end date if it's before start date
                        if (endDate < selectedDate) {
                          const newEndDate = new Date(selectedDate);
                          newEndDate.setDate(selectedDate.getDate() + 1);
                          setEndDate(newEndDate);
                        }
                        setIsStartDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">
                End Date
              </label>
              <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-9",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {endDate ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2" align="center">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(selectedDate) => {
                      if (selectedDate && selectedDate >= startDate) {
                        setEndDate(selectedDate);
                        setIsEndDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Color
            </label>
            <div className="grid grid-cols-9 gap-2">
              {PERIOD_COLORS.map((periodColor) => (
                <button
                  key={periodColor}
                  type="button"
                  className={cn(
                    "w-6 h-6 border-2 transition-all",
                    color === periodColor 
                      ? "border-foreground scale-110" 
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: periodColor }}
                  onClick={() => setColor(periodColor)}
                />
              ))}
            </div>
          </div>

          {/* Notes (single details field) */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add detailed notes..."
              className="w-full text-sm resize-none"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!title.trim() || endDate < startDate}
              className="flex-1 h-9 text-sm"
            >
              {period ? 'Update' : 'Add'} Interval
            </Button>
            
            {period && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive h-9 px-4"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 