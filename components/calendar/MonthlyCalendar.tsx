'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEvent, CalendarData, CalendarProps } from '@/types/calendar';
import { Plus, CalendarDays, Trash2, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EventModal } from './EventModal';
import { getContrastColor } from '@/utils/colorUtils';

interface MonthlyCalendarProps extends CalendarProps {
  className?: string;
  headerLeftControls?: React.ReactNode;
  headerRightControls?: React.ReactNode;
  onNavigateToDaily?: (date: Date) => void;
  initialDate?: Date;
  /** When true, renders a denser, smaller calendar cells */
  compact?: boolean;
}

// No DayCell interface needed; we compute per month inline

export function MonthlyCalendar({
  data = { events: [], periods: [] },
  className = '',
  onEventAdd,
  onEventEdit,
  onEventDelete,
  headerLeftControls,
  headerRightControls,
  onNavigateToDaily,
  initialDate,
  compact = false,
}: MonthlyCalendarProps) {
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Base year for 12-month vertical view
  const baseYear = (initialDate || new Date()).getFullYear();

  // Auto-scroll to the current month (or initialDate month) on mount
  useEffect(() => {
    const targetMonth = (initialDate || new Date()).getMonth();
    const el = document.getElementById(`month-${targetMonth}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [initialDate]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetails(true);
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

  const handleModalClose = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setSelectedDate(null);
    setShowDayDetails(false);
  };

  const handleEventDelete = () => {
    if (editingEvent) {
      onEventDelete?.(editingEvent.id);
      handleModalClose();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Day Details Modal (click-to-open summary) */}
      {showDayDetails && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDayDetails(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {(() => {
                const dayEvents = data.events.filter(e => e.date.toDateString() === selectedDate.toDateString());
                return (
                  <>
                    {dayEvents.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No events on this day</p>
                    )}
                    {dayEvents.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-sm text-muted-foreground uppercase tracking-wide">Events</h4>
                        <div className="space-y-2">
                          {dayEvents.map(event => (
                            <div key={event.id} className="flex items-center gap-3 p-3 border cursor-pointer transition-colors" onClick={() => { setEditingEvent(event); setShowEventModal(true); setShowDayDetails(false); }}>
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                              <div className="flex-1">
                                <div className="font-medium">{event.title}</div>
                                {(event.notes || event.description) && (
                                  <div className="text-sm text-foreground mt-1 p-2 bg-muted/50 rounded-md whitespace-pre-wrap border border-border max-h-24 overflow-y-auto">{event.notes || event.description}</div>
                                )}
                              </div>
                              {onEventDelete && (
                                <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this event?')) { onEventDelete(event.id); } }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Header - simplified. Scroll to navigate months. */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {headerLeftControls}
          <h2 className={cn(compact ? "text-base" : "text-lg", "font-semibold text-muted-foreground")}>Monthly · {baseYear}</h2>
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
        </div>
      </div>

      {/* 12 months vertically scrollable */}
      <div className="space-y-8">
        {Array.from({ length: 12 }, (_, monthIndex) => {
          // Build a 6x7 grid for each month
          const firstOfMonth = new Date(baseYear, monthIndex, 1);
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
            <div key={monthIndex} id={`month-${monthIndex}`} className="bg-card overflow-hidden border border-border/50 rounded-lg">
              {/* Month header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/70">
                <h3 className={cn(compact ? "text-sm" : "text-base", "font-bold text-foreground")}>{firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <span className={cn("text-xs text-muted-foreground")}>Scroll to navigate</span>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border/40 text-center font-semibold text-muted-foreground bg-card">
                <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Sun</div>
                <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Mon</div>
                <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Tue</div>
                <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Wed</div>
                <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Thu</div>
                <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Fri</div>
                <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Sat</div>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {days.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === monthIndex;
                  const isToday = date.toDateString() === new Date().toDateString();
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = date < today && !isToday;

                  const dayEvents = data.events
                    .filter(event => event.date.toDateString() === date.toDateString())
                    .slice()
                    .sort((a, b) => a.date.getTime() - b.date.getTime());

                  return (
                    <div
                      key={`${monthIndex}-${index}`}
                      className={cn(
                        compact ? "min-h-[80px]" : "min-h-[100px]",
                        "border-r border-b border-border/30 last:border-r-0 transition-all duration-200 cursor-pointer relative group",
                        !isCurrentMonth && "text-muted-foreground/50",
                        isPast && "opacity-50",
                        isToday && "border-primary border-2 bg-primary/10 ring-2 ring-primary/30",
                        selectedDate && date.toDateString() === selectedDate.toDateString() && "border-accent-foreground/60 bg-accent/10"
                      )}
                      onClick={() => handleDateClick(date)}
                      onDoubleClick={() => handleDateDoubleClick(date)}
                    >
                      {onNavigateToDaily && (
                        <button
                          className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background border border-border text-muted-foreground hover:text-foreground p-1"
                          title="Open this day in Daily View"
                          onClick={(e) => { e.stopPropagation(); onNavigateToDaily(date); }}
                        >
                          <CalendarDays className="w-3 h-3" />
                        </button>
                      )}

                      {/* Background */}
                      <div className={cn(
                        "absolute inset-0",
                        !isCurrentMonth && "bg-muted/20",
                        isCurrentMonth && "bg-background",
                        isToday && "bg-primary/15",
                        selectedDate && date.toDateString() === selectedDate.toDateString() && "bg-accent/20"
                      )} />

                      {/* Content */}
                      <div className={cn("relative z-10 h-full", compact ? "p-1" : "p-2")}> 
                        <div className={cn(
                          compact ? "text-xs mb-1" : "text-sm mb-2",
                          "font-medium transition-colors duration-200 relative z-10",
                          !isCurrentMonth && "text-muted-foreground",
                          isToday && "text-primary font-bold"
                        )}>
                          {date.getDate()}
                        </div>

                        {/* Events */}
                        <div className="space-y-1 relative z-10">
                          {dayEvents.slice(0, 3).map(event => {
                            const textColor = getContrastColor(event.color);
                            return (
                              <div
                                key={event.id}
                                className={cn(
                                  compact ? "h-5 px-1.5 py-0.5 text[11px]" : "h-7 px-2 py-1 text-sm",
                                  "cursor-pointer hover:opacity-95 transition-opacity duration-200 border group relative flex items-center rounded-sm"
                                )}
                                style={{ 
                                  backgroundColor: event.color,
                                  borderColor: event.color,
                                  color: textColor,
                                  borderLeftWidth: '3px',
                                  borderLeftColor: textColor === '#000' ? '#000' : '#fff'
                                }}
                                onClick={(e) => handleEventClick(event, e)}
                                title={`${event.title}${(event.notes || event.description) ? ` - ${event.notes || event.description}` : ''}`}
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <span className={cn("truncate font-semibold", compact ? "text-[11px]" : "text-sm")}
                                    style={{ color: textColor }}
                                  >
                                    {event.title}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className={cn(compact ? "text-[10px]" : "text-xs", "text-muted-foreground p-1 font-medium")}>
                              +{dayEvents.length - 3} more events
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
        })}
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
    </div>
  );
} 