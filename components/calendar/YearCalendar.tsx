'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Inter } from 'next/font/google';
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
import { ChevronLeft, ChevronRight, Plus, Edit2, X, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { PeriodModal } from './PeriodModal';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getContrastColor } from '@/utils/colorUtils';

const inter = Inter({ subsets: ['latin'] });

interface YearCalendarProps extends CalendarProps {
  className?: string;
  headerLeftControls?: React.ReactNode;
  headerRightControls?: React.ReactNode;
}

// Event/Period Details Modal Component
function EventPeriodDetailsModal({ 
  isOpen, 
  onClose, 
  event,
  period,
  onEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  period?: CalendarPeriod | null;
  onEdit?: () => void;
}) {
  if (!isOpen || (!event && !period)) return null;

  const item = event || period;
  const isEvent = !!event;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {isEvent ? 'Event Details' : 'Period Details'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Color indicator and title */}
          <div className="flex items-center gap-3">
            <div 
              className={`${isEvent ? 'w-3 h-3 rounded-full' : 'w-6 h-2 rounded-full'} flex-shrink-0`}
              style={{ backgroundColor: item!.color }}
            />
            <h4 className="font-semibold text-lg">{item!.title}</h4>
          </div>

          {/* Date information */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Date</p>
            <p className="text-sm">
              {isEvent 
                ? (event as CalendarEvent).date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : `${(period as CalendarPeriod).startDate.toLocaleDateString()} - ${(period as CalendarPeriod).endDate.toLocaleDateString()}`
              }
            </p>
          </div>

          {/* Description */}
          {item!.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{item!.description}</p>
            </div>
          )}

          {/* Notes */}
          {item!.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <div className="text-sm p-3 bg-muted/50 rounded-md whitespace-pre-wrap border border-border max-h-32 overflow-y-auto">{item!.notes}</div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Edit2 className="w-4 h-4 mr-2" /> Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

// Day Details Modal Component
function DayDetailsModal({ 
  isOpen, 
  onClose, 
  date, 
  events, 
  periods,
  onEventClick,
  onPeriodClick,
  onAddEventRequest,
  onAddPeriodRequest,
}: {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: CalendarEvent[];
  periods: CalendarPeriod[];
  onEventClick?: (event: CalendarEvent) => void;
  onPeriodClick?: (period: CalendarPeriod) => void;
  onAddEventRequest?: () => void;
  onAddPeriodRequest?: () => void;
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
                        onClick={() => onEventClick?.(event)}
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
                          {event.notes && (
                            <div className="text-sm text-foreground mt-1 p-2 bg-muted/50 rounded-md whitespace-pre-wrap border border-border max-h-24 overflow-y-auto">{event.notes}</div>
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
                        onClick={() => onPeriodClick?.(period)}
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
                          {period.notes && (
                            <div className="text-sm text-foreground mt-1 p-2 bg-muted/50 rounded-md whitespace-pre-wrap border border-border max-h-24 overflow-y-auto">{period.notes}</div>
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
        <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" size="sm" onClick={onAddPeriodRequest}>
                <Plus className="w-4 h-4 mr-2" /> New Period
            </Button>
            <Button size="sm" onClick={onAddEventRequest}>
                <Plus className="w-4 h-4 mr-2" /> New Event
            </Button>
        </div>
      </div>
    </div>
  );
}

// New Action Popup Component
function ActionPopup({
  position,
  onClose,
  onAddEvent,
  onAddPeriod,
}: {
  position: { x: number; y: number };
  onClose: () => void;
  onAddEvent: () => void;
  onAddPeriod: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="fixed bg-background border rounded-lg shadow-xl z-50 p-2 space-y-1"
      style={{ top: position.y, left: position.x }}
    >
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onAddEvent}>
        <Plus className="w-4 h-4 mr-2" /> New Event
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onAddPeriod}>
        <Plus className="w-4 h-4 mr-2" /> New Period
      </Button>
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
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<CalendarPeriod | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [viewingPeriod, setViewingPeriod] = useState<CalendarPeriod | null>(null);
  const [eraserMode, setEraserMode] = useState(false);
  const [actionPopup, setActionPopup] = useState<{ x: number; y: number; date: Date } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  // Drag state for periods
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [draggedPeriod, setDraggedPeriod] = useState<CalendarPeriod | null>(null);
  const [dragStartDay, setDragStartDay] = useState<Date | null>(null);

  const weekDays = getWeekDays();
  const eventsByMonth = useMemo(() => 
    getEventsByMonth(data.events, currentYear), 
    [data.events, currentYear]
  );

  // Scroll to current month on mount
  useEffect(() => {
    const currentMonth = new Date().getMonth();
    const currentMonthElement = document.getElementById(`month-${currentMonth}`);
    if (currentMonthElement) {
      currentMonthElement.scrollIntoView({ 
        block: 'center' 
      });
    }
  }, []);

  const navigateYear = (direction: 'prev' | 'next') => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentYear(prevYear => prevYear + (direction === 'next' ? 1 : -1));
      setIsLoading(false);
      // Define starting position based on navigation direction
      if (direction === 'next') {
        // Scroll to top when navigating forward
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Scroll to bottom when navigating backward
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 0);
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

  const handleDateMouseDown = (e: React.MouseEvent, date: Date) => {
    longPressTriggered.current = false;
    const timer = setTimeout(() => {
      longPressTriggered.current = true;
      handleAddPeriod(date);
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleDateMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handlePeriodMouseDown = (e: React.MouseEvent, date: Date, period: CalendarPeriod) => {
    e.stopPropagation();
    longPressTriggered.current = false;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const leftThird = width / 3;
    const rightThird = (width * 2) / 3;
    
    // Determine drag mode based on click position and date position within period
    const isStartDate = isSameDay(date, period.startDate);
    const isEndDate = isSameDay(date, period.endDate);
    const isSingleDay = isStartDate && isEndDate;
    
    let dragMode: 'move' | 'resize-start' | 'resize-end' = 'move';
    
    if (isSingleDay) {
      // Single day period - always move
      dragMode = 'move';
    } else if (isStartDate) {
      // On start date - left third resizes start, rest moves
      dragMode = clickX < leftThird ? 'resize-start' : 'move';
    } else if (isEndDate) {
      // On end date - right third resizes end, rest moves
      dragMode = clickX > rightThird ? 'resize-end' : 'move';
    } else {
      // Middle date - left third extends start, right third extends end, middle moves
      if (clickX < leftThird) {
        dragMode = 'resize-start';
      } else if (clickX > rightThird) {
        dragMode = 'resize-end';
      } else {
        dragMode = 'move';
      }
    }
    
    // Start drag with determined mode
    setDragMode(dragMode);
    setDraggedPeriod(period);
    setDragStartDay(date);
    
    const timer = setTimeout(() => {
      longPressTriggered.current = true;
      // Show period details on long press
      setViewingPeriod(period);
      setDetailsModalOpen(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (eraserMode) {
      onEventDelete?.(event.id);
      return;
    }
    // Show details instead of directly editing
    setViewingEvent(event);
    setDetailsModalOpen(true);
  };

  const handlePeriodClick = (period: CalendarPeriod, e: React.MouseEvent) => {
    e.stopPropagation();
    if (eraserMode) {
      onPeriodDelete?.(period.id);
      return;
    }
    // Show details instead of directly editing
    setViewingPeriod(period);
    setDetailsModalOpen(true);
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

    // Don't update if no actual change
    if (diffDays === 0) return;

    if (dragMode === 'move') {
        const newStartDate = new Date(draggedPeriod.startDate);
        newStartDate.setDate(newStartDate.getDate() + diffDays);
        const newEndDate = new Date(draggedPeriod.endDate);
        newEndDate.setDate(newEndDate.getDate() + diffDays);
        
        // Validate dates
        if (newStartDate.getTime() !== draggedPeriod.startDate.getTime() || 
            newEndDate.getTime() !== draggedPeriod.endDate.getTime()) {
          onPeriodEdit({ ...draggedPeriod, startDate: newStartDate, endDate: newEndDate });
          setDragStartDay(date); // Update reference point for smoother dragging
        }
    } else if (dragMode === 'resize-start') {
        const newStartDate = new Date(draggedPeriod.startDate);
        newStartDate.setDate(newStartDate.getDate() + diffDays);
        
        // Ensure start doesn't go past end (leave at least 1 day)
        if (newStartDate < draggedPeriod.endDate && 
            newStartDate.getTime() !== draggedPeriod.startDate.getTime()) {
            onPeriodEdit({ ...draggedPeriod, startDate: newStartDate });
            setDragStartDay(date);
        }
    } else if (dragMode === 'resize-end') {
        const newEndDate = new Date(draggedPeriod.endDate);
        newEndDate.setDate(newEndDate.getDate() + diffDays);
        
        // Ensure end doesn't go before start (leave at least 1 day)
        if (newEndDate > draggedPeriod.startDate && 
            newEndDate.getTime() !== draggedPeriod.endDate.getTime()) {
            onPeriodEdit({ ...draggedPeriod, endDate: newEndDate });
            setDragStartDay(date);
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
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleDragEnd();
      };
      
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [dragMode]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventModalOpen(true);
  };

  const handleAddPeriod = (date?: Date) => {
    const initialDate = date || selectedDate || new Date();
    setSelectedDate(initialDate);
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

  const handleDetailsEdit = () => {
    setDetailsModalOpen(false);
    if (viewingEvent) {
      setEditingEvent(viewingEvent);
      setEventModalOpen(true);
      setViewingEvent(null);
    } else if (viewingPeriod) {
      setEditingPeriod(viewingPeriod);
      setPeriodModalOpen(true);
      setViewingPeriod(null);
    }
  };

  const renderEventCircles = (events: CalendarEvent[]) => {
    if (events.length === 0) return null;

    if (events.length === 1) {
      // Single event - square in top right corner
      return (
        <div className="absolute top-0.5 right-0.5 z-20">
          <div
            className="w-2 h-2 border border-white/30 shadow-sm"
            style={{ backgroundColor: events[0].color }}
            title={events[0].title}
          />
        </div>
      );
    } else if (events.length === 2) {
      // Two events - two squares in top corners
      return (
        <>
          <div className="absolute top-0.5 left-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[0].color }}
              title={events[0].title}
            />
          </div>
          <div className="absolute top-0.5 right-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[1].color }}
              title={events[1].title}
            />
          </div>
        </>
      );
    } else if (events.length === 3) {
      // Three events - top corners and top center
      return (
        <>
          <div className="absolute top-0.5 left-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[0].color }}
              title={events[0].title}
            />
          </div>
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[1].color }}
              title={events[1].title}
            />
          </div>
          <div className="absolute top-0.5 right-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[2].color }}
              title={events[2].title}
            />
          </div>
        </>
      );
    } else {
      // Four or more events - top edge squares with overflow indicator
      return (
        <>
          <div className="absolute top-0.5 left-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[0].color }}
              title={events[0].title}
            />
          </div>
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[1].color }}
              title={events[1].title}
            />
          </div>
          <div className="absolute top-0.5 right-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm bg-muted-foreground flex items-center justify-center"
              title={`${events.length - 2} more events`}
            >
              <div className="w-0.5 h-0.5 bg-white" />
            </div>
          </div>
        </>
      );
    }
  };

  const renderSmallEventIndicators = (events: CalendarEvent[]) => {
    // This function is now deprecated in favor of renderEventCircles
    return null;
  };

  const renderMonth = (month: number) => {
    const monthDates = getMonthDates(currentYear, month);
    
    const monthEvents = (eventsByMonth[month] || []).slice().sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const monthPeriods = getPeriodSegmentsForMonth(data.periods, currentYear, month)
      .slice()
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    return (
      <div key={month} id={`month-${month}`}>
        {/* Month Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-center text-foreground">
            {getMonthName(month)}
          </h3>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div key={`${day}-${index}`} className={cn("text-xs font-medium text-muted-foreground text-center py-1", inter.className)}>
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

            const isHovered = hoveredItemId && 
              (dayInfo.events.some(e => e.id === hoveredItemId) || 
               dayInfo.periods.some(p => p.id === hoveredItemId));

            // Remove the old border-style event indicator - replaced with color circles
            
            const periodStyle: React.CSSProperties = {};
            let periodClasses = '';

            if (dayInfo.periods.length === 1) {
              const period = dayInfo.periods[0];
              const baseColor = period.color;
              const opacity = isPast ? 0.3 : 0.7; // More transparent for past dates
              
              // Convert hex to rgba for transparency
              const hexToRgba = (hex: string, alpha: number) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              };
              
              periodStyle.backgroundColor = hexToRgba(baseColor, opacity);
              periodStyle.color = getContrastColor(baseColor);

            } else if (dayInfo.periods.length >= 2) {
              const p1 = dayInfo.periods[0];
              const p2 = dayInfo.periods[1];
              const opacity = isPast ? 0.3 : 0.7;
              
              const hexToRgba = (hex: string, alpha: number) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
              };
              
              // Horizontal split: top half p1, bottom half p2
              periodStyle.background = `linear-gradient(to bottom, ${hexToRgba(p1.color, opacity)} 50%, ${hexToRgba(p2.color, opacity)} 50%)`;
              periodStyle.color = '#fff';
              periodStyle.textShadow = '0 1px 2px rgba(0,0,0,0.7)';
            }

            // Removed hasEventIndicator - no longer needed with new circle system
            
            // Visual feedback for drag mode
            const isDragTarget = dragMode && draggedPeriod && dayInfo.periods.some(p => p.id === draggedPeriod.id);

            return (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    key={date.toISOString()}
                    data-date={date.toISOString()}
                    className={cn(`
                      relative h-8 flex items-center justify-center text-xs border transition-all duration-200`,
                      isPast 
                        ? 'text-muted-foreground/50 cursor-default border-border/30' 
                        : 'text-foreground cursor-pointer border-border/50 shadow-sm',
                      !periodStyle.backgroundColor && !isPast && 'bg-background',
                      dayInfo.isToday && 'bg-primary text-primary-foreground font-semibold border-primary shadow-md ring-2 ring-primary/70 ring-offset-1 ring-offset-background animate-pulse',
                      selectedDate && isSameDay(date, selectedDate) && !periodStyle.backgroundColor && 'bg-accent border-accent-foreground/20',
                      isHovered && !periodStyle.backgroundColor && 'bg-accent ring-2 ring-accent-foreground/50 ring-offset-1 ring-offset-background',
                      isHovered && periodStyle.backgroundColor && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-background shadow-lg', // Enhanced highlighting for periods
                      isDragTarget && 'ring-2 ring-blue-400 shadow-lg scale-105', // Visual feedback for drag
                      dragMode && dayInfo.periods.length > 0 && 'cursor-grabbing',
                      !dragMode && dayInfo.periods.length > 0 && !isPast && 'hover:shadow-md hover:scale-105 cursor-grab' // Indicate draggable
                    )}
                    style={{ ...periodStyle }}
                    onClick={() => !isPast && handleDateClick(date)}
                    onDoubleClick={() => !isPast && handleDateDoubleClick(date)}
                    onMouseDown={(e) => !isPast && dayInfo.periods.length > 0 ? handlePeriodMouseDown(e, date, dayInfo.periods[0]) : handleDateMouseDown(e, date)}
                    onMouseUp={handleDateMouseUp}
                    onMouseLeave={handleDateMouseUp}
                    onMouseMove={dragMode && !isPast ? (e) => handleDragMove(e, date) : undefined}
                  >
                    <span className={cn("relative z-20 font-bold select-none", inter.className)}>
                      {date.getDate()}
                    </span>
                    {renderEventCircles(dayInfo.events)}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 p-3">
                  <div className="text-sm font-semibold mb-2">
                    {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="space-y-2">
                    {dayInfo.events.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Events</h4>
                        {dayInfo.events.map(event => (
                          <div key={event.id} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />
                            <span>{event.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {dayInfo.periods.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1">Periods</h4>
                        {dayInfo.periods.map(period => (
                          <div key={period.id} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-1 rounded-full" style={{ backgroundColor: period.color }} />
                            <span>{period.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {dayInfo.events.length === 0 && dayInfo.periods.length === 0 && (
                      <p className="text-xs text-muted-foreground">No events or periods.</p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>

        {/* Events and Periods List */}
        {(monthEvents.length > 0 || monthPeriods.length > 0) && (
          <div className={cn("mt-3 space-y-2", inter.className)}>
            {/* Events Section */}
            {monthEvents.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Events</h4>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {monthEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`group flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-transparent hover:border-accent hover:bg-accent/30 cursor-pointer transition-all duration-200 ${
                        eraserMode ? 'hover:border-red-200 hover:bg-red-50 dark:hover:border-red-800 dark:hover:bg-red-900/20' : ''
                      }`}
                      onClick={(e) => handleEventClick(event, e)}
                      onMouseEnter={() => setHoveredItemId(event.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                    >
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="text-foreground truncate font-medium" title={event.title}>
                          {event.title}
                        </span>
                        <span className="text-muted-foreground/60 text-[10px] font-normal whitespace-nowrap">
                          {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {eraserMode ? (
                        <X className="w-3 h-3 text-red-500" />
                      ) : (
                        <Edit2 className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Periods Section */}
            {monthPeriods.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Periods</h4>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {monthPeriods.map(period => (
                    <div 
                      key={period.id} 
                      className={`group flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-transparent hover:border-accent hover:bg-accent/30 cursor-pointer transition-all duration-200 ${
                        eraserMode ? 'hover:border-red-200 hover:bg-red-50 dark:hover:border-red-800 dark:hover:bg-red-900/20' : ''
                      }`}
                      onClick={(e) => handlePeriodClick(period, e)}
                      onMouseEnter={() => setHoveredItemId(period.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                      onMouseDown={(e) => {
                        if (eraserMode) return; // Disable drag in eraser mode
                        e.stopPropagation(); // Prevent date-level mouse down
                        handleDragStart(e, period, 'move');
                      }}
                    >
                      <div 
                        className="w-4 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: period.color }}
                      />
                      <span className="text-foreground truncate flex-1 font-medium" title={period.title}>
                        {period.title}
                      </span>
                      {eraserMode ? (
                        <X className="w-3 h-3 text-red-500" />
                      ) : (
                        <Edit2 className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${className} relative`}>
      {/* Year Navigation & Controls */}
      <div 
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm flex items-center justify-center gap-4 relative border-b border-border shadow-sm h-14 -mb-14"
        style={{ position: 'sticky', top: '0', zIndex: 40 }}
      >
        <div className="flex-1"> {headerLeftControls}</div>
        
        <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigateYear('prev')}
              size="sm"
              className="flex items-center gap-2"
              title={`Go to ${currentYear - 1}`}
            >
              <ChevronLeft className="w-4 h-4" />
              {currentYear - 1}
            </Button>
            
            <h2 className="text-xl font-bold text-foreground min-w-[100px] text-center">
              {currentYear}
            </h2>
            
            <Button
              variant="outline"
              onClick={() => navigateYear('next')}
              size="sm"
              className="flex items-center gap-2"
              title={`Go to ${currentYear + 1}`}
            >
              {currentYear + 1}
              <ChevronRight className="w-4 h-4" />
            </Button>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
            <Button
              onClick={handleAddEvent}
              size="sm"
              className="flex items-center gap-2"
              disabled={eraserMode}
            >
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAddPeriod()}
              size="sm"
              className="flex items-center gap-2"
              disabled={eraserMode}
            >
              <Plus className="w-4 h-4" />
              Add Period
            </Button>

            <Button
              variant={eraserMode ? "default" : "outline"}
              onClick={() => setEraserMode(!eraserMode)}
              size="sm"
              className={`flex items-center gap-2 ${eraserMode ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
            >
              <Eraser className="w-4 h-4" />
              {eraserMode ? 'Exit Eraser' : 'Eraser'}
            </Button>
            {headerRightControls}
        </div>
      </div>
      
      {/* 12-Month Grid */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-8 gap-y-10 transition-opacity pt-14 mt-6",
        {
          'cursor-crosshair': eraserMode,
          'opacity-50 pointer-events-none': isLoading
        }
      )}>
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

      {/* Modals are outside the main flow */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setEditingEvent(null);
          setSelectedDate(null);
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
          setSelectedDate(null);
        }}
        onSave={handlePeriodSave}
        onDelete={onPeriodDelete}
        period={editingPeriod}
        initialDate={selectedDate || undefined}
      />

      <EventPeriodDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setViewingEvent(null);
          setViewingPeriod(null);
        }}
        event={viewingEvent}
        period={viewingPeriod}
        onEdit={handleDetailsEdit}
      />

      <DayDetailsModal
        isOpen={dayDetailsOpen}
        onClose={() => {
          setDayDetailsOpen(false);
          setSelectedDate(null);
        }}
        date={selectedDate}
        events={selectedDate ? data.events.filter(e => e.date.toDateString() === selectedDate.toDateString()) : []}
        periods={selectedDate ? data.periods.filter(p => p.startDate <= selectedDate && p.endDate >= selectedDate) : []}
        onEventClick={(event) => {
          setDayDetailsOpen(false);
          setViewingEvent(event);
          setDetailsModalOpen(true);
        }}
        onPeriodClick={(period) => {
          setDayDetailsOpen(false);
          setViewingPeriod(period);
          setDetailsModalOpen(true);
        }}
        onAddEventRequest={() => {
          setDayDetailsOpen(false);
          handleAddEvent();
        }}
        onAddPeriodRequest={() => {
          setDayDetailsOpen(false);
          handleAddPeriod();
        }}
      />

      {actionPopup && (
        <ActionPopup
          position={{ x: actionPopup.x, y: actionPopup.y }}
          onClose={() => setActionPopup(null)}
          onAddEvent={() => {
            setSelectedDate(actionPopup.date);
            setTimeout(() => {
              handleAddEvent();
            }, 0);
            setActionPopup(null);
          }}
          onAddPeriod={() => {
            setSelectedDate(actionPopup.date);
            setTimeout(() => {
              handleAddPeriod(actionPopup.date);
            }, 0);
            setActionPopup(null);
          }}
        />
      )}
    </div>
  );
} 