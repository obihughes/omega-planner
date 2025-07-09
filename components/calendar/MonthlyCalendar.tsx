'use client';

import React, { useState, useMemo } from 'react';
import { CalendarEvent, CalendarPeriod, CalendarData, CalendarProps } from '@/types/calendar';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar, Edit2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { PeriodModal } from './PeriodModal';

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
      const dayPeriods = data.periods.filter(period =>
        date >= period.startDate && date <= period.endDate
      );
      
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

  // Statistics for the current month
  const monthStats = useMemo(() => {
    const currentMonthEvents = data.events.filter(event => 
      event.date.getMonth() === currentDate.getMonth() && 
      event.date.getFullYear() === currentDate.getFullYear()
    );
    
    const currentMonthPeriods = data.periods.filter(period =>
      (period.startDate.getMonth() === currentDate.getMonth() && 
       period.startDate.getFullYear() === currentDate.getFullYear()) ||
      (period.endDate.getMonth() === currentDate.getMonth() && 
       period.endDate.getFullYear() === currentDate.getFullYear())
    );
    
    const activeDays = new Set();
    currentMonthEvents.forEach(event => activeDays.add(event.date.toDateString()));
    currentMonthPeriods.forEach(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
          activeDays.add(d.toDateString());
        }
      }
    });
    
    return {
      totalEvents: currentMonthEvents.length,
      totalPeriods: currentMonthPeriods.length,
      activeDays: activeDays.size,
    };
  }, [data, currentDate]);

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
              className="h-10 w-10 rounded-xl hover:bg-accent transition-colors border border-border/50"
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
              className="h-10 w-10 rounded-xl hover:bg-accent transition-colors border border-border/50"
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
            Add Period
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card/60 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-border/50">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border/50 text-center font-semibold text-muted-foreground bg-card/80">
          <div className="p-4 text-sm">Sun</div>
          <div className="p-4 text-sm">Mon</div>
          <div className="p-4 text-sm">Tue</div>
          <div className="p-4 text-sm">Wed</div>
          <div className="p-4 text-sm">Thu</div>
          <div className="p-4 text-sm">Fri</div>
          <div className="p-4 text-sm">Sat</div>
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                "min-h-[140px] p-3 border-r border-b border-border/50 last:border-r-0 hover:bg-accent/30 transition-colors cursor-pointer",
                !day.isCurrentMonth && "bg-muted/20 text-muted-foreground/50",
                day.isToday && "bg-primary/10 border-primary/20"
              )}
              onClick={() => handleDateClick(day.date)}
              onDoubleClick={() => handleDateDoubleClick(day.date)}
            >
              <div className={cn(
                "text-sm font-medium mb-2",
                !day.isCurrentMonth && "text-muted-foreground",
                day.isToday && "text-primary font-bold"
              )}>
                {day.date.getDate()}
              </div>
              
                             {/* Periods */}
               {day.periods.length > 0 && (
                 <div className="mb-2 space-y-0.5">
                   {day.periods.slice(0, 3).map(period => {
                     const isStart = day.date.toDateString() === period.startDate.toDateString();
                     const isEnd = day.date.toDateString() === period.endDate.toDateString();
                     
                     return (
                       <div
                         key={period.id}
                         className="h-2 rounded-full cursor-pointer hover:h-3 transition-all duration-200 relative group"
                         style={{
                           backgroundColor: period.color + '30',
                           borderLeft: isStart ? `2px solid ${period.color}` : 'none',
                           borderRight: isEnd ? `2px solid ${period.color}` : 'none'
                         }}
                         onClick={(e) => handlePeriodClick(period, e)}
                         title={`${period.title} (${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()})`}
                       >
                         {isStart && (
                           <div className="absolute left-0 top-2 opacity-0 group-hover:opacity-100 bg-popover text-popover-foreground text-[9px] px-1 py-0.5 rounded shadow-md border z-10 whitespace-nowrap transition-opacity">
                             {period.title}
                           </div>
                         )}
                       </div>
                     );
                   })}
                   {day.periods.length > 3 && (
                     <div className="text-xs text-muted-foreground text-center">
                       +{day.periods.length - 3}
                     </div>
                   )}
                 </div>
               )}
              
              {/* Events */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="p-1.5 rounded-md text-xs cursor-pointer hover:scale-[1.02] transition-all shadow-sm border group"
                    style={{ 
                      backgroundColor: event.color + '20', 
                      borderColor: event.color + '60',
                      borderLeftWidth: '3px',
                      borderLeftColor: event.color
                    }}
                    onClick={(e) => handleEventClick(event, e)}
                    title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <span className="truncate font-medium text-xs text-foreground">
                          {event.title}
                        </span>
                      </div>
                      <Edit2 className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {event.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {event.description}
                      </div>
                    )}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-muted-foreground p-1">
                    +{day.events.length - 3} more events
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/60 backdrop-blur-sm rounded-xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Events</h4>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            {monthStats.totalEvents}
          </div>
          <div className="text-xs text-muted-foreground">This month</div>
        </div>
        
        <div className="bg-card/60 backdrop-blur-sm rounded-xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Periods</h4>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            {monthStats.totalPeriods}
          </div>
          <div className="text-xs text-muted-foreground">Active periods</div>
        </div>
        
        <div className="bg-card/60 backdrop-blur-sm rounded-xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Active Days</h4>
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            {monthStats.activeDays}
          </div>
          <div className="text-xs text-muted-foreground">Days with activity</div>
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