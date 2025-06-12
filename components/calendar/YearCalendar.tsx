'use client';

import React, { useState, useMemo } from 'react';
import { CalendarEvent, CalendarPeriod, CalendarData, CalendarProps } from '@/types/calendar';
import { 
  getMonthDates, 
  getDayInfo, 
  getEventsByMonth, 
  getMonthName, 
  getWeekDays,
  getPeriodSegmentsForMonth
} from '@/utils/calendar';
import { ChevronLeft, ChevronRight, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { PeriodModal } from './PeriodModal';

interface YearCalendarProps extends CalendarProps {
  className?: string;
}

export function YearCalendar({ 
  year = new Date().getFullYear(),
  data = { events: [], periods: [] },
  className = '',
  onEventAdd,
  onPeriodAdd,
  onEventEdit,
  onPeriodEdit,
  onEventDelete,
  onPeriodDelete
}: YearCalendarProps) {
  const [currentYear, setCurrentYear] = useState(year);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<CalendarPeriod | null>(null);
  
  const weekDays = getWeekDays();
  const eventsByMonth = useMemo(() => 
    getEventsByMonth(data.events, currentYear), 
    [data.events, currentYear]
  );

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setEventModalOpen(true);
  };

  const handlePeriodClick = (period: CalendarPeriod, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPeriod(period);
    setPeriodModalOpen(true);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventModalOpen(true);
  };

  const handleAddPeriod = () => {
    setEditingPeriod(null);
    setPeriodModalOpen(true);
  };

  const handleEventSave = (eventData: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent && onEventEdit) {
      onEventEdit({ ...editingEvent, ...eventData });
    } else if (onEventAdd) {
      onEventAdd(eventData);
    }
  };

  const handlePeriodSave = (periodData: Omit<CalendarPeriod, 'id'>) => {
    if (editingPeriod && onPeriodEdit) {
      onPeriodEdit({ ...editingPeriod, ...periodData });
    } else if (onPeriodAdd) {
      onPeriodAdd(periodData);
    }
  };

  const renderPeriodHighlight = (periodPositions: any[]) => {
    return periodPositions.map((pos, index) => {
      const { period, isStart, isEnd, isMiddle, row } = pos;
      
      let lineClass = 'absolute h-1 z-10 opacity-70';
      let topOffset = `${4 + (row * 6)}px`;
      
      if (isStart && isEnd) {
        // Single day period
        lineClass += ' w-6 h-6 rounded-full border-2 opacity-40';
        topOffset = '2px';
      } else if (isStart) {
        // Start of period
        lineClass += ' left-1/2 right-0 rounded-r-full';
      } else if (isEnd) {
        // End of period  
        lineClass += ' left-0 right-1/2 rounded-l-full';
      } else if (isMiddle) {
        // Middle of period
        lineClass += ' left-0 right-0';
      }

      return (
        <div
          key={`${period.id}-${index}`}
          className={lineClass}
          style={{
            backgroundColor: period.color,
            top: topOffset,
          }}
          onClick={(e) => handlePeriodClick(period, e)}
          title={period.title}
        />
      );
    });
  };

  const getEventBorderStyle = (events: CalendarEvent[]) => {
    if (events.length === 0) return {};
    
    // Use the first event's color for the border
    const primaryEvent = events[0];
    return {
      borderColor: primaryEvent.color,
      borderWidth: '2px',
      borderStyle: 'solid'
    };
  };

  const renderMonth = (month: number) => {
    const monthDates = getMonthDates(currentYear, month);
    const monthEvents = eventsByMonth[month] || [];
    const monthPeriods = getPeriodSegmentsForMonth(data.periods, currentYear, month);
    
    return (
      <div key={month} className="min-h-[280px]">
        {/* Month Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-center text-foreground">
            {getMonthName(month)}
          </h3>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-xs font-medium text-muted-foreground text-center py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {monthDates.map((date, index) => {
            const dayInfo = getDayInfo(date, month, data.events, data.periods, monthDates);
            
            const eventBorderStyle = getEventBorderStyle(dayInfo.events);
            
            return (
              <div
                key={date.toISOString()}
                className={`
                  relative min-h-[32px] p-1 text-sm cursor-pointer rounded transition-colors
                  ${dayInfo.isCurrentMonth ? 'text-foreground hover:bg-accent/50' : 'text-muted-foreground opacity-40'}
                  ${dayInfo.isToday ? 'bg-primary text-primary-foreground font-semibold' : ''}
                  ${selectedDate && date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-primary' : ''}
                `}
                style={eventBorderStyle}
                onClick={() => handleDateClick(date)}
              >
                {/* Day Number */}
                <span className="relative z-20">
                  {date.getDate()}
                </span>

                {/* Period Highlights */}
                {renderPeriodHighlight(dayInfo.periodPositions)}

                {/* Event Click Area - invisible overlay for clicking events */}
                {dayInfo.events.length > 0 && (
                  <div 
                    className="absolute inset-0 z-30 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(dayInfo.events[0], e);
                    }}
                    title={dayInfo.events.map(e => e.title).join(', ')}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Events and Periods List */}
        {(monthEvents.length > 0 || monthPeriods.length > 0) && (
          <div className="space-y-2">
            {/* Events */}
            {monthEvents.map(event => (
              <div 
                key={event.id} 
                className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={(e) => handleEventClick(event, e)}
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <span className="text-foreground truncate flex-1" title={event.title}>
                  {event.title}
                </span>
                <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </div>
            ))}

            {/* Periods */}
            {monthPeriods.map(period => (
              <div 
                key={period.id} 
                className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={(e) => handlePeriodClick(period, e)}
              >
                <div 
                  className="w-4 h-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: period.color }}
                />
                <span className="text-foreground truncate flex-1" title={period.title}>
                  {period.title}
                </span>
                <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateYear('prev')}
          className="p-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <h2 className="text-2xl font-bold text-foreground min-w-[100px] text-center">
          {currentYear}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateYear('next')}
          className="p-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={handleAddEvent}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
        
        <Button
          variant="outline"
          onClick={handleAddPeriod}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Period
        </Button>
      </div>

      {/* 12-Month Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 12 }, (_, month) => renderMonth(month))}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </p>
        </div>
      )}

      {/* Modals */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleEventSave}
        onDelete={onEventDelete}
        event={editingEvent}
        initialDate={selectedDate || undefined}
      />

      <PeriodModal
        isOpen={periodModalOpen}
        onClose={() => {
          setPeriodModalOpen(false);
          setEditingPeriod(null);
        }}
        onSave={handlePeriodSave}
        onDelete={onPeriodDelete}
        period={editingPeriod}
        initialDate={selectedDate || undefined}
      />
    </div>
  );
} 