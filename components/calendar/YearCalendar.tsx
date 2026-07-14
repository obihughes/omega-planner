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
import { ChevronLeft, ChevronRight, Plus, Edit2, X, Eraser, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { PeriodModal } from './PeriodModal';
import { cn } from '@/lib/utils';
// Removed hover-based summary UI in favor of click-to-open details
import { getContrastColor } from '@/utils/colorUtils';

const inter = Inter({ subsets: ['latin'] });

interface YearCalendarProps extends CalendarProps {
  className?: string;
  headerLeftControls?: React.ReactNode;
  headerRightControls?: React.ReactNode;
  isVisible?: boolean;
}

// Event/Period Details Modal Component
function EventPeriodDetailsModal({ 
  isOpen, 
  onClose, 
  event,
  period,
  onEdit,
  onDeleteEvent,
  onDeletePeriod,
}: {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  period?: CalendarPeriod | null;
  onEdit?: () => void;
  onDeleteEvent?: (eventId: string) => void;
  onDeletePeriod?: (periodId: string) => void;
}) {
  if (!isOpen || (!event && !period)) return null;

  const item = event || period;
  const isEvent = !!event;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
                            {isEvent ? 'Event Details' : 'Interval Details'}
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

          {/* Details (prefer notes, fallback to description) */}
          {(item!.notes || item!.description) && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Details</p>
              <div className="text-sm p-3 bg-muted/50 whitespace-pre-wrap border border-border max-h-32 overflow-y-auto">{item!.notes || item!.description}</div>
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
          {event && onDeleteEvent && (
            <Button size="sm" variant="destructive" onClick={() => onDeleteEvent(event.id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
          {period && onDeletePeriod && (
            <Button size="sm" variant="destructive" onClick={() => onDeletePeriod(period.id)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          )}
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
  onEventDelete,
  onPeriodDelete,
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
  onEventDelete?: (eventId: string) => void;
  onPeriodDelete?: (periodId: string) => void;
}) {
  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-background border shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
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
                          <p className="text-muted-foreground text-center py-8">No events or intervals on this day</p>
          ) : (
            <>
              {events.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">Events</h4>
                  <div className="space-y-2">
                    {events.map(event => (
                      <div 
                        key={event.id}
                        className="flex items-center gap-3 p-3 border cursor-pointer transition-colors"
                        onClick={() => onEventClick?.(event)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{event.title}</div>
                          {(event.notes || event.description) && (
                            <div className="text-sm text-foreground mt-1 p-2 bg-muted/50 rounded-md whitespace-pre-wrap border border-border max-h-24 overflow-y-auto">{event.notes || event.description}</div>
                          )}
                        </div>
                        {onEventDelete && (
                          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onEventDelete(event.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {periods.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">Intervals</h4>
                  <div className="space-y-2">
                    {periods.map(period => (
                      <div 
                        key={period.id}
                        className="flex items-center gap-3 p-3 border cursor-pointer transition-colors"
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
                          {(period.notes || period.description) && (
                            <div className="text-sm text-foreground mt-1 p-2 bg-muted/50 rounded-md whitespace-pre-wrap border border-border max-h-24 overflow-y-auto">{period.notes || period.description}</div>
                          )}
                        </div>
                        {onPeriodDelete && (
                          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onPeriodDelete(period.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
                <Plus className="w-4 h-4 mr-2" /> New Interval
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
            <Plus className="w-4 h-4 mr-2" /> New Interval
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
  isVisible = true,
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
  // Hover state removed; we now use click-to-open only
  
  // Drag state for periods
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [draggedPeriod, setDraggedPeriod] = useState<CalendarPeriod | null>(null);
  const [dragStartDay, setDragStartDay] = useState<Date | null>(null);

  const weekDays = getWeekDays();
  const eventsByMonth = useMemo(() => 
    getEventsByMonth(data.events, currentYear), 
    [data.events, currentYear]
  );

  // Scroll to current month on mount, when year changes, or when component becomes visible
  useEffect(() => {
    if (!isVisible) return; // Don't scroll if component is not visible

    const today = new Date();
    const currentMonth = today.getMonth();
    const actualCurrentYear = today.getFullYear();

    // Only scroll to current month if we're viewing the current year
    if (currentYear === actualCurrentYear) {
      const currentMonthElement = document.getElementById(`month-${currentMonth}`);
      if (currentMonthElement) {
        // Use a small delay to ensure the DOM is fully rendered
        setTimeout(() => {
          currentMonthElement.scrollIntoView({
            behavior: 'auto',
            block: 'center'
          });
        }, 100);
      }
    }
  }, [currentYear, isVisible]); // Re-run when currentYear changes or when component becomes visible

  const navigateYear = (direction: 'prev' | 'next') => {
    setIsLoading(true);
    setTimeout(() => {
      const newYear = currentYear + (direction === 'next' ? 1 : -1);
      setCurrentYear(newYear);
      setIsLoading(false);
      
      // Small delay to ensure DOM is updated before scrolling
      setTimeout(() => {
        const today = new Date();
        const actualCurrentYear = today.getFullYear();
        
        if (newYear === actualCurrentYear) {
          // If returning to current year, scroll to current month
          const currentMonth = today.getMonth();
          const currentMonthElement = document.getElementById(`month-${currentMonth}`);
          if (currentMonthElement) {
            currentMonthElement.scrollIntoView({
              behavior: 'auto',
              block: 'center'
            });
          }
        } else {
          // For other years, scroll to January within the calendar scroll container
          const januaryElement = document.getElementById('month-0');
          if (januaryElement) {
            januaryElement.scrollIntoView({
              behavior: 'auto',
              block: 'start'
            });
          }
        }
      }, 150);
    }, 0);
  };

  const handleDateClick = (date: Date) => {
    if (longPressTriggered.current) return;
    // Always open day details to show what's scheduled (or empty message)
    setSelectedDate(date);
    setDayDetailsOpen(true);
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
            />
          </div>
          <div className="absolute top-0.5 right-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[1].color }}
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
            />
          </div>
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[1].color }}
            />
          </div>
          <div className="absolute top-0.5 right-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[2].color }}
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
            />
          </div>
          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm"
              style={{ backgroundColor: events[1].color }}
            />
          </div>
          <div className="absolute top-0.5 right-0.5 z-20">
            <div
              className="w-1.5 h-1.5 border border-white/30 shadow-sm bg-muted-foreground flex items-center justify-center"
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
    // Build a 6x7 grid for each month (like monthly calendar)
    const firstOfMonth = new Date(currentYear, month, 1);
    const startDate = new Date(firstOfMonth);
    const firstDayWeekday = firstOfMonth.getDay();
    startDate.setDate(firstOfMonth.getDate() - firstDayWeekday);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }

    return (
      <div key={month} id={`month-${month}`} className="bg-card overflow-hidden border border-border/50 rounded-lg">
        {/* Month header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/70">
          <button
            type="button"
            className="text-sm font-bold text-foreground hover:underline cursor-pointer flex-1 text-left"
            title="Open this month in Monthly view"
            onClick={() => {
              try {
                const yyyy = String(currentYear);
                const mm = String(month + 1).padStart(2, '0');
                const dateParam = `${yyyy}-${mm}-01`;
                window.location.href = `/calendar?view=monthly&date=${dateParam}`;
              } catch {
                window.location.href = `/calendar?view=monthly`;
              }
            }}
          >
            {firstOfMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border/40 text-center font-semibold text-muted-foreground bg-card">
          <div className="p-2 text-[10px]">Sun</div>
          <div className="p-2 text-[10px]">Mon</div>
          <div className="p-2 text-[10px]">Tue</div>
          <div className="p-2 text-[10px]">Wed</div>
          <div className="p-2 text-[10px]">Thu</div>
          <div className="p-2 text-[10px]">Fri</div>
          <div className="p-2 text-[10px]">Sat</div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = date < today && !isToday;

            const dayEvents = data.events
              .filter(event => event.date.toDateString() === date.toDateString())
              .slice()
              .sort((a, b) => a.date.getTime() - b.date.getTime());

            const dayPeriods = data.periods.filter(p =>
              p.startDate <= date && p.endDate >= date
            );

            // Convert hex to rgba for transparency
            const hexToRgba = (hex: string, alpha: number) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const periodStyle: React.CSSProperties = {};
            if (dayPeriods.length === 1) {
              const period = dayPeriods[0];
              const opacity = isPast ? 0.15 : 0.25;
              periodStyle.backgroundColor = hexToRgba(period.color, opacity);
            } else if (dayPeriods.length >= 2) {
              const p1 = dayPeriods[0];
              const p2 = dayPeriods[1];
              const opacity = isPast ? 0.15 : 0.25;
              periodStyle.background = `linear-gradient(to bottom, ${hexToRgba(p1.color, opacity)} 50%, ${hexToRgba(p2.color, opacity)} 50%)`;
            }

            return (
              <div
                key={`${month}-${index}`}
                className={cn(
                  "min-h-[80px] border-r border-b border-border/30 last:border-r-0 transition-all duration-200 cursor-pointer relative group",
                  !isCurrentMonth && "text-muted-foreground/50",
                  isPast && "opacity-50",
                  isToday && "border-primary border-2 bg-primary/10 ring-2 ring-primary/30",
                  selectedDate && date.toDateString() === selectedDate.toDateString() && "border-accent-foreground/60 bg-accent/10"
                )}
                style={periodStyle}
                onClick={() => !isPast && handleDateClick(date)}
                onDoubleClick={() => !isPast && handleDateDoubleClick(date)}
                onMouseDown={(e) => !isPast && dayPeriods.length > 0 ? handlePeriodMouseDown(e, date, dayPeriods[0]) : handleDateMouseDown(e, date)}
                onMouseUp={handleDateMouseUp}
                onMouseLeave={handleDateMouseUp}
              >
                {/* Background */}
                <div className={cn(
                  "absolute inset-0",
                  !isCurrentMonth && "bg-muted/20",
                  isCurrentMonth && !periodStyle.backgroundColor && "bg-background",
                  isToday && "bg-primary/15"
                )} />

                {/* Content */}
                <div className="relative z-10 h-full p-1">
                  <div className={cn(
                    "text-xs mb-1 font-medium transition-colors duration-200 relative z-10",
                    !isCurrentMonth && "text-muted-foreground",
                    isToday && "text-primary font-bold"
                  )}>
                    {date.getDate()}
                  </div>

                  {/* Events */}
                  <div className="space-y-1 relative z-10">
                    {dayEvents.slice(0, 2).map(event => {
                      const textColor = getContrastColor(event.color);
                      return (
                        <div
                          key={event.id}
                          className="h-4 px-1.5 py-0.5 text-[9px] cursor-pointer hover:opacity-95 transition-opacity duration-200 border group relative flex items-center rounded-sm truncate"
                          style={{
                            backgroundColor: event.color,
                            borderColor: event.color,
                            color: textColor
                          }}
                          onClick={(e) => handleEventClick(event, e)}
                          title={`${event.title}${(event.notes || event.description) ? ` - ${event.notes || event.description}` : ''}`}
                        >
                          <span className="truncate font-semibold text-[9px]"
                            style={{ color: textColor }}
                          >
                            {event.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1 font-medium">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
              Add Interval
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
      
      {/* 12-Month Grid - 6 rows x 2 columns */}
      <div className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-4 transition-all duration-300 pt-16 mt-6 px-0 bg-background/50",
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
        onDeleteEvent={onEventDelete}
        onDeletePeriod={onPeriodDelete}
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
        onEventDelete={onEventDelete}
        onPeriodDelete={onPeriodDelete}
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