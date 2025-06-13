'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: (eventId: string) => void;
  event?: CalendarEvent | null;
  initialDate?: Date;
}

const EVENT_COLORS = [
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

export function EventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  event,
  initialDate 
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(new Date(event.date));
      setColor(event.color);
    } else {
      setTitle('');
      setDescription('');
      setDate(initialDate || new Date());
      setColor(EVENT_COLORS[0]);
    }
  }, [event, initialDate, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      color,
      type: 'event'
    });

    onClose();
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'Add Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 block">
              Event Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title..."
              className="w-full text-base"
              autoFocus
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 block">
              Date *
            </label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-base h-11",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  {date ? date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  initialFocus
                  className="[&_button]:cursor-pointer [&_button]:hover:bg-accent [&_button]:select-none"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 block">
              Color
            </label>
            <div className="grid grid-cols-8 gap-3">
              {EVENT_COLORS.map((eventColor) => (
                <button
                  key={eventColor}
                  type="button"
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all shadow-sm hover:shadow-md",
                    color === eventColor 
                      ? "border-foreground scale-105 shadow-md" 
                      : "border-border/30 hover:scale-105 hover:border-border/60"
                  )}
                  style={{ backgroundColor: eventColor }}
                  onClick={() => setColor(eventColor)}
                  title={eventColor}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-3 block">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Add a description for this event..."
              className="w-full text-base resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 h-11 text-base font-semibold"
            >
              {event ? 'Update Event' : 'Create Event'}
            </Button>
            
            {event && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="h-11 px-6"
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