'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CalendarEvent, CalendarPeriod, CalendarData, CalendarProps, PeriodPosition } from '@/types/calendar';
import { 
  getMonthDates, 
  getDayInfo, 
  getEventsByMonth, 
  getMonthName, 
  getWeekDays,
  getPeriodSegmentsForMonth,
  isSameDay
} from '@/utils/calendar';
import { ChevronLeft, ChevronRight, Plus, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { PeriodModal } from './PeriodModal';
import { cn } from '@/lib/utils';

interface YearCalendarProps extends CalendarProps {
  className?: string;
  headerLeftControls?: React.ReactNode;
  headerRightControls?: React.ReactNode;
}

// Day Details Modal Component
function DayDetailsModal({ 
  isOpen, 
  onClose, 
  date, 
  events, 
  periods,
  onEventEdit,
  onPeriodEdit 
}: {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  periods: CalendarPeriod[];
  onEventEdit?: (event: CalendarEvent) => void;
  onPeriodEdit?: (period: CalendarPeriod) => void;
}) {
  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {events.length === 0 && periods.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No events or periods on this day</p>
          ) : (
            <>
              {events.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">Events</h4>
                  <div className="space-y-2">
                    {events.map(event => (
                      <div 
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => onEventEdit?.(event)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground">{event.description}</div>
                          )}
                        </div>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {periods.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">Periods</h4>
                  <div className="space-y-2">
                    {periods.map(period => (
                      <div 
                        key={period.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => onPeriodEdit?.(period)}
                      >
                        <div 
                          className="w-6 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: period.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{period.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {period.startDate.toLocaleDateString()} - {period.endDate.toLocaleDateString()}
                          </div>
                          {period.description && (
                            <div className="text-sm text-muted-foreground">{period.description}</div>
                          )}
                        </div>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
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
  onPeriodDelete,
  headerLeftControls,
  headerRightControls,
}: YearCalendarProps) {
  const [currentYear, setCurrentYear] = useState(year);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<CalendarPeriod | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  
  // Drag state for periods
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [draggedPeriod, setDraggedPeriod] = useState<CalendarPeriod | null>(null);
  const [dragStartDay, setDragStartDay] = useState<Date | null>(null);

  const weekDays = getWeekDays();
  const eventsByMonth = useMemo(() => 
    getEventsByMonth(data.events, currentYear), 
    [data.events, currentYear]
  );

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const handleDateClick = (date: Date) => {
    if (longPressTriggered.current) {
      return;
    }
    const dayInfo = getDayInfo(date, date.getMonth(), data.events, data.periods, []);
    
    if (dayInfo.events.length > 0 || dayInfo.periods.length > 0) {
      // Show day details if there are events or periods
      setSelectedDate(date);
      setDayDetailsOpen(true);
    } else {
      // Just select the date if empty
      setSelectedDate(date);
    }
  };

  const handleDateDoubleClick = (date: Date) => {
    setSelectedDate(date);
    handleAddEvent();
  };

  const handleDateMouseDown = (date: Date) => {
    longPressTriggered.current = false;
    const timer = setTimeout(() => {
      longPressTriggered.current = true;
      // Long press detected - create unnamed period directly
      if (onPeriodAdd) {
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 6); // Default 1 week period
        
        onPeriodAdd({
          title: 'New Period',
          description: '',
          startDate: date,
          endDate: endDate,
          color: '#f59e0b', // Default amber color
          type: 'period'
        });
      }
      setLongPressTimer(null);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleDateMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
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

  const handleDayDetailsEventEdit = (event: CalendarEvent) => {
    setDayDetailsOpen(false);
    setEditingEvent(event);
    setEventModalOpen(true);
  };

  const handleDayDetailsPeriodEdit = (period: CalendarPeriod) => {
    setDayDetailsOpen(false);
    setEditingPeriod(period);
    setPeriodModalOpen(true);
  };

  // Drag handlers for periods
  const handleDragStart = (e: React.MouseEvent, period: CalendarPeriod, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    setDragMode(mode);
    setDraggedPeriod(period);
    
    const dayElement = (e.target as HTMLElement).closest('[data-date]');
    if (dayElement) {
        const dateStr = dayElement.getAttribute('data-date');
        if (dateStr) setDragStartDay(new Date(dateStr));
    }
  };

  const handleDragMove = (e: React.MouseEvent, date: Date) => {
    if (!dragMode || !draggedPeriod || !dragStartDay || !onPeriodEdit) return;

    const diffTime = date.getTime() - dragStartDay.getTime();
    const diffDays = Math.round(diffTime / (24 * 60 * 60 * 1000));

    if (dragMode === 'move') {
        const newStartDate = new Date(draggedPeriod.startDate);
        newStartDate.setDate(newStartDate.getDate() + diffDays);
        const newEndDate = new Date(draggedPeriod.endDate);
        newEndDate.setDate(newEndDate.getDate() + diffDays);
        
        onPeriodEdit({ ...draggedPeriod, startDate: newStartDate, endDate: newEndDate });
    } else if (dragMode === 'resize-start') {
        const newStartDate = new Date(draggedPeriod.startDate);
        newStartDate.setDate(newStartDate.getDate() + diffDays);
        if (newStartDate <= draggedPeriod.endDate) {
            onPeriodEdit({ ...draggedPeriod, startDate: newStartDate });
        }
    } else if (dragMode === 'resize-end') {
        const newEndDate = new Date(draggedPeriod.endDate);
        newEndDate.setDate(newEndDate.getDate() + diffDays);
        if (newEndDate >= draggedPeriod.startDate) {
            onPeriodEdit({ ...draggedPeriod, endDate: newEndDate });
        }
    }
  };

  const handleDragEnd = () => {
    setDragMode(null);
    setDraggedPeriod(null);
    setDragStartDay(null);
  };

  useEffect(() => {
    if (dragMode) {
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      const handleMouseUp = () => handleDragEnd();
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragMode]);

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

  const renderPeriodHighlight = (periodPositions: PeriodPosition[]) => {
    return periodPositions.map((pos) => {
      const { period, isStart, isEnd, row } = pos;
      
      const highlightClasses = cn(
        'absolute h-1.5 w-full',
        {
          'rounded-md': isStart && isEnd, // Single day
          'rounded-l-md': isStart && !isEnd,
          'rounded-r-md': !isStart && isEnd,
        }
      );

      return (
        <div
          key={period.id}
          className={highlightClasses}
          style={{ 
            backgroundColor: period.color, 
            opacity: 0.8, 
            bottom: `${(row * 6) + 3}px`, // Stacked from the bottom
            zIndex: 1,
          }}
          title={period.title}
        />
      );
    });
  };

  const renderSmallEventIndicators = (events: CalendarEvent[]) => {
    if (events.length <= 1) return null; // Only show for 2 or more events

    return (
      <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-0.5 z-20">
        {events.slice(0, 3).map((event, index) => (
          <div
            key={event.id}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: event.color }}
            title={event.title}
          />
        ))}
        {events.length > 3 && (
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex items-center justify-center text-[8px] text-muted-foreground font-bold">
            +
          </div>
        )}
      </div>
    );
  };

  const renderMonth = (month: number) => {
    const monthDates = getMonthDates(currentYear, month);
    const monthEvents = eventsByMonth[month] || [];
    const monthPeriods = getPeriodSegmentsForMonth(data.periods, currentYear, month);
    
    return (
      <div key={month}>
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
        <div className="grid grid-cols-7 gap-y-1 relative">
          {monthDates.map((date, index) => {
            const dayInfo = getDayInfo(date, month, data.events, data.periods, monthDates);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = date < today && !dayInfo.isToday;

            if (!dayInfo.isCurrentMonth) {
              return <div key={date.toISOString()} className="h-8" />;
            }

            const eventBorderStyle = dayInfo.events.length > 0 && dayInfo.periods.length === 0 ? {
              boxShadow: `0 0 0 2px ${dayInfo.events[0].color} inset`,
            } : {};
            
            return (
              <div
                key={date.toISOString()}
                data-date={date.toISOString()}
                className={`
                  relative h-8 flex items-center justify-center text-xs rounded transition-colors
                  ${isPast 
                    ? 'text-muted-foreground/50 cursor-default' 
                    : 'text-foreground hover:bg-accent/50 cursor-pointer'
                  }
                  ${dayInfo.isToday ? 'bg-primary text-primary-foreground font-semibold rounded-full' : ''}
                  ${selectedDate && date.toDateString() === selectedDate.toDateString() ? 'bg-accent' : ''}
                `}
                style={eventBorderStyle}
                onClick={() => !isPast && handleDateClick(date)}
                onDoubleClick={() => !isPast && handleDateDoubleClick(date)}
                onMouseDown={() => !isPast && handleDateMouseDown(date)}
                onMouseUp={handleDateMouseUp}
                onMouseLeave={handleDateMouseUp}
                onMouseMove={dragMode && !isPast ? (e) => handleDragMove(e, date) : undefined}
              >
                {renderPeriodHighlight(dayInfo.periodPositions)}
                <span className="relative z-20 font-bold select-none">
                  {date.getDate()}
                </span>
                {renderSmallEventIndicators(dayInfo.events)}
              </div>
            );
          })}
        </div>

        {/* Events and Periods List */}
        {(monthEvents.length > 0 || monthPeriods.length > 0) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {/* Events */}
            {monthEvents.map(event => (
              <div 
                key={event.id} 
                className="group flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded hover:bg-accent/50 cursor-pointer transition-colors"
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
                className="group flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded hover:bg-accent/50 cursor-pointer transition-colors"
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
    <div className={`space-y-6 ${className} relative`}>
      {/* Fixed Year Navigation */}
      <Button
          variant="outline"
          onClick={() => navigateYear('prev')}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 h-auto px-2 py-8 rounded-l-none shadow-lg"
          title={`Go to ${currentYear - 1}`}
      >
        <span className="[writing-mode:vertical-rl] font-semibold tracking-widest text-sm">
            {currentYear - 1}
        </span>
      </Button>
      <Button
          variant="outline"
          onClick={() => navigateYear('next')}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 h-auto px-2 py-8 rounded-r-none shadow-lg"
          title={`Go to ${currentYear + 1}`}
      >
        <span className="[writing-mode:vertical-rl] font-semibold tracking-widest text-sm">
            {currentYear + 1}
        </span>
      </Button>

      {/* Year Navigation & Controls */}
      <div className="flex items-center justify-center gap-4 relative mb-4">
        <div className="flex-1"> {headerLeftControls}</div>
        
        <div className="flex-shrink-0">
            <h2 className="text-2xl font-bold text-foreground min-w-[100px] text-center">
              {currentYear}
            </h2>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
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
            {headerRightControls}
        </div>
      </div>

      {/* 12-Month Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
        {Array.from({ length: 12 }, (_, month) => renderMonth(month))}
      </div>

      {/* Selected Date Info */}
      {selectedDate && !dayDetailsOpen && (
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

      <DayDetailsModal
        isOpen={dayDetailsOpen}
        onClose={() => setDayDetailsOpen(false)}
        date={selectedDate}
        events={selectedDate ? data.events.filter(e => e.date.toDateString() === selectedDate.toDateString()) : []}
        periods={selectedDate ? data.periods.filter(p => p.startDate <= selectedDate && p.endDate >= selectedDate) : []}
        onEventEdit={handleDayDetailsEventEdit}
        onPeriodEdit={handleDayDetailsPeriodEdit}
      />
    </div>
  );
} 