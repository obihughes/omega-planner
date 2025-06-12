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
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [color, setColor] = useState(PERIOD_COLORS[0]);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);

  useEffect(() => {
    if (period) {
      setTitle(period.title);
      setDescription(period.description || '');
      setStartDate(new Date(period.startDate));
      setEndDate(new Date(period.endDate));
      setColor(period.color);
    } else {
      setTitle('');
      setDescription('');
      const start = initialDate || new Date();
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Default to 1 week period
      setStartDate(start);
      setEndDate(end);
      setColor(PERIOD_COLORS[2]); // Default to amber
    }
  }, [period, initialDate, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;
    if (endDate < startDate) return; // End date must be after start date

    onSave({
      title: title.trim(),
      description: description.trim(),
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {period ? 'Edit Period' : 'Add Period'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Period title"
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Start Date
              </label>
              <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {startDate ? startDate.toLocaleDateString() : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <label className="text-sm font-medium text-foreground mb-2 block">
                End Date
              </label>
              <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {endDate ? endDate.toLocaleDateString() : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
            <label className="text-sm font-medium text-foreground mb-2 block">
              Color
            </label>
            <div className="grid grid-cols-9 gap-2">
              {PERIOD_COLORS.map((periodColor) => (
                <button
                  key={periodColor}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
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

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Period description"
              className="w-full"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={!title.trim() || endDate < startDate}
              className="flex-1"
            >
              {period ? 'Update' : 'Add'} Period
            </Button>
            
            {period && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 