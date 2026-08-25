'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarEvent, CalendarProps } from '@/types/calendar';
import { Plus, CalendarDays } from 'lucide-react';
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

const ALL_MONTHS = new Set(Array.from({ length: 12 }, (_, i) => i));
const EMPTY_EVENTS: CalendarEvent[] = [];

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DayCellProps {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  compact: boolean;
  onNavigateToDaily?: (date: Date) => void;
  onDoubleClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

const DayCell = React.memo(function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isPast,
  isSelected,
  events,
  compact,
  onNavigateToDaily,
  onDoubleClick,
  onEventClick,
}: DayCellProps) {
  return (
    <div
      className={cn(
        compact ? "min-h-[80px]" : "min-h-[100px]",
        "border-r border-b border-border/30 last:border-r-0 transition-colors duration-200 cursor-pointer relative group",
        !isCurrentMonth && "text-muted-foreground/50",
        isPast && "opacity-50",
        isToday && "border-primary border-2 bg-primary/10 ring-2 ring-primary/30",
        isSelected && "border-accent-foreground/60 bg-accent/10"
      )}
      onDoubleClick={() => onDoubleClick(date)}
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

      <div className={cn(
        "absolute inset-0",
        !isCurrentMonth && "bg-muted/20",
        isCurrentMonth && "bg-background",
        isToday && "bg-primary/15",
        isSelected && "bg-accent/20"
      )} />

      <div className={cn("relative z-10 h-full", compact ? "p-1" : "p-2")}>
        <div className={cn(
          compact ? "text-xs mb-1" : "text-sm mb-2",
          "font-medium transition-colors duration-200 relative z-10",
          !isCurrentMonth && "text-muted-foreground",
          isToday && "text-primary font-bold"
        )}>
          {date.getDate()}
        </div>

        <div className="space-y-1 relative z-10">
          {events.slice(0, 3).map(event => {
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
                onClick={(e) => onEventClick(event, e)}
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
          {events.length > 3 && (
            <div className={cn(compact ? "text-[10px]" : "text-xs", "text-muted-foreground p-1 font-medium")}>
              +{events.length - 3} more events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prev, next) => (
  prev.dateKey === next.dateKey
  && prev.isCurrentMonth === next.isCurrentMonth
  && prev.isToday === next.isToday
  && prev.isPast === next.isPast
  && prev.isSelected === next.isSelected
  && prev.events === next.events
  && prev.compact === next.compact
  && prev.onNavigateToDaily === next.onNavigateToDaily
  && prev.onDoubleClick === next.onDoubleClick
  && prev.onEventClick === next.onEventClick
));

function MonthGrid({
  monthIndex,
  baseYear,
  compact,
  todayStart,
  todayKey,
  selectedDateKey,
  eventsByDateKey,
  onNavigateToDaily,
  onDoubleClick,
  onEventClick,
}: {
  monthIndex: number;
  baseYear: number;
  compact: boolean;
  todayStart: Date;
  todayKey: string;
  selectedDateKey: string | null;
  eventsByDateKey: Map<string, CalendarEvent[]>;
  onNavigateToDaily?: (date: Date) => void;
  onDoubleClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}) {
  const firstOfMonth = new Date(baseYear, monthIndex, 1);
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  return (
    <div id={`month-${monthIndex}`} className="bg-card overflow-hidden border border-border/50 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/70">
        <h3 className={cn(compact ? "text-sm" : "text-base", "font-bold text-foreground")}>
          {firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <span className="text-xs text-muted-foreground">Scroll to navigate</span>
      </div>

      <div className="grid grid-cols-7 border-b border-border/40 text-center font-semibold text-muted-foreground bg-card">
        <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Sun</div>
        <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Mon</div>
        <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Tue</div>
        <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Wed</div>
        <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Thu</div>
        <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Fri</div>
        <div className={cn(compact ? "p-2 text-[10px]" : "p-3 text-xs")}>Sat</div>
      </div>

      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const dateKey = toLocalDateKey(date);
          const isToday = dateKey === todayKey;
          return (
            <DayCell
              key={`${monthIndex}-${index}`}
              date={date}
              dateKey={dateKey}
              isCurrentMonth={date.getMonth() === monthIndex}
              isToday={isToday}
              isPast={date < todayStart && !isToday}
              isSelected={selectedDateKey === dateKey}
              events={eventsByDateKey.get(dateKey) ?? EMPTY_EVENTS}
              compact={compact}
              onNavigateToDaily={onNavigateToDaily}
              onDoubleClick={onDoubleClick}
              onEventClick={onEventClick}
            />
          );
        })}
      </div>
    </div>
  );
}

function MonthPlaceholder({ monthIndex, baseYear, compact }: { monthIndex: number; baseYear: number; compact: boolean }) {
  const firstOfMonth = new Date(baseYear, monthIndex, 1);
  return (
    <div id={`month-${monthIndex}`} className="bg-card overflow-hidden border border-border/50 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/70">
        <h3 className={cn(compact ? "text-sm" : "text-base", "font-bold text-foreground")}>
          {firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <span className="text-xs text-muted-foreground">Scroll to navigate</span>
      </div>
      <div className={cn(compact ? "min-h-[480px]" : "min-h-[600px]")} />
    </div>
  );
}

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
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const baseYear = (initialDate || new Date()).getFullYear();
  const targetMonth = (initialDate || new Date()).getMonth();
  const [mountedMonths, setMountedMonths] = useState<Set<number>>(() => new Set([targetMonth]));

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayKey = toLocalDateKey(todayStart);
  const selectedDateKey = selectedDate ? toLocalDateKey(selectedDate) : null;

  const eventsByDateKey = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of data.events) {
      const key = event.dateKey || toLocalDateKey(event.date);
      const list = map.get(key);
      if (list) {
        list.push(event);
      } else {
        map.set(key, [event]);
      }
    }
    return map;
  }, [data.events]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMountedMonths(ALL_MONTHS);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (mountedMonths.size < 12) return;
    document.getElementById(`month-${targetMonth}`)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [mountedMonths, targetMonth]);

  const handleDateDoubleClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setShowEventModal(true);
  }, []);

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
  };

  const handleEventDelete = () => {
    if (editingEvent) {
      onEventDelete?.(editingEvent.id);
      handleModalClose();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
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

      <div className="space-y-8">
        {Array.from({ length: 12 }, (_, monthIndex) => (
          mountedMonths.has(monthIndex) ? (
            <MonthGrid
              key={monthIndex}
              monthIndex={monthIndex}
              baseYear={baseYear}
              compact={compact}
              todayStart={todayStart}
              todayKey={todayKey}
              selectedDateKey={selectedDateKey}
              eventsByDateKey={eventsByDateKey}
              onNavigateToDaily={onNavigateToDaily}
              onDoubleClick={handleDateDoubleClick}
              onEventClick={handleEventClick}
            />
          ) : (
            <MonthPlaceholder
              key={monthIndex}
              monthIndex={monthIndex}
              baseYear={baseYear}
              compact={compact}
            />
          )
        ))}
      </div>

      <EventModal
        isOpen={showEventModal}
        onClose={handleModalClose}
        onSave={handleEventSave}
        onDelete={editingEvent ? handleEventDelete : undefined}
        event={editingEvent}
        initialDate={selectedDate || new Date()}
      />
    </div>
  );
}
