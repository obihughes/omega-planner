'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CalendarEvent, CalendarPeriod, CalendarData, CalendarProps } from '@/types/calendar';
import { ChevronLeft, ChevronRight, Plus, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { PeriodModal } from './PeriodModal';
import { getContrastColor } from '@/utils/colorUtils';

interface MonthlyCalendarProps extends CalendarProps {
  className?: string;
  headerLeftControls?: React.ReactNode;
  headerRightControls?: React.ReactNode;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  periods: CalendarPeriod[];
}

export function MonthlyCalendar({
  data = { events: [], periods: [] },
  className = '',
  onEventAdd,
  onPeriodAdd,
  onEventEdit,
  onPeriodEdit,
  onEventDelete,
  onPeriodDelete,
  headerLeftControls,
  headerRightControls,
}: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<CalendarPeriod | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get the first day of the current month and calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Calculate the start date (first Sunday of the calendar grid)
  const startDate = new Date(firstDayOfMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(firstDayOfMonth.getDate() - firstDayWeekday);

  // Generate calendar days (6 weeks * 7 days = 42 days)
  const calendarDays = useMemo(() => {
    const days: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Get events for this date
      const dayEvents = data.events.filter(event => 
        event.date.toDateString() === date.toDateString()
      );
      
      // Get periods that include this date
      const dayPeriods = data.periods.filter(period => {
        // Use date-only comparison to avoid time zone issues
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startOnly = new Date(period.startDate.getFullYear(), period.startDate.getMonth(), period.startDate.getDate());
        const endOnly = new Date(period.endDate.getFullYear(), period.endDate.getMonth(), period.endDate.getDate());
        return dateOnly >= startOnly && dateOnly <= endOnly;
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: date.toDateString() === new Date().toDateString(),
        events: dayEvents,
        periods: dayPeriods,
      });
    }
    return days;
  }, [startDate, currentDate, data]);

  // Scroll to current day when month changes or component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Find today's index in the calendar days
      const todayIndex = calendarDays.findIndex(day => 
        day.date.toDateString() === today.toDateString()
      );
      
      if (todayIndex !== -1) {
        // Calculate which row today is in (0-5 for 6 weeks)
        const rowOfToday = Math.floor(todayIndex / 7);
        
        // Each row is approximately 120px + borders, let's use 125px per row
        const rowHeight = 125;
        
        // Scroll to show today's row, but try to center it in the 4-row view
        // We want to show today's row as the 2nd row if possible
        const targetRow = Math.max(0, rowOfToday - 1);
        const scrollPosition = targetRow * rowHeight;
        
        scrollContainerRef.current.scrollTop = scrollPosition;
      }
    }
  }, [calendarDays, currentDate]);



  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDateDoubleClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handlePeriodClick = (period: CalendarPeriod, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPeriod(period);
    setShowPeriodModal(true);
  };

  const handleEventSave = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      onEventEdit?.({ ...editingEvent, ...eventData });
    } else {
      onEventAdd?.(eventData);
    }
    setShowEventModal(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const handlePeriodSave = (periodData: Omit<CalendarPeriod, 'id'>) => {
    if (editingPeriod) {
      onPeriodEdit?.({ ...editingPeriod, ...periodData });
    } else {
      onPeriodAdd?.(periodData);
    }
    setShowPeriodModal(false);
    setEditingPeriod(null);
    setSelectedDate(null);
  };

  const handleModalClose = () => {
    setShowEventModal(false);
    setShowPeriodModal(false);
    setEditingEvent(null);
    setEditingPeriod(null);
    setSelectedDate(null);
  };

  const handleEventDelete = () => {
    if (editingEvent) {
      onEventDelete?.(editingEvent.id);
      handleModalClose();
    }
  };

  const handlePeriodDelete = () => {
    if (editingPeriod) {
      onPeriodDelete?.(editingPeriod.id);
      handleModalClose();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {headerLeftControls}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('prev')}
              className="h-10 w-10 hover:bg-accent transition-colors border border-border/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <h2 className="text-2xl font-bold text-foreground min-w-[240px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth('next')}
              className="h-10 w-10 hover:bg-accent transition-colors border border-border/50"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {headerRightControls}
          <Button
            onClick={() => {
              setSelectedDate(new Date());
              setShowEventModal(true);
            }}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
          <Button
            onClick={() => {
              setSelectedDate(new Date());
              setShowPeriodModal(true);
            }}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Interval
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
              <div className="bg-card overflow-hidden border border-border/50 rounded-lg">
        {/* Day Headers - Fixed */}
        <div className="grid grid-cols-7 border-b border-border/40 text-center font-semibold text-muted-foreground bg-card sticky top-0 z-10">
          <div className="p-4 text-sm">Sun</div>
          <div className="p-4 text-sm">Mon</div>
          <div className="p-4 text-sm">Tue</div>
          <div className="p-4 text-sm">Wed</div>
          <div className="p-4 text-sm">Thu</div>
          <div className="p-4 text-sm">Fri</div>
          <div className="p-4 text-sm">Sat</div>
        </div>
        
        {/* Scrollable Calendar Days Container */}
        <div 
          ref={scrollContainerRef}
          className="h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            // Calculate period styling for full cell background
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = day.date < today && !day.isToday;
            
            const periodStyle: React.CSSProperties = {};
            
            // Convert hex to rgba for transparency
            const hexToRgba = (hex: string, alpha: number) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            if (day.periods.length === 1) {
              const period = day.periods[0];
              const baseColor = period.color;
              const opacity = isPast ? 0.15 : 0.25; // Much more subtle opacity
              
              periodStyle.backgroundColor = hexToRgba(baseColor, opacity);
              periodStyle.color = getContrastColor(baseColor);

            } else if (day.periods.length >= 2) {
              const p1 = day.periods[0];
              const p2 = day.periods[1];
              const opacity = isPast ? 0.15 : 0.25; // Much more subtle opacity
              
              // Horizontal split: top half p1, bottom half p2
              periodStyle.background = `linear-gradient(to bottom, ${hexToRgba(p1.color, opacity)} 50%, ${hexToRgba(p2.color, opacity)} 50%)`;
              periodStyle.color = '#fff';
              periodStyle.textShadow = '0 1px 2px rgba(0,0,0,0.7)';
            }

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[120px] border-r border-b border-border/30 last:border-r-0 transition-all duration-200 cursor-pointer relative group",
                  "hover:bg-accent/10",
                  !day.isCurrentMonth && "text-muted-foreground/50",
                  isPast && "opacity-50",
                  day.isToday && "border-primary border-2 bg-primary/10 ring-2 ring-primary/30",
                  selectedDate && day.date.toDateString() === selectedDate.toDateString() && "border-accent-foreground/60 bg-accent/10"
                )}
                onClick={() => handleDateClick(day.date)}
                onDoubleClick={() => handleDateDoubleClick(day.date)}
              >
                {/* Default Background Layer */}
                <div className={cn(
                  "absolute inset-0",
                  !day.isCurrentMonth && "bg-muted/20",
                  day.isCurrentMonth && "bg-background",
                  day.isToday && "bg-primary/15",
                  selectedDate && day.date.toDateString() === selectedDate.toDateString() && "bg-accent/20",
                  "group-hover:bg-accent/40"
                )} />
                
                {/* Period Background Layer */}
                {day.periods.length > 0 && (
                  <div 
                    className="absolute inset-0 z-[1]"
                    style={periodStyle}
                  />
                )}
                
                {/* Content Layer */}
                <div className="relative z-10 p-3 h-full">
                <div className={cn(
                  "text-sm font-medium mb-2 transition-colors duration-200 relative z-10",
                  !day.isCurrentMonth && !periodStyle.color && "text-muted-foreground",
                  day.isToday && !periodStyle.color && "text-primary font-bold"
                )}>
                  {day.date.getDate()}
                </div>
                
                {/* Period count indicator for multiple periods */}
                {day.periods.length > 2 && (
                  <div className="absolute top-1 right-1 text-xs bg-background/80 text-foreground px-1 py-0.5 border z-10">
                    +{day.periods.length - 2}
                  </div>
                )}
                
                {/* Events */}
                <div className="space-y-1 relative z-10">
                  {day.events.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="h-6 px-2 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity duration-200 border group relative flex items-center justify-between bg-opacity-90"
                      style={{ 
                        backgroundColor: event.color,
                        borderColor: event.color,
                        borderLeftWidth: '3px',
                        borderLeftColor: event.color
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                      title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="truncate font-medium text-xs text-gray-800 dark:text-gray-800">
                          {event.title}
                        </span>
                      </div>
                      <Eye className="w-3 h-3 text-gray-700 opacity-60 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0" />
                    </div>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-muted-foreground p-1 font-medium">
                      +{day.events.length - 3} more events
                    </div>
                  )}
                </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>


      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          isOpen={showEventModal}
          onClose={handleModalClose}
          onSave={handleEventSave}
          onDelete={editingEvent ? handleEventDelete : undefined}
          event={editingEvent}
          initialDate={selectedDate || new Date()}
        />
      )}

      {/* Period Modal */}
      {showPeriodModal && (
        <PeriodModal
          isOpen={showPeriodModal}
          onClose={handleModalClose}
          onSave={handlePeriodSave}
          onDelete={editingPeriod ? handlePeriodDelete : undefined}
          period={editingPeriod}
          initialDate={selectedDate || new Date()}
        />
      )}
    </div>
  );
} 